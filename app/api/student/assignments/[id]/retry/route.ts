import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { retryStudentAssignment } from "@/lib/lms/student-assignments";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentAssignmentId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: row, error: fetchError } = await supabase
      .from("student_assignments")
      .select("id, student_id, is_locked, is_completed")
      .eq("id", studentAssignmentId)
      .single();

    if (fetchError || !row) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    if (row.student_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (row.is_locked) {
      return NextResponse.json({ error: "Assignment is locked." }, { status: 403 });
    }

    if (!row.is_completed) {
      return NextResponse.json({ error: "Assignment is not completed." }, { status: 400 });
    }

    await retryStudentAssignment(supabase, studentAssignmentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
