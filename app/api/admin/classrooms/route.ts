import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { fetchAdminClassrooms } from "@/lib/admin/queries/classrooms";
import { isValidHskLevel, hskLevelRangeLabel } from "@/lib/lms/hsk-levels";
import { normalizeClassCode } from "@/lib/lms/classroom";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const classrooms = await fetchAdminClassrooms(auth.ctx.db);
    return NextResponse.json({ classrooms });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const teacherId = typeof body.teacherId === "string" ? body.teacherId : "";
    const hskLevel = Number(body.hskLevel);
    const classCode = typeof body.classCode === "string" ? normalizeClassCode(body.classCode) : "";

    if (!name || !teacherId || !classCode) {
      return NextResponse.json({ error: "Name, teacher, and class code are required." }, { status: 400 });
    }

    if (!isValidHskLevel(hskLevel)) {
      return NextResponse.json({ error: `HSK level must be between ${hskLevelRangeLabel()}.` }, { status: 400 });
    }

    const { data: teacher, error: teacherError } = await auth.ctx.db
      .from("profiles")
      .select("id, role, status")
      .eq("id", teacherId)
      .single();

    if (teacherError || !teacher || teacher.role !== "teacher" || teacher.status !== "active") {
      return NextResponse.json({ error: "Active teacher not found." }, { status: 404 });
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
        teacher_id: teacherId,
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
