import { SubtitleSegment, Token, ExerciseLine } from './types'

// Words that should never be turned into blanks.
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'it', 'to', 'of', 'and', 'or', 'in', 'on',
  'at', 'by', 'for', 'with', 'as', 'if', 'do', 'be', 'so', 'not',
  'but', 'yet', 'how', 'its', 'my', 'his', 'her', 'our', 'your',
  "don't", "doesn't", "hasn't", "haven't", "won't", "can't",
])

// Splits "Hello," → ["Hello", ","]  and  "world." → ["world", "."]
function splitWordAndSuffix(raw: string): [string, string] {
  const match = raw.match(/^([\w'']+)([^\w'']*)$/)
  return match ? [match[1], match[2]] : [raw, '']
}

// Rule: every 3rd content word (length > 3, not a stop word) becomes a blank.
// Deterministic — same input always produces the same blanks.
export function lineToTokens(segment: SubtitleSegment): ExerciseLine {
  const words = segment.text.trim().split(/\s+/)
  let blankCounter = 0

  const tokens: Token[] = words.map((raw, i) => {
    const [word, suffix] = splitWordAndSuffix(raw)
    const answer = word.toLowerCase()
    const isCandidate = word.length > 3 && !STOP_WORDS.has(answer)

    let kind: TokenKind = 'word'
    if (isCandidate) {
      blankCounter++
      if (blankCounter % 3 === 0) kind = 'blank'
    }

    return { kind, word, suffix, answer, index: i }
  })

  return { segment, tokens }
}

type TokenKind = 'word' | 'blank'

export function buildExercise(segments: SubtitleSegment[]): ExerciseLine[] {
  return segments.map(lineToTokens)
}
