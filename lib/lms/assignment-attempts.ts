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

export interface AssignmentAttemptHistory {
  attempts: AssignmentAttemptItem[];
  totalCount: number;
}

function normalizeCompletionInput(input: AssignmentCompletionInput) {
  const normalizedScore = Math.min(100, Math.max(0, Math.round(input.score)));
  const correctCount =
    typeof input.correctCount === "number" ? Math.max(0, Math.round(input.correctCount)) : null;
  const totalQuestions =
    typeof input.totalQuestions === "number" ? Math.max(1, Math.round(input.totalQuestions)) : null;
  return { normalizedScore, correctCount, totalQuestions };
}

export async function recordStudentAssignmentAttempt(
  supabase: SupabaseClient,
  studentAssignmentId: string,
  input: AssignmentCompletionInput,
  startedAt: string | null
): Promise<AssignmentAttemptItem> {
  const { normalizedScore, correctCount, totalQuestions } = normalizeCompletionInput(input);
  const completedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("student_assignment_attempts")
    .insert({
      student_assignment_id: studentAssignmentId,
      score: normalizedScore,
      correct_count: correctCount,
      total_questions: totalQuestions,
      started_at: startedAt,
      completed_at: completedAt,
    })
    .select("id, score, correct_count, total_questions, started_at, completed_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to record assignment attempt.");
  }

  return {
    id: data.id,
    score: data.score,
    correctCount: data.correct_count,
    totalQuestions: data.total_questions,
    startedAt: data.started_at,
    completedAt: data.completed_at,
  };
}

export async function getAttemptsForStudentAssignment(
  supabase: SupabaseClient,
  studentAssignmentId: string,
  limit = 20
): Promise<AssignmentAttemptHistory> {
  const [listResult, countResult] = await Promise.all([
    supabase
      .from("student_assignment_attempts")
      .select("id, score, correct_count, total_questions, started_at, completed_at")
      .eq("student_assignment_id", studentAssignmentId)
      .order("completed_at", { ascending: false })
      .limit(limit),
    supabase
      .from("student_assignment_attempts")
      .select("id", { count: "exact", head: true })
      .eq("student_assignment_id", studentAssignmentId),
  ]);

  if (listResult.error) throw new Error(listResult.error.message);
  if (countResult.error) throw new Error(countResult.error.message);

  return {
    attempts: (listResult.data ?? []).map((row) => ({
      id: row.id,
      score: row.score,
      correctCount: row.correct_count,
      totalQuestions: row.total_questions,
      startedAt: row.started_at,
      completedAt: row.completed_at,
    })),
    totalCount: countResult.count ?? listResult.data?.length ?? 0,
  };
}
