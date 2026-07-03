import { NextResponse } from "next/server";
import { getAttemptsForStudentAssignment } from "@/lib/lms/assignment-attempts";
import { requireTeacherApi } from "@/lib/teacher/require-teacher";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTeacherApi();
  if (!auth.ok) return auth.response;

  try {
    const { id: studentAssignmentId } = await params;

    const { data: row, error: rowError } = await auth.ctx.db
      .from("student_assignments")
      .select("id, student_id")
      .eq("id", studentAssignmentId)
      .single();

    if (rowError || !row) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    const { data: student, error: studentError } = await auth.ctx.db
      .from("students")
      .select("user_id, teacher_id")
      .eq("user_id", row.student_id)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    if (student.teacher_id !== auth.ctx.userId) {
      return NextResponse.json({ error: "You do not manage this student." }, { status: 403 });
    }

    const attempts = await getAttemptsForStudentAssignment(auth.ctx.db, studentAssignmentId, 5);

    return NextResponse.json({ attempts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
