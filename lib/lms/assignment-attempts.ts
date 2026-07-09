import type { SupabaseClient } from "@supabase/supabase-js";

export interface AssignmentCompletionInput {
  score: number;
  correctCount?: number;
  totalQuestions?: number;
}

export interface AssignmentAttemptItem {
  id: string;
  score: number;
  correctCount: number | null;
  totalQuestions: number | null;
  startedAt: string | null;
  completedAt: string;
}

export async function recordStudentAssignmentAttempt(
  supabase: SupabaseClient,
  studentAssignmentId: string,
  input: AssignmentCompletionInput,
  startedAt: string | null
) {
  const normalizedScore = Math.min(100, Math.max(0, Math.round(input.score)));
  const correctCount =
    typeof input.correctCount === "number" ? Math.max(0, Math.round(input.correctCount)) : null;
  const totalQuestions =
    typeof input.totalQuestions === "number" ? Math.max(1, Math.round(input.totalQuestions)) : null;

  const { error } = await supabase.from("student_assignment_attempts").insert({
    student_assignment_id: studentAssignmentId,
    score: normalizedScore,
    correct_count: correctCount,
    total_questions: totalQuestions,
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
    .select("id, score, correct_count, total_questions, started_at, completed_at")
    .eq("student_assignment_id", studentAssignmentId)
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    score: row.score,
    correctCount: row.correct_count,
    totalQuestions: row.total_questions,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  }));
}
