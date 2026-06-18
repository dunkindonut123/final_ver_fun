import type { SupabaseClient } from "@supabase/supabase-js";

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
  const { error } = await supabase
    .from("student_assignments")
    .update({
      is_completed: true,
      score: Math.min(100, Math.max(0, Math.round(score))),
      completed_at: new Date().toISOString(),
    })
    .eq("id", studentAssignmentId);

  if (error) {
    throw new Error(error.message);
  }
}

export function assignmentScoreFromCorrect(correct: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}
