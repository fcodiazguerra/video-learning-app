'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VideoInput } from '../components/VideoInput'
import { Difficulty } from '../lib/exercise'

const DIFFICULTIES: { value: Difficulty; label: string; description: string }[] = [
  { value: 'easy',    label: 'Fácil',   description: '~1 de cada 5 palabras' },
  { value: 'normal',  label: 'Normal',  description: '~1 de cada 3 palabras' },
  { value: 'hard',    label: 'Difícil', description: '~1 de cada 2 palabras' },
  { value: 'extreme', label: 'Extrema', description: 'todas las palabras'    },
]

export default function Home() {
  const router = useRouter()
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')

  function handleVideoLoad(videoId: string) {
    router.push(`/player?v=${videoId}&d=${difficulty}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 bg-gray-50">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Video Learning</h1>
        <p className="text-gray-500 text-sm">
          Paste a YouTube URL and practice fill-in-the-blank while watching.
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

      <VideoInput onVideoLoad={handleVideoLoad} />
    </main>
  )
}
