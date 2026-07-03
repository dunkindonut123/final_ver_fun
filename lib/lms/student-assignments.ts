import type { SupabaseClient } from "@supabase/supabase-js";
import { recordStudentAssignmentAttempt } from "@/lib/lms/assignment-attempts";

export interface AssignmentRow {
  id: string;
  chapter_id: string;
  title: string;
  order_index: number;
  assignment_key: "A1" | "A2" | "A3" | "B";
}

export interface StudentAssignmentRow {
  id: string;
  student_id: string;
  assignment_id: string;
  is_locked: boolean;
  is_completed: boolean;
  score: number | null;
  completed_at: string | null;
  assignment?: AssignmentRow;
}

export async function seedStudentAssignments(
  supabase: SupabaseClient,
  studentId: string,
  hskLevel: number
) {
  const { error } = await supabase.rpc("seed_student_assignments", {
    p_student_id: studentId,
    p_hsk_level: hskLevel,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function completeStudentAssignment(
  supabase: SupabaseClient,
  studentAssignmentId: string,
  score: number
) {
  const { data: existing, error: fetchError } = await supabase
    .from("student_assignments")
    .select("started_at")
    .eq("id", studentAssignmentId)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));
  const completedAt = new Date().toISOString();

  const { error } = await supabase
    .from("student_assignments")
    .update({
      is_completed: true,
      score: normalizedScore,
      completed_at: completedAt,
    })
    .eq("id", studentAssignmentId);

  if (error) {
    throw new Error(error.message);
  }

  await recordStudentAssignmentAttempt(
    supabase,
    studentAssignmentId,
    normalizedScore,
    existing?.started_at ?? null
  );
}

export async function retryStudentAssignment(
  supabase: SupabaseClient,
  studentAssignmentId: string
) {
  const { error } = await supabase
    .from("student_assignments")
    .update({
      is_completed: false,
      started_at: null,
      completed_at: null,
    })
    .eq("id", studentAssignmentId);

  if (error) {
    throw new Error(error.message);
  }
}

export interface AssignmentBMetrics {
  wpm: number;
  accuracy: number;
  correctWords: number;
  incorrectWords: number;
}

export function assignmentScoreFromCorrect(correct: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

export function assignmentBScoreFromMetrics(metrics: AssignmentBMetrics) {
  const wpmScore = Math.min(100, Math.round((metrics.wpm / 50) * 100));
  const totalWords = metrics.correctWords + metrics.incorrectWords;
  const wordAccuracy =
    totalWords > 0 ? Math.round((metrics.correctWords / totalWords) * 100) : metrics.accuracy;
  const throughputScore = Math.min(100, Math.round((metrics.correctWords / 15) * 100));

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        0.35 * metrics.accuracy + 0.25 * wpmScore + 0.2 * wordAccuracy + 0.2 * throughputScore
      )
    )
  );
}
