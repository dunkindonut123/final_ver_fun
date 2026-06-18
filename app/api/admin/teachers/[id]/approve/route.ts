import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teacherId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, email, role, status")
      .eq("id", teacherId)
      .single();

    if (profileError || !profile || profile.role !== "teacher") {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({ status: "active" })
      .eq("id", teacherId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { data: existingTeacher } = await admin
      .from("teachers")
      .select("user_id")
      .eq("user_id", teacherId)
      .maybeSingle();

    if (!existingTeacher) {
      const { error: teacherInsertError } = await admin.from("teachers").insert({
        user_id: teacherId,
        teacher_code: null,
      });

      if (teacherInsertError) {
        return NextResponse.json({ error: teacherInsertError.message }, { status: 500 });
      }
    }

    await admin
      .from("teacher_requests")
      .update({ status: "approved" })
      .eq("email", profile.email);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
