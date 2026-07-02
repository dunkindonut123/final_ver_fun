"use client"

import React from "react"
import { TypingGame } from "@/components/typing-game"
import { QuestionsUnavailable } from "@/components/student/questions-unavailable"

interface AssignmentBGameProps {
  chapterId: string
  initialWordPool?: string[]
  returnHref?: string
}

export function AssignmentBGame({ initialWordPool, returnHref }: AssignmentBGameProps) {
  if (!initialWordPool?.length) {
    return <QuestionsUnavailable returnHref={returnHref} compact={Boolean(returnHref)} />
  }

  return <TypingGame initialWordPool={initialWordPool} />
}

export default AssignmentBGame
