export interface ParsedVideo {
  id: string
  originalUrl: string
}

export interface SubtitleSegment {
  start: number // seconds
  end: number   // seconds
  text: string
}

export type TokenKind = 'word' | 'blank'

export interface Token {
  kind: TokenKind
  word: string   // the word without punctuation
  suffix: string // trailing punctuation (e.g. "," or ".")
  answer: string // normalized for comparison: lowercase, no punctuation
  index: number  // position in the line
}

export interface ExerciseLine {
  segment: SubtitleSegment
  tokens: Token[]
}

export type AnswerStatus = 'idle' | 'correct' | 'incorrect'

export interface AnswerState {
  value: string
  status: AnswerStatus
}

export interface Score {
  correct: number
  incorrect: number
}
