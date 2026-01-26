'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, Maximize, Settings, Lock } from 'lucide-react'
import styles from './ProtectedVideoPlayer.module.css'

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
      className={styles.videoPlayerContainer}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* حماية الطبقة الشفافة */}
      {protectionLayer && (
        <div className={styles.protectionLayer} />
      )}

      {/* الفيديو */}
      <video
        ref={videoRef}
        src={videoUrl}
        className={styles.videoElement}
        controls={false}
        onEnded={() => {
          setIsPlaying(false)
          onProgress(100)
        }}
      />

      {/* عناصر التحكم */}
      {showControls && (
        <div className={styles.controlsOverlay}>
          {/* شريط التقدم */}
          <div className={styles.progressSection}>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className={styles.progressBar}
            />
            <div className={styles.timeDisplay}>
              <span className={styles.timeText}>{formatTime(currentTime)}</span>
              <span className={styles.timeText}>{formatTime(duration)}</span>
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className={styles.controlsBar}>
            <div className={styles.leftControls}>
              {/* تشغيل/إيقاف */}
              <button
                onClick={togglePlay}
                className={styles.controlButton}
              >
                {isPlaying ? (
                  <Pause className={styles.controlIcon} />
                ) : (
                  <Play className={styles.controlIcon} />
                )}
              </button>

              {/* الصوت */}
              <div className={styles.volumeControl}>
                <Volume2 className={styles.volumeIcon} />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className={styles.volumeSlider}
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
                className={styles.playbackSelect}
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>

            <div className={styles.rightControls}>
              {/* إشارة الحماية */}
              <div className={styles.protectionIndicator}>
                <Lock className={styles.protectionIcon} />
                <span className={styles.protectionText}>محمي</span>
              </div>

              {/* ملء الشاشة */}
              <button
                onClick={toggleFullscreen}
                className={styles.controlButton}
              >
                <Maximize className={styles.controlIcon} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* رسالة الحماية */}
      <div className={styles.protectionBadge}>
        <Lock className={styles.badgeIcon} />
        <span className={styles.badgeText}>محمي ضد النسخ</span>
      </div>
    </div>
  )
}