'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, Maximize, Settings, Lock, Loader2 } from 'lucide-react'
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
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [protectionLayer, setProtectionLayer] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSavedProgress, setLastSavedProgress] = useState(0)

  // إنشاء عميل Supabase
  const createClientBrowser = () => {
    return require('@/lib/supabase/sf-client').createClientBrowser()
  }

  // حفظ التقدم في قاعدة البيانات
  const saveProgressToDB = useCallback(async (progress: number) => {
    try {
      const supabase = createClientBrowser()
      
      // التحقق مما إذا كان التقدم قد تغير بشكل كبير
      if (Math.abs(progress - lastSavedProgress) < 5 && progress !== 100) {
        return // لا تحفظ إذا كان التغيير أقل من 5% (ما لم يكن 100%)
      }

      // تحديث أو إنشاء سجل التقدم
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          lecture_content_id: contentId,
          package_id: packageId,
          status: progress >= 90 ? 'completed' : 'in_progress',
          score: progress,
          last_accessed_at: new Date().toISOString(),
          ...(progress >= 90 && { completed_at: new Date().toISOString() })
        }, {
          onConflict: 'user_id,lecture_content_id'
        })

      if (!error) {
        setLastSavedProgress(progress)
        onProgress(progress) // تحديث المكون الأب
      }
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }, [userId, contentId, packageId, onProgress, lastSavedProgress])

  // جلب التقدم الحالي
  const fetchCurrentProgress = useCallback(async () => {
    try {
      const supabase = createClientBrowser()
      const { data } = await supabase
        .from('user_progress')
        .select('score')
        .eq('user_id', userId)
        .eq('lecture_content_id', contentId)
        .single()

      if (data?.score) {
        setLastSavedProgress(data.score)
        return data.score
      }
    } catch (error) {
      console.error('Error fetching progress:', error)
    }
    return 0
  }, [userId, contentId])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // تحميل التقدم عند البدء
    fetchCurrentProgress().then(savedProgress => {
      if (savedProgress > 0 && video.duration > 0) {
        video.currentTime = (savedProgress / 100) * video.duration
      }
    })

    const handleTimeUpdate = () => {
      if (!video.duration) return
      
      const currentTime = video.currentTime
      const progress = (currentTime / video.duration) * 100
      
      setCurrentTime(currentTime)
      
      // تحديث التقدم كل ثانية
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current)
      }
      
      progressTimerRef.current = setTimeout(() => {
        saveProgressToDB(progress)
      }, 1000)
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setIsLoading(false)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      saveProgressToDB(100) // حفظ 100% عند الانتهاء
      onProgress(100)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)

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
      // منع مسطرة المسافات للتشغيل/الإيقاف
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      }
    }

    // منع فك ترميز الفيديو
    const handleCanPlay = () => {
      video.setAttribute('controlslist', 'nodownload nofullscreen')
    }

    video.addEventListener('canplay', handleCanPlay)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)

    // حفظ التقدم عند مغادرة الصفحة
    const handleBeforeUnload = () => {
      if (video.duration > 0) {
        const progress = (video.currentTime / video.duration) * 100
        saveProgressToDB(progress)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('canplay', handleCanPlay)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current)
      }
      
      // حفظ التقدم النهائي
      if (video.duration > 0) {
        const progress = (video.currentTime / video.duration) * 100
        saveProgressToDB(progress)
      }
    }
  }, [saveProgressToDB, fetchCurrentProgress])

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
    
    // حفظ التقدم عند السحب
    if (duration > 0) {
      const progress = (time / duration) * 100
      saveProgressToDB(progress)
    }
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
      onMouseLeave={() => {
        if (isPlaying) {
          setTimeout(() => setShowControls(false), 2000)
        }
      }}
    >
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <Loader2 className={styles.loadingSpinner} style={{ color: theme.primary }} />
          <p className={styles.loadingText}>جاري تحميل الفيديو...</p>
        </div>
      )}

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
          saveProgressToDB(100)
        }}
        preload="metadata"
        crossOrigin="anonymous"
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
              style={{ '--progress': `${(currentTime / (duration || 1)) * 100}%` } as React.CSSProperties}
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