import { redirect, notFound } from "next/navigation"
import { isAssignmentALevel, isAssignmentKeyForHsk, parseHskLevelFromChapterId } from "@/lib/lms/assignment-keys"
import { isValidHskLevel } from "@/lib/lms/hsk-levels"
import { findStudentAssignmentForChapterKey } from "@/lib/lms/student-assignments"
import type { AssignmentRow } from "@/lib/lms/student-assignments"
import { createClient } from "@/lib/supabase/server"

function resolveAssignmentKey(query: {
  assignment?: string
  legacy?: string
}): AssignmentRow["assignment_key"] | null {
  if ((query.legacy ?? "").toLowerCase() === "b") {
    return "B"
  }

  const key = (query.assignment ?? "").toUpperCase()
  if (isAssignmentALevel(key) || key === "B") {
    return key
  }

  return null
}

/**
 * Legacy entry point. Resolves chapter/assignment query params to the caller's
 * student_assignments row and redirects into the lock-aware student flow.
 * Does not load questions or write legacy progress.
 */
export default async function TypingHanziPage({
  searchParams,
}: {
  searchParams?: Promise<{
    hsk?: string
    assignment?: string
    chapterId?: string
    legacy?: string
  }>
}) {
  const query = searchParams ? await searchParams : {}
  const chapterId = query.chapterId
  const assignmentKey = resolveAssignmentKey(query)
  const hskLevel = Number.parseInt(query.hsk ?? "", 10)

  if (!chapterId || !assignmentKey) {
    notFound()
  }

  // HSK is optional for B/legacy links; when present it must be valid.
  if (query.hsk !== undefined && query.hsk !== "" && !isValidHskLevel(hskLevel)) {
    notFound()
  }

  const chapterHsk = parseHskLevelFromChapterId(chapterId)
  const effectiveHsk = isValidHskLevel(hskLevel) ? hskLevel : chapterHsk
  if (effectiveHsk !== null && !isAssignmentKeyForHsk(effectiveHsk, assignmentKey)) {
    notFound()
  }
  if (isValidHskLevel(hskLevel) && chapterHsk !== null && hskLevel !== chapterHsk) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const row = await findStudentAssignmentForChapterKey(
    supabase,
    user.id,
    chapterId,
    assignmentKey
  )

  if (!row) {
    redirect(`/student/chapter/${chapterId}`)
  }

  redirect(`/student/assignment/${row.id}`)
}
