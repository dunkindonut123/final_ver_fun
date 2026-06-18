import { MandarinTypingGame } from "@/components/mandarin-typing-game"
import {
  isAssignmentALevel,
  isSupportedHskLevel,
} from "@/lib/mandarin-typing-questions"
import { notFound } from "next/navigation"

export default async function TypingHanziPage({
  searchParams,
}: {
  searchParams?: Promise<{ hsk?: string; assignment?: string; chapterId?: string }>
}) {
  const query = searchParams ? await searchParams : {}
  const hskLevel = Number.parseInt(query.hsk ?? "", 10)
  const assignmentLevel = (query.assignment ?? "").toUpperCase()

  if (!isSupportedHskLevel(hskLevel) || !isAssignmentALevel(assignmentLevel)) {
    notFound()
  }

  return (
    <MandarinTypingGame
      hskLevel={hskLevel}
      assignmentLevel={assignmentLevel}
      chapterId={query.chapterId}
    />
  )
}
