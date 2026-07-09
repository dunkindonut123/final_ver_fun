import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssignmentGameRouter } from "@/components/student/assignment-game-router";
import {
  getCombinedAQuestionsForChapter,
  toMandarinTypingQuestions,
  toWordPool,
  type AssignmentKey,
  type AssignmentQuestionRow,
} from "@/lib/lms/assignment-questions";
import { isAssignmentALevel } from "@/lib/mandarin-typing-questions";

function extractQuestions(
  assignment: {
    assignment_questions:
      | AssignmentQuestionRow[]
      | AssignmentQuestionRow
      | null;
  } | null
): AssignmentQuestionRow[] {
  if (!assignment?.assignment_questions) return [];
  const rows = Array.isArray(assignment.assignment_questions)
    ? assignment.assignment_questions
    : [assignment.assignment_questions];
  return rows.slice().sort((a, b) => a.question_order - b.question_order);
}

export default async function StudentAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: studentAssignmentId } = await params;
  const supabase = await createClient();

  const [{ data: { user } }, { data: row }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("student_assignments")
      .select(
        `
        id,
        student_id,
        is_locked,
        is_completed,
        started_at,
        assignment:assignments!inner(
          id,
          title,
          assignment_key,
          chapter_id,
          order_index,
          chapter:hsk_chapters!inner(hsk_level),
          assignment_questions(
            id,
            assignment_id,
            question_order,
            answer,
            pinyin_hint,
            meaning_hint
          )
        )
      `
      )
      .eq("id", studentAssignmentId)
      .single(),
  ]);

  if (!user) redirect("/login");
  if (!row || row.student_id !== user.id) redirect("/student/dashboard");

  const assignment = Array.isArray(row.assignment) ? row.assignment[0] : row.assignment;
  if (!assignment) redirect("/student/dashboard");

  const chapter = Array.isArray(assignment.chapter) ? assignment.chapter[0] : assignment.chapter;
  if (!chapter) redirect("/student/dashboard");

  if (!row.is_locked && !row.is_completed && !row.started_at) {
    void supabase
      .from("student_assignments")
      .update({ started_at: new Date().toISOString() })
      .eq("id", row.id)
      .is("started_at", null);
  }

  const assignmentKey = assignment.assignment_key as AssignmentKey;
  const dbRows = extractQuestions(assignment);
  let mandarinQuestions;
  let assignmentBWords;

  if (isAssignmentALevel(assignmentKey)) {
    mandarinQuestions = dbRows.length > 0 ? toMandarinTypingQuestions(dbRows) : [];
  } else if (assignmentKey === "B") {
    // Prefer synced B rows when present; otherwise build from A1–A3 in one query.
    if (dbRows.length > 0) {
      assignmentBWords = toWordPool(dbRows);
    } else {
      const combinedRows = await getCombinedAQuestionsForChapter(supabase, assignment.chapter_id);
      assignmentBWords = combinedRows.length > 0 ? toWordPool(combinedRows) : [];
    }
  }

  return (
    <AssignmentGameRouter
      studentAssignmentId={row.id}
      chapterId={assignment.chapter_id}
      hskLevel={chapter.hsk_level}
      assignmentKey={assignment.assignment_key}
      assignmentTitle={assignment.title}
      isLocked={row.is_locked}
      mandarinQuestions={mandarinQuestions}
      assignmentBWords={assignmentBWords}
    />
  );
}
