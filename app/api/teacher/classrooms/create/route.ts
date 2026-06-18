import { NextResponse } from "next/server";
import { requireTeacherApi } from "@/lib/teacher/require-teacher";
import { normalizeClassCode } from "@/lib/lms/classroom";

export async function POST(request: Request) {
  const auth = await requireTeacherApi();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const hskLevel = Number(body.hskLevel);
    const classCode = typeof body.classCode === "string" ? normalizeClassCode(body.classCode) : "";

    if (!name || !classCode) {
      return NextResponse.json({ error: "Name and class code are required." }, { status: 400 });
    }

    if (!Number.isInteger(hskLevel) || hskLevel < 1 || hskLevel > 6) {
      return NextResponse.json({ error: "HSK level must be between 1 and 6." }, { status: 400 });
    }

    const { data: existing } = await auth.ctx.db
      .from("classrooms")
      .select("id")
      .eq("class_code", classCode)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Class code already in use." }, { status: 400 });
    }

    const { data: classroom, error: insertError } = await auth.ctx.db
      .from("classrooms")
      .insert({
        name,
        class_code: classCode,
        teacher_id: auth.ctx.userId,
        hsk_level: hskLevel,
      })
      .select("id, name, class_code, hsk_level, teacher_id")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, classroom });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
