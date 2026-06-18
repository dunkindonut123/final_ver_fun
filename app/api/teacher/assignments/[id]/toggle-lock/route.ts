import { NextResponse } from "next/server";
import { requireTeacherApi } from "@/lib/teacher/require-teacher";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTeacherApi();
  if (!auth.ok) return auth.response;

  try {
    const { id: studentAssignmentId } = await params;

    const { data: row, error: rowError } = await auth.ctx.db
      .from("student_assignments")
      .select("id, student_id, is_locked")
      .eq("id", studentAssignmentId)
      .single();

    if (rowError || !row) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const { data: student } = await auth.ctx.db
      .from("students")
      .select("user_id, teacher_id")
      .eq("user_id", row.student_id)
      .single();

    if (!student || student.teacher_id !== auth.ctx.userId) {
      return NextResponse.json({ error: "You do not manage this student." }, { status: 403 });
    }

    const { error: updateError } = await auth.ctx.db
      .from("student_assignments")
      .update({ is_locked: !row.is_locked })
      .eq("id", studentAssignmentId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, isLocked: !row.is_locked });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
