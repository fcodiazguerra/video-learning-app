'use client'

import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { VideoPlayer } from '../../components/VideoPlayer'
import { ExerciseLine } from '../../components/ExerciseLine'
import { buildExercise, parseDifficulty } from '../../lib/exercise'
import { useExercise } from '../../hooks/useExercise'
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer'
import { useLocalVideoPlayer } from '../../hooks/useLocalVideoPlayer'
import { getLocalVideoUrl } from '../../lib/localVideo'
import { SubtitleSegment } from '../../lib/types'

export function PlayerView() {
  const params     = useSearchParams()
  const videoId    = params.get('v') ?? ''
  const isLocal    = params.get('source') === 'local'
  const difficulty = parseDifficulty(params.get('d'))

  const segments = useMemo<SubtitleSegment[] | null>(() => {
    const key = isLocal ? 'srt:local' : `srt:${videoId}`
    if (!isLocal && !videoId) return null
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return null }
  }, [videoId, isLocal])

  const lines = useMemo(
    () => segments ? buildExercise(segments, difficulty) : [],
    [segments, difficulty]
  )

  const {
    activeIndex, maxReachedIndex,
    setActiveByTime, handleTimeUpdate,
    pauseGrace, resumeGrace,
    submitAnswer, revealBlank, answers, score,
    graceActive, graceRemaining, graceMax,
    gameOver, freePlay,
    resetGame, continueWithoutScore,
    isLineComplete,
  } = useExercise(lines, difficulty)

  // ── Word list ───────────────────────────────────────────────────────────────
  const [savedWords, setSavedWords] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const handleWordClick = useCallback((word: string) => {
    setSavedWords((prev) => prev.includes(word) ? prev : [...prev, word])
  }, [])
  const handleCopyWords = useCallback(() => {
    const text = savedWords.map((w, i) => `${i + 1} - ${w}`).join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [savedWords])

  // ── Game-level pause (user button) ─────────────────────────────────────────
  // gamePausedRef: read synchronously in effects to avoid stale-closure races.
  // gamePaused (state): drives the button UI.
  const gamePausedRef  = useRef(false)
  const [gamePaused, setGamePaused] = useState(false)

  // hasStartedRef: read in keydown handler; hasStarted (state): drives the UI.
  const hasStartedRef  = useRef(false)
  const [hasStarted, setHasStarted] = useState(false)

  // Tracks whether grace was active when the user clicked Pause.
  // Used to decide whether to resume the grace countdown on Play.
  const pausedMidGraceRef = useRef(false)

  // Ref-copy of graceActive so handlePause can read it synchronously.
  const graceActiveRef = useRef(graceActive)
  useEffect(() => { graceActiveRef.current = graceActive }, [graceActive])

  const pauseRef = useRef<(() => void) | null>(null)

  const handleVideoTimeUpdate = useCallback(
    (time: number) => {
      if (gamePausedRef.current) return
      const lastEnd = lines[lines.length - 1]?.segment.end
      if (lastEnd !== undefined && time >= lastEnd) {
        pauseRef.current?.()
        return
      }
      handleTimeUpdate(time, answers[activeIndex] ?? {}, activeIndex)
      setActiveByTime(time)
    },
    [setActiveByTime, handleTimeUpdate, answers, activeIndex, lines]
  )

  const ytPlayer    = useYouTubePlayer({ videoId, onTimeUpdate: handleVideoTimeUpdate, skip: isLocal })
  const localPlayer = useLocalVideoPlayer({ src: isLocal ? (getLocalVideoUrl() ?? '') : '', onTimeUpdate: handleVideoTimeUpdate, skip: !isLocal })

  const { isReady, pause, play, seekTo } = isLocal ? localPlayer : ytPlayer
  pauseRef.current = pause
  const containerRef = isLocal ? undefined : ytPlayer.containerRef
  const videoRef     = isLocal ? localPlayer.videoRef : undefined

  // Initial Start button — starts the video for the very first time.
  const handleStart = useCallback(() => {
    hasStartedRef.current = true
    setHasStarted(true)
    gamePausedRef.current = false
    setGamePaused(false)
    const firstSegmentStart = lines[0]?.segment.start ?? 0
    if (firstSegmentStart > 0) seekTo(firstSegmentStart)
    play()
  }, [play, seekTo, lines])

  // Resume from a manual pause.
  // If paused mid-grace (video already stopped for an answer) → restart the countdown,
  //   video will resume only when the answer is correct.
  // If paused while video was playing normally → resume video directly.
  const handleResume = useCallback(() => {
    gamePausedRef.current = false
    setGamePaused(false)
    if (pausedMidGraceRef.current) {
      pausedMidGraceRef.current = false
      resumeGrace()
    } else {
      play()
    }
  }, [resumeGrace, play])

  const handleStartOver = useCallback(() => {
    hasStartedRef.current = false
    setHasStarted(false)
    gamePausedRef.current = false
    setGamePaused(false)
    pausedMidGraceRef.current = false
    resetGame()
    seekTo(0)
    pause()
  }, [resetGame, seekTo, pause])

  const handlePause = useCallback(() => {
    pausedMidGraceRef.current = graceActiveRef.current  // remember grace state
    gamePausedRef.current = true
    setGamePaused(true)
    pauseGrace()   // stop countdown
    pause()        // stop video
  }, [pauseGrace, pause])

  // ── Grace → video pause/play ────────────────────────────────────────────────
  // Only act when the change is caused by game mechanics, not a manual pause.
  const prevGraceActiveRef = useRef(false)
  useEffect(() => {
    const prev = prevGraceActiveRef.current
    if (!prev && graceActive && !gamePausedRef.current) {
      pause()  // grace just started → freeze video
    } else if (prev && !graceActive && !gameOver && !gamePausedRef.current) {
      play()   // grace just cleared (phrase complete) → resume video
    }
    prevGraceActiveRef.current = graceActive
  }, [graceActive, gameOver, pause, play])

  // Resume video when player chooses "continue without score"
  const prevFreePlayRef = useRef(false)
  useEffect(() => {
    if (!prevFreePlayRef.current && freePlay) {
      gamePausedRef.current = false
      play()
    }
    prevFreePlayRef.current = freePlay
  }, [freePlay, play])

  // ── Keyboard handler ────────────────────────────────────────────────────────
  const activeIndexRef = useRef(activeIndex)
  const maxReachedRef  = useRef(maxReachedIndex)
  const gameOverRef    = useRef(gameOver)
  useEffect(() => { activeIndexRef.current = activeIndex },    [activeIndex])
  useEffect(() => { maxReachedRef.current  = maxReachedIndex }, [maxReachedIndex])
  useEffect(() => { gameOverRef.current    = gameOver },        [gameOver])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore until the user has pressed Play at least once
      if (!hasStartedRef.current) return
      // Ignore when game is manually paused or over
      if (gamePausedRef.current || gameOverRef.current) return

      if (e.key === 'Backspace') {
        e.preventDefault()
        const line = lines[activeIndexRef.current]
        if (!line) return
        pauseGrace()
        seekTo(line.segment.start)
        play()
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const target = Math.max(0, activeIndexRef.current - 1)
        if (target === activeIndexRef.current) return
        pauseGrace()
        seekTo(lines[target].segment.start)
        play()
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const target = Math.min(maxReachedRef.current, activeIndexRef.current + 1)
        if (target === activeIndexRef.current) return
        pauseGrace()
        seekTo(lines[target].segment.start)
        play()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lines, pauseGrace, seekTo, play])

  // ── Render ──────────────────────────────────────────────────────────────────
  if ((!videoId && !isLocal) || !segments) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-sm">
        <p className="text-gray-500">No subtitles found for this video.</p>
        <a href="/" className="underline text-blue-600">Go back</a>
      </div>
    )
  }

  const activeLine    = lines[activeIndex]
  const activeAnswers = answers[activeIndex] ?? {}
  const lineComplete  = activeLine ? isLineComplete(activeIndex, activeAnswers) : false
  const blanksTotal   = activeLine ? activeLine.tokens.filter((t) => t.kind === 'blank').length : 0
  const blanksCorrect = activeLine
    ? activeLine.tokens.filter(
        (t) => t.kind === 'blank' && activeAnswers[t.index]?.status === 'correct'
      ).length
    : 0

  const gracePercent = graceRemaining !== null ? Math.min(100, (graceRemaining / graceMax) * 100) : 100
  const graceColor =
    graceRemaining !== null && graceRemaining < graceMax * 0.3
      ? '#ef4444'
      : graceRemaining !== null && graceRemaining < graceMax * 0.6
      ? '#f59e0b'
      : '#22c55e'

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6 flex gap-4 items-start">
      <div className="flex-1 flex flex-col gap-4 min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between">
          <a href="/" className="text-sm text-blue-600 hover:underline">← Back</a>
          <div className="text-sm text-gray-500">
            {!freePlay ? (
              <>
                Phrase <span className="font-semibold text-gray-800">{activeIndex + 1}</span>
                {' / '}{lines.length}{'  ·  '}
                <span className="text-green-600 font-medium">{score.correct} correct</span>
              </>
            ) : (
              <span className="text-gray-400 italic">Free play — no score</span>
            )}
          </div>
        </div>

        {/* Pause button — only shown after game has started */}
        {isReady && hasStarted && (
          <div className="flex justify-center">
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect x="1" y="1" width="4" height="12" rx="1"/>
                <rect x="9" y="1" width="4" height="12" rx="1"/>
              </svg>
              Pause
            </button>
          </div>
        )}

        {/* Video — start overlay and pause menu live inside the video area */}
        <VideoPlayer
          {...(isLocal ? { videoRef: videoRef! } : { containerRef: containerRef! })}
          isReady={isReady}
          showStart={isReady && !hasStarted}
          onStart={handleStart}
          paused={gamePaused}
          onResume={handleResume}
          onRestart={handleStartOver}
        />

        {/* Keyboard hints — only shown after game has started */}
        {hasStarted && (
          <div className="flex gap-4 text-xs text-gray-400 justify-center">
            <span><kbd className="bg-gray-100 border border-gray-300 rounded px-1">⌫</kbd> replay</span>
            <span>
              <kbd className="bg-gray-100 border border-gray-300 rounded px-1">↑</kbd>
              <kbd className="bg-gray-100 border border-gray-300 rounded px-1">↓</kbd> navigate
            </span>
            <span><kbd className="bg-gray-100 border border-gray-300 rounded px-1">↵</kbd> reveal</span>
          </div>
        )}

        {/* Grace timer bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{ width: `${gracePercent}%`, backgroundColor: graceColor }}
          />
        </div>

        {/* Game Over */}
        {gameOver && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-4">
            <p className="text-3xl font-bold text-red-600">Game Over</p>
            <p className="text-gray-600 text-sm">
              You ran out of time on phrase {activeIndex + 1}.
            </p>
            <p className="text-gray-500 text-sm">
              Score: {score.correct} correct answer{score.correct !== 1 ? 's' : ''}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleStartOver}
                className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Start over
              </button>
              <button
                onClick={continueWithoutScore}
                className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Continue without score
              </button>
            </div>
          </div>
        )}

        {/* Current phrase — only shown after game has started */}
        {hasStarted && !gameOver && activeLine && (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {fmt(activeLine.segment.start)} – {fmt(activeLine.segment.end)}
              </p>
              {blanksTotal > 0 && (
                <p className="text-xs text-gray-400">{blanksCorrect}/{blanksTotal} blanks</p>
              )}
            </div>
            <ExerciseLine
              line={activeLine}
              answers={activeAnswers}
              onAnswer={(tokenIndex, value) => submitAnswer(activeIndex, tokenIndex, value)}
              onReveal={(tokenIndex) => revealBlank(activeIndex, tokenIndex)}
              onWordClick={handleWordClick}
            />
            {lineComplete && blanksTotal > 0 && (
              <p className="text-sm text-green-600 font-medium">Phrase complete! Keep watching…</p>
            )}
          </div>
        )}

        {!hasStarted && (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 text-center text-gray-400 text-sm">
            Press Start to begin…
          </div>
        )}

      </div>{/* end main column */}

      {/* Word list sidebar */}
      <div className="w-48 flex-shrink-0 sticky top-6">
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Word list
            </p>
            {savedWords.length > 0 && (
              <button
                onClick={handleCopyWords}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
          {savedWords.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Click any word to save it here.</p>
          ) : (
            <ol className="flex flex-col gap-1">
              {savedWords.map((w, i) => (
                <li key={w} className="text-sm text-gray-800">
                  <span className="text-gray-400 mr-1">{i + 1} -</span>{w}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      </div>
    </main>
  )
}

function fmt(s: number): string {
  const m   = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
