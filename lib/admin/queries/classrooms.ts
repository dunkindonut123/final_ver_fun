import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminClassroomRow = {
  id: string;
  name: string;
  classCode: string;
  hskLevel: number;
  teacherId: string;
  teacherName: string;
  studentCount: number;
  createdAt: string;
};

export async function fetchAdminClassrooms(db: SupabaseClient): Promise<AdminClassroomRow[]> {
  const { data: classrooms, error } = await db
    .from("classrooms")
    .select("id, name, class_code, hsk_level, teacher_id, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const teacherIds = [...new Set((classrooms ?? []).map((c) => c.teacher_id))];

  const { data: teachers } =
    teacherIds.length > 0
      ? await db.from("profiles").select("id, full_name").in("id", teacherIds)
      : { data: [] as { id: string; full_name: string | null }[] };

  const teacherMap = new Map((teachers ?? []).map((t) => [t.id, t]));

  const classroomIds = (classrooms ?? []).map((c) => c.id);
  const { data: studentCounts } =
    classroomIds.length > 0
      ? await db.from("students").select("classroom_id").in("classroom_id", classroomIds)
      : { data: [] as { classroom_id: string | null }[] };

  const countMap = new Map<string, number>();
  (studentCounts ?? []).forEach((row) => {
    if (!row.classroom_id) return;
    countMap.set(row.classroom_id, (countMap.get(row.classroom_id) ?? 0) + 1);
  });

  return (classrooms ?? []).map((classroom) => ({
    id: classroom.id,
    name: classroom.name,
    classCode: classroom.class_code,
    hskLevel: classroom.hsk_level,
    teacherId: classroom.teacher_id,
    teacherName: teacherMap.get(classroom.teacher_id)?.full_name ?? "Teacher",
    studentCount: countMap.get(classroom.id) ?? 0,
    createdAt: classroom.created_at,
  }));
}
