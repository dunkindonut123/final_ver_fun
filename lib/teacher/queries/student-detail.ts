import type { SupabaseClient } from "@supabase/supabase-js";
import { getQuestionCountsByAssignmentIds } from "@/lib/lms/assignment-questions";
import { isAssignmentALevel } from "@/lib/mandarin-typing-questions";

export type AssignmentStatus = "not_started" | "in_progress" | "completed";

export type AssignmentToggle = {
  studentAssignmentId: string;
  assignmentId: string;
  title: string;
  assignmentKey: string;
  orderIndex: number;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  isLocked: boolean;
  isCompleted: boolean;
  score: number | null;
  correctCount: number | null;
  totalQuestions: number | null;
  questionPoolCount: number | null;
  status: AssignmentStatus;
};

export type PromotionFlag = {
  status: "pending" | "approved" | "rejected";
  targetLevel: number;
  note: string | null;
};

export async function getStudentAssignmentToggles(
  supabase: SupabaseClient,
  studentId: string,
  hskLevel: number
): Promise<AssignmentToggle[]> {
  let data:
    | {
        id: string;
        is_locked: boolean;
        is_completed: boolean;
        score: number | null;
        correct_count?: number | null;
        total_questions?: number | null;
        started_at: string | null;
        assignment:
          | {
              id: string;
              title: string;
              order_index: number;
              chapter_id: string;
              assignment_key: string;
            }
          | {
              id: string;
              title: string;
              order_index: number;
              chapter_id: string;
              assignment_key: string;
            }[]
          | null;
      }[]
    | null = null;

  const primary = await supabase
    .from("student_assignments")
    .select(
      "id, is_locked, is_completed, score, correct_count, total_questions, started_at, assignment:assignments(id, title, order_index, chapter_id, assignment_key)"
    )
    .eq("student_id", studentId);

  if (primary.error?.message?.includes("correct_count")) {
    const fallback = await supabase
      .from("student_assignments")
      .select(
        "id, is_locked, is_completed, score, started_at, assignment:assignments(id, title, order_index, chapter_id, assignment_key)"
      )
      .eq("student_id", studentId);
    data = fallback.data;
  } else if (primary.error || !primary.data) {
    return [];
  } else {
    data = primary.data;
  }

  if (!data) return [];

  const chapterIds = [
    ...new Set(
      data
        .map((row) => {
          const assignment = Array.isArray(row.assignment) ? row.assignment[0] : row.assignment;
          return assignment?.chapter_id ?? null;
        })
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const chapterMap = new Map<string, { title: string; hsk_level: number; chapter_number: number }>();
  if (chapterIds.length > 0) {
    const { data: chapters } = await supabase
      .from("hsk_chapters")
      .select("id, title, hsk_level, chapter_number")
      .in("id", chapterIds);

    (chapters ?? []).forEach((chapter) => {
      chapterMap.set(chapter.id, {
        title: chapter.title,
        hsk_level: chapter.hsk_level,
        chapter_number: chapter.chapter_number,
      });
    });
  }

  const levelPrefix = `hsk${hskLevel}-`;

  const items = data
    .map((row) => {
      const assignment = Array.isArray(row.assignment) ? row.assignment[0] : row.assignment;
      if (!assignment?.chapter_id?.startsWith(levelPrefix)) return null;

      const chapter = chapterMap.get(assignment.chapter_id);
      const chapterTitle = chapter?.title ?? assignment.chapter_id;
      const chapterNumber =
        chapter?.chapter_number ??
        Number.parseInt(assignment.chapter_id.match(/-ch(\d+)$/)?.[1] ?? "0", 10);

      const status: AssignmentStatus = row.is_completed
        ? "completed"
        : row.started_at
          ? "in_progress"
          : "not_started";

      return {
        studentAssignmentId: row.id,
        assignmentId: assignment.id,
        title: assignment.title,
        assignmentKey: assignment.assignment_key ?? "",
        orderIndex: assignment.order_index,
        chapterId: assignment.chapter_id,
        chapterNumber,
        chapterTitle,
        isLocked: row.is_locked,
        isCompleted: row.is_completed,
        score: row.score,
        correctCount: row.correct_count ?? null,
        totalQuestions: row.total_questions ?? null,
        questionPoolCount: null as number | null,
        status,
      };
    })
    .filter((item): item is AssignmentToggle => item !== null)
    .sort((a, b) => a.chapterNumber - b.chapterNumber || a.orderIndex - b.orderIndex);

  const aAssignmentIds = items
    .filter((item) => isAssignmentALevel(item.assignmentKey))
    .map((item) => item.assignmentId);
  const questionCounts = await getQuestionCountsByAssignmentIds(supabase, aAssignmentIds);

  return items.map((item) => ({
    ...item,
    questionPoolCount: isAssignmentALevel(item.assignmentKey)
      ? questionCounts.get(item.assignmentId) ?? null
      : null,
  }));
}

export async function getLatestPromotionFlag(
  supabase: SupabaseClient,
  studentId: string
): Promise<PromotionFlag | null> {
  const { data } = await supabase
    .from("promotion_flags")
    .select("status, target_level, note")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    status: data.status as PromotionFlag["status"],
    targetLevel: data.target_level,
    note: data.note,
  };
}
