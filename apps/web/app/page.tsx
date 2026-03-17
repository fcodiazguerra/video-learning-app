'use client'

import { useRouter } from 'next/navigation'
import { VideoInput } from '../components/VideoInput'

export default function Home() {
  const router = useRouter()

  function handleVideoLoad(videoId: string) {
    router.push(`/player?v=${videoId}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 bg-gray-50">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Video Learning</h1>
        <p className="text-gray-500 text-sm">
          Paste a YouTube URL and practice fill-in-the-blank while watching.
        </p>
      </div>
      <VideoInput onVideoLoad={handleVideoLoad} />
    </main>
  )
}
