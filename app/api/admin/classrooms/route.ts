import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { isValidHskLevel, hskLevelRangeLabel } from "@/lib/lms/hsk-levels";
import { normalizeClassCode } from "@/lib/lms/classroom";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { data: classrooms, error } = await auth.ctx.db
    .from("classrooms")
    .select("id, name, class_code, hsk_level, teacher_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const teacherIds = [...new Set((classrooms ?? []).map((c) => c.teacher_id))];

  const { data: teachers } =
    teacherIds.length > 0
      ? await auth.ctx.db.from("profiles").select("id, full_name").in("id", teacherIds)
      : { data: [] as { id: string; full_name: string | null }[] };

  const teacherMap = new Map((teachers ?? []).map((t) => [t.id, t]));

  const classroomIds = (classrooms ?? []).map((c) => c.id);
  const { data: studentCounts } =
    classroomIds.length > 0
      ? await auth.ctx.db.from("students").select("classroom_id").in("classroom_id", classroomIds)
      : { data: [] as { classroom_id: string | null }[] };

  const countMap = new Map<string, number>();
  (studentCounts ?? []).forEach((row) => {
    if (!row.classroom_id) return;
    countMap.set(row.classroom_id, (countMap.get(row.classroom_id) ?? 0) + 1);
  });

  const result = (classrooms ?? []).map((classroom) => ({
    id: classroom.id,
    name: classroom.name,
    classCode: classroom.class_code,
    hskLevel: classroom.hsk_level,
    teacherId: classroom.teacher_id,
    teacherName: teacherMap.get(classroom.teacher_id)?.full_name ?? "Teacher",
    studentCount: countMap.get(classroom.id) ?? 0,
    createdAt: classroom.created_at,
  }));

  return NextResponse.json({ classrooms: result });
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
