"use client"

import Link from "next/link"
import { Home, RotateCcw } from "lucide-react"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { generateWordSet, hskLevelInfo, type HSKLevel } from "@/lib/hanzi-data"

type WordStatus = "pending" | "current" | "correct" | "incorrect"

interface WordState {
  word: string
  status: WordStatus
  userInput: string
}

const GAME_DURATION = 300 // 1 minute in seconds

interface TypingGameProps {
  level: HSKLevel
}

export function TypingGame({ level }: TypingGameProps) {
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
  const containerRef = useRef<HTMLDivElement>(null)

  const initializeGame = useCallback(() => {
    const newWords = generateWordSet(level, 100).map((word, index) => ({
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
  }, [level])

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    if (gameState === "idle") {
      setGameState("playing")
    }

    if (gameState === "finished") return

    setInput(value)
    setStats((prev) => ({
      ...prev,
      totalKeystrokes: prev.totalKeystrokes + 1,
    }))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault()
      
      if (gameState === "finished" || !input.trim()) return

      const currentWord = words[currentIndex]
      const isCorrect = input.trim() === currentWord.word

      setWords((prev) => {
        const newWords = [...prev]
        newWords[currentIndex] = {
          ...newWords[currentIndex],
          status: isCorrect ? "correct" : "incorrect",
          userInput: input.trim(),
        }
        if (currentIndex + 1 < newWords.length) {
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
          ? prev.correctKeystrokes + input.trim().length
          : prev.correctKeystrokes,
      }))

      const newIndex = currentIndex + 1
      const wordsPerRow = 9
      
      // When completing the first row (9 words), shift rows up
      if (newIndex >= wordsPerRow * 2) {
        setWords((prev) => {
          // Remove the completed first row
          const remainingWords = prev.slice(wordsPerRow * 2)
          // Mark the first word of the new first row as current
          if (remainingWords.length > 0) {
            remainingWords[0] = { ...remainingWords[0], status: "current" }
          }
          // Generate new rows to add at the end
          const newRowWords = generateWordSet(level, wordsPerRow * 2).map((word) => ({
            word,
            status: "pending" as WordStatus,
            userInput: "",
          }))
          return [...remainingWords, ...newRowWords]
        })
        setCurrentIndex(0)
      } else {
        setCurrentIndex(newIndex)
      }
      
      setInput("")
    }
  }

  const calculateWPM = () => {
    const timeElapsed = (GAME_DURATION - timeLeft) / 60 // Convert to minutes
    if (timeElapsed === 0) return 0
    return Math.round(stats.correctWords / timeElapsed)
  }

  const calculateAccuracy = () => {
    const totalAttempted = stats.correctWords + stats.incorrectWords
    if (totalAttempted === 0) return 100
    return Math.round((stats.correctWords / totalAttempted) * 100)
  }

  const calculateScore = () => {
    const wpm = calculateWPM()
    const accuracy = calculateAccuracy()
    return Math.round(wpm * (accuracy / 100))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (gameState === "finished") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-md">
          <h2 className="text-3xl font-bold text-foreground">Hasil</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1 p-4 bg-card rounded-xl border border-border">
              <div className="text-5xl font-bold text-primary">{calculateWPM()}</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">KPM</div>
            </div>
            <div className="space-y-1 p-4 bg-card rounded-xl border border-border">
              <div className="text-5xl font-bold text-primary">{calculateAccuracy()}%</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Akurasi</div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex justify-between text-foreground">
              <span>{hskLevelInfo[level].name}</span>
            </div>
            <div className="flex justify-between text-foreground">
              <span>Kata Benar</span>
              <span className="text-correct">{stats.correctWords}</span>
            </div>
            <div className="flex justify-between text-foreground">
              <span>Kata Salah</span>
              <span className="text-incorrect">{stats.incorrectWords}</span>
            </div>
            <div className="flex justify-between text-foreground">
              <span>Total Karakter</span>
              <span>{stats.totalKeystrokes}</span>
            </div>
            <div className="flex justify-between text-foreground font-semibold pt-2 border-t border-border">
              <span>Skor Akhir</span>
              <span className="text-primary">{calculateScore()}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              href="/games"
              className="flex items-center gap-2 px-6 py-3 border border-border rounded-lg text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Beranda</span>
            </Link>
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
    <div 
      className="min-h-screen bg-background flex flex-col items-center justify-center p-4"
      ref={containerRef}
    >
      <div className="w-full max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-center gap-4">
          <Link 
            href="/games"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Home className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>{hskLevelInfo[level].name}</span>
          </div>
        </div>

        {/* Timer */}
        <div className="text-center">
          <div className="text-4xl font-bold text-primary tabular-nums">
            {formatTime(timeLeft)}
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
            {words.slice(0, 18).map((wordState, index) => (
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
            <span>KPM: <span className="text-primary text-lg">{calculateWPM()}</span></span>
            <span>Akurasi: <span className="text-primary text-lg">{calculateAccuracy()}%</span></span>
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
