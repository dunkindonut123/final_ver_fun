"use client"

import React from "react"
import { TypingGame } from "@/components/typing-game"
import { generateWordSetForChapter, type HSKLevel } from "@/lib/hanzi-data"

interface AssignmentBGameProps {
  chapterId: string
  level: HSKLevel
}

export function AssignmentBGame({ chapterId, level }: AssignmentBGameProps) {
  // Generate a deterministic pool for the chapter and pass it to TypingGame
  const pool = generateWordSetForChapter(level, chapterId, 200)

  return <TypingGame level={level} initialWordPool={pool} />
}

export default AssignmentBGame
