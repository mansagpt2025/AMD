'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, Maximize, Settings, Lock } from 'lucide-react'

interface ProtectedVideoPlayerProps {
  videoUrl: string
  contentId: string
  userId: string
  onProgress: (progress: number) => void
  theme: any
}

export default function ProtectedVideoPlayer({
  videoUrl,
  contentId,
  userId,
  onProgress,
  theme
}: ProtectedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [protectionLayer, setProtectionLayer] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      const progress = (video.currentTime / video.duration) * 100
      onProgress(progress)
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    // حماية الفيديو
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()
    const handleKeyDown = (e: KeyboardEvent) => {
      // منع مفاتيح النسخ
      if (e.ctrlKey && (e.key === 'c' || e.key === 's' || e.key === 'p')) {
        e.preventDefault()
      }
      // منع F12
      if (e.key === 'F12') {
        e.preventDefault()
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const togglePlay = () => {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return
    
    const time = parseFloat(e.target.value)
    videoRef.current.currentTime = time
    setCurrentTime(time)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return
    
    const vol = parseFloat(e.target.value)
    videoRef.current.volume = vol
    setVolume(vol)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div 
      ref={containerRef}
      className="relative bg-black"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* حماية الطبقة الشفافة */}
      {protectionLayer && (
        <div className="absolute inset-0 z-10 pointer-events-none" />
      )}

      {/* الفيديو */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-auto max-h-[70vh]"
        controls={false}
        onEnded={() => {
          setIsPlaying(false)
          onProgress(100)
        }}
      />

      {/* عناصر التحكم */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* شريط التقدم */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
            <div className="flex justify-between text-sm text-white mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* تشغيل/إيقاف */}
              <button
                onClick={togglePlay}
                className="text-white hover:scale-110 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>

              {/* الصوت */}
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-white" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>

              {/* السرعة */}
              <select
                value={playbackRate}
                onChange={(e) => {
                  if (videoRef.current) {
                    videoRef.current.playbackRate = parseFloat(e.target.value)
                    setPlaybackRate(parseFloat(e.target.value))
                  }
                }}
                className="bg-transparent text-white border-none outline-none"
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              {/* إشارة الحماية */}
              <div className="flex items-center gap-2 text-white/70">
                <Lock className="w-4 h-4" />
                <span className="text-sm">محمي</span>
              </div>

              {/* ملء الشاشة */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:scale-110 transition-transform"
              >
                <Maximize className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* رسالة الحماية */}
      <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
        <Lock className="w-3 h-3" />
        <span>محمي ضد النسخ</span>
      </div>
    </div>
  )
}