"use client"

import { RotateCcw, Home } from "lucide-react"
import Link from "next/link"

import type React from "react"
import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react"
import { useStableKeyboardViewport } from "@/lib/use-stable-keyboard-viewport"

type WordStatus = "pending" | "current" | "correct" | "incorrect"

interface WordState {
  word: string
  status: WordStatus
  userInput: string
}

const GAME_DURATION = 120
const WORDS_PER_ROW = 9
const VISIBLE_WORD_COUNT = WORDS_PER_ROW * 2

interface TypingGameProps {
  initialWordPool: string[]
  returnHref?: string
  onFinished?: (metrics: {
    wpm: number
    accuracy: number
    correctWords: number
    incorrectWords: number
    totalKeystrokes: number
  }) => void | Promise<void>
  saveState?: "idle" | "saving" | "saved" | "error"
  saveMessage?: string | null
}

interface WordTileProps {
  wordState: WordState
  index: number
}

const WordTile = memo(function WordTile({ wordState, index }: WordTileProps) {
  return (
    <div
      key={`${wordState.word}-${index}`}
      className={`flex items-center justify-center ${wordState.word.length >= 4 ? "min-h-12 sm:min-h-16 col-span-1" : "min-h-10 sm:min-h-12"}`}
    >
      <span
        className={`w-full h-full px-1.5 sm:px-2 py-1.5 sm:py-2 rounded transition-all font-semibold line-clamp-1 flex items-center justify-center text-base sm:text-xl md:text-2xl ${
          wordState.status === "current"
            ? "bg-primary/30 text-primary border-2 border-primary font-bold"
            : wordState.status === "correct"
            ? "bg-green-500/30 text-green-600"
            : wordState.status === "incorrect"
            ? "bg-red-500/30 text-red-600"
            : "text-foreground"
        }`}
        title={wordState.word}
      >
        {wordState.word}
      </span>
    </div>
  )
})

