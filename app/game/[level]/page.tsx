import { TypingGame } from "@/components/typing-game"
import { notFound } from "next/navigation"
import type { HSKLevel } from "@/lib/hanzi-data"

export default async function GamePage({
  params,
}: {
  params: Promise<{ level: string }>
}) {
  const { level: levelParam } = await params
  const level = Number.parseInt(levelParam, 10) as HSKLevel

  if (![1, 2, 3, 4].includes(level)) {
    notFound()
  }

  return <TypingGame level={level} />
}
