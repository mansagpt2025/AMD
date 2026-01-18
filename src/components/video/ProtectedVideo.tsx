'use client'

import { useEffect, useRef } from 'react'

export default function ProtectedVideo({
  videoUrl,
  startAt = 0,
}: {
  videoUrl: string
  startAt?: number
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const hide = () => {
      if (iframeRef.current) iframeRef.current.style.display = 'none'
    }
    const show = () => {
      if (iframeRef.current) iframeRef.current.style.display = 'block'
    }

    document.addEventListener('visibilitychange', () => {
      document.hidden ? hide() : show()
    })

    window.addEventListener('blur', hide)
    window.addEventListener('focus', show)

    return () => {
      window.removeEventListener('blur', hide)
      window.removeEventListener('focus', show)
    }
  }, [])

  return (
    <iframe
      ref={iframeRef}
      src={`${videoUrl}?start=${startAt}&controls=0&rel=0`}
      width="100%"
      height="500"
      allow="autoplay; encrypted-media"
      style={{ background: 'black' }}
    />
  )
}
