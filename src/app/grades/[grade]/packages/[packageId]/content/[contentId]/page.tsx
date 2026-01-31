'use client'

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  Video, FileText, BookOpen, Clock, CheckCircle,
  X, ArrowRight, AlertCircle, Loader2, Download,
  Target, Lock, Eye, Home, ChevronRight, Shield,
  Award, Zap, Play, Pause, Volume2, Maximize,
  ExternalLink, Trophy, ArrowLeft, RefreshCw, XCircle,
  ChevronLeft, Info, BarChart3, FileCheck, Users,
  Calendar, BarChart, TrendingUp, EyeOff, Copy,
  Bookmark, Star, Share2, Settings, Bell, HelpCircle,
  MessageSquare, ThumbsUp, Flag, MoreVertical
} from 'lucide-react'
import styles from './ContentPage.module.css'
import { motion, AnimatePresence } from 'framer-motion'

// ==========================================
// SUPABASE CLIENT
// ==========================================
declare global {
  var __contentPageSupabase: ReturnType<typeof createBrowserClient> | undefined
}

const getSupabase = () => {
  if (typeof window === 'undefined') return null
  
  if (!globalThis.__contentPageSupabase) {
    globalThis.__contentPageSupabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return globalThis.__contentPageSupabase
}

// ==========================================
// TYPES
// ==========================================
interface Question {
  id: number
  text: string
  options: { id: string; text: string }[]
  correctAnswer: string
}

interface Theme {
  primary: string
  primaryLight: string
  success: string
  warning: string
  danger: string
  background: string
  card: string
  text: string
  textLight: string
  border: string
}

interface ContentData {
  id: string
  title: string
  description: string
  type: 'video' | 'pdf' | 'exam' | 'text'
  content_url: string
  created_at: string
  lecture_id: string
  duration_minutes?: number
  pass_score?: number
}

interface UserProgress {
  id: string
  status: 'not_started' | 'in_progress' | 'completed' | 'passed' | 'failed'
  score?: number
  last_accessed_at: string
  completed_at?: string
}

// ==========================================
// ENHANCED LOADING COMPONENT
// ==========================================
function EnhancedLoadingState({ theme }: { theme: Theme }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={styles.loadingContainer}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className={styles.loadingContent}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className={styles.loadingSpinnerContainer}
        >
          <Loader2 
            className={styles.loadingSpinner} 
            style={{ 
              color: theme.primary,
              filter: `drop-shadow(0 0 8px ${theme.primary}40)`
            }} 
            size={48}
          />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={styles.loadingText}
        >
          جاري تحميل المحتوى...
        </motion.p>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "60%" }}
          transition={{ duration: 2, repeat: Infinity }}
          className={styles.loadingBar}
          style={{ background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)` }}
        />
      </motion.div>
    </motion.div>
  )
}

// ==========================================
// ENHANCED ERROR COMPONENT
// ==========================================
function EnhancedErrorState({ 
  error, 
  theme, 
  onRetry 
}: { 
  error: string; 
  theme: Theme; 
  onRetry: () => void 
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={styles.errorContainer}
    >
      <motion.div
        initial={{ y: 20, scale: 0.9 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className={styles.errorContent}
      >
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 0.5 }}
        >
          <AlertCircle 
            className={styles.errorIcon} 
            size={64}
            style={{ color: theme.danger || '#ef4444' }}
          />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={styles.errorTitle}
        >
          حدث خطأ
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={styles.errorMessage}
        >
          {error}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={styles.errorActions}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRetry}
            className={styles.backBtn}
            style={{ 
              background: `linear-gradient(135deg, ${theme.primary} 0%, #8b5cf6 100%)` 
            }}
          >
            <RefreshCw size={16} />
            <span>إعادة المحاولة</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// ==========================================
