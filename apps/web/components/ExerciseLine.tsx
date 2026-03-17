'use client'

import { useState, useRef, useEffect } from 'react'
import { ExerciseLine as ExerciseLineType, AnswerState, Token } from '../lib/types'

interface Props {
  line: ExerciseLineType
  answers: Record<number, AnswerState>
  onAnswer: (tokenIndex: number, value: string) => void
  onWordClick?: (word: string) => void
}

interface BlankProps {
  token: Token
  answer: AnswerState | undefined
  onAnswer: (value: string) => void
  shouldFocus: boolean
  onWordClick?: (word: string) => void
}

function BlankInput({ token, answer, onAnswer, shouldFocus, onWordClick }: BlankProps) {
  const [typed, setTyped]         = useState('')
  const [wrongChar, setWrongChar] = useState<string | null>(null)
  const spanRef      = useRef<HTMLSpanElement>(null)
  const wrongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isCorrect = answer?.status === 'correct'
  const expected  = token.answer

  // Focus this blank whenever it becomes the active target
  useEffect(() => {
    if (shouldFocus && !isCorrect) {
      spanRef.current?.focus()
    }
  }, [shouldFocus, isCorrect])

  // Reset local state when the answer is cleared (e.g. game restart)
  useEffect(() => {
    if (answer === undefined) {
      setTyped('')
      setWrongChar(null)
    }
  }, [answer])

  useEffect(() => () => { if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current) }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (isCorrect) return

    // Tab: let through for natural focus navigation
    if (e.key === 'Tab') return

    // Backspace always bubbles to the global handler → replays the phrase.
    // There is no delete: characters are accepted or rejected one-by-one.
    if (e.key === 'Backspace') return

    // Non-printable keys (arrows, etc.) bubble to global handler
    if (e.key.length !== 1) return

    e.preventDefault()

    const nextPos = typed.length
    if (nextPos >= expected.length) return

    if (e.key.toLowerCase() === expected[nextPos]) {
      const newTyped = typed + expected[nextPos]
      setTyped(newTyped)
      if (newTyped === expected) onAnswer(newTyped)
    } else {
      // Flash wrong character in red for 600 ms
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current)
      setWrongChar(e.key)
      wrongTimerRef.current = setTimeout(() => setWrongChar(null), 600)
    }
  }

  // Render one fixed-width slot per character of the expected answer
  const slots = Array.from({ length: expected.length }, (_, i) => {
    if (isCorrect) {
      return <span key={i} className="text-green-700">{expected[i]}</span>
    }
    if (i < typed.length) {
      return <span key={i} className="text-gray-900">{typed[i]}</span>
    }
    if (i === typed.length && wrongChar !== null) {
      return <span key={i} className="text-red-500">{wrongChar}</span>
    }
    return <span key={i} className="text-gray-300">_</span>
  })

  const borderColor = isCorrect
    ? 'border-green-500'
    : typed.length > 0
    ? 'border-blue-400'
    : 'border-gray-400'

  return (
    <span className="inline-flex items-baseline gap-0">
      <span
        ref={spanRef}
        // data-blank lets the global Backspace handler know we're in a blank
        data-blank="true"
        tabIndex={isCorrect ? -1 : 0}
        onKeyDown={handleKeyDown}
        onClick={() => {
          if (isCorrect) { onWordClick?.(token.answer); return }
          spanRef.current?.focus()
        }}
        className={`inline-flex font-mono text-sm border-b-2 px-0.5
          focus:outline-none focus:border-blue-500 cursor-text select-none
          ${borderColor}`}
        style={{ minWidth: `${Math.max(expected.length + 1, 4)}ch` }}
      >
        {slots}
      </span>
      <span className="text-gray-800">{token.suffix}</span>
    </span>
  )
}

export function ExerciseLine({ line, answers, onAnswer, onWordClick }: Props) {
  const firstIncompleteIdx = line.tokens.find(
    (t) => t.kind === 'blank' && answers[t.index]?.status !== 'correct'
  )?.index ?? -1

  return (
    <div className="flex flex-wrap gap-x-1 gap-y-2 items-baseline text-base leading-loose">
      {line.tokens.map((token) => {
        if (token.kind === 'word') {
          return (
            <span
              key={token.index}
              onClick={() => onWordClick?.(token.word)}
              className={`text-gray-800 ${onWordClick ? 'cursor-pointer hover:text-blue-600 hover:underline' : ''}`}
            >
              {token.word}{token.suffix}
            </span>
          )
        }
        return (
          <BlankInput
            key={token.index}
            token={token}
            answer={answers[token.index]}
            onAnswer={(value) => onAnswer(token.index, value)}
            shouldFocus={token.index === firstIncompleteIdx}
            onWordClick={onWordClick}
          />
        )
      })}
    </div>
  )
}
