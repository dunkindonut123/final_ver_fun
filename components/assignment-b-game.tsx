"use client"

import React, { useCallback } from "react"
import { TypingGame } from "@/components/typing-game"
import { QuestionsUnavailable } from "@/components/student/questions-unavailable"
import { assignmentBScoreFromMetrics } from "@/lib/lms/student-assignments"

interface AssignmentBGameProps {
  chapterId: string
  studentAssignmentId?: string
  initialWordPool?: string[]
  returnHref?: string
}

export function AssignmentBGame({
  studentAssignmentId,
  initialWordPool,
  returnHref,
}: AssignmentBGameProps) {
  const handleFinished = useCallback(
    async (metrics: {
      wpm: number
      accuracy: number
      correctWords: number
      incorrectWords: number
    }) => {
      if (!studentAssignmentId) return

      const score = assignmentBScoreFromMetrics(metrics)
      await fetch(`/api/student/assignments/${studentAssignmentId}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      })
    },
    [studentAssignmentId]
  )

  if (!initialWordPool?.length) {
    return <QuestionsUnavailable returnHref={returnHref} compact={Boolean(returnHref)} />
  }

  return (
    <TypingGame
      initialWordPool={initialWordPool}
      returnHref={returnHref}
      onFinished={studentAssignmentId ? handleFinished : undefined}
    />
  )
}

export default AssignmentBGame
