"use client"

import React, { useCallback, useState } from "react"
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
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const handleFinished = useCallback(
    async (metrics: {
      wpm: number
      accuracy: number
      correctWords: number
      incorrectWords: number
    }) => {
      if (!studentAssignmentId) return

      setSaveState("saving")
      setSaveMessage(null)

      try {
        const score = assignmentBScoreFromMetrics(metrics)
        const response = await fetch(`/api/student/assignments/${studentAssignmentId}/complete`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          setSaveState("error")
          setSaveMessage(
            typeof payload.error === "string"
              ? payload.error
              : "Failed to save assignment progress."
          )
          return
        }

        setSaveState("saved")
        setSaveMessage("Assignment successfully saved.")
      } catch {
        setSaveState("error")
        setSaveMessage("Failed to save assignment progress.")
      }
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
      saveState={saveState}
      saveMessage={saveMessage}
    />
  )
}

export default AssignmentBGame
