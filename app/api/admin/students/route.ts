import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { data: students, error: studentsError } = await auth.ctx.db
    .from("students")
    .select("user_id, teacher_id, classroom_id, current_hsk_level, created_at")
    .order("created_at", { ascending: false });

  if (studentsError) {
    return NextResponse.json({ error: studentsError.message }, { status: 500 });
  }

  if (!students || students.length === 0) {
    return NextResponse.json({ students: [] });
  }

  const studentIds = students.map((s) => s.user_id);
  const teacherIds = [...new Set(students.map((s) => s.teacher_id).filter(Boolean))] as string[];
  const classroomIds = [...new Set(students.map((s) => s.classroom_id).filter(Boolean))] as string[];

  const [{ data: profiles }, { data: classrooms }, { data: teachers }] = await Promise.all([
    auth.ctx.db.from("profiles").select("id, full_name, email").in("id", studentIds),
    classroomIds.length > 0
      ? auth.ctx.db.from("classrooms").select("id, name, hsk_level, class_code").in("id", classroomIds)
      : Promise.resolve({ data: [] as { id: string; name: string; hsk_level: number; class_code: string }[] }),
    teacherIds.length > 0
      ? auth.ctx.db.from("profiles").select("id, full_name").in("id", teacherIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const classroomMap = new Map((classrooms ?? []).map((c) => [c.id, c]));
  const teacherMap = new Map((teachers ?? []).map((t) => [t.id, t]));

  const result = students.map((student) => {
    const profile = profileMap.get(student.user_id);
    const classroom = student.classroom_id ? classroomMap.get(student.classroom_id) : null;
    const teacher = student.teacher_id ? teacherMap.get(student.teacher_id) : null;

    return {
      id: student.user_id,
      name: profile?.full_name ?? "Student",
      email: profile?.email ?? "",
      hskLevel: student.current_hsk_level,
      teacherId: student.teacher_id,
      teacherName: teacher?.full_name ?? null,
      classroomId: student.classroom_id,
      classroomName: classroom?.name ?? null,
      classCode: classroom?.class_code ?? null,
      createdAt: student.created_at,
    };
  });

  return NextResponse.json({ students: result });
}
