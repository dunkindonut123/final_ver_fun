import { MandarinTypingGame } from "@/components/mandarin-typing-game"
import { isAssignmentALevel } from "@/lib/mandarin-typing-questions"
import { isValidHskLevel } from "@/lib/lms/hsk-levels"
import {
  getQuestionsForAssignment,
  toMandarinTypingQuestions,
} from "@/lib/lms/assignment-questions"
import { createClient } from "@/lib/supabase/server"
import { QuestionsUnavailable } from "@/components/student/questions-unavailable"
import { notFound } from "next/navigation"

export default async function TypingHanziPage({
  searchParams,
}: {
  searchParams?: Promise<{ hsk?: string; assignment?: string; chapterId?: string }>
}) {
  const query = searchParams ? await searchParams : {}
  const hskLevel = Number.parseInt(query.hsk ?? "", 10)
  const assignmentLevel = (query.assignment ?? "").toUpperCase()
  const chapterId = query.chapterId

  if (!isValidHskLevel(hskLevel) || !isAssignmentALevel(assignmentLevel) || !chapterId) {
    notFound()
  }

  const supabase = await createClient()
  const dbRows = await getQuestionsForAssignment(supabase, chapterId, assignmentLevel)
  const questions = dbRows.length > 0 ? toMandarinTypingQuestions(dbRows) : []

  if (questions.length === 0) {
    return <QuestionsUnavailable />
  }

  return (
    <MandarinTypingGame
      hskLevel={hskLevel}
      assignmentLevel={assignmentLevel}
      chapterId={chapterId}
      initialQuestions={questions}
    />
  )
}
