import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface TeacherRequestRow {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  role: "teacher" | "student";
}

function generateTeacherCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requestId = typeof body.requestId === "string" ? body.requestId : "";
    const action = body.action === "approve" || body.action === "reject" ? body.action : "";
    const token = typeof body.token === "string" ? body.token : "";

    if (!requestId || !action || !token) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const expectedToken = process.env.ADMIN_APPROVAL_TOKEN ?? process.env.ADMIN_URL_TOKEN;
    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Server not configured",
          details: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
        },
        { status: 500 }
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: requestRow, error: requestError } = await admin
      .from("teacher_requests")
      .select("id, name, email, status")
      .eq("id", requestId)
      .eq("status", "pending")
      .single();

    if (requestError || !requestRow) {
      return NextResponse.json(
        {
          success: false,
          error: "Request not found",
          details: requestError?.message,
        },
        { status: 404 }
      );
    }

    const typedRequest = requestRow as TeacherRequestRow;

    if (action === "reject") {
      const { error: rejectError } = await admin
        .from("teacher_requests")
        .update({ status: "rejected" })
        .eq("id", typedRequest.id);

      if (rejectError) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to reject request",
            details: rejectError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    const { data: profileRow, error: profileLookupError } = await admin
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("email", typedRequest.email)
      .maybeSingle();

    if (profileLookupError || !profileRow) {
      return NextResponse.json(
        {
          success: false,
          error: "Teacher profile not found",
          details:
            profileLookupError?.message ?? "Teacher must complete signup before approval.",
        },
        { status: 400 }
      );
    }

    const typedProfile = profileRow as ProfileRow;

    if (typedProfile.role !== "teacher") {
      return NextResponse.json(
        {
          success: false,
          error: "Profile role is not teacher",
          details: "Only teacher profiles can be approved.",
        },
        { status: 400 }
      );
    }

    let teacherCode = "";

    const { data: existingTeacher, error: existingTeacherError } = await admin
      .from("teachers")
      .select("user_id, teacher_code")
      .eq("user_id", typedProfile.id)
      .maybeSingle();

    if (existingTeacherError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to verify teacher approval status",
          details: existingTeacherError.message,
        },
        { status: 500 }
      );
    }

    if (existingTeacher) {
      teacherCode = existingTeacher.teacher_code;
    }

    let insertedTeacher = false;
    let teacherInsertError: string | null = null;

    if (!existingTeacher) {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        teacherCode = generateTeacherCode();
        const { error: insertTeacherError } = await admin.from("teachers").insert({
          user_id: typedProfile.id,
          teacher_code: teacherCode,
        });

        if (!insertTeacherError) {
          insertedTeacher = true;
          teacherInsertError = null;
          break;
        }

        teacherInsertError = insertTeacherError.message;
      }
    } else {
      insertedTeacher = true;
    }

    if (!insertedTeacher) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create teacher code",
          details: teacherInsertError,
        },
        { status: 500 }
      );
    }

    const { error: approveError } = await admin
      .from("teacher_requests")
      .update({ status: "approved" })
      .eq("id", typedRequest.id);

    if (approveError) {
      return NextResponse.json(
        {
          success: false,
          error: "Teacher approved but request update failed",
          details: approveError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      email: typedRequest.email,
      teacherCode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected server error",
        details: message,
      },
      { status: 500 }
    );
  }
}
