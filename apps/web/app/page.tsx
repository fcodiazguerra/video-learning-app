'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { extractVideoId } from '../lib/youtube'
import { Difficulty } from '../lib/exercise'
import { parseSrt } from '../lib/parseSrt'

const DIFFICULTIES: { value: Difficulty; label: string; description: string }[] = [
  { value: 'easy',    label: 'Fácil',   description: '~1 de cada 5 palabras' },
  { value: 'normal',  label: 'Normal',  description: '~1 de cada 3 palabras' },
  { value: 'hard',    label: 'Difícil', description: '~1 de cada 2 palabras' },
  { value: 'extreme', label: 'Extrema', description: 'todas las palabras'    },
]

export default function Home() {
  const router = useRouter()
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [url, setUrl]               = useState('')
  const [srtName, setSrtName]       = useState('')
  const [error, setError]           = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const srtRef  = useRef<string>('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSrtName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => { srtRef.current = ev.target?.result as string ?? '' }
    reader.readAsText(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const videoId = extractVideoId(url.trim())
    if (!videoId) {
      setError('Paste a valid YouTube URL (youtube.com/watch?v=... or youtu.be/...)')
      return
    }
    if (!srtRef.current) {
      setError('Please upload an SRT subtitle file.')
      return
    }

    const segments = parseSrt(srtRef.current)
    if (segments.length === 0) {
      setError('Could not parse the SRT file. Make sure it is a valid subtitle file.')
      return
    }

    sessionStorage.setItem(`srt:${videoId}`, JSON.stringify(segments))
    router.push(`/player?v=${videoId}&d=${difficulty}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 bg-gray-50">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Video Learning</h1>
        <p className="text-gray-500 text-sm">
          Paste a YouTube URL, upload the English subtitles, and practice fill-in-the-blank.
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-xl">
        {/* URL input */}
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* SRT file input */}
        <div
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-sm text-gray-500">
            {srtName ? srtName : 'Upload .srt subtitle file'}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept=".srt"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

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
