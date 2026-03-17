# Video Learning App

Web app that turns any YouTube video into a fill-in-the-blank exercise, synchronized with the video playback.

## How it works

1. Paste a YouTube URL
2. The app embeds the video and fetches its subtitles
3. Subtitles are converted into fill-in-the-blank exercises
4. The user fills in missing words while watching the video in real time

## Project structure

```
video-learning-app/
├── apps/
│   ├── web/        # Next.js frontend
│   └── api/        # Backend API
├── packages/
│   ├── core/       # Subtitle parsing and exercise generation logic
│   ├── prompts/    # (future) AI prompt templates
│   └── types/      # Shared TypeScript types
└── docs/
    ├── MVP.md
    ├── ROADMAP.md
    └── ARCHITECTURE.md
```

## Getting started

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start development
pnpm dev
```

## Docs

- [MVP](docs/MVP.md) — scope and success criteria for v1
- [Roadmap](docs/ROADMAP.md) — planned features and phases
- [Architecture](docs/ARCHITECTURE.md) — technical decisions and system design