// ENHANCED VIDEO PLAYER
// ==========================================
function EnhancedVideoPlayer({ 
  videoUrl, 
  contentId, 
  userId, 
  packageId, 
  onProgress, 
  theme 
}: { 
  videoUrl: string; 
  contentId: string; 
  userId: string; 
  packageId: string;
  onProgress: (progress: number) => void; 
  theme: Theme 
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const youtubePlayerRef = useRef<any>(null)
  const youtubeContainerRef = useRef<HTMLDivElement>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [availableQualities, setAvailableQualities] = useState<string[]>([])
  const [currentQuality, setCurrentQuality] = useState('auto')
  const [isYouTubeReady, setIsYouTubeReady] = useState(false)
  const [hoveredControl, setHoveredControl] = useState<string | null>(null)

  const isYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be')
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }
  const youtubeId = isYouTube ? getYouTubeId(videoUrl) : null

  // YouTube API
  useEffect(() => {
    if (!isYouTube || !youtubeId) return

    const loadYouTubeAPI = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        initYouTubePlayer()
        return
      }
      
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
      
      ;(window as any).onYouTubeIframeAPIReady = initYouTubePlayer
    }

    const initYouTubePlayer = () => {
      if (!youtubeContainerRef.current) return
      
      youtubePlayerRef.current = new (window as any).YT.Player(youtubeContainerRef.current, {
        videoId: youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 0,
          iv_load_policy: 3,
          playsinline: 1,
          enablejsapi: 1
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange
        }
      })
    }

    loadYouTubeAPI()
    
    return () => {
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.destroy()
      }
    }
  }, [isYouTube, youtubeId])

  const onPlayerReady = (event: any) => {
    setIsYouTubeReady(true)
    setDuration(event.target.getDuration())
    const qualities = event.target.getAvailableQualityLevels()
    if (qualities && qualities.length > 0) {
      setAvailableQualities(qualities)
    }
    event.target.setVolume(100)
  }

  const onPlayerStateChange = (event: any) => {
    setIsPlaying(event.data === 1)
    if (event.data === 0) {
      onProgress(100)
    }
  }

  // Update progress for YouTube
  useEffect(() => {
    if (!isYouTube || !isPlaying) return
    
    const interval = setInterval(() => {
      if (youtubePlayerRef.current && isYouTubeReady) {
        const current = youtubePlayerRef.current.getCurrentTime()
        const dur = youtubePlayerRef.current.getDuration()
        setCurrentTime(current)
        setDuration(dur)
        if (dur > 0) {
          onProgress((current / dur) * 100)
        }
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isYouTube, isPlaying, isYouTubeReady, onProgress])

  const togglePlay = () => {
    if (isYouTube && youtubePlayerRef.current && isYouTubeReady) {
      if (isPlaying) {
        youtubePlayerRef.current.pauseVideo()
      } else {
        youtubePlayerRef.current.playVideo()
      }
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const skip = (seconds: number) => {
    if (isYouTube && youtubePlayerRef.current && isYouTubeReady) {
      const current = youtubePlayerRef.current.getCurrentTime()
      youtubePlayerRef.current.seekTo(current + seconds, true)
    } else if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (isYouTube && youtubePlayerRef.current && isYouTubeReady) {
      youtubePlayerRef.current.seekTo(time, true)
    } else if (videoRef.current) {
      videoRef.current.currentTime = time
    }
    setCurrentTime(time)
  }

  const changeSpeed = () => {
    const speeds = [0.5, 1, 1.25, 1.5, 2]
    const currentIndex = speeds.indexOf(playbackRate)
    const next = speeds[(currentIndex + 1) % speeds.length]
    
    if (isYouTube && youtubePlayerRef.current && isYouTubeReady) {
      youtubePlayerRef.current.setPlaybackRate(next)
    } else if (videoRef.current) {
      videoRef.current.playbackRate = next
    }
    setPlaybackRate(next)
  }

  const changeQuality = (quality: string) => {
    if (isYouTube && youtubePlayerRef.current && isYouTubeReady) {
      youtubePlayerRef.current.setPlaybackQuality(quality)
      setCurrentQuality(quality)
    }
    setShowQualityMenu(false)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    return false
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Control buttons configuration
  const controlButtons = [
    { 
      icon: <RefreshCw size={18} style={{ transform: 'scaleX(-1)' }} />, 
      action: () => skip(-10), 
      label: 'تأخير 10 ثواني' 
    },
    { 
      icon: isPlaying ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" />, 
      action: togglePlay, 
      label: isPlaying ? 'إيقاف' : 'تشغيل',
      primary: true 
    },
    { 
      icon: <RefreshCw size={18} />, 
      action: () => skip(10), 
      label: 'تقديم 10 ثواني' 
    },
    { 
      icon: <Volume2 size={18} />, 
      action: null, 
      label: 'الصوت' 
    },
    { 
      icon: <Zap size={16} />, 
      action: changeSpeed, 
      label: `${playbackRate}x` 
    },
    { 
      icon: <Maximize size={18} />, 
      action: toggleFullscreen, 
      label: 'ملء الشاشة' 
    }
  ]

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={styles.videoContainer}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onContextMenu={handleContextMenu}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
    >
      {isYouTube && youtubeId ? (
        <>
          <div 
            ref={youtubeContainerRef}
            style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
          />
          {/* Protection layer */}
          <div 
            onClick={togglePlay}
            onContextMenu={handleContextMenu}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
              cursor: 'pointer',
              background: 'transparent'
            }}
          />
        </>
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime)
              setDuration(videoRef.current.duration || 0)
              if (videoRef.current.duration > 0) {
                onProgress((videoRef.current.currentTime / videoRef.current.duration) * 100)
              }
            }
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) setDuration(videoRef.current.duration || 0)
          }}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onVolumeChange={() => {
            if (videoRef.current) setVolume(videoRef.current.volume)
          }}
          onRateChange={() => {
            if (videoRef.current) setPlaybackRate(videoRef.current.playbackRate)
          }}
          controls={false}
          playsInline
          disablePictureInPicture
          controlsList="nodownload noplaybackrate nofullscreen"
          onContextMenu={handleContextMenu}
        />
      )}

      {/* Protection overlay */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 5,
          pointerEvents: 'none'
        }}
        onContextMenu={handleContextMenu}
      />

      {/* Enhanced Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={styles.videoControls}
          >
            {/* Progress Bar */}
            <motion.div 
              className={styles.progressSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className={styles.progressSlider}
                style={{ '--progress-color': theme.primary } as React.CSSProperties}
              />
              <div className={styles.timeDisplay}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </motion.div>

            {/* Control Buttons */}
            <div className={styles.controlButtons}>
              {controlButtons.map((btn, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={() => setHoveredControl(btn.label)}
                  onMouseLeave={() => setHoveredControl(null)}
onClick={btn.action ?? undefined}
                  className={`${styles.controlBtn} ${btn.primary ? styles.primaryBtn : ''}`}
                  title={btn.label}
                >
                  {btn.icon}
                  {hoveredControl === btn.label && (
                    <motion.span
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={styles.tooltip}
                    >
                      {btn.label}
                    </motion.span>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play button overlay */}
      {!isPlaying && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={togglePlay}
          className={styles.playOverlay}
          style={{ 
            background: `radial-gradient(circle, ${theme.primary}40 0%, transparent 70%)`,
            border: `2px solid ${theme.primary}80`
          }}
        >
          <Play size={40} color="white" fill="white" />
        </motion.div>
      )}

      {/* Protected badge */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className={styles.protectedBadge}
        style={{ 
          background: 'rgba(0,0,0,0.8)',
          border: `1px solid ${theme.primary}30`
        }}
      >
        <Shield size={14} />
        <span>محمي من النسخ</span>
      </motion.div>
    </motion.div>
  )
}

// ==========================================
// ENHANCED PDF VIEWER
// ==========================================
function EnhancedPDFViewer({ 
  pdfUrl, 
  contentId, 
  userId, 
  packageId, 
  theme, 
  onProgress 
}: { 
  pdfUrl: string; 
  contentId: string; 
  userId: string; 
  packageId: string;
  theme: Theme; 
  onProgress?: (progress: number) => void 
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeSpent, setTimeSpent] = useState(0)
  const [progressSaved, setProgressSaved] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const isGoogleDrive = pdfUrl?.includes('drive.google.com') || pdfUrl?.includes('docs.google.com')
  const getGoogleDriveId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/)
    return match ? match[1] : null
  }
  const driveId = isGoogleDrive ? getGoogleDriveId(pdfUrl) : null
  
  const getViewerUrl = () => {
    if (!pdfUrl) return ''
    if (isGoogleDrive && driveId) return `https://drive.google.com/file/d/${driveId}/preview`
    if (pdfUrl.includes('dropbox.com')) return pdfUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '?dl=1')
    if (!pdfUrl.endsWith('.pdf')) return pdfUrl
    return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(pdfUrl)}`
  }

  const saveProgress = useCallback(async () => {
    if (!userId || !contentId || progressSaved) return
    try {
      const supabase = getSupabase()
      if (!supabase) return
      await supabase.from('user_progress').upsert({
        user_id: userId,
        lecture_content_id: contentId,
        package_id: packageId,
        status: 'completed',
        score: 100,
        last_accessed_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id,lecture_content_id' })
      setProgressSaved(true)
      if (onProgress) onProgress(100)
    } catch (err) {
      console.error('Error saving progress:', err)
    }
  }, [userId, contentId, packageId, onProgress, progressSaved])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pdfUrl) { 
        setIsLoading(false); 
        saveProgress() 
      } else { 
        setError('رابط الملف غير متوفر'); 
        setIsLoading(false) 
      }
    }, 1000)
    
    const interval = setInterval(() => { 
      if (document.hasFocus()) setTimeSpent(prev => prev + 1) 
    }, 1000)
    
    return () => { 
      clearTimeout(timer); 
      clearInterval(interval) 
    }
  }, [pdfUrl, saveProgress])

  const handleDownload = () => {
    if (!pdfUrl) return
    if (isGoogleDrive && driveId) {
      window.open(`https://drive.google.com/uc?export=download&id=${driveId}`, '_blank')
    } else {
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `document-${contentId}.pdf`
      link.target = '_blank'
      link.click()
    }
    saveProgress()
  }

  const handleOpenOriginal = () => window.open(pdfUrl, '_blank')
  const toggleFavorite = () => setIsFavorite(!isFavorite)

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={styles.pdfViewerContainer}
      >
        <div className={styles.pdfErrorContainer}>
          <AlertCircle className={styles.errorIcon} size={48} color="#ef4444" />
          <h3>حدث خطأ في تحميل الملف</h3>
          <div className={styles.errorActions}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenOriginal} 
              className={styles.openButton}
              style={{ borderColor: theme.primary, color: theme.primary }}
            >
              <ExternalLink size={18} /> فتح الرابط الأصلي
            </motion.button>
            {isGoogleDrive && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload} 
                className={styles.downloadButton}
                style={{ background: theme.primary }}
              >
                <Download size={18} /> تحميل
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.pdfViewerContainer}
    >
      <div className={styles.pdfHeader}>
        <div className={styles.headerLeft}>
          <motion.div 
            className={styles.iconContainer}
            initial={{ rotate: -180 }}
            animate={{ rotate: 0 }}
            style={{ background: theme.primary }}
          >
            <BookOpen size={24} color="white" />
          </motion.div>
          <div>
            <h3 className={styles.title}>ملف PDF</h3>
            <p className={styles.subtitle}>
              {isGoogleDrive ? 'Google Drive' : 'PDF'}
              {timeSpent > 0 && ` | ${Math.floor(timeSpent / 60)}:${(timeSpent % 60).toString().padStart(2, '0')}`}
            </p>
          </div>
        </div>
        <div className={styles.headerActionsPdf}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleFavorite}
            className={styles.favoriteButton}
            style={{ color: isFavorite ? theme.primary : 'var(--text-secondary)' }}
          >
            <Star size={18} fill={isFavorite ? theme.primary : 'none'} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenOriginal} 
            className={styles.openButton}
            style={{ borderColor: theme.primary, color: theme.primary }}
          >
            <ExternalLink size={18} /><span>فتح في Drive</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownload} 
            className={styles.downloadButton}
            style={{ background: theme.primary }}
          >
            <Download size={18} /><span>تحميل</span>
          </motion.button>
        </div>
      </div>
      <div className={styles.viewerContainer}>
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.pdfLoadingContainer}
          >
            <Loader2 className={styles.loadingSpinner} style={{ color: theme.primary }} />
            <p>جاري تحميل الملف...</p>
          </motion.div>
        ) : (
          <div className={styles.iframeContainer}>
            <iframe 
              src={getViewerUrl()} 
              className={styles.pdfFrame} 
              title="PDF Viewer" 
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
            <div className={styles.protectionOverlay} onContextMenu={(e) => e.preventDefault()} />
          </div>
        )}
      </div>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={styles.pdfFooter}
      >
        <div className={styles.progressBarContainer}>
          <motion.div 
            className={styles.progressBarFill} 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1 }}
            style={{ background: theme.success }} 
          />
        </div>
        <div className={styles.progressText}>
          {progressSaved ? '✓ تم التحميل' : 'جاري التحميل...'}
        </div>
        {isGoogleDrive && (
          <p className={styles.driveNotice}>
            <AlertCircle size={14} /> قد تحتاج لتسجيل الدخول في Google
          </p>
        )}
        <p className={styles.watermark}>منصة التعلم الذكي © 2024</p>
      </motion.div>
    </motion.div>
  )
}

