import type { SupabaseClient } from "@supabase/supabase-js";

export interface AssignmentAttemptItem {
  id: string;
  score: number;
  startedAt: string | null;
  completedAt: string;
}

export async function recordStudentAssignmentAttempt(
  supabase: SupabaseClient,
  studentAssignmentId: string,
  score: number,
  startedAt: string | null
) {
  const { error } = await supabase.from("student_assignment_attempts").insert({
    student_assignment_id: studentAssignmentId,
    score: Math.min(100, Math.max(0, Math.round(score))),
    started_at: startedAt,
    completed_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getAttemptsForStudentAssignment(
  supabase: SupabaseClient,
  studentAssignmentId: string,
  limit = 5
): Promise<AssignmentAttemptItem[]> {
  const { data, error } = await supabase
    .from("student_assignment_attempts")
    .select("id, score, started_at, completed_at")
    .eq("student_assignment_id", studentAssignmentId)
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    score: row.score,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  }));
}
