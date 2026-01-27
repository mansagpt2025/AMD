'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, Maximize, Lock, Loader2, AlertCircle } from 'lucide-react'
import styles from './ProtectedVideoPlayer.module.css'

interface ProtectedVideoPlayerProps {
  videoUrl: string
  contentId: string
  userId: string
  packageId: string
  onProgress: (progress: number) => void
  theme: any
}

export default function ProtectedVideoPlayer({
  videoUrl,
  contentId,
  userId,
  packageId,
  onProgress,
  theme
}: ProtectedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(true)
  const [lastSavedTime, setLastSavedTime] = useState(0)

  // التحقق من نوع الرابط (YouTube أم ملف مباشر)
  const isYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be')
  
  // استخراج ID الخاص بـ YouTube
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const youtubeId = isYouTube ? getYouTubeId(videoUrl) : null

  // إنشاء عميل Supabase
  const createClientBrowser = () => {
    if (typeof window === 'undefined') return null
    return require('@/lib/supabase/sf-client').createClientBrowser()
  }

  // حفظ التقدم
  const saveProgress = useCallback(async (currentTime: number, totalDuration: number) => {
    if (!userId || !contentId) return
    
    try {
      const supabase = createClientBrowser()
      if (!supabase) return

      const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0
      
      // لا تحفظ إلا كل 10 ثوانٍ أو عند الانتهاء
      if (Math.abs(currentTime - lastSavedTime) < 10 && progress < 95) return
      
      await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          lecture_content_id: contentId,
          package_id: packageId,
          status: progress >= 90 ? 'completed' : 'in_progress',
          score: Math.round(progress),
          last_accessed_at: new Date().toISOString(),
          ...(progress >= 90 && { completed_at: new Date().toISOString() })
        }, {
          onConflict: 'user_id,lecture_content_id'
        })

      setLastSavedTime(currentTime)
      onProgress(Math.round(progress))
    } catch (err) {
      console.error('Error saving progress:', err)
    }
  }, [userId, contentId, packageId, onProgress, lastSavedTime])

  // للفيديوهات المباشرة (MP4)
  useEffect(() => {
    if (isYouTube || !videoRef.current) return

    const video = videoRef.current
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      if (Math.floor(video.currentTime) % 10 === 0) {
        saveProgress(video.currentTime, video.duration)
      }
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setIsLoading(false)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      saveProgress(video.duration, video.duration)
      onProgress(100)
    }

    const handleError = () => {
      setError('حدث خطأ في تحميل الفيديو. قد يكون الرابط غير صالح.')
      setIsLoading(false)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)

    // حماية الفيديو
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', handleContextMenu)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
      document.removeEventListener('contextmenu', handleContextMenu)
      saveProgress(video.currentTime, video.duration)
    }
  }, [isYouTube, saveProgress, onProgress])

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // عارض YouTube
  if (isYouTube && youtubeId) {
    return (
      <div ref={containerRef} className={styles.videoPlayerContainer}>
        <div className={styles.youtubeContainer}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&showinfo=0&controls=1&disablekb=1&fs=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={styles.youtubeIframe}
          />
        </div>
        <div className={styles.protectionBadge}>
          <Lock size={16} />
          <span>محمي ضد النسخ</span>
        </div>
      </div>
    )
  }

  // عارض الفيديو المباشر
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={48} color="#ef4444" />
        <p>{error}</p>
        <p className={styles.errorHint}>تأكد من أن رابط الفيديو صحيح ومتاح</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={styles.videoPlayerContainer}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setTimeout(() => setShowControls(false), 3000)}
    >
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <Loader2 className={styles.loadingSpinner} style={{ color: theme.primary }} />
          <p>جاري تحميل الفيديو...</p>
        </div>
      )}

      <video
        ref={videoRef}
        src={videoUrl}
        className={styles.videoElement}
        controls={false}
        onClick={togglePlay}
        preload="metadata"
        playsInline
      />

      {showControls && !isLoading && (
        <div className={styles.controlsOverlay}>
          <div className={styles.progressSection}>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className={styles.progressBar}
              style={{'--progress': `${(currentTime / (duration || 1)) * 100}%`} as any}
            />
            <div className={styles.timeDisplay}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className={styles.controlsBar}>
            <button onClick={togglePlay} className={styles.controlButton}>
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            <div className={styles.volumeControl}>
              <Volume2 size={20} />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => {
                  const vol = parseFloat(e.target.value)
                  setVolume(vol)
                  if (videoRef.current) videoRef.current.volume = vol
                }}
                className={styles.volumeSlider}
              />
            </div>

            <div className={styles.protectionIndicator}>
              <Lock size={16} />
              <span>محمي</span>
            </div>

            <button 
              onClick={() => containerRef.current?.requestFullscreen()} 
              className={styles.controlButton}
            >
              <Maximize size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}