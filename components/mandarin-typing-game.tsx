"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Home, RotateCcw, Volume2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  completedAssignmentsToScore,
  scoreToCompletedAssignments,
} from "@/lib/assignment-progress"
import { assignmentKeysForHsk } from "@/lib/lms/assignment-keys"
import {
  filterStudentHanziInput,
  getAnswerSlotDisplays,
  reconstructAnswerFromHanzi,
  stripAnswerStopwords,
  type AssignmentALevel,
  type MandarinTypingQuestion,
} from "@/lib/mandarin-typing-questions"
import { playCorrectBell, playWrongBuzz } from "@/lib/answer-sounds"
import { QuestionsUnavailable } from "@/components/student/questions-unavailable"
import { useStableKeyboardViewport } from "@/lib/use-stable-keyboard-viewport"

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
  return Number.parseInt(assignmentLevel.slice(1), 10)
}

function normalizeVoiceLang(lang: string) {
  return lang.toLowerCase().replace(/_/g, "-")
}

/** Preference order — lower index wins when multiple Mandarin voices exist. */
const MANDARIN_VOICE_PREFERENCE = [
  "google",
  "neural",
  "premium",
  "enhanced",
  "xiaoxiao",
  "xiaoyi",
  "yunxi",
  "yunyang",
  "tingting",
  "ting-ting",
  "meijia",
  "mei-jia",
] as const

const SPEECH_RATE = 0.9
/** Browsers often drop speak() queued immediately after cancel(); a short gap avoids that. */
const SPEAK_AFTER_CANCEL_MS = 50
const VOICES_FALLBACK_MS = 750

function isMandarinVoiceLang(lang: string) {
  const normalized = normalizeVoiceLang(lang)
  return (
    normalized === "zh-cn" ||
    normalized === "zh" ||
    normalized.startsWith("zh-cn") ||
    normalized.startsWith("cmn")
  )
}

