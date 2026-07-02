import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssignmentGameRouter } from "@/components/student/assignment-game-router";
import {
  getQuestionsForAssignment,
  toMandarinTypingQuestions,
  toWordPool,
  type AssignmentKey,
} from "@/lib/lms/assignment-questions";
import { isAssignmentALevel } from "@/lib/mandarin-typing-questions";

export default async function StudentAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: studentAssignmentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: row } = await supabase
    .from("student_assignments")
    .select(
      "id, student_id, is_locked, is_completed, started_at, assignment:assignments(id, title, assignment_key, chapter_id, order_index)"
    )
    .eq("id", studentAssignmentId)
    .single();

  if (!row || row.student_id !== user.id) redirect("/student/dashboard");

  const assignment = Array.isArray(row.assignment) ? row.assignment[0] : row.assignment;
  if (!assignment) redirect("/student/dashboard");

  const { data: chapter } = await supabase
    .from("hsk_chapters")
    .select("hsk_level")
    .eq("id", assignment.chapter_id)
    .single();

  if (!chapter) redirect("/student/dashboard");

  // Mark assignment as "in progress" the first time it is opened (unlocked, not completed).
  if (!row.is_locked && !row.is_completed && !row.started_at) {
    await supabase
      .from("student_assignments")
      .update({ started_at: new Date().toISOString() })
      .eq("id", row.id);
  }

  const assignmentKey = assignment.assignment_key as AssignmentKey;
  let mandarinQuestions;
  let assignmentBWords;

  if (isAssignmentALevel(assignmentKey)) {
    const dbRows = await getQuestionsForAssignment(supabase, assignment.chapter_id, assignmentKey);
    mandarinQuestions = dbRows.length > 0 ? toMandarinTypingQuestions(dbRows) : [];
  } else if (assignmentKey === "B") {
    const dbRows = await getQuestionsForAssignment(supabase, assignment.chapter_id, "B");
    assignmentBWords = dbRows.length > 0 ? toWordPool(dbRows) : [];
  }

  return (
    <AssignmentGameRouter
      studentAssignmentId={row.id}
      chapterId={assignment.chapter_id}
      hskLevel={chapter.hsk_level}
      assignmentKey={assignment.assignment_key}
      assignmentTitle={assignment.title}
      isLocked={row.is_locked}
      isCompleted={row.is_completed}
      mandarinQuestions={mandarinQuestions}
      assignmentBWords={assignmentBWords}
    />
  );
}
