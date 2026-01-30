'use client'

import { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  Video, FileText, BookOpen, Clock, CheckCircle,
  X, ArrowRight, AlertCircle, Loader2, Download,
  Target, Lock, Eye, Home, ChevronRight, Shield, 
  Award, Zap, Play, Pause, Volume2, Maximize,
  ExternalLink, Trophy, ArrowLeft, RefreshCw, XCircle
} from 'lucide-react'
import styles from './ContentPage.module.css'

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
  success: string
}

// ==========================================
// VIDEO PLAYER - محسن بعناصر تحكم كاملة
// ==========================================
function ProtectedVideoPlayer({ 
  videoUrl, contentId, userId, packageId, onProgress, theme 
}: { 
  videoUrl: string; contentId: string; userId: string; packageId: string
  onProgress: (progress: number) => void; theme: Theme
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

  const isYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be')
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }
  const youtubeId = isYouTube ? getYouTubeId(videoUrl) : null

  // تحميل YouTube API والمشغل
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

  // تحديث التقدم والوقت لليوتيوب
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

  // منع القائمة اليمنى والنسخ
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    return false
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // واجهة التحكم الموحدة
  const renderControls = () => (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.6), transparent)',
      padding: '20px 16px 16px',
      transition: 'opacity 0.3s',
      opacity: showControls ? 1 : 0,
      pointerEvents: showControls ? 'auto' : 'none',
      zIndex: 20,
      direction: 'rtl'
    }}>
      {/* شريط التقدم */}
      <div style={{ marginBottom: '12px' }}>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          style={{
            width: '100%',
            height: '6px',
            cursor: 'pointer',
            accentColor: theme.primary,
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '3px',
            outline: 'none',
            direction: 'ltr'
          }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          color: 'white', 
          fontSize: '0.8rem',
          marginTop: '4px',
          fontFamily: 'monospace',
          direction: 'ltr'
        }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* أزرار التحكم */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {/* تأخير 10 ثواني */}
        <button 
          onClick={() => skip(-10)}
          style={buttonStyle}
          title="تأخير 10 ثواني"
        >
          <RefreshCw size={20} style={{ transform: 'scaleX(-1)' }} />
        </button>

        {/* تشغيل/إيقاف */}
        <button 
          onClick={togglePlay}
          style={{
            ...buttonStyle,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            padding: '12px',
            transform: 'scale(1.1)'
          }}
        >
          {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" />}
        </button>

        {/* تقديم 10 ثواني */}
        <button 
          onClick={() => skip(10)}
          style={buttonStyle}
          title="تقديم 10 ثواني"
        >
          <RefreshCw size={20} />
        </button>

        {/* فاصل */}
        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.3)', margin: '0 8px' }} />

        {/* الصوت */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Volume2 size={20} color="white" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={volume}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              setVolume(v)
              if (isYouTube && youtubePlayerRef.current && isYouTubeReady) {
                youtubePlayerRef.current.setVolume(v * 100)
              } else if (videoRef.current) {
                videoRef.current.volume = v
              }
            }}
            style={{ width: '80px', accentColor: 'white', cursor: 'pointer' }}
          />
        </div>

        {/* السرعة */}
        <button 
          onClick={changeSpeed}
          style={{ ...buttonStyle, fontSize: '0.85rem', fontWeight: 'bold', minWidth: '48px' }}
          title="سرعة التشغيل"
        >
          {playbackRate}x
        </button>

        {/* الجودة - لليوتيوب فقط */}
        {isYouTube && (
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowQualityMenu(!showQualityMenu)}
              style={{ ...buttonStyle, fontSize: '0.8rem', fontWeight: 'bold', minWidth: '50px' }}
              title="جودة الفيديو"
            >
              {currentQuality === 'auto' ? 'جودة' : currentQuality}
            </button>
            {showQualityMenu && (
              <div style={{
                position: 'absolute',
                bottom: '40px',
                right: '50%',
                transform: 'translateX(50%)',
                background: 'rgba(0,0,0,0.95)',
                borderRadius: '8px',
                padding: '8px',
                minWidth: '100px',
                zIndex: 30,
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', padding: '4px 8px', textAlign: 'center' }}>
                  الجودة
                </div>
                {['auto', ...availableQualities].map((q) => (
                  <button
                    key={q}
                    onClick={() => changeQuality(q)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '6px 12px',
                      color: 'white',
                      background: currentQuality === q ? theme.primary : 'transparent',
                      border: 'none',
                      textAlign: 'center',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      borderRadius: '4px',
                      marginBottom: '2px'
                    }}
                  >
                    {q === 'auto' ? 'تلقائي' : q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ملء الشاشة */}
        <button 
          onClick={toggleFullscreen}
          style={buttonStyle}
          title={isFullscreen ? 'إخراج من ملء الشاشة' : 'ملء الشاشة'}
        >
          <Maximize size={20} />
        </button>
      </div>
    </div>
  )

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: 'relative', 
        background: '#000', 
        borderRadius: '0.75rem', 
        overflow: 'hidden',
        aspectRatio: '16/9',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        msUserSelect: 'none'
      }}
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
          {/* طبقة حماية لليوتيوب */}
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

      {/* طبقة حماية إضافية */}
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

      {renderControls()}

      {/* أيقونة التشغيل في المنتصف */}
      {!isPlaying && (
        <div 
          onClick={togglePlay}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.7)',
            borderRadius: '50%',
            padding: '24px',
            cursor: 'pointer',
            zIndex: 15,
            border: '2px solid rgba(255,255,255,0.3)'
          }}
        >
          <Play size={40} color="white" fill="white" />
        </div>
      )}

      {/* شارة المحتوى المحمي */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        background: 'rgba(0,0,0,0.8)',
        color: '#fbbf24',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        zIndex: 15,
        userSelect: 'none',
        pointerEvents: 'none',
        fontWeight: 'bold',
        border: '1px solid rgba(251, 191, 36, 0.3)'
      }}>
        <Shield size={14} />
        <span>محمي من النسخ</span>
      </div>
    </div>
  )
}

