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
  filterStudentHanziInput,
  getAnswerSlotDisplays,
  reconstructAnswerFromHanzi,
  stripAnswerStopwords,
  type AssignmentALevel,
  type MandarinTypingQuestion,
} from "@/lib/mandarin-typing-questions"
import { QuestionsUnavailable } from "@/components/student/questions-unavailable"

type GameState = "playing" | "finished"
type SaveState = "idle" | "saving" | "saved" | "error"

interface MandarinTypingGameProps {
  hskLevel: number
  assignmentLevel: AssignmentALevel
  chapterId?: string
  studentAssignmentId?: string
  returnHref?: string
  initialQuestions?: MandarinTypingQuestion[]
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
  initialQuestions,
}: MandarinTypingGameProps) {
  const questions = useMemo(() => initialQuestions ?? [], [initialQuestions])
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
  const scoreRef = useRef(0)
  const lastAutoPlayedKeyRef = useRef<string | null>(null)
  const [autoPlayNonce, setAutoPlayNonce] = useState(0)

  const currentQuestion = questions[currentQuestionIndex]

  const progressValue = useMemo(() => {
    if (gameState === "finished") return 100
    return ((currentQuestionIndex + 1) / totalQuestions) * 100
  }, [currentQuestionIndex, gameState, totalQuestions])

  const answerSlots = useMemo(
    () =>
      currentQuestion
        ? getAnswerSlotDisplays(currentQuestion.answer, inputValue)
        : [],
    [currentQuestion, inputValue]
  )
  const answerLength = answerSlots.length
  const expectedHanziLength = currentQuestion
    ? stripAnswerStopwords(currentQuestion.answer).length
    : 0

  const playPronunciation = useCallback((text: string) => {
    if (typeof window === "undefined" || !text) {
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "zh-CN"
    utterance.rate = 0.85

    const voices = window.speechSynthesis.getVoices()
    const chineseVoice =
      voices.find((voice) => voice.lang === "zh-CN") ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith("zh"))
    if (chineseVoice) {
      utterance.voice = chineseVoice
    }

    window.speechSynthesis.speak(utterance)
  }, [])

  const handlePlayHint = () => {
    if (!currentQuestion?.answer) {
      return
    }
    playPronunciation(currentQuestion.answer)
  }

  useEffect(() => {
    if (gameState !== "playing") {
      return
    }

    const question = questions[currentQuestionIndex]
    if (!question?.answer) {
      return
    }

    const autoPlayKey = `${autoPlayNonce}:${currentQuestionIndex}:${question.id}`
    if (lastAutoPlayedKeyRef.current === autoPlayKey) {
      return
    }
    lastAutoPlayedKeyRef.current = autoPlayKey

    playPronunciation(question.answer)
  }, [autoPlayNonce, currentQuestionIndex, gameState, playPronunciation, questions])

  const handleSubmit = () => {
    if (!currentQuestion || answerSubmitted) {
      return
    }

    const isCorrect =
      reconstructAnswerFromHanzi(currentQuestion.answer, inputValue) ===
      currentQuestion.answer

    setLastAnswerCorrect(isCorrect)
    setAnswerSubmitted(true)

    if (isCorrect) {
      scoreRef.current += 1
      setScore(scoreRef.current)
    }
  }

  const goToNextQuestion = () => {
    if (currentQuestionIndex + 1 >= totalQuestions) {
      if (saveState === "idle") {
        void persistAssignmentCompletion(scoreRef.current)
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
    scoreRef.current = 0
    setScore(0)
    setGameState("playing")
    setAnswerSubmitted(false)
    setLastAnswerCorrect(null)
    setSaveState("idle")
    setSaveMessage(null)
    setAutoPlayNonce((prev) => prev + 1)
    inputRef.current?.focus()
  }

  const persistAssignmentCompletion = useCallback(async (finalCorrectCount?: number) => {
    if (!chapterId && !studentAssignmentId) {
      setSaveState("saved")
      return
    }

    setSaveState("saving")
    setSaveMessage(null)

    try {
      if (studentAssignmentId) {
        const correctCount = finalCorrectCount ?? scoreRef.current
        const percentScore =
          totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
        const response = await fetch(`/api/student/assignments/${studentAssignmentId}/complete`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: percentScore,
            correctCount,
            totalQuestions,
          }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          setSaveState("error")
          setSaveMessage(payload.error ?? "Failed to save assignment progress.")
          return
        }

        setSaveState("saved")
        setSaveMessage("Assignment successfully saved.")
        return
      }

      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setSaveState("error")
        setSaveMessage("Login session not found. Please sign in again.")
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
      setSaveMessage("Assignment successfully saved.")
    } catch {
      setSaveState("error")
      setSaveMessage("Failed to save assignment progress.")
    }
  }, [assignmentLevel, chapterId, studentAssignmentId, totalQuestions])

  if (totalQuestions === 0) {
    return <QuestionsUnavailable returnHref={returnHref} />
  }

  if (gameState === "finished") {
    const scorePercent =
      totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0

    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <section className="w-full max-w-2xl rounded-3xl border border-border bg-card p-8 text-center shadow-sm space-y-6">
          <h1 className="text-3xl font-bold text-foreground">Assignment Completed</h1>
          <p className="text-muted-foreground">Final Score</p>

          <div className="mx-auto flex w-fit items-stretch gap-4">
            <div className="rounded-2xl border border-border bg-background px-10 py-6 text-center">
              <p className="text-5xl font-bold text-primary">
                {score}/{totalQuestions}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Correct Answers</p>
            </div>
            <div className="rounded-2xl border border-border bg-background px-10 py-6 text-center">
              <p className="text-5xl font-bold text-primary">{scorePercent}%</p>
              <p className="mt-2 text-sm text-muted-foreground">Score</p>
            </div>
          </div>

          {(saveState === "saving" || saveMessage) && (
            <p className="text-sm text-muted-foreground">
              {saveState === "saving" ? "Saving assignment progress..." : saveMessage}
            </p>
          )}

          <div className="flex items-center justify-center gap-3">
            {saveState === "saving" ? (
              <span className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground opacity-70">
                <Home className="h-4 w-4" />
                Saving progress...
              </span>
            ) : (
              <Link
                href={returnHref}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            )}
            <button
              onClick={restartGame}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Retry
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
            Return to Dashboard
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
          {answerSlots.map((slot, index) => (
            <button
              key={`slot-${index}`}
              type="button"
              onClick={() => inputRef.current?.focus()}
              aria-label={
                slot.isStopword
                  ? `Punctuation ${slot.char}`
                  : `Hanzi slot ${index + 1}`
              }
              className={`h-20 w-14 md:w-16 rounded-xl border-2 text-4xl font-semibold flex items-center justify-center ${
                slot.isStopword
                  ? "border-muted-foreground/30 bg-muted text-muted-foreground"
                  : "border-border bg-background text-foreground"
              }`}
            >
              {slot.char || ""}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(event) => {
              if (answerSubmitted) return
              const filtered = filterStudentHanziInput(event.target.value)
              setInputValue(
                expectedHanziLength > 0
                  ? filtered.slice(0, expectedHanziLength)
                  : filtered
              )
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
            maxLength={expectedHanziLength > 0 ? expectedHanziLength : undefined}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-lg text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter Hanzi Here"
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
                ? "Answer Correct"
                : `Incorrect Answer, Correct Answer: ${currentQuestion.answer}`}
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