// ==========================================
// ENHANCED EXAM VIEWER
// ==========================================
function EnhancedExamViewer({ 
  examContent, 
  contentId, 
  packageId, 
  userId, 
  theme, 
  onComplete 
}: {
  examContent: any; 
  contentId: string; 
  packageId: string; 
  userId: string;
  theme: Theme; 
  onComplete: () => void
}) {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{correct: number, wrong: number} | null>(null)
  const [showExplanation, setShowExplanation] = useState<number | null>(null)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const contentText = examContent?.content_url || examContent?.description || '';
        const match = contentText.match(/\[EXAM_QUESTIONS\]:(\{[\s\S]*\})/);
        
        if (match && match[1]) {
          try {
            const parsedData = JSON.parse(match[1]);
            
            if (parsedData.questions && Array.isArray(parsedData.questions) && parsedData.questions.length > 0) {
              const formattedQuestions: Question[] = parsedData.questions.map((q: any, index: number) => ({
                id: index + 1,
                text: q.question,
                options: q.options.map((opt: string, optIndex: number) => ({
                  id: String.fromCharCode(65 + optIndex),
                  text: opt
                })),
                correctAnswer: q.correct
              }));
              
              setQuestions(formattedQuestions);
              setTimeLeft((examContent?.duration_minutes || 10) * 60);
              setLoading(false);
              return;
            } else {
              throw new Error('لا توجد أسئلة في البيانات');
            }
          } catch (parseErr) {
            console.error('JSON Parse Error:', parseErr);
            setError('تنسيق الأسئلة غير صحيح');
            setLoading(false);
            return;
          }
        }
        
        const supabase = getSupabase()
        if (!supabase) {
          setError('لا توجد أسئلة متاحة');
          setLoading(false);
          return
        }

        const { data, error: dbError } = await supabase
          .from('questions')
          .select('*')
          .eq('content_id', contentId)
          .eq('is_active', true)
          .order('order_number', { ascending: true })

        if (dbError || !data || data.length === 0) {
          setError('لا توجد أسئلة متاحة لهذا الامتحان')
          setLoading(false)
          return
        }

        const formattedQuestions: Question[] = data.map((q: any, index: number) => ({
          id: q.id || index + 1,
          text: q.question_text || q.text,
          options: Array.isArray(q.options) ? q.options : [
            { id: 'A', text: q.option_a || 'الإجابة أ' },
            { id: 'B', text: q.option_b || 'الإجابة ب' },
            { id: 'C', text: q.option_c || 'الإجابة ج' },
            { id: 'D', text: q.option_d || 'الإجابة د' }
          ],
          correctAnswer: q.correct_answer || 'A'
        }))

        setQuestions(formattedQuestions)
        setTimeLeft((examContent?.duration_minutes || 10) * 60)
        setLoading(false)
      } catch (err) {
        console.error('Exam fetch error:', err)
        setError('حدث خطأ في تحميل الامتحان')
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [contentId, examContent])

  useEffect(() => {
    if (showResults || loading || error) return
    const timer = setInterval(() => {
      setTimeLeft(prev => { 
        if (prev <= 1) { 
          clearInterval(timer); 
          handleSubmit(); 
          return 0 
        } 
        return prev - 1 
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [showResults, loading, error])

  const handleAnswer = (questionId: number, answerId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }))
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    
    let correctCount = 0
    questions.forEach(q => { 
      const userAnswer = answers[q.id]
      const isCorrect = userAnswer === q.correctAnswer || 
        q.options.find(opt => opt.id === userAnswer)?.text === q.correctAnswer
      if (isCorrect) correctCount++ 
    })
    
    const wrongCount = questions.length - correctCount
    const finalScore = Math.round((correctCount / questions.length) * 100)
    
    setScore(finalScore)
    setResults({ correct: correctCount, wrong: wrongCount })
    setShowResults(true)
    setIsSubmitting(false)
    
    if (finalScore >= (examContent?.pass_score || 50)) onComplete()

    try {
      const supabase = getSupabase()
      if (supabase) await supabase.from('exam_results').insert({
        user_id: userId, 
        content_id: contentId, 
        score: finalScore,
        total_questions: questions.length, 
        correct_answers: correctCount, 
        wrong_answers: wrongCount
      })
    } catch (err) { 
      console.error('Error saving exam results:', err) 
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const toggleExplanation = (questionId: number) => {
    setShowExplanation(showExplanation === questionId ? null : questionId)
  }

  if (loading) return (
    <EnhancedLoadingState theme={theme} />
  )

  if (error) return (
    <EnhancedErrorState error={error} theme={theme} onRetry={() => window.location.reload()} />
  )

  if (showResults) {
    const passed = score >= (examContent?.pass_score || 50)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={styles.examResultsContainer}
      >
        <motion.div
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 15 }}
          className={`${styles.resultCard} ${passed ? styles.passed : styles.failed}`}
        >
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 0.8 }}
            className={styles.resultIcon}
          >
            {passed ? (
              <Trophy 
                size={56} 
                style={{ 
                  color: theme.success,
                  filter: `drop-shadow(0 0 12px ${theme.success}40)`
                }} 
              />
            ) : (
              <AlertCircle 
                size={56} 
                style={{ 
                  color: theme.danger || '#ef4444',
                  filter: `drop-shadow(0 0 12px ${theme.danger || '#ef4444'}40)`
                }} 
              />
            )}
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {passed ? '🎉 مبروك! لقد نجحت' : '😔 للأسف، لم تنجح'}
          </motion.h2>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className={styles.scoreCircle}
            style={{ 
              borderColor: passed ? theme.success : (theme.danger || '#ef4444'),
              background: `conic-gradient(
                ${passed ? theme.success : (theme.danger || '#ef4444')} ${score}%, 
                ${passed ? `${theme.success}20` : `${theme.danger || '#ef4444'}20`} ${score}%
              )`
            }}
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
              className={styles.scoreText}
            >
              {score}%
            </motion.span>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={styles.passScoreText}
          >
            درجة النجاح: {examContent?.pass_score || 50}%
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={styles.stats}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={styles.stat}
            >
              <CheckCircle color={theme.success} />
              <span>صحيحة: {results?.correct ?? 0}</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={styles.stat}
            >
              <XCircle color={theme.danger || '#ef4444'} />
              <span>خاطئة: {results?.wrong ?? 0}</span>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className={styles.resultButtons}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className={styles.backButtonExam}
              style={{ 
                background: `linear-gradient(135deg, ${theme.primary} 0%, #8b5cf6 100%)` 
              }}
            >
              <ArrowLeft size={16} />
              <span>العودة للباقة</span>
            </motion.button>
            {!passed && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { 
                  setShowResults(false); 
                  setAnswers({}); 
                  setCurrentQuestion(0); 
                  setTimeLeft((examContent?.duration_minutes || 10) * 60) 
                }} 
                className={styles.retryButton}
                style={{ 
                  borderColor: theme.primary, 
                  color: theme.primary 
                }}
              >
                <RefreshCw size={16} /> إعادة المحاولة
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    )
  }

  const currentQ = questions[currentQuestion]
  const isLastQuestion = currentQuestion === questions.length - 1

  if (!currentQ) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.examContainer}
    >
      <div className={styles.examHeader}>
        <div className={styles.examInfo}>
          <motion.div 
            className={styles.examIconContainer}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ background: theme.primaryLight }}
          >
            <Target style={{ color: theme.primary }} />
          </motion.div>
          <div>
            <h3>{examContent?.title || 'امتحان'}</h3>
            <p>سؤال {currentQuestion + 1} من {questions.length}</p>
          </div>
        </div>
        <motion.div 
          className={styles.timer}
          animate={timeLeft < 60 ? { scale: [1, 1.05, 1] } : {}}
          transition={timeLeft < 60 ? { duration: 1, repeat: Infinity } : {}}
          style={{ 
            background: timeLeft < 60 ? '#fee2e2' : timeLeft < 300 ? '#fef3c7' : '#d1fae5', 
            color: timeLeft < 60 ? '#dc2626' : timeLeft < 300 ? '#d97706' : '#059669' 
          }}
        >
          <Clock size={20} />
          <span>{formatTime(timeLeft)}</span>
        </motion.div>
      </div>
      
      <motion.div 
        key={currentQuestion}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className={styles.questionCard}
      >
        <div className={styles.questionHeader}>
          <span className={styles.questionNumber}>سؤال {currentQuestion + 1}</span>
          <div className={styles.questionProgress}>
            {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
          </div>
        </div>
        <h4 className={styles.questionText}>{currentQ.text}</h4>
        <div className={styles.options}>
          {currentQ.options.map(option => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02, x: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAnswer(currentQ.id, option.id)} 
              className={`${styles.option} ${answers[currentQ.id] === option.id ? styles.selected : ''}`}
              style={answers[currentQ.id] === option.id ? { 
                borderColor: theme.primary, 
                background: `linear-gradient(135deg, ${theme.primaryLight} 0%, #ffffff 100%)` 
              } : {}}
            >
              <span className={styles.optionLabel}>{option.id}</span>
              <span className={styles.optionText}>{option.text}</span>
              <div className={styles.radio}>
                {answers[currentQ.id] === option.id && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={styles.radioInner} 
                    style={{ background: theme.primary }} 
                  />
                )}
              </div>
            </motion.button>
          ))}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={() => toggleExplanation(currentQ.id)}
          className={styles.explanationButton}
          style={{ color: theme.primary }}
        >
          <Info size={16} />
          <span>شرح السؤال</span>
        </motion.button>
        
        <AnimatePresence>
          {showExplanation === currentQ.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={styles.explanation}
              style={{ borderColor: theme.primaryLight }}
            >
              <p>شرح مفصل للسؤال سيكون هنا...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      <div className={styles.navigation}>
        <motion.button
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentQuestion(prev => prev - 1)} 
          disabled={currentQuestion === 0} 
          className={styles.navButton}
          style={{ 
            opacity: currentQuestion === 0 ? 0.5 : 1,
            background: currentQuestion === 0 ? '#f3f4f6' : 'white'
          }}
        >
          <ArrowRight size={16} />
          <span>السابق</span>
        </motion.button>
        
        <div className={styles.progressDots}>
          {questions.map((_, idx) => (
            <motion.div
              key={idx}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`${styles.dot} ${idx === currentQuestion ? styles.active : ''} ${answers[questions[idx].id] ? styles.answered : ''}`} 
              style={{ 
                background: idx === currentQuestion ? theme.primary : 
                          answers[questions[idx].id] ? theme.success : '#e5e7eb' 
              }}
            />
          ))}
        </div>
        
        {isLastQuestion ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit} 
            disabled={isSubmitting || Object.keys(answers).length < questions.length} 
            className={styles.submitButton}
            style={{ 
              background: `linear-gradient(135deg, ${theme.success} 0%, #34d399 100%)`,
              opacity: Object.keys(answers).length < questions.length ? 0.5 : 1 
            }}
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 size={16} />
              </motion.div>
            ) : 'تسليم الإجابات'}
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentQuestion(prev => prev + 1)} 
            className={styles.navButton}
            style={{ 
              background: `linear-gradient(135deg, ${theme.primary} 0%, #8b5cf6 100%)`, 
              color: 'white', 
              border: 'none' 
            }}
          >
            <span>التالي</span>
            <ArrowLeft size={16} />
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

