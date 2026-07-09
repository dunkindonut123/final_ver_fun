import type { SupabaseClient } from "@supabase/supabase-js";

export type TeacherClassroomRow = {
  id: string;
  name: string;
  class_code: string;
  hsk_level: number;
  student_count: number;
};

export async function getTeacherClassrooms(
  supabase: SupabaseClient,
  teacherId: string
): Promise<TeacherClassroomRow[]> {
  const { data: classroomRows } = await supabase
    .from("classrooms")
    .select("id, name, class_code, hsk_level")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (!classroomRows || classroomRows.length === 0) {
    return [];
  }

  const classroomIds = classroomRows.map((classroom) => classroom.id);
  const { data: studentRows } = await supabase
    .from("students")
    .select("classroom_id")
    .in("classroom_id", classroomIds);

  const countMap = new Map<string, number>();
  for (const row of studentRows ?? []) {
    if (!row.classroom_id) continue;
    countMap.set(row.classroom_id, (countMap.get(row.classroom_id) ?? 0) + 1);
  }

  return classroomRows.map((classroom) => ({
    ...classroom,
    student_count: countMap.get(classroom.id) ?? 0,
  }));
}
