'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string
          width?: string | number
          height?: string | number
          playerVars?: Record<string, number>
          events?: { onReady?: () => void }
        }
      ) => YTPlayerInstance
    }
    onYouTubeIframeAPIReady: () => void
  }
}

interface YTPlayerInstance {
  getCurrentTime: () => number
  getPlayerState: () => number
  pauseVideo: () => void
  playVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  destroy: () => void
}

const YT_PLAYING = 1

interface Options {
  videoId: string
  onTimeUpdate: (time: number) => void
}

export function useYouTubePlayer({ videoId, onTimeUpdate }: Options) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayerInstance | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const onTimeUpdateRef = useRef(onTimeUpdate)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => { onTimeUpdateRef.current = onTimeUpdate }, [onTimeUpdate])

  const initPlayer = useCallback(() => {
    if (!containerRef.current || !window.YT?.Player) return

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 0,
        modestbranding: 1,
        rel: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
      },
      events: {
        onReady: () => {
          setIsReady(true)
          intervalRef.current = setInterval(() => {
            const time = playerRef.current?.getCurrentTime() ?? 0
            onTimeUpdateRef.current(time)
            const state = playerRef.current?.getPlayerState() ?? -1
            setIsPlaying(state === YT_PLAYING)
          }, 250)
        },
      },
    })
  }, [videoId])

  useEffect(() => {
    const cleanup = () => {
      clearInterval(intervalRef.current)
      playerRef.current?.destroy()
    }
    if (window.YT?.Player) {
      initPlayer()
    } else {
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(script)
      }
      window.onYouTubeIframeAPIReady = initPlayer
    }
    return cleanup
  }, [initPlayer])

  // Preserve focus so YouTube iframe doesn't steal it on pause/play API calls.
  const withFocusPreserved = useCallback((fn: () => void) => {
    const active = document.activeElement as HTMLElement | null
    fn()
    requestAnimationFrame(() => active?.focus({ preventScroll: true }))
  }, [])

  const pause = useCallback(() => withFocusPreserved(() => playerRef.current?.pauseVideo()), [withFocusPreserved])
  const play  = useCallback(() => withFocusPreserved(() => playerRef.current?.playVideo()),  [withFocusPreserved])
  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true)
  }, [])

  return { containerRef, isReady, isPlaying, pause, play, seekTo }
}