// ==========================================
// ENHANCED TEXT CONTENT
// ==========================================
function EnhancedTextContent({ 
  content, 
  theme 
}: { 
  content: any; 
  theme: Theme 
}) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const toggleFavorite = () => setIsFavorite(!isFavorite)
  const handleCopy = () => {
    navigator.clipboard.writeText(content.content_url || '')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.textContent}
    >
      <div className={styles.textContentHeader}>
        <FileText size={24} color={theme.primary} />
        <h3>المحتوى النصي</h3>
        <div className={styles.textActions}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleFavorite}
            className={styles.textActionButton}
            style={{ color: isFavorite ? theme.primary : 'var(--text-secondary)' }}
          >
            <Star size={18} fill={isFavorite ? theme.primary : 'none'} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCopy}
            className={styles.textActionButton}
            style={{ color: 'var(--text-secondary)' }}
          >
            <Copy size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowActions(!showActions)}
            className={styles.textActionButton}
            style={{ color: 'var(--text-secondary)' }}
          >
            <MoreVertical size={18} />
          </motion.button>
        </div>
      </div>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={styles.textContentInner}
        dangerouslySetInnerHTML={{ 
          __html: content.content_url || 'لا يوجد محتوى' 
        }} 
      />
      {showActions && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.extraActions}
          style={{ borderColor: theme.primaryLight }}
        >
          <button><Share2 size={16} /> مشاركة</button>
          <button><Bookmark size={16} /> حفظ</button>
          <button><Flag size={16} /> إبلاغ</button>
        </motion.div>
      )}
    </motion.div>
  )
}

