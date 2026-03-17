# Architecture

## Overview

```
User → Next.js (/) → /player?v=VIDEO_ID → YouTube IFrame + Exercise UI
```

Fully client-side. No backend, no database, no AI. Runs entirely in the browser.

## Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Framework | Next.js 15 (App Router)       |
| Language  | TypeScript                    |
| Styles    | Tailwind CSS v4               |
| Video     | YouTube IFrame Player API     |
| State     | React useState / useCallback  |

## Request flow

```
1. User enters YouTube URL → extractVideoId() parses it
2. Router navigates to /player?v=VIDEO_ID
3. PlayerView loads MOCK_SUBTITLES (hardcoded for MVP)
4. buildExercise() converts SubtitleSegment[] → ExerciseLine[]
5. VideoPlayer initializes YouTube IFrame API
6. setInterval polls player.getCurrentTime() every 250 ms
7. useExercise.setActiveByTime() highlights the current segment
8. User types into blank inputs → submitAnswer() validates + updates score
```

## Module map

```
apps/web/
  lib/
    types.ts       — shared TypeScript interfaces
    youtube.ts     — extract video ID from URL
    subtitles.ts   — mock subtitle data (Phase 2: replace with real fetch)
    exercise.ts    — convert subtitles to fill-in-the-blank tokens
  hooks/
    useYouTubePlayer.ts  — IFrame API lifecycle + currentTime polling
    useExercise.ts       — active segment, answers, score
  components/
    VideoInput.tsx    — URL input + validation
    VideoPlayer.tsx   — YouTube embed wrapper
    ExerciseLine.tsx  — renders tokens (words + blank inputs)
    ScoreDisplay.tsx  — correct / incorrect counter
  app/
    page.tsx          — home: URL input
    player/
      page.tsx        — Suspense wrapper
      PlayerView.tsx  — main exercise view (client component)
```

## Fill-in-blank algorithm

Rule: every 3rd content word (length > 3, not a stop word) becomes a blank.
Deterministic, no randomness, no AI. The same subtitle always produces the same exercise.

## Key decisions

**No backend for MVP.** All logic runs client-side. No infra cost, fastest path to validating the UX.

**Mock subtitles first.** Real YouTube subtitle fetching requires a server-side proxy (CORS blocks direct browser fetch). Mocks let us ship and validate the exercise UX without that complexity. Real fetch is Phase 2.

**YouTube IFrame API for sync.** `player.getCurrentTime()` is polled every 250 ms to find the active subtitle segment. Stays accurate on pause, seek, and rate change — no manual timer needed.

**No auto-pause on blank in MVP.** The video continues playing. Pausing on each blank is a Phase 2 refinement after validating that the core loop feels good.
