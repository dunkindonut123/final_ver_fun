import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getQuestionCountsByAssignmentIds } from "@/lib/lms/assignment-questions";
import { isAssignmentALevel } from "@/lib/mandarin-typing-questions";
import {
  ChapterDetailContent,
  type ChapterAssignmentItem,
} from "@/components/student/chapter-detail-content";

type AssignmentStatus = "locked" | "not_started" | "in_progress" | "completed";

function mapAssignmentRows(
  rows: {
    id: string;
    is_locked: boolean;
    is_completed: boolean;
    score: number | null;
    correct_count?: number | null;
    total_questions?: number | null;
    started_at: string | null;
    assignment: {
      id: string;
      title: string;
      order_index: number;
      assignment_key: string;
      chapter_id: string;
    } | {
      id: string;
      title: string;
      order_index: number;
      assignment_key: string;
      chapter_id: string;
    }[] | null;
  }[]
): ChapterAssignmentItem[] {
  return rows
    .map((row) => {
      const assignment = Array.isArray(row.assignment) ? row.assignment[0] : row.assignment;
      if (!assignment) return null;

      const status: AssignmentStatus = row.is_locked
        ? "locked"
        : row.is_completed
          ? "completed"
          : row.started_at
            ? "in_progress"
            : "not_started";

      return {
        studentAssignmentId: row.id,
        assignmentId: assignment.id,
        title: assignment.title,
        orderIndex: assignment.order_index,
        assignmentKey: assignment.assignment_key,
        isLocked: row.is_locked,
        isCompleted: row.is_completed,
        score: row.score,
        correctCount: row.correct_count ?? null,
        totalQuestions: row.total_questions ?? null,
        questionPoolCount: null as number | null,
        status,
      };
    })
    .filter((item): item is ChapterAssignmentItem => item !== null)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export default async function StudentChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: chapterId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: chapter }, { data: student }, assignmentQuery] =
    await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase
        .from("hsk_chapters")
        .select("id, title, hsk_level, description")
        .eq("id", chapterId)
        .single(),
      supabase.from("students").select("current_hsk_level").eq("user_id", user.id).single(),
      supabase
        .from("student_assignments")
        .select(
          "id, is_locked, is_completed, score, correct_count, total_questions, started_at, assignment:assignments!inner(id, title, order_index, assignment_key, chapter_id)"
        )
        .eq("student_id", user.id)
        .eq("assignments.chapter_id", chapterId),
    ]);

  let assignmentRows: Parameters<typeof mapAssignmentRows>[0] | null = assignmentQuery.data;
  if (assignmentQuery.error?.message?.includes("correct_count")) {
    const fallback = await supabase
      .from("student_assignments")
      .select(
        "id, is_locked, is_completed, score, started_at, assignment:assignments!inner(id, title, order_index, assignment_key, chapter_id)"
      )
      .eq("student_id", user.id)
      .eq("assignments.chapter_id", chapterId);
    assignmentRows = fallback.data;
  }

  if (!profile || profile.role !== "student") redirect("/login");
  if (!chapter) redirect("/student/dashboard");
  if (!student || student.current_hsk_level !== chapter.hsk_level) {
    redirect("/student/dashboard");
  }

  const baseAssignments = mapAssignmentRows(assignmentRows ?? []);
  const aAssignmentIds = baseAssignments
    .filter((assignment) => isAssignmentALevel(assignment.assignmentKey))
    .map((assignment) => assignment.assignmentId);
  const questionCounts = await getQuestionCountsByAssignmentIds(supabase, aAssignmentIds);
  const assignments = baseAssignments.map((assignment) => ({
    ...assignment,
    questionPoolCount: isAssignmentALevel(assignment.assignmentKey)
      ? questionCounts.get(assignment.assignmentId) ?? null
      : null,
  }));

  return (
    <ChapterDetailContent
      chapterTitle={chapter.title}
      chapterDescription={chapter.description ?? null}
      hskLevel={chapter.hsk_level}
      assignments={assignments}
    />
  );
}