// style للأزرار
const buttonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
  padding: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  transition: 'all 0.2s'
}// ==========================================
// PDF VIEWER
// ==========================================
function PDFViewer({ pdfUrl, contentId, userId, packageId, theme, onProgress }: { 
  pdfUrl: string; contentId: string; userId: string; packageId: string
  theme: Theme; onProgress?: (progress: number) => void
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeSpent, setTimeSpent] = useState(0)
  const [progressSaved, setProgressSaved] = useState(false)

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
      if (pdfUrl) { setIsLoading(false); saveProgress() }
      else { setError('رابط الملف غير متوفر'); setIsLoading(false) }
    }, 1000)
    const interval = setInterval(() => { if (document.hasFocus()) setTimeSpent(prev => prev + 1) }, 1000)
    return () => { clearTimeout(timer); clearInterval(interval) }
  }, [pdfUrl, saveProgress])

  const handleDownload = () => {
    if (!pdfUrl) return
    if (isGoogleDrive && driveId) window.open(`https://drive.google.com/uc?export=download&id=${driveId}`, '_blank')
    else {
      const link = document.createElement('a')
      link.href = pdfUrl; link.download = `document-${contentId}.pdf`; link.target = '_blank'; link.click()
    }
    saveProgress()
  }

  const handleOpenOriginal = () => window.open(pdfUrl, '_blank')

  if (error) {
    return (
      <div className={styles.pdfViewerContainer} style={{ padding: '2rem', textAlign: 'center' }}>
        <AlertCircle size={48} color="#ef4444" />
        <h3>حدث خطأ في تحميل الملف</h3>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
          <button 
            onClick={handleOpenOriginal} 
            className={styles.openButton}
            style={{ borderColor: theme.primary, color: theme.primary }}
          >
            <ExternalLink size={18} /> فتح الرابط الأصلي
          </button>
          {isGoogleDrive && (
            <button 
              onClick={handleDownload} 
              className={styles.downloadButton}
              style={{ background: theme.primary }}
            >
              <Download size={18} /> تحميل
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pdfViewerContainer}>
      <div className={styles.pdfHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.iconContainer} style={{ background: theme.primary }}>
            <BookOpen size={24} color="white" />
          </div>
          <div>
            <h3 className={styles.title}>ملف PDF</h3>
            <p className={styles.subtitle}>
              {isGoogleDrive ? 'Google Drive' : 'PDF'}
              {timeSpent > 0 && ` | ${Math.floor(timeSpent / 60)}:${(timeSpent % 60).toString().padStart(2, '0')}`}
            </p>
          </div>
        </div>
        <div className={styles.headerActionsPdf}>
          <button 
            onClick={handleOpenOriginal} 
            className={styles.openButton}
            style={{ borderColor: theme.primary, color: theme.primary }}
          >
            <ExternalLink size={18} /><span>فتح في Drive</span>
          </button>
          <button 
            onClick={handleDownload} 
            className={styles.downloadButton}
            style={{ background: theme.primary }}
          >
            <Download size={18} /><span>تحميل</span>
          </button>
        </div>
      </div>
      <div className={styles.viewerContainer}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Loader2 className={styles.loadingSpinner} style={{ color: theme.primary }} />
          </div>
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
      <div className={styles.pdfFooter}>
        <div className={styles.progressBarContainer}>
          <div className={styles.progressBarFill} style={{ width: '100%', background: theme.success }} />
        </div>
        <div className={styles.progressText}>{progressSaved ? '✓ تم التحميل' : 'جاري التحميل...'}</div>
        {isGoogleDrive && (
          <p className={styles.driveNotice}>
            <AlertCircle size={14} /> قد تحتاج لتسجيل الدخول في Google
          </p>
        )}
        <p className={styles.watermark}>الأبــارع محمود الـديــب © 2024</p>
      </div>
    </div>
  )
}

// ==========================================
// EXAM VIEWER - معدل ليقرأ من JSON في الوصف
// ==========================================
function ExamViewer({ examContent, contentId, packageId, userId, theme, onComplete }: {
  examContent: any; contentId: string; packageId: string; userId: string
  theme: Theme; onComplete: () => void
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

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // البحث عن الأسئلة في content_url أو description
        const contentText = examContent?.content_url || examContent?.description || '';
        
        // البحث عن النمط [EXAM_QUESTIONS]:{...}
        const match = contentText.match(/\[EXAM_QUESTIONS\]:(\{[\s\S]*\})/);
        
        if (match && match[1]) {
          try {
            const parsedData = JSON.parse(match[1]);
            
            if (parsedData.questions && Array.isArray(parsedData.questions) && parsedData.questions.length > 0) {
              const formattedQuestions: Question[] = parsedData.questions.map((q: any, index: number) => ({
                id: index + 1,
                text: q.question,
                options: q.options.map((opt: string, optIndex: number) => ({
                  id: String.fromCharCode(65 + optIndex), // A, B, C, D
                  text: opt
                })),
                correctAnswer: q.correct // يجب أن تطابق نص أحد الخيارات
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
        
        // Fallback: محاولة الجلب من قاعدة البيانات إذا لم يوجد JSON
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
    setResults({ correct: correctCount, wrong: wrongCount }) // 👈 حفظ النتيجة
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

  if (loading) return (
    <div className={styles.loadingContainer} style={{ minHeight: '400px' }}>
      <Loader2 className={styles.loadingSpinner} style={{ color: theme.primary }} />
      <p>جاري التحميل...</p>
    </div>
  )

  if (error) return (
    <div className={styles.errorContainer} style={{ minHeight: '400px' }}>
      <div className={styles.errorContent}>
        <AlertCircle className={styles.errorIcon} />
        <h3 className={styles.errorTitle}>خطأ</h3>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    </div>
  )

  if (showResults) {
    const passed = score >= (examContent?.pass_score || 50)
    return (
      <div className={styles.resultsContainer}>
        <div 
          className={styles.resultCard} 
          style={passed ? { background: '#d1fae5', border: '2px solid #059669' } : { background: '#fee2e2', border: '2px solid #dc2626' }}
        >
          <div className={styles.resultIcon}>
            {passed ? <Trophy size={64} color="#10b981" /> : <AlertCircle size={64} color="#ef4444" />}
          </div>
          <h2>{passed ? 'مبروك! لقد نجحت' : 'للأسف، لم تنجح'}</h2>
          <p className={styles.scoreText}>{score}%</p>
          <p className={styles.passScoreText}>درجة النجاح: {examContent?.pass_score || 50}%</p>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <CheckCircle color="#10b981" />
              <span>صحيحة: {results?.correct ?? 0}</span>  {/* 👈 استخدم results */}
            </div>
            <div className={styles.stat}>
              <XCircle color="#ef4444" />
              <span>خاطئة: {results?.wrong ?? 0}</span>    {/* 👈 استخدم results */}
            </div>
          </div>
          <div className={styles.resultButtons}>
            <button 
              onClick={() => router.back()} 
              className={styles.backButtonExam}
              style={{ background: theme.primary }}
            >
              العودة للباقة
            </button>
            {!passed && (
              <button 
                onClick={() => { 
                  setShowResults(false); 
                  setAnswers({}); 
                  setCurrentQuestion(0); 
                  setTimeLeft((examContent?.duration_minutes || 10) * 60) 
                }} 
                className={styles.retryButton}
              >
                <RefreshCw size={18} /> إعادة المحاولة
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const isLastQuestion = currentQuestion === questions.length - 1

  if (!currentQ) return null

  return (
    <div className={styles.examContainer}>
      <div className={styles.examHeader}>
        <div className={styles.examInfo}>
          <Target style={{ color: theme.primary }} />
          <div>
            <h3>{examContent?.title || 'امتحان'}</h3>
            <p>سؤال {currentQuestion + 1} من {questions.length}</p>
          </div>
        </div>
        <div 
          className={styles.timer} 
          style={{ 
            background: timeLeft < 60 ? '#fee2e2' : timeLeft < 300 ? '#fef3c7' : '#d1fae5', 
            color: timeLeft < 60 ? '#dc2626' : timeLeft < 300 ? '#d97706' : '#059669' 
          }}
        >
          <Clock size={20} />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>
      
      <div className={styles.questionCard}>
        <div className={styles.questionHeader}>
          <span className={styles.questionNumber}>سؤال {currentQuestion + 1}</span>
        </div>
        <h4 className={styles.questionText}>{currentQ.text}</h4>
        <div className={styles.options}>
          {currentQ.options.map(option => (
            <button 
              key={option.id} 
              onClick={() => handleAnswer(currentQ.id, option.id)} 
              className={`${styles.option} ${answers[currentQ.id] === option.id ? styles.selected : ''}`}
            >
              <span className={styles.optionLabel}>{option.id}</span>
              <span className={styles.optionText}>{option.text}</span>
              <div className={styles.radio}>
                {answers[currentQ.id] === option.id && <div className={styles.radioInner} />}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <div className={styles.navigation}>
        <button 
          onClick={() => setCurrentQuestion(prev => prev - 1)} 
          disabled={currentQuestion === 0} 
          className={styles.navButton}
          style={{ opacity: currentQuestion === 0 ? 0.5 : 1 }}
        >
          <ArrowRight size={20} /> السابق
        </button>
        
        <div className={styles.progressDots}>
          {questions.map((_, idx) => (
            <div 
              key={idx} 
              className={`${styles.dot} ${idx === currentQuestion ? styles.active : ''} ${answers[questions[idx].id] ? styles.answered : ''}`} 
            />
          ))}
        </div>
        
        {isLastQuestion ? (
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || Object.keys(answers).length < questions.length} 
            className={styles.submitButton}
            style={{ background: theme.success, opacity: Object.keys(answers).length < questions.length ? 0.5 : 1 }}
          >
            {isSubmitting ? <Loader2 className={styles.loadingSpinner} /> : 'تسليم'}
          </button>
        ) : (
          <button 
            onClick={() => setCurrentQuestion(prev => prev + 1)} 
            className={styles.navButton}
            style={{ background: theme.primary, color: 'white', border: 'none' }}
          >
            التالي <ArrowLeft size={20} />
          </button>
        )}
      </div>
    </div>
  )
}

// ==========================================
// UTILS
// ==========================================
function getGradeTheme(gradeSlug: string): Theme {
  const themes: Record<string, Theme> = {
    first: { primary: '#3b82f6', success: '#10b981' },
    second: { primary: '#8b5cf6', success: '#10b981' },
    third: { primary: '#f59e0b', success: '#10b981' }
  }
  return themes[gradeSlug] || themes.first
}

// ==========================================
// MAIN PAGE
// ==========================================
function LoadingState() {
  return (
    <div className={styles.loadingContainer}>
      <Loader2 className={styles.loadingSpinner} />
      <p className={styles.loadingText}>جاري تحميل المحتوى...</p>
    </div>
  )
}

function ContentViewer() {
  const router = useRouter()
  const params = useParams()
  
  const gradeSlug = params?.grade as string
  const packageId = params?.packageId as string
  const contentId = params?.contentId as string
  
  const theme = getGradeTheme(gradeSlug as any)

  const [content, setContent] = useState<any>(null)
  const [lecture, setLecture] = useState<any>(null)
  const [packageData, setPackageData] = useState<any>(null)
  const [userProgress, setUserProgress] = useState<any>(null)
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
          <ProtectedVideoPlayer 
            videoUrl={content.content_url || ''} 
            {...commonProps}
            onProgress={handleVideoProgress}
          />
        )
      case 'pdf': 
        return <PDFViewer pdfUrl={content.content_url || ''} {...commonProps} />
      case 'exam': 
        return <ExamViewer examContent={content} {...commonProps} onComplete={markAsCompleted} />
      case 'text': 
        return (
          <div className={styles.textContent}>
            <div 
              className={styles.textContentInner}
              dangerouslySetInnerHTML={{ 
                __html: content.content_url || 'لا يوجد محتوى' 
              }} 
            />
          </div>
        )
      default: 
        return (
          <div className={styles.unsupportedContent}>
            <AlertCircle className={styles.unsupportedIcon} />
            <p>نوع المحتوى غير مدعوم</p>
          </div>
        )
    }
  }, [content, currentUser, contentId, packageId, theme, handleVideoProgress, markAsCompleted])

  const getContentTypeLabel = useCallback(() => {
    switch (content?.type) {
      case 'video': return 'فيديو'
      case 'pdf': return 'PDF'
      case 'exam': return 'امتحان'
      case 'text': return 'نص'
      default: return 'محتوى'
    }
  }, [content])

  if (loading) return <LoadingState />
  
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <AlertCircle className={styles.errorIcon} />
          <h2 className={styles.errorTitle}>حدث خطأ</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={handleBack} className={styles.backBtn}>
            العودة للباقة
          </button>
        </div>
      </div>
    )
  }
  
  if (!content) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <AlertCircle className={styles.errorIcon} />
          <h2 className={styles.errorTitle}>حدث خطأ</h2>
          <p className={styles.errorMessage}>المحتوى غير موجود</p>
          <button onClick={handleBack} className={styles.backBtn}>
            العودة للباقة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.breadcrumb}>
            <button onClick={() => router.push('/')} className={styles.breadcrumbItem}>
              <Home size={16} />الرئيسية
            </button>
            <ChevronRight size={16} className={styles.breadcrumbSeparator} />
            <button 
              onClick={() => router.push(`/grades/${gradeSlug}`)} 
              className={styles.breadcrumbItem}
            >
              {gradeSlug === 'first' ? 'الصف الأول' : gradeSlug === 'second' ? 'الصف الثاني' : 'الصف الثالث'}
            </button>
            <ChevronRight size={16} className={styles.breadcrumbSeparator} />
            <button 
              onClick={() => router.push(`/grades/${gradeSlug}/packages/${packageId}`)} 
              className={styles.breadcrumbItem}
            >
              {packageData?.name || 'الباقة'}
            </button>
            <ChevronRight size={16} className={styles.breadcrumbSeparator} />
            <span className={styles.currentPage}>{content.title}</span>
          </div>
          
          <div className={styles.contentHeader}>
            <div className={styles.contentInfo}>
              <h1 className={styles.contentTitle}>{content.title}</h1>
              <div className={styles.contentMeta}>
                <span className={styles.contentType}>{getContentTypeLabel()}</span>
                <span className={styles.contentSeparator}>•</span>
                <span>{lecture?.title}</span>
                <span className={styles.contentSeparator}>•</span>
                <span>{packageData?.name}</span>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button 
                onClick={handleBack} 
                className={styles.backActionBtn}
                style={{ borderColor: theme.primary, color: theme.primary }}
              >
                <ArrowRight size={18} />العودة
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.contentLayout}>
          <div className={styles.leftColumn}>
            <div className={styles.tabs}>
              <button 
                onClick={() => setActiveTab('viewer')} 
                className={`${styles.tabButton} ${activeTab === 'viewer' ? styles.activeTab : ''}`}
                style={activeTab === 'viewer' ? { borderColor: theme.primary, color: theme.primary } : {}}
              >
                <Eye size={18} /><span>العرض</span>
              </button>
              <button 
                onClick={() => setActiveTab('info')} 
                className={`${styles.tabButton} ${activeTab === 'info' ? styles.activeTab : ''}`}
                style={activeTab === 'info' ? { borderColor: theme.primary, color: theme.primary } : {}}
              >
                <BookOpen size={18} /><span>المعلومات</span>
              </button>
            </div>
            
            <div className={styles.contentArea}>
              {activeTab === 'viewer' ? renderContent() : (
                <div className={styles.infoContainer}>
                  <h3 className={styles.infoTitle}>معلومات المحتوى</h3>
                  <p>{content.description || 'لا يوجد وصف'}</p>
                </div>
              )}
              
              {content.type === 'video' && (
                <div className={styles.progressTracking}>
                  <div className={styles.progressHeader}>
                    <h4>تقدم المشاهدة</h4>
                    <span>{videoProgress}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${videoProgress}%`, background: theme.primary }} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.statusCard}>
              <h4 className={styles.cardTitle}>الحالة</h4>
              <div 
                className={styles.statusContent}
                style={
                  userProgress?.status === 'completed' || userProgress?.status === 'passed' ? 
                    { background: '#d1fae5', color: '#065f46' } : 
                  userProgress?.status === 'failed' ? 
                    { background: '#fee2e2', color: '#991b1b' } : 
                  userProgress?.status === 'in_progress' ? 
                    { background: '#dbeafe', color: '#1e40af' } : 
                    { background: '#f3f4f6', color: '#4b5563' }
                }
              >
                {userProgress?.status === 'completed' || userProgress?.status === 'passed' ? 
                  <CheckCircle size={24} /> : 
                  userProgress?.status === 'failed' ? 
                    <X size={24} /> : 
                  userProgress?.status === 'in_progress' ? 
                    <Loader2 className={styles.loadingSpinner} size={24} /> : 
                    <BookOpen size={24} />
                }
                <div className={styles.statusInfo}>
                  <div className={styles.statusText}>
                    {userProgress?.status === 'completed' ? 'مكتمل' : 
                     userProgress?.status === 'passed' ? 'ناجح' : 
                     userProgress?.status === 'failed' ? 'فاشل' : 
                     userProgress?.status === 'in_progress' ? 'قيد التقدم' : 'لم يبدأ'}
                  </div>
                </div>
              </div>
              
              {content.type !== 'exam' && (
                <button 
                  onClick={markAsCompleted} 
                  disabled={userProgress?.status === 'completed' || userProgress?.status === 'passed'} 
                  className={styles.completeButton}
                  style={
                    userProgress?.status === 'completed' || userProgress?.status === 'passed' ? 
                      { background: '#9ca3af', cursor: 'not-allowed' } : 
                      { background: theme.success }
                  }
                >
                  {userProgress?.status === 'completed' || userProgress?.status === 'passed' ? 
                    <><CheckCircle size={18} />تم</> : 
                    <><CheckCircle size={18} />تمييز كمكتمل</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ContentPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ContentViewer />
    </Suspense>
  )
}
