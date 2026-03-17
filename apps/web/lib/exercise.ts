import { SubtitleSegment, Token, ExerciseLine } from './types'

export type Difficulty = 'easy' | 'normal' | 'hard' | 'extreme'

// Words that should never be turned into blanks (except in extreme mode).
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'it', 'to', 'of', 'and', 'or', 'in', 'on',
  'at', 'by', 'for', 'with', 'as', 'if', 'do', 'be', 'so', 'not',
  'but', 'yet', 'how', 'its', 'my', 'his', 'her', 'our', 'your',
  "don't", "doesn't", "hasn't", "haven't", "won't", "can't",
])

// How often a candidate word becomes a blank (every Nth candidate).
const BLANK_EVERY: Record<Difficulty, number> = {
  easy:    5,  // ~20% of content words
  normal:  3,  // ~33% of content words
  hard:    2,  // ~50% of content words
  extreme: 1,  // 100% — every word
}

// Splits "Hello," → ["Hello", ","]  and  "world." → ["world", "."]
function splitWordAndSuffix(raw: string): [string, string] {
  const match = raw.match(/^([\w'']+)([^\w'']*)$/)
  return match ? [match[1], match[2]] : [raw, '']
}

type TokenKind = 'word' | 'blank'

export function lineToTokens(segment: SubtitleSegment, difficulty: Difficulty = 'normal'): ExerciseLine {
  const words = segment.text.trim().split(/\s+/)
  let blankCounter = 0
  const every = BLANK_EVERY[difficulty]

  const tokens: Token[] = words.map((raw, i) => {
    const [word, suffix] = splitWordAndSuffix(raw)
    const answer = word.toLowerCase()

    // Extreme: every word is a candidate. Others: content words only.
    const isCandidate = difficulty === 'extreme'
      ? word.length > 0
      : word.length > 3 && !STOP_WORDS.has(answer)

    let kind: TokenKind = 'word'
    if (isCandidate) {
      blankCounter++
      if (blankCounter % every === 0) kind = 'blank'
    }

    return { kind, word, suffix, answer, index: i }
  })

  return { segment, tokens }
}

export function buildExercise(segments: SubtitleSegment[], difficulty: Difficulty = 'normal'): ExerciseLine[] {
  return segments.map((s) => lineToTokens(s, difficulty))
}

export function parseDifficulty(value: string | null): Difficulty {
  if (value === 'easy' || value === 'normal' || value === 'hard' || value === 'extreme') return value
  return 'normal'
}
