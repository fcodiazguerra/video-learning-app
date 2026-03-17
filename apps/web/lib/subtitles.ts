import { SubtitleSegment } from './types'

// Mock subtitles used during MVP to validate the exercise UX
// without needing real subtitle fetching (which requires a server-side proxy).
// Replace with a real API call in Phase 2.
export const MOCK_SUBTITLES: SubtitleSegment[] = [
  { start: 0,  end: 5,  text: "Your time is limited, so don't waste it living someone else's life." },
  { start: 5,  end: 10, text: "Don't be trapped by dogma, which is living with the results of other people's thinking." },
  { start: 10, end: 15, text: "Don't let the noise of others' opinions drown out your own inner voice." },
  { start: 15, end: 20, text: "And most importantly, have the courage to follow your heart and intuition." },
  { start: 20, end: 25, text: "They somehow already know what you truly want to become." },
  { start: 25, end: 30, text: "Everything else is secondary." },
  { start: 30, end: 35, text: "Stay hungry, stay foolish, and never stop learning." },
  { start: 35, end: 40, text: "The only way to do great work is to love what you do." },
  { start: 40, end: 45, text: "If you haven't found it yet, keep looking and don't settle." },
  { start: 45, end: 50, text: "Have the courage to follow your heart." },
]