// ==========================================
// UTILS
// ==========================================
function getGradeTheme(gradeSlug: string): Theme {
  const themes: Record<string, Theme> = {
    first: { 
      primary: '#3b82f6', 
      primaryLight: '#dbeafe',
      success: '#10b981', 
      warning: '#f59e0b',
      danger: '#ef4444',
      background: '#f8fafc',
      card: '#ffffff',
      text: '#1e293b',
      textLight: '#64748b',
      border: '#e2e8f0'
    },
    second: { 
      primary: '#8b5cf6', 
      primaryLight: '#ede9fe',
      success: '#10b981', 
      warning: '#f59e0b',
      danger: '#ef4444',
      background: '#f8fafc',
      card: '#ffffff',
      text: '#1e293b',
      textLight: '#64748b',
      border: '#e2e8f0'
    },
    third: { 
      primary: '#f59e0b', 
      primaryLight: '#fef3c7',
      success: '#10b981', 
      warning: '#f59e0b',
      danger: '#ef4444',
      background: '#f8fafc',
      card: '#ffffff',
      text: '#1e293b',
      textLight: '#64748b',
      border: '#e2e8f0'
    }
  }
  return themes[gradeSlug] || themes.first
}

// ==========================================
// STATUS CARD COMPONENT
// ==========================================
function StatusCard({ 
  userProgress, 
  content, 
  markAsCompleted, 
  theme 
}: { 
  userProgress: UserProgress | null; 
  content: ContentData | null; 
  markAsCompleted: () => void; 
  theme: Theme 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={styles.statusCard}
    >
      <h4 className={styles.cardTitle}>حالة المحتوى</h4>
      <motion.div 
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className={`${styles.statusContent} ${
          userProgress?.status === 'completed' || userProgress?.status === 'passed' ? styles.completed :
          userProgress?.status === 'failed' ? styles.failed :
          userProgress?.status === 'in_progress' ? styles.inProgress : styles.notStarted
        }`}
      >
        {userProgress?.status === 'completed' || userProgress?.status === 'passed' ? 
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <CheckCircle size={28} />
          </motion.div> : 
          userProgress?.status === 'failed' ? 
            <X size={28} /> : 
          userProgress?.status === 'in_progress' ? 
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 size={28} />
            </motion.div> : 
            <BookOpen size={28} />
        }
        <div className={styles.statusInfo}>
          <div className={styles.statusText}>
            {userProgress?.status === 'completed' ? 'مكتمل' : 
             userProgress?.status === 'passed' ? 'ناجح' : 
             userProgress?.status === 'failed' ? 'فاشل' : 
             userProgress?.status === 'in_progress' ? 'قيد التقدم' : 'لم يبدأ'}
          </div>
          <p className={styles.statusSubtext}>
            {userProgress?.last_accessed_at ? 
              `آخر زيارة: ${new Date(userProgress.last_accessed_at).toLocaleDateString('ar-EG')}` : 
              'لم يتم البدء بعد'}
          </p>
        </div>
      </motion.div>
      
      {content?.type !== 'exam' && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={markAsCompleted} 
          disabled={userProgress?.status === 'completed' || userProgress?.status === 'passed'} 
          className={`${styles.completeButton} ${
            userProgress?.status === 'completed' || userProgress?.status === 'passed' ? styles.disabled : ''
          }`}
          style={
            userProgress?.status === 'completed' || userProgress?.status === 'passed' ? 
              { background: theme.primaryLight, color: theme.primary } : 
              { background: `linear-gradient(135deg, ${theme.success} 0%, #34d399 100%)` }
          }
        >
          {userProgress?.status === 'completed' || userProgress?.status === 'passed' ? 
            <>
              <CheckCircle size={16} />
              <span>تم إكمال المحتوى</span>
            </> : 
            <>
              <CheckCircle size={16} />
              <span>تمييز كمكتمل</span>
            </>
          }
        </motion.button>
      )}
    </motion.div>
  )
}

