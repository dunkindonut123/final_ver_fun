import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { seedStudentAssignments } from "@/lib/lms/student-assignments";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { id: promotionId } = await params;
    const body = await request.json();
    const classroomId = typeof body.classroomId === "string" ? body.classroomId : "";

    if (!classroomId) {
      return NextResponse.json({ error: "classroomId is required." }, { status: 400 });
    }

    const { data: flag, error: flagError } = await auth.ctx.db
      .from("promotion_flags")
      .select("id, student_id, current_level, target_level, status")
      .eq("id", promotionId)
      .single();

    if (flagError || !flag) {
      return NextResponse.json({ error: "Promotion request not found" }, { status: 404 });
    }

    if (flag.status !== "pending") {
      return NextResponse.json({ error: "This promotion has already been reviewed." }, { status: 400 });
    }

    const { data: classroom, error: classroomError } = await auth.ctx.db
      .from("classrooms")
      .select("id, teacher_id, hsk_level")
      .eq("id", classroomId)
      .single();

    if (classroomError || !classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    if (classroom.hsk_level !== flag.target_level) {
      return NextResponse.json(
        { error: "Selected classroom must match the target HSK level." },
        { status: 400 }
      );
    }

    const { error: studentError } = await auth.ctx.db
      .from("students")
      .update({
        current_hsk_level: flag.target_level,
        classroom_id: classroom.id,
        teacher_id: classroom.teacher_id,
      })
      .eq("user_id", flag.student_id);

    if (studentError) {
      return NextResponse.json({ error: studentError.message }, { status: 500 });
    }

    await seedStudentAssignments(flag.student_id, flag.target_level);

    const { error: flagUpdateError } = await auth.ctx.db
      .from("promotion_flags")
      .update({ status: "approved" })
      .eq("id", promotionId);

    if (flagUpdateError) {
      return NextResponse.json({ error: flagUpdateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
