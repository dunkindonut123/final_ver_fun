"use client"

import { RotateCcw, Home } from "lucide-react"
import Link from "next/link"

import type React from "react"
import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react"

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
  }) => void
}

interface WordTileProps {
  wordState: WordState
  index: number
}

const WordTile = memo(function WordTile({ wordState, index }: WordTileProps) {
  return (
    <div
      key={`${wordState.word}-${index}`}
      className={`flex items-center justify-center ${wordState.word.length >= 4 ? "min-h-16 col-span-1" : "min-h-12"}`}
    >
      <span
        className={`w-full h-full px-2 py-2 rounded transition-all font-semibold line-clamp-1 flex items-center justify-center text-2xl ${
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

export function TypingGame({ initialWordPool, returnHref, onFinished }: TypingGameProps) {
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

  const initializeGame = useCallback(() => {
    const newWords = initialWordPool.map((word, index) => ({
      word,
      status: index === 0 ? "current" : "pending" as WordStatus,
      userInput: "",
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
  }, [initialWordPool])

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
          const remainingWords = newWords.slice(VISIBLE_WORD_COUNT)
          if (remainingWords.length > 0) {
            remainingWords[0] = { ...remainingWords[0], status: "current" }
          }
          const newRowWords = initialWordPool.map((word) => ({
            word,
            status: "pending" as WordStatus,
            userInput: "",
          }))
          return [...remainingWords, ...newRowWords]
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
  }, [currentIndex, gameState, input, initialWordPool, words])

  if (gameState === "finished") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-md">
          <h2 className="text-3xl font-bold text-foreground">Hasil</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1 p-4 bg-card rounded-xl border border-border">
              <div className="text-5xl font-bold text-primary">{wpm}</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">KPM</div>
            </div>
            <div className="space-y-1 p-4 bg-card rounded-xl border border-border">
              <div className="text-5xl font-bold text-primary">{accuracy}%</div>
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

          <div className="flex items-center justify-center gap-3 pt-4">
            {returnHref ? (
              <Link
                href={returnHref}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Home className="w-5 h-5" />
                <span>Back to chapter</span>
              </Link>
            ) : null}
            <button
              onClick={initializeGame}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Coba Lagi</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl space-y-6">
        {/* Timer */}
        <div className="text-center">
          <div className="text-4xl font-bold text-primary tabular-nums">
            {formattedTime}
          </div>
        </div>

        {/* Instructions - Only on Idle */}
        {gameState === "idle" && (
          <>
            
            <p className="text-center text-muted-foreground text-sm animate-pulse">
              Mulai mengetik untuk memulai...
            </p>
          </>
        )}

        {/* Words Display - 2 rows of 9 */}
        <div className="relative overflow-hidden bg-card/50 rounded-lg p-4 border border-border tracking-widest">
          <div className="grid grid-cols-9 gap-0 auto-rows-max">
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
            className="w-full max-w-md px-5 py-4 text-2xl text-center bg-card border-2 border-border rounded-lg focus:outline-none focus:border-primary text-foreground font-semibold"
            placeholder="Ketik di sini..."
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>

        {/* Live Stats - Only show during playing */}
        {gameState === "playing" && (
          <div className="flex justify-center gap-12 text-base text-muted-foreground font-semibold">
            <span>KPM: <span className="text-primary text-lg">{wpm}</span></span>
            <span>Akurasi: <span className="text-primary text-lg">{accuracy}%</span></span>
          </div>
        )}

        {/* Restart Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              initializeGame()
            }}
            className="text-muted-foreground hover:text-primary transition-colors p-2"
            title="Restart"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
