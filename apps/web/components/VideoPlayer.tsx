'use client'

import { RefObject } from 'react'

interface Props {
  containerRef: RefObject<HTMLDivElement | null>
  isReady: boolean
  showStart?: boolean
  onStart?: () => void
  paused?: boolean
  onResume?: () => void
  onRestart?: () => void
}

export function VideoPlayer({ containerRef, isReady, showStart, onStart, paused, onResume, onRestart }: Props) {
  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
          Loading player…
        </div>
      )}
      {/* Always-on overlay — blocks all direct interaction with the YouTube iframe */}
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
