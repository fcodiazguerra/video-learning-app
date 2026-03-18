'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { extractVideoId } from '../lib/youtube'
import { Difficulty } from '../lib/exercise'
import { parseSrt } from '../lib/parseSrt'
import { setLocalVideoUrl } from '../lib/localVideo'
import { SubtitleSegment } from '../lib/types'

const DIFFICULTIES: { value: Difficulty; label: string; description: string }[] = [
  { value: 'easy',    label: 'Fácil',   description: '~1 de cada 5 palabras' },
  { value: 'normal',  label: 'Normal',  description: '~1 de cada 3 palabras' },
  { value: 'hard',    label: 'Difícil', description: '~1 de cada 2 palabras' },
  { value: 'extreme', label: 'Extrema', description: 'todas las palabras'    },
]

type Source = 'youtube' | 'local'

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function parseTime(str: string): number | null {
  if (str.trim().startsWith('-')) return null
  const parts = str.split(':')
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10)
    const s = parseInt(parts[1], 10)
    if (!isNaN(m) && !isNaN(s) && s < 60) return m * 60 + s
  }
  return null
}

export default function Home() {
  const router = useRouter()
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [source, setSource]         = useState<Source>('youtube')
  const [url, setUrl]               = useState('')
  const [srtName, setSrtName]       = useState('')
  const [videoName, setVideoName]   = useState('')
  const [error, setError]           = useState('')

  // Parsed segments + range state
  const [parsedSegments, setParsedSegments] = useState<SubtitleSegment[] | null>(null)
  const [rangeStart, setRangeStart]         = useState('')
  const [rangeEnd, setRangeEnd]             = useState('')

  const srtFileRef   = useRef<HTMLInputElement>(null)
  const videoFileRef = useRef<HTMLInputElement>(null)
  const blobUrlRef   = useRef<string>('')

  function handleSrtChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSrtName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string ?? ''
      const segments = parseSrt(text)
      if (segments.length > 0) {
        const maxT = segments[segments.length - 1].end
        setParsedSegments(segments)
        setRangeStart('0:00')
        setRangeEnd('')
      } else {
        setParsedSegments(null)
      }
    }
    reader.readAsText(file)
  }

  function handleVideoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoName(file.name)
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    blobUrlRef.current = URL.createObjectURL(file)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!parsedSegments) {
      setError('Please upload an SRT subtitle file.')
      return
    }

    // Parse and validate start time
    const lastSegEnd = parsedSegments[parsedSegments.length - 1].end
    const startSec = parseTime(rangeStart)
    if (startSec === null) {
      setError('Invalid start time. Use M:SS (e.g. 1:30).')
      return
    }


    // Parse end time — empty means no upper limit
    let endSec: number | null = null
    if (rangeEnd.trim() !== '') {
      endSec = parseTime(rangeEnd)
      if (endSec === null) {
        setError('Invalid end time. Use M:SS (e.g. 10:00).')
        return
      }
      if (endSec > lastSegEnd) {
        setError(`End time cannot exceed ${formatTime(lastSegEnd)} (last subtitle).`)
        return
      }
      if (startSec >= endSec) {
        setError('Start time must be before end time.')
        return
      }
    } else {
      // No end time set — still validate start is not past all subtitles
      if (startSec >= lastSegEnd) {
        setError(`Start time cannot be after the last subtitle (${formatTime(lastSegEnd)}).`)
        return
      }
    }

    // Filter segments — no upper bound if endSec is null
    const filtered = parsedSegments.filter(s =>
      s.start >= startSec && (endSec === null || s.start < endSec)
    )
    if (filtered.length === 0) {
      setError('No subtitles found in the selected range.')
      return
    }

    // Build player URL — include &to=X only when an end time was set
    const toParam = endSec !== null ? `&to=${endSec}` : ''

    if (source === 'youtube') {
      const videoId = extractVideoId(url.trim())
      if (!videoId) {
        setError('Paste a valid YouTube URL (youtube.com/watch?v=... or youtu.be/...)')
        return
      }
      sessionStorage.setItem(`srt:${videoId}`, JSON.stringify(filtered))
      router.push(`/player?v=${videoId}&d=${difficulty}${toParam}`)
    } else {
      if (!blobUrlRef.current) {
        setError('Please select a video file.')
        return
      }
      sessionStorage.setItem('srt:local', JSON.stringify(filtered))
      setLocalVideoUrl(blobUrlRef.current)
      router.push(`/player?source=local&d=${difficulty}${toParam}`)
    }
  }

  const maxTime = parsedSegments ? formatTime(parsedSegments[parsedSegments.length - 1].end) : null

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 bg-gray-50">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Video Learning</h1>
        <p className="text-gray-500 text-sm">
          Practice fill-in-the-blank while watching a video.
        </p>
      </div>

      {/* Difficulty selector */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-medium text-gray-700">Dificultad</p>
        <div className="flex gap-2">
          {DIFFICULTIES.map(({ value, label, description }) => {
            const selected = difficulty === value
            return (
              <button
                key={value}
                onClick={() => setDifficulty(value)}
                className={`flex flex-col items-center px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors w-24
                  ${selected
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
              >
                <span>{label}</span>
                <span className={`text-xs font-normal mt-0.5 ${selected ? 'text-blue-500' : 'text-gray-400'}`}>
                  {description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xl">

        {/* Source tabs */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => { setSource('youtube'); setError('') }}
            className={`flex-1 py-2 text-sm font-medium transition-colors
              ${source === 'youtube' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            YouTube
          </button>
          <button
            type="button"
            onClick={() => { setSource('local'); setError('') }}
            className={`flex-1 py-2 text-sm font-medium transition-colors
              ${source === 'local' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Local video
          </button>
        </div>

        {/* YouTube URL input */}
        {source === 'youtube' && (
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        {/* Local video file input */}
        {source === 'local' && (
          <FileDropZone
            label={videoName || 'Select video file (.mp4, .webm, .mov…)'}
            accept="video/*"
            inputRef={videoFileRef}
            onChange={handleVideoFileChange}
          />
        )}

        {/* SRT file input */}
        <FileDropZone
          label={srtName || 'Upload .srt subtitle file'}
          accept=".srt"
          inputRef={srtFileRef}
          onChange={handleSrtChange}
        />

        {/* Range selector — shown once SRT is loaded */}
        {parsedSegments && (
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-4 flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-700">
              Video range
              <span className="text-xs font-normal text-gray-400 ml-2">
                (max: {maxTime})
              </span>
            </p>
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs text-gray-500">From</label>
                <input
                  type="text"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  placeholder="0:00"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <span className="text-gray-400 mt-5">–</span>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs text-gray-500">To</label>
                <input
                  type="text"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  placeholder={maxTime ?? ''}
                  max={maxTime ?? undefined}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start
        </button>
      </form>
    </main>
  )
}

function FileDropZone({ label, accept, inputRef, onChange }: {
  label: string
  accept: string
  inputRef: React.RefObject<HTMLInputElement | null>
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
    >
      <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
      <span className="text-sm text-gray-500 truncate">{label}</span>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onChange} />
    </div>
  )
}
