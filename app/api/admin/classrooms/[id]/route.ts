import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { id: classroomId } = await params;
    const body = await request.json();
    const teacherId = typeof body.teacherId === "string" ? body.teacherId : "";

    if (!teacherId) {
      return NextResponse.json({ error: "teacherId is required." }, { status: 400 });
    }

    const { data: classroom, error: classroomError } = await auth.ctx.db
      .from("classrooms")
      .select("id")
      .eq("id", classroomId)
      .maybeSingle();

    if (classroomError) {
      return NextResponse.json({ error: classroomError.message }, { status: 500 });
    }

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    const { data: teacher, error: teacherError } = await auth.ctx.db
      .from("profiles")
      .select("id, role, status")
      .eq("id", teacherId)
      .single();

    if (teacherError || !teacher || teacher.role !== "teacher" || teacher.status !== "active") {
      return NextResponse.json({ error: "Active teacher not found." }, { status: 404 });
    }

    const { error: updateClassroomError } = await auth.ctx.db
      .from("classrooms")
      .update({ teacher_id: teacherId })
      .eq("id", classroomId);

    if (updateClassroomError) {
      return NextResponse.json({ error: updateClassroomError.message }, { status: 500 });
    }

    const { error: updateStudentsError } = await auth.ctx.db
      .from("students")
      .update({ teacher_id: teacherId })
      .eq("classroom_id", classroomId);

    if (updateStudentsError) {
      return NextResponse.json({ error: updateStudentsError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { id: classroomId } = await params;

    const { data: classroom, error: lookupError } = await auth.ctx.db
      .from("classrooms")
      .select("id")
      .eq("id", classroomId)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    // students.classroom_id is ON DELETE SET NULL — students are unassigned, not deleted
    const { error: deleteError } = await auth.ctx.db
      .from("classrooms")
      .delete()
      .eq("id", classroomId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
