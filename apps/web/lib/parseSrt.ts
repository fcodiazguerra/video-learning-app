import { SubtitleSegment } from './types'

// "00:01:23,456" → seconds as float
function timeToSeconds(t: string): number {
  const [hms, ms] = t.split(',')
  const [h, m, s] = hms.split(':').map(Number)
  return h * 3600 + m * 60 + s + Number(ms) / 1000
}

// Remove bracketed/parenthesized annotations, music notes, lone dashes
function cleanText(raw: string): string {
  return raw
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/♪[^♪]*♪?/g, '')
    .replace(/♫[^♫]*♫?/g, '')
    .replace(/^[-–—]+$/, '')
    .replace(/<[^>]+>/g, '')   // HTML tags sometimes present in SRT
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function parseSrt(content: string): SubtitleSegment[] {
  const blocks = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split(/\n\n+/)
  const segments: SubtitleSegment[] = []

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length < 2) continue

    // Skip the sequence number line if present
    const timeLine = lines.find((l) => l.includes('-->'))
    if (!timeLine) continue

    const [startRaw, endRaw] = timeLine.split('-->').map((s) => s.trim())
    const start = timeToSeconds(startRaw)
    const end   = timeToSeconds(endRaw)

    // Text lines: everything after the timecode line
    const timeLineIdx = lines.indexOf(timeLine)
    const text = lines
      .slice(timeLineIdx + 1)
      .map(cleanText)
      .filter(Boolean)
      .join(' ')

    if (text) segments.push({ start, end, text })
  }

  return segments
}
