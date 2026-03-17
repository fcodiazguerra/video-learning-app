'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { ExerciseLine, AnswerState, AnswerStatus } from '../lib/types'

type LineAnswers = Record<number, AnswerState>
type AllAnswers = Record<number, LineAnswers>

const GRACE_SECONDS = 15  // starting grace time
const GRACE_MAX     = 20  // absolute cap after bonuses
const GRACE_BONUS   =  4  // seconds awarded per completed phrase

export function useExercise(lines: ExerciseLine[]) {
  const [answers, setAnswers]             = useState<AllAnswers>({})
  const [activeIndex, setActiveIndex]     = useState(0)
  const [graceRemaining, setGraceRemaining] = useState<number | null>(null)
  const [graceActive, setGraceActive]     = useState(false)
  const [gameOver, setGameOver]           = useState(false)
  const [freePlay, setFreePlay]           = useState(false)
  const [maxReachedIndex, setMaxReachedIndex] = useState(0)

  const graceIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const graceDelayRef     = useRef<ReturnType<typeof setTimeout>  | null>(null)
  const graceRemainingRef = useRef<number | null>(null)
  const gameOverRef       = useRef(false)
  const freePlayRef       = useRef(false)
  const maxReachedRef     = useRef(0)
  const completedLinesRef = useRef<Set<number>>(new Set())

  useEffect(() => { gameOverRef.current = gameOver }, [gameOver])
  useEffect(() => { freePlayRef.current = freePlay },  [freePlay])

  const isLineComplete = useCallback(
    (lineIndex: number, lineAnswers: LineAnswers) => {
      const line = lines[lineIndex]
      if (!line) return false
      const blanks = line.tokens.filter((t) => t.kind === 'blank')
      if (blanks.length === 0) return true
      return blanks.every((t) => lineAnswers[t.index]?.status === 'correct')
    },
    [lines]
  )

  // Award bonus seconds when a phrase is completed (idempotent).
  const awardBonusForLine = useCallback((lineIndex: number) => {
    if (completedLinesRef.current.has(lineIndex)) return
    completedLinesRef.current.add(lineIndex)
    if (graceRemainingRef.current === null) return // grace never started — nothing to top up
    const next = Math.min(GRACE_MAX, graceRemainingRef.current + GRACE_BONUS)
    graceRemainingRef.current = next
    setGraceRemaining(next)
  }, [])

  // Stop/pause the grace interval. Does NOT reset the remaining time.
  const stopGrace = useCallback(() => {
    if (graceDelayRef.current)    { clearTimeout(graceDelayRef.current);   graceDelayRef.current   = null }
    if (graceIntervalRef.current) { clearInterval(graceIntervalRef.current); graceIntervalRef.current = null }
    setGraceActive(false)
  }, [])

  // Pause grace (e.g. Backspace replay, manual game pause). Preserves remaining value.
  const pauseGrace = useCallback(() => {
    if (graceDelayRef.current)    { clearTimeout(graceDelayRef.current);   graceDelayRef.current   = null }
    if (graceIntervalRef.current) { clearInterval(graceIntervalRef.current); graceIntervalRef.current = null }
    setGraceActive(false)
  }, [])

  // Start (or resume) the countdown from a given value.
  const startGraceInterval = useCallback((from: number) => {
    if (graceIntervalRef.current) return
    setGraceRemaining(from)
    setGraceActive(true)
    graceRemainingRef.current = from

    graceIntervalRef.current = setInterval(() => {
      if (gameOverRef.current) {
        clearInterval(graceIntervalRef.current!)
        graceIntervalRef.current = null
        setGraceActive(false)
        return
      }
      // In free play the timer stays frozen at full — no countdown, no game over
      if (freePlayRef.current) return
      const next = (graceRemainingRef.current ?? from) - 0.1
      graceRemainingRef.current = next
      setGraceRemaining(Math.max(0, next))
      if (next <= 0) {
        clearInterval(graceIntervalRef.current!)
        graceIntervalRef.current = null
        setGraceActive(false)
        setGameOver(true)
      }
    }, 100)
  }, [])

  // Resume grace countdown after a manual game pause (picks up from where it left off).
  const resumeGrace = useCallback(() => {
    if (graceRemainingRef.current === null) return   // grace never started
    if (graceIntervalRef.current) return             // already running
    startGraceInterval(graceRemainingRef.current)
  }, [startGraceInterval])

  useEffect(() => {
    return () => {
      if (graceDelayRef.current)    clearTimeout(graceDelayRef.current)
      if (graceIntervalRef.current) clearInterval(graceIntervalRef.current)
    }
  }, [])

  const setActiveByTime = useCallback(
    (time: number) => {
      if (gameOverRef.current) return
      const idx = lines.findIndex((l) => time >= l.segment.start && time < l.segment.end)
      if (idx === -1) return
      setActiveIndex((prev) => {
        // Don't advance while grace countdown is actively running
        if (idx > prev && graceIntervalRef.current !== null) return prev
        if (idx > maxReachedRef.current) {
          maxReachedRef.current = idx
          setMaxReachedIndex(idx)
        }
        return idx
      })
    },
    [lines]
  )

  const handleTimeUpdate = useCallback(
    (time: number, lineAnswers: LineAnswers, lineIndex: number) => {
      if (gameOverRef.current) return
      const line = lines[lineIndex]
      if (!line) return
      // Phrases with no blanks need no interaction
      const blanks = line.tokens.filter((t) => t.kind === 'blank')
      if (blanks.length === 0) return

      const pastEnd  = time >= line.segment.end
      const complete = isLineComplete(lineIndex, lineAnswers)

      if (complete) {
        stopGrace()
        awardBonusForLine(lineIndex)
      } else if (pastEnd && !graceIntervalRef.current && !graceDelayRef.current) {
        const from = graceRemainingRef.current ?? GRACE_SECONDS
        startGraceInterval(from)
      }
    },
    [lines, isLineComplete, stopGrace, awardBonusForLine, startGraceInterval]
  )

  const checkGrace = useCallback(
    (lineIndex: number, newAnswers: AllAnswers) => {
      const lineAnswers = newAnswers[lineIndex] ?? {}
      if (isLineComplete(lineIndex, lineAnswers)) {
        stopGrace()
        awardBonusForLine(lineIndex)
      }
    },
    [isLineComplete, stopGrace, awardBonusForLine]
  )

  const submitAnswer = useCallback(
    (lineIndex: number, tokenIndex: number, value: string) => {
      const token = lines[lineIndex]?.tokens[tokenIndex]
      if (!token || token.kind !== 'blank') return

      const status: AnswerStatus =
        value.trim().toLowerCase() === token.answer ? 'correct' : 'incorrect'

      setAnswers((prev) => {
        const next = {
          ...prev,
          [lineIndex]: { ...prev[lineIndex], [tokenIndex]: { value, status } },
        }
        checkGrace(lineIndex, next)
        return next
      })
    },
    [lines, checkGrace]
  )

  const score = useMemo(() => {
    let correct = 0, incorrect = 0
    for (const la of Object.values(answers))
      for (const ans of Object.values(la)) {
        if (ans.status === 'correct') correct++
        else if (ans.status === 'incorrect') incorrect++
      }
    return { correct, incorrect }
  }, [answers])

  const resetGame = useCallback(() => {
    stopGrace()
    setAnswers({})
    setActiveIndex(0)
    setGameOver(false)
    setFreePlay(false)
    setGraceRemaining(null)
    setGraceActive(false)
    setMaxReachedIndex(0)
    graceRemainingRef.current = null
    gameOverRef.current       = false
    freePlayRef.current       = false
    maxReachedRef.current     = 0
    completedLinesRef.current = new Set()
  }, [stopGrace])

  const continueWithoutScore = useCallback(() => {
    stopGrace()
    setGameOver(false)
    setFreePlay(true)
    setGraceRemaining(GRACE_SECONDS)
    setGraceActive(false)
    graceRemainingRef.current = GRACE_SECONDS  // bar shows full from the start
    gameOverRef.current       = false
    freePlayRef.current       = true
  }, [stopGrace])

  return {
    activeIndex, maxReachedIndex,
    setActiveByTime, handleTimeUpdate,
    pauseGrace, resumeGrace,
    submitAnswer, answers, score,
    graceActive, graceRemaining,
    graceMax: GRACE_SECONDS,  // reference for the bar (100% = starting time)
    gameOver, freePlay,
    resetGame, continueWithoutScore,
    isLineComplete,
  }
}
