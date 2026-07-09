import type { SupabaseClient } from "@supabase/supabase-js";
import {
  recordStudentAssignmentAttempt,
  type AssignmentCompletionInput,
} from "@/lib/lms/assignment-attempts";
import { createAdminClient } from "@/lib/supabase/admin";

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
  correct_count: number | null;
  total_questions: number | null;
  completed_at: string | null;
  assignment?: AssignmentRow;
}

/** Seeds assignment rows for a student. Uses service-role only — the RPC is not executable by authenticated clients. */
export async function seedStudentAssignments(studentId: string, hskLevel: number) {
  const admin = createAdminClient();
  const { error } = await admin.rpc("seed_student_assignments", {
    p_student_id: studentId,
    p_hsk_level: hskLevel,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/** Resolves the caller's student_assignments row for a chapter + assignment key (A1/A2/A3/B). */
export async function findStudentAssignmentForChapterKey(
  supabase: SupabaseClient,
  studentId: string,
  chapterId: string,
  assignmentKey: AssignmentRow["assignment_key"]
) {
  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("id")
    .eq("chapter_id", chapterId)
    .eq("assignment_key", assignmentKey)
    .maybeSingle();

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  if (!assignment) {
    return null;
  }

  const { data, error } = await supabase
    .from("student_assignments")
    .select("id, student_id, is_locked")
    .eq("student_id", studentId)
    .eq("assignment_id", assignment.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function completeStudentAssignment(
  supabase: SupabaseClient,
  studentAssignmentId: string,
  input: AssignmentCompletionInput
) {
  const { data: existing, error: fetchError } = await supabase
    .from("student_assignments")
    .select("started_at")
    .eq("id", studentAssignmentId)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const normalizedScore = Math.min(100, Math.max(0, Math.round(input.score)));
  const correctCount =
    typeof input.correctCount === "number" ? Math.max(0, Math.round(input.correctCount)) : null;
  const totalQuestions =
    typeof input.totalQuestions === "number" ? Math.max(1, Math.round(input.totalQuestions)) : null;
  const completedAt = new Date().toISOString();

  const { error } = await supabase
    .from("student_assignments")
    .update({
      is_completed: true,
      score: normalizedScore,
      correct_count: correctCount,
      total_questions: totalQuestions,
      completed_at: completedAt,
    })
    .eq("id", studentAssignmentId);

  if (error) {
    throw new Error(error.message);
  }

  await recordStudentAssignmentAttempt(
    supabase,
    studentAssignmentId,
    {
      score: normalizedScore,
      correctCount: correctCount ?? undefined,
      totalQuestions: totalQuestions ?? undefined,
    },
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
