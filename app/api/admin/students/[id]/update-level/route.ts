import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { seedStudentAssignments } from "@/lib/lms/student-assignments";
import { isValidHskLevel, hskLevelRangeLabel } from "@/lib/lms/hsk-levels";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { id: studentId } = await params;
    const body = await request.json();
    const newHskLevel = Number(body.hskLevel);
    const classroomId = typeof body.classroomId === "string" ? body.classroomId : "";

    if (!classroomId || !isValidHskLevel(newHskLevel)) {
      return NextResponse.json(
        { error: `Valid hskLevel (${hskLevelRangeLabel()}) and classroomId are required.` },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await auth.ctx.db
      .from("profiles")
      .select("id, role")
      .eq("id", studentId)
      .single();

    if (profileError || !profile || profile.role !== "student") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const { data: classroom, error: classroomError } = await auth.ctx.db
      .from("classrooms")
      .select("id, teacher_id, hsk_level")
      .eq("id", classroomId)
      .single();

    if (classroomError || !classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    if (classroom.hsk_level !== newHskLevel) {
      return NextResponse.json(
        { error: "Selected classroom must match the new HSK level." },
        { status: 400 }
      );
    }

    const { error: updateError } = await auth.ctx.db
      .from("students")
      .update({
        current_hsk_level: newHskLevel,
        classroom_id: classroom.id,
        teacher_id: classroom.teacher_id,
      })
      .eq("user_id", studentId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await seedStudentAssignments(studentId, newHskLevel);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
