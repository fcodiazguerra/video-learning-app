import { Suspense } from 'react'
import { PlayerView } from './PlayerView'

// Suspense is required because PlayerView uses useSearchParams() (Next.js App Router).
export default function PlayerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
          Loading…
        </div>
      }
    >
      <PlayerView />
    </Suspense>
  )
}
