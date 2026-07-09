import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeClassCode } from "@/lib/lms/classroom";
import { seedStudentAssignments } from "@/lib/lms/student-assignments";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const classCode = typeof body.classCode === "string" ? normalizeClassCode(body.classCode) : "";

    if (!name || !email || !password || !classCode) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: classroomRows, error: classroomError } = await admin.rpc(
      "find_classroom_by_code",
      { input_code: classCode }
    );

    const classroom = Array.isArray(classroomRows) ? classroomRows[0] : null;

    if (classroomError || !classroom) {
      return NextResponse.json(
        { error: "Invalid class code. Please check with your teacher." },
        { status: 400 }
      );
    }

    const { data: authData, error: signUpError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (signUpError || !authData.user) {
      return NextResponse.json(
        { error: signUpError?.message ?? "Unable to create account." },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    const { error: profileError } = await admin.from("profiles").insert({
      id: userId,
      email,
      full_name: name,
      role: "student",
      status: "active",
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const { error: studentError } = await admin.from("students").insert({
      user_id: userId,
      teacher_id: classroom.teacher_id,
      classroom_id: classroom.id,
      current_hsk_level: classroom.hsk_level,
    });

    if (studentError) {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: studentError.message }, { status: 500 });
    }

    await seedStudentAssignments(userId, classroom.hsk_level);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
