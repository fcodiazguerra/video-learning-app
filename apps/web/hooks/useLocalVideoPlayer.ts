'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Options {
  src: string
  onTimeUpdate: (time: number) => void
  skip?: boolean
}

export function useLocalVideoPlayer({ src, onTimeUpdate, skip }: Options) {
  const videoRef        = useRef<HTMLVideoElement>(null)
  const [isReady, setIsReady] = useState(false)
  const onTimeUpdateRef = useRef(onTimeUpdate)

  useEffect(() => { onTimeUpdateRef.current = onTimeUpdate }, [onTimeUpdate])

  useEffect(() => {
    if (skip || !src) return
    const video = videoRef.current
    if (!video) return

    video.src = src

    const onLoaded    = () => setIsReady(true)
    const onTick      = () => onTimeUpdateRef.current(video.currentTime)

    video.addEventListener('loadedmetadata', onLoaded)
    video.addEventListener('timeupdate', onTick)
    return () => {
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('timeupdate', onTick)
    }
  }, [src, skip])

  const play   = useCallback(() => { videoRef.current?.play().catch(() => {}) }, [])
  const pause  = useCallback(() => { videoRef.current?.pause() }, [])
  const seekTo = useCallback((t: number) => {
    if (videoRef.current) videoRef.current.currentTime = t
  }, [])

  return { videoRef, isReady, play, pause, seekTo }
}
