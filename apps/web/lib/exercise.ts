import { SubtitleSegment, Token, ExerciseLine } from './types'

export type Difficulty = 'easy' | 'normal' | 'hard' | 'extreme'

// Words that should never be turned into blanks (except in extreme mode).
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'it', 'to', 'of', 'and', 'or', 'in', 'on',
  'at', 'by', 'for', 'with', 'as', 'if', 'do', 'be', 'so', 'not',
  'but', 'yet', 'how', 'its', 'my', 'his', 'her', 'our', 'your',
  "don't", "doesn't", "hasn't", "haven't", "won't", "can't",
])

// Fraction of candidate words that become blanks per phrase.
// Minimum 1 blank guaranteed per phrase (when candidates exist).
const BLANK_RATIO: Record<Difficulty, number> = {
  easy:    0.3,  // ~30% of content words
  normal:  0.5,  // ~50% of content words
  hard:    0.7,  // ~70% of content words
  extreme: 1.0,  // 100% — every word
}

// Splits "Hello," → ["Hello", ","]  and  "world." → ["world", "."]
function splitWordAndSuffix(raw: string): [string, string] {
  const match = raw.match(/^([\w'']+)([^\w'']*)$/)
  return match ? [match[1], match[2]] : [raw, '']
}

type TokenKind = 'word' | 'blank'

export function lineToTokens(segment: SubtitleSegment, difficulty: Difficulty = 'normal'): ExerciseLine {
  const words = segment.text.trim().split(/\s+/)
  const ratio = BLANK_RATIO[difficulty]

  // Collect candidate indices first (two-pass so we know the total).
  const candidateIndices: number[] = []
  const parsed = words.map((raw, i) => {
    const [word, suffix] = splitWordAndSuffix(raw)
    const answer = word.toLowerCase()
    const isCandidate = difficulty === 'extreme'
      ? word.length > 0
      : word.length > 3 && !STOP_WORDS.has(answer)
    if (isCandidate) candidateIndices.push(i)
    return { word, suffix, answer }
  })

  // How many blanks to create for this phrase — at least 1 if any candidates exist.
  const targetBlanks = candidateIndices.length === 0
    ? 0
    : Math.max(1, Math.round(candidateIndices.length * ratio))

  // Pick blank indices evenly distributed across candidates (deterministic).
  const blankSet = new Set<number>()
  for (let i = 0; i < targetBlanks; i++) {
    const pick = Math.floor(i * candidateIndices.length / targetBlanks)
    blankSet.add(candidateIndices[pick])
  }

  const tokens: Token[] = parsed.map(({ word, suffix, answer }, i) => ({
    kind: blankSet.has(i) ? 'blank' : 'word' as TokenKind,
    word, suffix, answer, index: i,
  }))

  return { segment, tokens }
}

export function buildExercise(segments: SubtitleSegment[], difficulty: Difficulty = 'normal'): ExerciseLine[] {
  return segments.map((s) => lineToTokens(s, difficulty))
}

export function parseDifficulty(value: string | null): Difficulty {
  if (value === 'easy' || value === 'normal' || value === 'hard' || value === 'extreme') return value
  return 'normal'
}

// Bonus seconds awarded per character typed correctly, by difficulty.
const BONUS_PER_CHAR: Record<Difficulty, number> = {
  easy:    0.5,
  normal:  0.6,
  hard:    0.7,
  extreme: 0.8,
}

// Bonus for completing a single blank (chars in the answer × rate).
export function bonusForBlank(answerLength: number, difficulty: Difficulty): number {
  return answerLength * BONUS_PER_CHAR[difficulty]
}
