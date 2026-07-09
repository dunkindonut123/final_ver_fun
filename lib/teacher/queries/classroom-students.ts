import type { SupabaseClient } from "@supabase/supabase-js";

export type ClassroomStudentRow = {
  id: string;
  name: string;
  completedCount: number;
  unlockedCount: number;
  totalCount: number;
  overallScore: number;
};

export async function getClassroomStudentRows(
  supabase: SupabaseClient,
  params: { classroomId: string; teacherId: string; hskLevel: number }
): Promise<ClassroomStudentRow[]> {
  const { classroomId, teacherId, hskLevel } = params;

  const { data: studentRows } = await supabase
    .from("students")
    .select("user_id")
    .eq("classroom_id", classroomId)
    .eq("teacher_id", teacherId);

  if (!studentRows || studentRows.length === 0) {
    return [];
  }

  const ids = studentRows.map((row) => row.user_id);
  const [{ data: profiles }, { data: assignments }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", ids),
    supabase
      .from("student_assignments")
      .select("student_id, is_locked, is_completed, score, assignment:assignments(chapter_id)")
      .in("student_id", ids),
  ]);

  const stats = new Map<
    string,
    { completed: number; unlocked: number; total: number; scoreSum: number; scoreCount: number }
  >();
  ids.forEach((id) =>
    stats.set(id, { completed: 0, unlocked: 0, total: 0, scoreSum: 0, scoreCount: 0 })
  );

  const levelPrefix = `hsk${hskLevel}-`;
  (assignments ?? []).forEach((row) => {
    const assignment = Array.isArray(row.assignment) ? row.assignment[0] : row.assignment;
    if (!assignment?.chapter_id?.startsWith(levelPrefix)) return;

    const current = stats.get(row.student_id);
    if (!current) return;
    current.total += 1;
    if (!row.is_locked) current.unlocked += 1;
    if (row.is_completed) {
      current.completed += 1;
      if (typeof row.score === "number") {
        current.scoreSum += row.score;
        current.scoreCount += 1;
      }
    }
  });

  return (profiles ?? []).map((profile) => {
    const s = stats.get(profile.id) ?? {
      completed: 0,
      unlocked: 0,
      total: 0,
      scoreSum: 0,
      scoreCount: 0,
    };
    return {
      id: profile.id,
      name: profile.full_name ?? "Student",
      completedCount: s.completed,
      unlockedCount: s.unlocked,
      totalCount: s.total,
      overallScore: s.scoreCount > 0 ? Math.round(s.scoreSum / s.scoreCount) : 0,
    };
  });
}