/** Prefer higher-quality Mainland Mandarin voices when the browser provides them. */
function pickFluentMandarinVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  const mandarinVoices = voices.filter((voice) => isMandarinVoiceLang(voice.lang))

  let best: SpeechSynthesisVoice | undefined
  let bestRank = Number.POSITIVE_INFINITY

  for (const voice of mandarinVoices) {
    const name = voice.name.toLowerCase()
    const rank = MANDARIN_VOICE_PREFERENCE.findIndex((token) => name.includes(token))
    if (rank >= 0 && rank < bestRank) {
      best = voice
      bestRank = rank
    }
  }

  return (
    best ??
    mandarinVoices.find((voice) =>
      normalizeVoiceLang(voice.lang).startsWith("zh-cn")
    ) ??
    mandarinVoices[0] ??
    voices.find((voice) => normalizeVoiceLang(voice.lang).startsWith("zh"))
  )
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
  const isComposingRef = useRef(false)
  /** After the first Hear Pronunciation tap, question-change autoplay is allowed. */
  const speechUnlockedRef = useRef(false)
  const speakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const voicesFallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const voicesChangedHandlerRef = useRef<(() => void) | null>(null)
  const [autoPlayNonce, setAutoPlayNonce] = useState(0)

  // Keep assignment UI from jumping when the mobile keyboard opens.
  useStableKeyboardViewport(true)

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
  const expectedHanziLength = currentQuestion
    ? stripAnswerStopwords(currentQuestion.answer).length
    : 0

  const commitHanziInput = useCallback(
    (rawValue: string) => {
      const filtered = filterStudentHanziInput(rawValue)
      setInputValue(
        expectedHanziLength > 0
          ? Array.from(filtered).slice(0, expectedHanziLength).join("")
          : filtered
      )
    },
    [expectedHanziLength]
  )

  const clearPendingSpeechWork = useCallback(() => {
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current)
      speakTimeoutRef.current = null
    }
    if (voicesFallbackTimeoutRef.current) {
      clearTimeout(voicesFallbackTimeoutRef.current)
      voicesFallbackTimeoutRef.current = null
    }
    if (voicesChangedHandlerRef.current) {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        voicesChangedHandlerRef.current
      )
      voicesChangedHandlerRef.current = null
    }
  }, [])

  const playPronunciation = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !text) {
        return
      }

      // Punctuation/spaces confuse compact TTS engines; speak hanzi only.
      const speakText = stripAnswerStopwords(text)
      if (!speakText) {
        return
      }

      clearPendingSpeechWork()

      const speakWithVoices = (voices: SpeechSynthesisVoice[]) => {
        window.speechSynthesis.cancel()

        speakTimeoutRef.current = setTimeout(() => {
          speakTimeoutRef.current = null

          const utterance = new SpeechSynthesisUtterance(speakText)
          utterance.lang = "zh-CN"
          // Near-natural rate: far below ~0.8, basic voices time-stretch and warble.
          utterance.rate = SPEECH_RATE
          utterance.pitch = 1
          utterance.volume = 1

          const chineseVoice = pickFluentMandarinVoice(voices)
          if (chineseVoice) {
            utterance.voice = chineseVoice
            utterance.lang = chineseVoice.lang
          }

          window.speechSynthesis.speak(utterance)
        }, SPEAK_AFTER_CANCEL_MS)
      }

      const voices = window.speechSynthesis.getVoices()
      if (pickFluentMandarinVoice(voices)) {
        speakWithVoices(voices)
        return
      }

      // Chrome may return [] or a non-Chinese list before voiceschanged.
      const onVoicesChanged = () => {
        const nextVoices = window.speechSynthesis.getVoices()
        if (!pickFluentMandarinVoice(nextVoices) && nextVoices.length === 0) {
          return
        }
        clearPendingSpeechWork()
        speakWithVoices(nextVoices)
      }
      voicesChangedHandlerRef.current = onVoicesChanged
      window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged)

      voicesFallbackTimeoutRef.current = setTimeout(() => {
        voicesFallbackTimeoutRef.current = null
        if (voicesChangedHandlerRef.current) {
          window.speechSynthesis.removeEventListener(
            "voiceschanged",
            voicesChangedHandlerRef.current
          )
          voicesChangedHandlerRef.current = null
        }
        speakWithVoices(window.speechSynthesis.getVoices())
      }, VOICES_FALLBACK_MS)
    },
    [clearPendingSpeechWork]
  )

  useEffect(() => {
    return () => {
      clearPendingSpeechWork()
    }
  }, [clearPendingSpeechWork])

  const handlePlayHint = () => {
    if (!currentQuestion?.answer) {
      return
    }
    // First tap unlocks autoplay for later questions (iOS/gesture gate).
    speechUnlockedRef.current = true
    playPronunciation(currentQuestion.answer)
  }

  useEffect(() => {
    if (gameState !== "playing") {
      return
    }

    // Skip mount autoplay until speech is unlocked by a user gesture.
    if (!speechUnlockedRef.current) {
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

  useEffect(() => {
    if (gameState !== "playing") return
    inputRef.current?.focus({ preventScroll: true })
  }, [currentQuestionIndex, gameState])

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
      playCorrectBell()
      scoreRef.current += 1
      setScore(scoreRef.current)
    } else {
      playWrongBuzz()
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
    inputRef.current?.focus({ preventScroll: true })
  }

  const restartGame = () => {
    clearPendingSpeechWork()
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
    inputRef.current?.focus({ preventScroll: true })
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

      const previousCompleted = scoreToCompletedAssignments(existingProgress?.score ?? null, hskLevel)
      const targetCompleted = completedCountForAssignment(assignmentLevel)
      const nextCompleted = Math.max(previousCompleted, targetCompleted)
      const totalAssignments = assignmentKeysForHsk(hskLevel).length

      const { error: upsertError } = await supabase.from("student_chapter_progress").upsert(
        {
          student_id: userData.user.id,
          chapter_id: chapterId,
          score: completedAssignmentsToScore(nextCompleted, hskLevel),
          is_completed: nextCompleted === totalAssignments,
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
      // so that individual assignment completion is tracked
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
  }, [assignmentLevel, chapterId, hskLevel, studentAssignmentId, totalQuestions])

  if (totalQuestions === 0) {
    return <QuestionsUnavailable returnHref={returnHref} />
  }

  if (gameState === "finished") {
    const scorePercent =
      totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0

    return (
      <main className="fixed inset-0 z-10 overflow-y-auto overscroll-none bg-background flex items-start md:items-center justify-center p-2 sm:p-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pt-[max(0.5rem,env(safe-area-inset-top))] sm:p-4">
        <section className="w-full max-w-2xl rounded-none sm:rounded-3xl border-0 sm:border border-border bg-card p-4 sm:p-8 text-center shadow-none sm:shadow-sm space-y-5 sm:space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Assignment Completed</h1>
          <p className="text-muted-foreground">Final Score</p>

          <div className="mx-auto flex w-full max-w-md flex-col sm:flex-row sm:w-fit items-stretch gap-3 sm:gap-4">
            <div className="flex-1 rounded-2xl border border-border bg-background px-6 py-5 sm:px-10 sm:py-6 text-center">
              <p className="text-4xl sm:text-5xl font-bold text-primary">
                {score}/{totalQuestions}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Correct Answers</p>
            </div>
            <div className="flex-1 rounded-2xl border border-border bg-background px-6 py-5 sm:px-10 sm:py-6 text-center">
              <p className="text-4xl sm:text-5xl font-bold text-primary">{scorePercent}%</p>
              <p className="mt-2 text-sm text-muted-foreground">Score</p>
            </div>
          </div>

          {(saveState === "saving" || saveMessage) && (
            <p className="text-sm text-muted-foreground">
              {saveState === "saving" ? "Saving assignment progress..." : saveMessage}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            {saveState === "saving" ? (
              <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground opacity-70">
                <Home className="h-4 w-4" />
                Saving progress...
              </span>
            ) : (
              <Link
                href={returnHref}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            )}
            <button
              onClick={restartGame}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
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
    <main className="fixed inset-0 z-10 overflow-y-auto overscroll-none bg-background flex items-start md:items-center justify-center p-2 sm:p-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pt-[max(0.5rem,env(safe-area-inset-top))] sm:p-4">
      <section className="w-full max-w-4xl rounded-none sm:rounded-3xl border-0 sm:border border-border bg-card px-3 py-4 sm:px-6 sm:py-8 md:px-10 md:py-10 shadow-none sm:shadow-sm space-y-4 sm:space-y-6 md:space-y-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link
            href={returnHref}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Home className="h-4 w-4" />
            Return to Dashboard
          </Link>
          <p className="text-sm text-muted-foreground font-medium">HSK {hskLevel} - {assignmentLevel}</p>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <div className="h-12 sm:h-16 w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md flex items-center justify-center">
            <span className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
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

        <div className="text-center space-y-3 sm:space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-foreground break-words">
            {currentQuestion.meaningHintId}
          </h1>
          <button
            type="button"
            onClick={handlePlayHint}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-base text-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Volume2 className="h-4 w-4" />
            Hear Pronunciation
          </button>
        </div>

        {/* Flex-wrap keeps slot size readable; long answers wrap instead of crushing */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {answerSlots.map((slot, index) => (
            <button
              key={`slot-${index}`}
              type="button"
              onClick={() => inputRef.current?.focus({ preventScroll: true })}
              aria-label={
                slot.isStopword
                  ? `Punctuation ${slot.char}`
                  : `Hanzi slot ${index + 1}`
              }
              className={`h-14 w-11 sm:h-20 sm:w-14 md:w-16 shrink-0 rounded-xl border-2 text-2xl sm:text-4xl font-semibold flex items-center justify-center ${
                slot.isStopword
                  ? "border-muted-foreground/30 bg-muted text-muted-foreground"
                  : "border-border bg-background text-foreground"
              }`}
            >
              {slot.char || ""}
            </button>
          ))}
        </div>

        <div className="space-y-3 sm:space-y-4">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(event) => {
              if (answerSubmitted) return
              // Don't reshape the value while an IME (e.g. Pinyin) is composing.
              const nativeEvent = event.nativeEvent as InputEvent
              if (isComposingRef.current || nativeEvent.isComposing) {
                setInputValue(event.target.value)
                return
              }
              commitHanziInput(event.target.value)
            }}
            onCompositionStart={() => {
              isComposingRef.current = true
            }}
            onCompositionEnd={(event) => {
              isComposingRef.current = false
              if (answerSubmitted) return
              commitHanziInput(event.currentTarget.value)
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing || event.key === "Process") {
                return
              }
              if (event.key === "Enter") {
                event.preventDefault()
                if (answerSubmitted) {
                  goToNextQuestion()
                } else {
                  handleSubmit()
                }
              }
            }}
            className="w-full min-h-12 rounded-lg border border-border bg-background px-4 py-3 text-lg text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter Hanzi Here"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            onFocus={() => {
              window.scrollTo(0, 0)
            }}
          />

          {answerSubmitted && (
            <div
              className={`rounded-lg px-4 py-3 text-sm font-medium text-center break-words ${
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
                className="w-full sm:w-auto min-h-12 rounded-lg bg-primary px-8 py-3 text-lg sm:text-xl font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {currentQuestionIndex + 1 === totalQuestions ? "Lihat Skor" : "Soal Berikutnya"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full sm:w-auto min-h-12 rounded-lg bg-emerald-500 px-8 py-3 text-lg sm:text-xl font-semibold text-white hover:bg-emerald-600 transition-colors"
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