// ==========================================
// PROGRESS BAR COMPONENT
// ==========================================
function ProgressBar({ progress, theme }: { progress: number; theme: Theme }) {
  return (
    <div className={styles.progressTracking}>
      <div className={styles.progressHeader}>
        <h4>تقدم المشاهدة</h4>
        <motion.span
          key={progress}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
        >
          {progress}%
        </motion.span>
      </div>
      <div className={styles.progressBar}>
        <motion.div 
          className={styles.progressFill} 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ 
            background: `linear-gradient(90deg, ${theme.primary} 0%, #8b5cf6 100%)` 
          }} 
        />
      </div>
      <div className={styles.progressHint}>
        سيتم وضع علامة كمكتمل تلقائيًا عند إكمال 80% من المحتوى
      </div>
    </div>
  )
}

// ==========================================
// MAIN CONTENT VIEWER COMPONENT
// ==========================================
function ContentViewer() {
  const router = useRouter()
  const params = useParams()
  
  const gradeSlug = params?.grade as string
  const packageId = params?.packageId as string
  const contentId = params?.contentId as string
  
  const theme = getGradeTheme(gradeSlug)

  const [content, setContent] = useState<ContentData | null>(null)
  const [lecture, setLecture] = useState<any>(null)
  const [packageData, setPackageData] = useState<any>(null)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [userPackage, setUserPackage] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'viewer' | 'info'>('viewer')
  const [videoProgress, setVideoProgress] = useState(0)
  const [authChecked, setAuthChecked] = useState(false)
  
  const supabase = useMemo(() => getSupabase(), [])

  useEffect(() => {
    if (!supabase || !gradeSlug || !packageId || !contentId || authChecked) return

    const initializePage = async () => {
      try {
        setLoading(true)
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          console.log('No session, redirecting...')
          router.replace(`/login?returnUrl=/grades/${gradeSlug}/packages/${packageId}/content/${contentId}`)
          return
        }

        const user = session.user
        setCurrentUser(user)
        
        const { data: userPackageData, error: accessError } = await supabase
          .from('user_packages')
          .select('*')
          .eq('user_id', user.id)
          .eq('package_id', packageId)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle()

        if (!userPackageData) {
          router.replace(`/grades/${gradeSlug}?error=not_subscribed`)
          return
        }
        
        setUserPackage(userPackageData)
        
        const { data: contentData, error: contentError } = await supabase
          .from('lecture_contents')
          .select('*')
          .eq('id', contentId)
          .single()
        
        if (contentError || !contentData) {
          setError('المحتوى غير موجود')
          setLoading(false)
          setAuthChecked(true)
          return
        }
        
        setContent(contentData)
        
        const [lectureRes, packageRes, progressRes] = await Promise.all([
          supabase.from('lectures').select('*').eq('id', contentData.lecture_id).single(),
          supabase.from('packages').select('*').eq('id', packageId).single(),
          supabase.from('user_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('lecture_content_id', contentId)
            .maybeSingle()
        ])
        
        setLecture(lectureRes.data)
        setPackageData(packageRes.data)
        
        const now = new Date().toISOString()
        
        if (!progressRes.data) {
          const { data: newProgress } = await supabase
            .from('user_progress')
            .insert({
              user_id: user.id,
              lecture_content_id: contentId,
              package_id: packageId,
              status: 'in_progress',
              last_accessed_at: now,
              created_at: now
            })
            .select()
            .single()
          setUserProgress(newProgress)
        } else {
          await supabase
            .from('user_progress')
            .update({ last_accessed_at: now })
            .eq('id', progressRes.data.id)
          
          setUserProgress({...progressRes.data, last_accessed_at: now})
        }
        
        setLoading(false)
        setAuthChecked(true)
        
      } catch (err: any) {
        console.error('Error:', err)
        setError(err?.message || 'حدث خطأ في تحميل البيانات')
        setLoading(false)
        setAuthChecked(true)
      }
    }
    
    initializePage()
  }, [gradeSlug, packageId, contentId, supabase, authChecked, router])

  const handleVideoProgress = useCallback((progress: number) => {
    setVideoProgress(progress)
    if (progress >= 80 && content?.type === 'video') {
      markAsCompleted()
    }
  }, [content])

  const markAsCompleted = useCallback(async () => {
    if (!userProgress || !content || !currentUser) return
    if (userProgress.status === 'completed' || userProgress.status === 'passed') return

    const status = content.type === 'exam' ? 'passed' : 'completed'
    const now = new Date().toISOString()
    
    try {
      const supabase = getSupabase()
      if (!supabase) return
      
      await supabase
        .from('user_progress')
        .update({ 
          status, 
          completed_at: now,
          score: content.type === 'exam' ? userProgress.score : 100
        })
        .eq('id', userProgress.id)
      
      setUserProgress({ ...userProgress, status, completed_at: now })
    } catch (err) {
      console.error('Mark complete error:', err)
    }
  }, [userProgress, content, currentUser])

  const handleBack = useCallback(() => {
    router.push(`/grades/${gradeSlug}/packages/${packageId}`)
  }, [router, gradeSlug, packageId])

  const getContentTypeLabel = useCallback(() => {
    switch (content?.type) {
      case 'video': return 'فيديو'
      case 'pdf': return 'PDF'
      case 'exam': return 'امتحان'
      case 'text': return 'نص'
      default: return 'محتوى'
    }
  }, [content])

  const getContentTypeIcon = useCallback(() => {
    switch (content?.type) {
      case 'video': return <Video size={20} />
      case 'pdf': return <FileText size={20} />
      case 'exam': return <Target size={20} />
      case 'text': return <BookOpen size={20} />
      default: return <FileText size={20} />
    }
  }, [content])

  const renderContent = useCallback(() => {
    if (!content) return null
    
    const commonProps = {
      contentId,
      userId: currentUser?.id,
      packageId,
      theme
    }
    
    switch (content.type) {
      case 'video': 
        return (
          <>
            <EnhancedVideoPlayer 
              videoUrl={content.content_url || ''} 
              {...commonProps}
              onProgress={handleVideoProgress}
            />
            <ProgressBar progress={videoProgress} theme={theme} />
          </>
        )
      case 'pdf': 
        return <EnhancedPDFViewer pdfUrl={content.content_url || ''} {...commonProps} />
      case 'exam': 
        return <EnhancedExamViewer examContent={content} {...commonProps} onComplete={markAsCompleted} />
      case 'text': 
        return <EnhancedTextContent content={content} theme={theme} />
      default: 
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.unsupportedContent}
          >
            <AlertCircle className={styles.unsupportedIcon} size={48} />
            <h3>نوع المحتوى غير مدعوم</h3>
            <p>عذرًا، نوع المحتوى هذا غير متاح حاليًا للعرض.</p>
          </motion.div>
        )
    }
  }, [content, currentUser, contentId, packageId, theme, handleVideoProgress, videoProgress, markAsCompleted])

  if (loading) return <EnhancedLoadingState theme={theme} />
  
  if (error) {
    return <EnhancedErrorState error={error} theme={theme} onRetry={() => window.location.reload()} />
  }
  
  if (!content) {
    return <EnhancedErrorState error="المحتوى غير موجود" theme={theme} onRetry={handleBack} />
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={styles.pageContainer} 
      style={{ background: theme.background }}
    >
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div className={styles.breadcrumb}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/')} 
              className={styles.breadcrumbItem}
            >
              <Home size={16} /> الرئيسية
            </motion.button>
            <ChevronRight size={16} className={styles.breadcrumbSeparator} />
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/grades/${gradeSlug}`)} 
              className={styles.breadcrumbItem}
            >
              {gradeSlug === 'first' ? 'الصف الأول الثانوي' : gradeSlug === 'second' ? 'الصف الثاني الثانوي' : 'الصف الثالث الثانوي'}
            </motion.button>
            <ChevronRight size={16} className={styles.breadcrumbSeparator} />
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/grades/${gradeSlug}/packages/${packageId}`)} 
              className={styles.breadcrumbItem}
            >
              {packageData?.name || 'الباقة'}
            </motion.button>
            <ChevronRight size={16} className={styles.breadcrumbSeparator} />
            <span className={styles.currentPage}>{content.title}</span>
          </div>
          
          <div className={styles.contentHeader}>
            <div className={styles.contentInfo}>
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className={styles.contentTypeBadge} 
                style={{ background: theme.primaryLight, color: theme.primary }}
              >
                {getContentTypeIcon()}
                <span>{getContentTypeLabel()}</span>
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.contentTitle}
              >
                {content.title}
              </motion.h1>
              <div className={styles.contentMeta}>
                <span className={styles.metaItem}>
                  <BookOpen size={14} />
                  <span>{lecture?.title}</span>
                </span>
                <span className={styles.metaSeparator}>•</span>
                <span className={styles.metaItem}>
                  <Award size={14} />
                  <span>{packageData?.name}</span>
                </span>
              </div>
            </div>
            <div className={styles.headerActions}>
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBack} 
                className={styles.backActionBtn}
                style={{ 
                  borderColor: theme.primary, 
                  color: theme.primary,
                  background: `linear-gradient(135deg, ${theme.primaryLight} 0%, white 100%)`
                }}
              >
                <ChevronLeft size={16} />
                <span>العودة للباقة</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentLayout}>
          {/* Left Column */}
          <div className={styles.leftColumn}>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.tabs}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('viewer')} 
                className={`${styles.tabButton} ${activeTab === 'viewer' ? styles.activeTab : ''}`}
                style={activeTab === 'viewer' ? { 
                  borderBottomColor: theme.primary, 
                  color: theme.primary,
                  background: theme.primaryLight 
                } : {}}
              >
                <Eye size={18} /><span>عرض المحتوى</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('info')} 
                className={`${styles.tabButton} ${activeTab === 'info' ? styles.activeTab : ''}`}
                style={activeTab === 'info' ? { 
                  borderBottomColor: theme.primary, 
                  color: theme.primary,
                  background: theme.primaryLight 
                } : {}}
              >
                <Info size={18} /><span>معلومات المحتوى</span>
              </motion.button>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.contentArea}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: activeTab === 'viewer' ? -50 : 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: activeTab === 'viewer' ? 50 : -50 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'viewer' ? (
                    renderContent()
                  ) : (
                    <div className={styles.infoContainer}>
                      <div className={styles.infoHeader}>
                        <h3 className={styles.infoTitle}>معلومات المحتوى</h3>
                        <div className={styles.infoBadge} style={{ background: theme.primaryLight, color: theme.primary }}>
                          {getContentTypeIcon()}
                          <span>{getContentTypeLabel()}</span>
                        </div>
                      </div>
                      <div className={styles.infoContent}>
                        <div className={styles.infoSection}>
                          <h4>الوصف</h4>
                          <p>{content.description || 'لا يوجد وصف'}</p>
                        </div>
                        
                        <div className={styles.infoGrid}>
                          <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            className={styles.infoCard}
                          >
                            <div className={styles.infoIcon} style={{ background: theme.primaryLight }}>
                              <Calendar color={theme.primary} size={20} />
                            </div>
                            <div>
                              <h5>تاريخ الإنشاء</h5>
                              <p>{new Date(content.created_at || Date.now()).toLocaleDateString('ar-EG')}</p>
                            </div>
                          </motion.div>
                          
                          <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            className={styles.infoCard}
                          >
                            <div className={styles.infoIcon} style={{ background: theme.primaryLight }}>
                              <BarChart color={theme.primary} size={20} />
                            </div>
                            <div>
                              <h5>الحالة</h5>
                              <p>{userProgress?.status === 'completed' ? 'مكتمل' : 
                                  userProgress?.status === 'passed' ? 'ناجح' : 
                                  userProgress?.status === 'failed' ? 'فاشل' : 
                                  userProgress?.status === 'in_progress' ? 'قيد التقدم' : 'لم يبدأ'}</p>
                            </div>
                          </motion.div>

                          <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            className={styles.infoCard}
                          >
                            <div className={styles.infoIcon} style={{ background: theme.primaryLight }}>
                              <Clock color={theme.primary} size={20} />
                            </div>
                            <div>
                              <h5>المدة</h5>
                              <p>{content.duration_minutes ? `${content.duration_minutes} دقيقة` : 'غير محددة'}</p>
                            </div>
                          </motion.div>

                          <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            className={styles.infoCard}
                          >
                            <div className={styles.infoIcon} style={{ background: theme.primaryLight }}>
                              <Target color={theme.primary} size={20} />
                            </div>
                            <div>
                              <h5>درجة النجاح</h5>
                              <p>{content.pass_score ? `${content.pass_score}%` : 'غير محددة'}</p>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className={styles.rightColumn}>
            <div className={styles.sidebar}>
              <StatusCard 
                userProgress={userProgress} 
                content={content} 
                markAsCompleted={markAsCompleted} 
                theme={theme} 
              />
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={styles.lectureInfo}
              >
                <h4 className={styles.cardTitle}>المحاضرة</h4>
                <div className={styles.lectureContent}>
                  <div className={styles.lectureIcon} style={{ background: theme.primaryLight }}>
                    <BookOpen color={theme.primary} size={20} />
                  </div>
                  <div>
                    <h5>{lecture?.title}</h5>
                    <p>{lecture?.description || 'لا يوجد وصف'}</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={styles.packageInfo}
              >
                <h4 className={styles.cardTitle}>الباقة</h4>
                <div className={styles.packageContent}>
                  <div className={styles.packageIcon} style={{ background: theme.primaryLight }}>
                    <Award color={theme.primary} size={20} />
                  </div>
                  <div>
                    <h5>{packageData?.name}</h5>
                    <p>تاريخ الانتهاء: {new Date(userPackage?.expires_at || Date.now()).toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={styles.statsInfo}
              >
                <h4 className={styles.cardTitle}>إحصائيات</h4>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <div className={styles.statIcon} style={{ background: theme.primaryLight }}>
                      <Eye size={16} color={theme.primary} />
                    </div>
                    <div>
                      <div className={styles.statValue}>{videoProgress}%</div>
                      <div className={styles.statLabel}>التقدم</div>
                    </div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statIcon} style={{ background: theme.primaryLight }}>
                      <Clock size={16} color={theme.primary} />
                    </div>
                    <div>
                      <div className={styles.statValue}>{content.duration_minutes || '--'}</div>
                      <div className={styles.statLabel}>دقيقة</div>
                    </div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statIcon} style={{ background: theme.primaryLight }}>
                      <TrendingUp size={16} color={theme.primary} />
                    </div>
                    <div>
                      <div className={styles.statValue}>{userProgress?.score || '--'}</div>
                      <div className={styles.statLabel}>الدرجة</div>
                    </div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statIcon} style={{ background: theme.primaryLight }}>
                      <Users size={16} color={theme.primary} />
                    </div>
                    <div>
                      <div className={styles.statValue}>--</div>
                      <div className={styles.statLabel}>المشاهدات</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  )
}

// ==========================================
// MAIN EXPORT
// ==========================================
export default function ContentPage() {
  return (
    <Suspense fallback={<EnhancedLoadingState theme={getGradeTheme('first')} />}>
      <ContentViewer />
    </Suspense>
  )
}