# MVP

## Goal

A user pastes a YouTube URL, watches the video embedded in the app, and fills in missing words from the subtitles in real time — no account, no AI, no setup.

## Scope

### In

- Paste a YouTube URL → embed the video in the app
- Fetch subtitles automatically (auto-generated or manual, English)
- Convert subtitles into fill-in-the-blank exercises (words hidden algorithmically)
- Exercises appear in sync with the video as it plays
- User types the missing word → instant correct / incorrect feedback
- Video pauses automatically when a blank appears, resumes on correct answer (or skip)

### Out (post-MVP)

- User accounts or progress tracking
- Language selection or multi-language support
- AI-generated exercises or explanations
- Configurable difficulty or word selection
- Mobile-optimized experience
- Sharing or exporting results

## Success criteria

- A user can go from URL to first exercise in under 15 seconds
- Exercises are in sync with the video timeline (±1 second tolerance)
- The app handles videos up to 30 minutes long without performance issues
- Error states are clear: no subtitles available, invalid URL, private video

## Key constraints

- No AI in v1 — word selection is purely algorithmic (e.g. every Nth word, skip stop words)
- No database — fully stateless
- Subtitle fetching must work for public videos without YouTube API authentication
- No user account required to use the app
