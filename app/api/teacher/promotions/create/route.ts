import { NextResponse } from "next/server";
import { requireTeacherApi } from "@/lib/teacher/require-teacher";
import { MAX_HSK_LEVEL } from "@/lib/lms/hsk-levels";

export async function POST(request: Request) {
  const auth = await requireTeacherApi();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const studentId = typeof body.studentId === "string" ? body.studentId : "";
    const note = typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required." }, { status: 400 });
    }

    const { data: student, error: studentError } = await auth.ctx.db
      .from("students")
      .select("user_id, teacher_id, current_hsk_level")
      .eq("user_id", studentId)
      .single();

    if (studentError || !student || student.teacher_id !== auth.ctx.userId) {
      return NextResponse.json({ error: "You do not manage this student." }, { status: 403 });
    }

    if (student.current_hsk_level >= MAX_HSK_LEVEL) {
      return NextResponse.json(
        { error: "Student is already at the highest HSK level." },
        { status: 400 }
      );
    }

    const { data: existing } = await auth.ctx.db
      .from("promotion_flags")
      .select("id")
      .eq("student_id", studentId)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "A pending promotion request already exists for this student." },
        { status: 400 }
      );
    }

    const { error: insertError } = await auth.ctx.db.from("promotion_flags").insert({
      student_id: studentId,
      flagged_by: auth.ctx.userId,
      current_level: student.current_hsk_level,
      target_level: student.current_hsk_level + 1,
      status: "pending",
      note,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
