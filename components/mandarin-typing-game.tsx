"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Home, RotateCcw, Volume2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  ASSIGNMENT_KEYS,
  completedAssignmentsToScore,
  scoreToCompletedAssignments,
} from "@/lib/assignment-progress"
import {
  getMandarinTypingQuestions,
  type AssignmentALevel,
  type SupportedHskLevel,
} from "@/lib/mandarin-typing-questions"

type GameState = "playing" | "finished"
type SaveState = "idle" | "saving" | "saved" | "error"

interface MandarinTypingGameProps {
  hskLevel: SupportedHskLevel
  assignmentLevel: AssignmentALevel
  chapterId?: string
  studentAssignmentId?: string
  returnHref?: string
}

function normalizeInput(value: string) {
  return value.replace(/\s+/g, "")
}

function completedCountForAssignment(assignmentLevel: AssignmentALevel) {
  if (assignmentLevel === "A1") return 1
  if (assignmentLevel === "A2") return 2
  return 3
}

export function MandarinTypingGame({
  hskLevel,
  assignmentLevel,
  chapterId,
  studentAssignmentId,
  returnHref = "/student/dashboard",
}: MandarinTypingGameProps) {
  const questions = useMemo(
    () => getMandarinTypingQuestions(hskLevel, assignmentLevel, chapterId),
    [assignmentLevel, hskLevel, chapterId]
  )
  const totalQuestions = questions.length

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [inputValue, setInputValue] = useState("")
  const [score, setScore] = useState(0)
  const [gameState, setGameState] = useState<GameState>("playing")
  const [answerSubmitted, setAnswerSubmitted] = useState(false)
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentQuestion = questions[currentQuestionIndex]

  const progressValue = useMemo(() => {
    if (gameState === "finished") return 100
    return ((currentQuestionIndex + 1) / totalQuestions) * 100
  }, [currentQuestionIndex, gameState, totalQuestions])

  const answerLength = currentQuestion?.answer.length ?? 0

  const handlePlayHint = () => {
    if (typeof window === "undefined" || !currentQuestion) {
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(currentQuestion.pinyinHint)
    utterance.lang = "zh-CN"
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }

  const handleSubmit = () => {
    if (!currentQuestion || answerSubmitted) {
      return
    }

    const isCorrect = normalizeInput(inputValue) === currentQuestion.answer
    const isLastQuestion = currentQuestionIndex + 1 === totalQuestions

    setLastAnswerCorrect(isCorrect)
    setAnswerSubmitted(true)

    if (isCorrect) {
      setScore((prev) => prev + 1)
    }

    if (isLastQuestion && saveState === "idle") {
      void persistAssignmentCompletion()
    }
  }

  const goToNextQuestion = () => {
    if (currentQuestionIndex + 1 >= totalQuestions) {
      if (saveState === "idle") {
        void persistAssignmentCompletion()
      }
      setGameState("finished")
      return
    }

    setCurrentQuestionIndex((prev) => prev + 1)
    setInputValue("")
    setAnswerSubmitted(false)
    setLastAnswerCorrect(null)
    inputRef.current?.focus()
  }

  const restartGame = () => {
    window.speechSynthesis.cancel()
    setCurrentQuestionIndex(0)
    setInputValue("")
    setScore(0)
    setGameState("playing")
    setAnswerSubmitted(false)
    setLastAnswerCorrect(null)
    setSaveState("idle")
    setSaveMessage(null)
    inputRef.current?.focus()
  }

  const persistAssignmentCompletion = useCallback(async () => {
    if (!chapterId && !studentAssignmentId) {
      setSaveState("saved")
      return
    }

    setSaveState("saving")
    setSaveMessage(null)

    try {
      if (studentAssignmentId) {
        const percentScore = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
        const response = await fetch(`/api/student/assignments/${studentAssignmentId}/complete`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: percentScore }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          setSaveState("error")
          setSaveMessage(payload.error ?? "Gagal menyimpan progress assignment.")
          return
        }

        setSaveState("saved")
        setSaveMessage("Assignment berhasil ditandai selesai.")
        return
      }

      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setSaveState("error")
        setSaveMessage("Sesi login tidak ditemukan. Silakan login ulang.")
        return
      }

      const { data: existingProgress, error: fetchError } = await supabase
        .from("student_chapter_progress")
        .select("score")
        .eq("student_id", userData.user.id)
        .eq("chapter_id", chapterId)
        .maybeSingle()

      if (fetchError) {
        setSaveState("error")
        setSaveMessage(fetchError.message)
        return
      }

      const previousCompleted = scoreToCompletedAssignments(existingProgress?.score ?? null)
      const targetCompleted = completedCountForAssignment(assignmentLevel)
      const nextCompleted = Math.max(previousCompleted, targetCompleted)

      const { error: upsertError } = await supabase.from("student_chapter_progress").upsert(
        {
          student_id: userData.user.id,
          chapter_id: chapterId,
          score: completedAssignmentsToScore(nextCompleted),
          is_completed: nextCompleted === ASSIGNMENT_KEYS.length,
          time_spent_minutes: 0,
          last_accessed: new Date().toISOString(),
        },
        {
          onConflict: "student_id,chapter_id",
        }
      )

      if (upsertError) {
        setSaveState("error")
        setSaveMessage(upsertError.message)
        return
      }

      // Also upsert assignment-level completion into student_assignment_progress
      // so that individual assignment completion is tracked (A1/A2/A3/B)
      try {
        await supabase.from("student_assignment_progress").upsert(
          {
            student_id: userData.user.id,
            chapter_id: chapterId,
            assignment_key: assignmentLevel,
            is_completed: true,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "student_id,chapter_id,assignment_key" }
        )
      } catch (e) {
        // ignore assignment upsert errors here; main chapter progress succeeded
      }

      setSaveState("saved")
      setSaveMessage("Assignment berhasil ditandai selesai.")
    } catch {
      setSaveState("error")
      setSaveMessage("Gagal menyimpan progress assignment.")
    }
  }, [assignmentLevel, chapterId, score, studentAssignmentId, totalQuestions])

  useEffect(() => {
    if (gameState !== "finished" || saveState !== "idle") {
      return
    }

    void persistAssignmentCompletion()
  }, [gameState, persistAssignmentCompletion, saveState])

  if (gameState === "finished") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <section className="w-full max-w-2xl rounded-3xl border border-border bg-card p-8 text-center shadow-sm space-y-6">
          <h1 className="text-3xl font-bold text-foreground">Game Selesai</h1>
          <p className="text-muted-foreground">Skor Akhir Kamu</p>

          <div className="mx-auto w-fit rounded-2xl border border-border bg-background px-10 py-6">
            <p className="text-5xl font-bold text-primary">
              {score}/{totalQuestions}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Jawaban benar</p>
          </div>

          {(saveState === "saving" || saveMessage) && (
            <p className="text-sm text-muted-foreground">
              {saveState === "saving" ? "Menyimpan progress assignment..." : saveMessage}
            </p>
          )}

          <div className="flex items-center justify-center gap-3">
            {saveState === "saving" ? (
              <span className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground opacity-70">
                <Home className="h-4 w-4" />
                Menyimpan progress...
              </span>
            ) : (
              <Link
                href={returnHref}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Home className="h-4 w-4" />
                Beranda
              </Link>
            )}
            <button
              onClick={restartGame}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Main Lagi
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <section className="w-full max-w-4xl rounded-3xl border border-border bg-card px-6 py-8 md:px-10 md:py-10 shadow-sm space-y-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link
            href={returnHref}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Home className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>
          <p className="text-sm text-muted-foreground font-medium">HSK {hskLevel} - {assignmentLevel}</p>
        </div>

        <div className="space-y-3">
          <div className="h-16 w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md flex items-center justify-center">
            <span className="text-3xl font-bold text-white tracking-wide">
              {currentQuestionIndex + 1}/{totalQuestions}
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground">{currentQuestion.meaningHintId}</h1>
          <button
            type="button"
            onClick={handlePlayHint}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-base text-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Volume2 className="h-4 w-4" />
            Hear Pronunciation
          </button>
        </div>

        <div
          className="grid gap-3 justify-center"
          style={{ gridTemplateColumns: `repeat(${Math.max(answerLength, 1)}, minmax(0, 56px))` }}
        >
          {Array.from({ length: answerLength }).map((_, index) => {
            const char = inputValue[index] ?? ""
            return (
              <button
                key={`slot-${index}`}
                type="button"
                onClick={() => inputRef.current?.focus()}
                className="h-20 w-14 md:w-16 rounded-xl border-2 border-border bg-background text-4xl font-semibold text-foreground flex items-center justify-center"
              >
                {char || ""}
              </button>
            )
          })}
        </div>

        <div className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(event) => {
              if (answerSubmitted) return
              setInputValue(event.target.value)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                if (answerSubmitted) {
                  goToNextQuestion()
                } else {
                  handleSubmit()
                }
              }
            }}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-lg text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Ketik jawaban hanzi di sini"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />

          {answerSubmitted && (
            <div
              className={`rounded-lg px-4 py-3 text-sm font-medium text-center ${
                lastAnswerCorrect
                  ? "bg-green-500/10 text-green-700 border border-green-500/30"
                  : "bg-red-500/10 text-red-700 border border-red-500/30"
              }`}
            >
              {lastAnswerCorrect
                ? "Benar"
                : `Kurang tepat. Jawaban yang benar: ${currentQuestion.answer}`}
            </div>
          )}

          <div className="flex items-center justify-center">
            {answerSubmitted ? (
              <button
                type="button"
                onClick={goToNextQuestion}
                className="rounded-lg bg-primary px-8 py-3 text-xl font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {currentQuestionIndex + 1 === totalQuestions ? "Lihat Skor" : "Soal Berikutnya"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-lg bg-emerald-500 px-8 py-3 text-xl font-semibold text-white hover:bg-emerald-600 transition-colors"
              >
                Submit Answer
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
