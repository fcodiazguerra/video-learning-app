'use client'

import { useState, useRef, useEffect } from 'react'
import { ExerciseLine as ExerciseLineType, AnswerState, Token } from '../lib/types'

interface Props {
  line: ExerciseLineType
  answers: Record<number, AnswerState>
  onAnswer: (tokenIndex: number, value: string) => void
  onReveal?: (tokenIndex: number) => void
  onWordClick?: (word: string) => void
}

interface BlankProps {
  token: Token
  answer: AnswerState | undefined
  onAnswer: (value: string) => void
  onReveal?: () => void
  shouldFocus: boolean
  onWordClick?: (word: string) => void
}

function isAlpha(c: string): boolean {
  return /[a-zA-Z]/.test(c)
}

function BlankInput({ token, answer, onAnswer, onReveal, shouldFocus, onWordClick }: BlankProps) {
  const [typed, setTyped]         = useState('')
  const [wrongChar, setWrongChar] = useState<string | null>(null)
  const spanRef       = useRef<HTMLSpanElement>(null)
  const wrongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isCorrect = answer?.status === 'correct'
  const expected  = token.answer  // e.g. "i'm", "they're"

  // Next position in expected that requires user input (skip punctuation)
  const nextAlphaPos = (() => {
    let pos = typed.length
    while (pos < expected.length && !isAlpha(expected[pos])) pos++
    return pos
  })()

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
    if (e.key === 'Tab') return
    if (e.key === 'Backspace') return
    if (e.key === 'Enter') {
      e.preventDefault()
      onReveal?.()
      return
    }
    if (e.key.length !== 1) return

    e.preventDefault()

    if (nextAlphaPos >= expected.length) return

    if (e.key.toLowerCase() === expected[nextAlphaPos]) {
      // Advance typed to include all chars up to and including nextAlphaPos
      // (this auto-fills any punctuation between the previous letter and this one)
      const newTyped = expected.slice(0, nextAlphaPos + 1)
      setTyped(newTyped)

      // Word is complete when no more alpha chars remain
      const remaining = expected.slice(nextAlphaPos + 1)
      if (!remaining.split('').some(isAlpha)) {
        onAnswer(expected)
      }
    } else {
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current)
      setWrongChar(e.key)
      wrongTimerRef.current = setTimeout(() => setWrongChar(null), 600)
    }
  }

  // One slot per character of expected answer.
  // Punctuation/non-alpha chars are always pre-shown.
  // Alpha chars follow the typed-progress logic.
  const slots = Array.from({ length: expected.length }, (_, i) => {
    const char = expected[i]

    if (isCorrect) {
      return <span key={i} className="text-green-700">{char}</span>
    }

    if (!isAlpha(char)) {
      // Pre-shown punctuation
      return <span key={i} className="text-gray-500">{char}</span>
    }

    if (i < typed.length) {
      return <span key={i} className="text-gray-900">{char}</span>
    }
    if (i === nextAlphaPos && wrongChar !== null) {
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

export function ExerciseLine({ line, answers, onAnswer, onReveal, onWordClick }: Props) {
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
            onReveal={() => onReveal?.(token.index)}
            shouldFocus={token.index === firstIncompleteIdx}
            onWordClick={onWordClick}
          />
        )
      })}
    </div>
  )
}
