'use client'

import { RefObject } from 'react'

interface BaseProps {
  isReady: boolean
  showStart?: boolean
  onStart?: () => void
  paused?: boolean
  onResume?: () => void
  onRestart?: () => void
  rangeEnded?: boolean
}

type Props = BaseProps & (
  | { containerRef: RefObject<HTMLDivElement | null>; videoRef?: never }
  | { videoRef: RefObject<HTMLVideoElement | null>;  containerRef?: never }
)

export function VideoPlayer({ containerRef, videoRef, isReady, showStart, onStart, paused, onResume, onRestart, rangeEnded }: Props) {
  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">

      {/* YouTube container */}
      {containerRef && <div ref={containerRef} className="absolute inset-0" />}

      {/* Local video element */}
      {videoRef && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full"
          playsInline
          preload="metadata"
        />
      )}

      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
          Loading player…
        </div>
      )}

      {/* Always-on overlay — blocks direct interaction with the player */}
      {isReady && <div className="absolute inset-0 z-10" />}

      {/* Initial start overlay */}
      {showStart && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
          <button
            onClick={onStart}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-white/90 hover:bg-white transition-colors shadow-lg"
          >
            <svg width="24" height="24" viewBox="0 0 14 14" fill="currentColor" className="ml-1">
              <polygon points="2,1 13,7 2,13"/>
            </svg>
          </button>
        </div>
      )}

      {/* Range ended overlay */}
      {rangeEnded && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
          <div className="text-center space-y-2">
            <p className="text-white text-2xl font-bold">End of selection</p>
            <p className="text-white/70 text-sm">You've reached the end of the selected range.</p>
          </div>
        </div>
      )}

      {/* Pause menu */}
      {paused && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={onResume}
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors w-44 justify-center"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <polygon points="2,1 13,7 2,13"/>
              </svg>
              Continuar
            </button>
            <button
              onClick={onRestart}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold text-sm hover:bg-gray-600 transition-colors w-44 justify-center"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M7 2a5 5 0 1 0 4.33 2.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <polygon points="10,1 13,4 7,4"/>
              </svg>
              Reiniciar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