export function TypingGame({
  initialWordPool,
  returnHref,
  onFinished,
  saveState = "idle",
  saveMessage = null,
}: TypingGameProps) {
  const [words, setWords] = useState<WordState[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [input, setInput] = useState("")
  const [gameState, setGameState] = useState<"idle" | "playing" | "finished">("idle")
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [stats, setStats] = useState({
    correctWords: 0,
    incorrectWords: 0,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const finishedNotifiedRef = useRef(false)
  const poolCursorRef = useRef(0)

  useStableKeyboardViewport(gameState !== "finished")

  useEffect(() => {
    if (gameState === "finished") return
    inputRef.current?.focus({ preventScroll: true })
  }, [gameState, currentIndex])

  const visibleWords = useMemo(() => words.slice(0, VISIBLE_WORD_COUNT), [words])
  const formattedTime = useMemo(() => {
    const mins = Math.floor(timeLeft / 60)
    const secs = timeLeft % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }, [timeLeft])
  const wpm = useMemo(() => {
    const timeElapsed = (GAME_DURATION - timeLeft) / 60
    if (timeElapsed === 0) return 0
    return Math.round(stats.correctWords / timeElapsed)
  }, [timeLeft, stats.correctWords])
  const accuracy = useMemo(() => {
    const totalAttempted = stats.correctWords + stats.incorrectWords
    if (totalAttempted === 0) return 100
    return Math.round((stats.correctWords / totalAttempted) * 100)
  }, [stats.correctWords, stats.incorrectWords])

  const takeFromPool = useCallback(
    (count: number): WordState[] => {
      if (initialWordPool.length === 0 || count <= 0) return []

      const nextWords: WordState[] = []
      for (let i = 0; i < count; i++) {
        const word = initialWordPool[poolCursorRef.current % initialWordPool.length]
        poolCursorRef.current += 1
        nextWords.push({
          word,
          status: "pending",
          userInput: "",
        })
      }
      return nextWords
    },
    [initialWordPool]
  )

  const initializeGame = useCallback(() => {
    poolCursorRef.current = 0
    // Bound initial queue — recycle from the pool instead of holding/growing the full source list.
    const seedCount = Math.max(
      VISIBLE_WORD_COUNT,
      Math.min(initialWordPool.length || VISIBLE_WORD_COUNT, VISIBLE_WORD_COUNT * 2)
    )
    const newWords = takeFromPool(seedCount).map((wordState, index) => ({
      ...wordState,
      status: (index === 0 ? "current" : "pending") as WordStatus,
    }))
    setWords(newWords)
    setCurrentIndex(0)
    setInput("")
    setGameState("idle")
    setTimeLeft(GAME_DURATION)
    setStats({
      correctWords: 0,
      incorrectWords: 0,
      totalKeystrokes: 0,
      correctKeystrokes: 0,
    })
    finishedNotifiedRef.current = false
  }, [initialWordPool, takeFromPool])

  useEffect(() => {
    initializeGame()
  }, [initializeGame])

  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState("finished")
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [gameState, timeLeft])

  useEffect(() => {
    if (gameState !== "finished" || !onFinished || finishedNotifiedRef.current) return

    finishedNotifiedRef.current = true
    onFinished({
      wpm,
      accuracy,
      correctWords: stats.correctWords,
      incorrectWords: stats.incorrectWords,
      totalKeystrokes: stats.totalKeystrokes,
    })
  }, [accuracy, gameState, onFinished, stats.correctWords, stats.incorrectWords, stats.totalKeystrokes, wpm])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    if (gameState === "idle") {
      setGameState("playing")
    }

    if (gameState === "finished") return

    setInput(value)
  }, [gameState])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault()
      
      if (gameState === "finished" || !input.trim()) return

      const trimmedInput = input.trim()
      const currentWord = words[currentIndex]
      const isCorrect = trimmedInput === currentWord.word
      const newIndex = currentIndex + 1
      const shouldShiftRows = newIndex >= VISIBLE_WORD_COUNT

      setWords((prev) => {
        const newWords = [...prev]
        newWords[currentIndex] = {
          ...newWords[currentIndex],
          status: isCorrect ? "correct" : "incorrect",
          userInput: trimmedInput,
        }

        if (shouldShiftRows) {
          let remainingWords = newWords.slice(VISIBLE_WORD_COUNT)
          if (remainingWords.length < VISIBLE_WORD_COUNT) {
            remainingWords = [
              ...remainingWords,
              ...takeFromPool(VISIBLE_WORD_COUNT - remainingWords.length),
            ]
          }
          if (remainingWords.length > 0) {
            remainingWords[0] = { ...remainingWords[0], status: "current" }
          }
          // Keep queue bounded to roughly two visible screens.
          return remainingWords.slice(0, VISIBLE_WORD_COUNT * 2)
        }

        if (newIndex < newWords.length) {
          newWords[currentIndex + 1] = {
            ...newWords[currentIndex + 1],
            status: "current",
          }
        }
        return newWords
      })

      setStats((prev) => ({
        ...prev,
        correctWords: isCorrect ? prev.correctWords + 1 : prev.correctWords,
        incorrectWords: isCorrect ? prev.incorrectWords : prev.incorrectWords + 1,
        correctKeystrokes: isCorrect
          ? prev.correctKeystrokes + trimmedInput.length
          : prev.correctKeystrokes,
        totalKeystrokes: prev.totalKeystrokes + 1,
      }))

      if (shouldShiftRows) {
        setCurrentIndex(0)
      } else {
        setCurrentIndex(newIndex)
      }
      
      setInput("")
    }
  }, [currentIndex, gameState, input, takeFromPool, words])

  if (gameState === "finished") {
    return (
      <div className="fixed inset-0 z-10 overflow-y-auto overscroll-none bg-background flex flex-col items-start sm:items-center justify-center p-2 sm:p-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pt-[max(0.5rem,env(safe-area-inset-top))] sm:p-4">
        <div className="text-center space-y-6 sm:space-y-8 max-w-md w-full px-1 sm:px-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Hasil</h2>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <div className="space-y-1 p-3 sm:p-4 bg-card rounded-xl border border-border">
              <div className="text-4xl sm:text-5xl font-bold text-primary">{wpm}</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">KPM</div>
            </div>
            <div className="space-y-1 p-3 sm:p-4 bg-card rounded-xl border border-border">
              <div className="text-4xl sm:text-5xl font-bold text-primary">{accuracy}%</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Akurasi</div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex justify-between text-foreground">
              <span>Kata Benar</span>
              <span className="text-green-600">{stats.correctWords}</span>
            </div>
            <div className="flex justify-between text-foreground">
              <span>Kata Salah</span>
              <span className="text-red-600">{stats.incorrectWords}</span>
            </div>
            <div className="flex justify-between text-foreground">
              <span>Total Karakter</span>
              <span>{stats.totalKeystrokes}</span>
            </div>
          </div>

          {saveState === "saving" ? (
            <p className="text-sm text-muted-foreground">Saving assignment progress…</p>
          ) : null}
          {saveState === "saved" ? (
            <p className="text-sm text-emerald-600">{saveMessage ?? "Assignment successfully saved."}</p>
          ) : null}
          {saveState === "error" ? (
            <p className="text-sm text-destructive">
              {saveMessage ?? "Failed to save assignment progress."}
            </p>
          ) : null}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-4">
            {returnHref ? (
              <Link
                href={returnHref}
                aria-disabled={saveState === "saving"}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors ${
                  saveState === "saving" ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <Home className="h-4 w-4" />
                Return to Dashboard
              </Link>
            ) : null}
            <button
              onClick={initializeGame}
              disabled={saveState === "saving"}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto overscroll-none bg-background flex flex-col items-start sm:items-center justify-start sm:justify-center p-2 sm:p-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pt-[max(0.5rem,env(safe-area-inset-top))] sm:p-4">
      <div className="w-full max-w-5xl space-y-3 sm:space-y-6">
        {returnHref ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Link
              href={returnHref}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Home className="h-4 w-4" />
              Return to Dashboard
            </Link>
          </div>
        ) : null}

        {/* Timer */}
        <div className="text-center">
          <div className="text-2xl sm:text-4xl font-bold text-primary tabular-nums">
            {formattedTime}
          </div>
        </div>

        {/* Instructions - Only on Idle */}
        {gameState === "idle" && (
          <p className="text-center text-muted-foreground text-sm animate-pulse">
            Type to start...
          </p>
        )}

        {/* Cap board height on phone so the input stays reachable above the keyboard */}
        <div className="relative max-h-[32vh] sm:max-h-none overflow-y-auto overscroll-contain bg-card/50 rounded-lg p-2 sm:p-4 border border-border tracking-wide sm:tracking-widest">
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-0 auto-rows-max">
            {visibleWords.map((wordState, index) => (
              <WordTile key={`${wordState.word}-${index}`} wordState={wordState} index={index} />
            ))}
          </div>
        </div>

        {/* Visible Input */}
        <div className="flex justify-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="w-full max-w-md min-h-12 px-4 sm:px-5 py-3 sm:py-4 text-xl sm:text-2xl text-center bg-card border-2 border-border rounded-lg focus:outline-none focus:border-primary text-foreground font-semibold"
            placeholder="Answer here..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            onFocus={() => {
              window.scrollTo(0, 0)
            }}
          />
        </div>

        {/* Live Stats - Only show during playing */}
        {gameState === "playing" && (
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 sm:gap-12 text-sm sm:text-base text-muted-foreground font-semibold">
            <span>KPM: <span className="text-primary text-base sm:text-lg">{wpm}</span></span>
            <span>Akurasi: <span className="text-primary text-base sm:text-lg">{accuracy}%</span></span>
          </div>
        )}

        {/* Restart Button */}
        <div className="flex justify-center pt-1 sm:pt-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              initializeGame()
            }}
            className="text-muted-foreground hover:text-primary transition-colors p-2 min-h-10 min-w-10 inline-flex items-center justify-center"
            title="Restart"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
