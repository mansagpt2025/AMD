'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  Video, FileText, BookOpen, Clock, CheckCircle,
  X, ArrowRight, AlertCircle, Loader2, Download,
  Target, Lock, Eye, Home, ChevronRight, Shield, 
  Award, Zap, Play, Pause, Volume2, Maximize,
  ExternalLink, Trophy, ArrowLeft, RefreshCw, XCircle,
  ChevronLeft, Info, BarChart3, FileCheck, Menu,
  MoreVertical, Share2, Heart, Bookmark, Sparkles,
  Timer, TrendingUp, CheckCheck, Circle, RotateCcw,
  GraduationCap, Calendar, User, FileQuestion,
  PanelLeft, Minimize2, VolumeX, Settings, Subtitles,
  HelpCircle, AlertTriangle
} from 'lucide-react'
import styles from './ContentPage.module.css'

// ==========================================
// SUPABASE CLIENT (Unchanged)
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
// UPDATED TYPES
// ==========================================
interface ExamQuestion {
  question: string
  options: string[]
  correct: number
  marks?: number
}

interface Question {
  id: number
  text: string
  options: { id: string; text: string }[]
  correctAnswer: string
  marks: number
}

interface Theme {
  primary: string
  primaryLight: string
  primaryDark: string
  success: string
  warning: string
  error: string
  background: string
  surface: string
  card: string
  text: string
  textLight: string
  border: string
  gradient: string
}

// ==========================================
// ENHANCED VIDEO PLAYER (Unchanged)
// ==========================================
function CinematicVideoPlayer({ 
  videoUrl, contentId, userId, packageId, onProgress, theme 
}: { 
  videoUrl: string; contentId: string; userId: string; packageId: string
  onProgress: (progress: number) => void; theme: Theme
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const youtubePlayerRef = useRef<any>(null)
  const youtubeContainerRef = useRef<HTMLDivElement>(null)
const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isYouTubeReady, setIsYouTubeReady] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)

  const isYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be')
  
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }
  const youtubeId = isYouTube ? getYouTubeId(videoUrl) : null

  useEffect(() => {
    if (!isYouTube || !youtubeId) return
    
    const loadYouTubeAPI = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        initPlayer()
        return
      }
      
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
      
      ;(window as any).onYouTubeIframeAPIReady = initPlayer
    }

    const initPlayer = () => {
      if (!youtubeContainerRef.current) return
      
      youtubePlayerRef.current = new (window as any).YT.Player(youtubeContainerRef.current, {
        videoId: youtubeId,
        playerVars: {
          autoplay: 0, controls: 0, disablekb: 1, modestbranding: 1,
          rel: 0, showinfo: 0, fs: 0, iv_load_policy: 3,
          playsinline: 1, enablejsapi: 1
        },
        events: {
          onReady: (e: any) => {
            setIsYouTubeReady(true)
            setDuration(e.target.getDuration())
            e.target.setVolume(100)
          },
          onStateChange: (e: any) => {
            setIsPlaying(e.data === 1)
            setBuffering(e.data === 3)
            if (e.data === 0) onProgress(100)
          }
        }
      })
    }

    loadYouTubeAPI()
    return () => { if (youtubePlayerRef.current) youtubePlayerRef.current.destroy() }
  }, [isYouTube, youtubeId])

  useEffect(() => {
    if (!isYouTube || !isPlaying) return
    const interval = setInterval(() => {
      if (youtubePlayerRef.current && isYouTubeReady) {
        const current = youtubePlayerRef.current.getCurrentTime()
        const dur = youtubePlayerRef.current.getDuration()
        setCurrentTime(current)
        setDuration(dur)
        if (dur > 0) onProgress((current / dur) * 100)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isYouTube, isPlaying, isYouTubeReady, onProgress])

  const togglePlay = useCallback(() => {
    if (isYouTube && youtubePlayerRef.current && isYouTubeReady) {
      isPlaying ? youtubePlayerRef.current.pauseVideo() : youtubePlayerRef.current.playVideo()
    } else if (videoRef.current) {
      isPlaying ? videoRef.current.pause() : videoRef.current.play()
    }
  }, [isPlaying, isYouTube, isYouTubeReady])

  const skip = useCallback((seconds: number) => {
    if (isYouTube && youtubePlayerRef.current && isYouTubeReady) {
      const current = youtubePlayerRef.current.getCurrentTime()
      youtubePlayerRef.current.seekTo(current + seconds, true)
    } else if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }, [isYouTube, isYouTubeReady])

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (isYouTube && youtubePlayerRef.current && isYouTubeReady) {
      youtubePlayerRef.current.seekTo(time, true)
    } else if (videoRef.current) {
      videoRef.current.currentTime = time
    }
    setCurrentTime(time)
  }

  const changeSpeed = (speed: number) => {
    if (isYouTube && youtubePlayerRef.current && isYouTubeReady) {
      youtubePlayerRef.current.setPlaybackRate(speed)
    } else if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
    setPlaybackRate(speed)
    setShowSettings(false)
  }

  const toggleMute = () => {
    if (isYouTube && youtubePlayerRef.current && isYouTubeReady) {
      isMuted ? youtubePlayerRef.current.unMute() : youtubePlayerRef.current.mute()
    } else if (videoRef.current) {
      videoRef.current.muted = !isMuted
    }
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (v: number) => {
    setVolume(v)
    if (isYouTube && youtubePlayerRef.current && isYouTubeReady) {
      youtubePlayerRef.current.setVolume(v * 100)
    } else if (videoRef.current) {
      videoRef.current.volume = v
    }
    if (v === 0) setIsMuted(true)
    else if (isMuted) setIsMuted(false)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error)
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div 
      ref={containerRef}
      className={styles.videoContainer}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <div className={styles.videoWrapper}>
        {isYouTube && youtubeId ? (
          <>
            <div ref={youtubeContainerRef} className={styles.youtubeFrame} />
            <div className={styles.youtubeOverlay} onClick={togglePlay} />
          </>
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            className={styles.videoElement}
            onTimeUpdate={(e) => {
              setCurrentTime(e.currentTarget.currentTime)
              setDuration(e.currentTarget.duration || 0)
              if (e.currentTarget.duration > 0) {
                onProgress((e.currentTarget.currentTime / e.currentTarget.duration) * 100)
              }
            }}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onWaiting={() => setBuffering(true)}
            onCanPlay={() => setBuffering(false)}
            playsInline
            disablePictureInPicture
            controlsList="nodownload noplaybackrate nofullscreen"
          />
        )}
      </div>

      <AnimatePresence>
        {buffering && (
          <motion.div 
            className={styles.bufferingOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={styles.spinnerRing} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isPlaying && (
          <motion.button
            className={styles.centerPlayButton}
            onClick={togglePlay}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play size={40} fill="white" />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.div 
        className={styles.controlsBar}
        initial={false}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.progressContainer}>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className={styles.progressInput}
            style={{ background: `linear-gradient(to right, ${theme.primary} ${progress}%, rgba(255,255,255,0.3) ${progress}%)` }}
          />
          <div className={styles.timeDisplay}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className={styles.controlsRow}>
          <div className={styles.leftControls}>
            <motion.button 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.9 }}
              onClick={togglePlay}
              className={styles.playPauseBtn}
            >
              {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
            </motion.button>
            
            <div className={styles.skipButtons}>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => skip(-10)}>
                <RotateCcw size={18} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => skip(10)}>
                <RefreshCw size={18} />
              </motion.button>
            </div>

            <div 
              className={styles.volumeControl}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={toggleMute}>
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </motion.button>
              <AnimatePresence>
                {showVolumeSlider && (
                  <motion.div 
                    className={styles.volumeSlider}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 80, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                  >
                    <input 
                      type="range" 
                      min={0} 
                      max={1} 
                      step={0.1} 
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      style={{ background: `linear-gradient(to right, white ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) ${(isMuted ? 0 : volume) * 100}%)` }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className={styles.rightControls}>
            <div className={styles.speedBadge} onClick={() => setShowSettings(!showSettings)}>
              {playbackRate}x
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.9 }}
              onClick={toggleFullscreen}
              className={styles.fullscreenBtn}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize size={20} />}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {showSettings && (
            <motion.div 
              className={styles.settingsMenu}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
            >
              <div className={styles.settingsHeader}>سرعة التشغيل</div>
              {[0.5, 1, 1.25, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  className={`${styles.speedOption} ${playbackRate === speed ? styles.active : ''}`}
                  onClick={() => changeSpeed(speed)}
                >
                  {speed === 1 ? 'عادي' : `${speed}x`}
                  {playbackRate === speed && <CheckCheck size={16} />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className={styles.protectedBadge}>
        <Shield size={14} />
        <span>محتوى محمي</span>
      </div>
    </div>
  )
}

// ==========================================
// ENHANCED PDF VIEWER (Unchanged)
// ==========================================
function GlassPDFViewer({ pdfUrl, contentId, userId, packageId, theme, onProgress }: { 
  pdfUrl: string; contentId: string; userId: string; packageId: string
  theme: Theme; onProgress?: (progress: number) => void
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeSpent, setTimeSpent] = useState(0)
  const [progressSaved, setProgressSaved] = useState(false)
  const [showToolbar, setShowToolbar] = useState(false)

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
    }, 1500)
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
      <div className={styles.glassContainer}>
        <div className={styles.errorState}>
          <div className={styles.errorIconWrapper} style={{ background: `${theme.error}20` }}>
            <AlertCircle size={48} color={theme.error} />
          </div>
          <h3>حدث خطأ في تحميل الملف</h3>
          <p>تعذر الوصول إلى الملف المطلوب</p>
          <div className={styles.errorActions}>
            <button onClick={handleOpenOriginal} className={styles.secondaryBtn} style={{ borderColor: theme.primary, color: theme.primary }}>
              <ExternalLink size={18} /> فتح الرابط الأصلي
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.glassContainer} onMouseEnter={() => setShowToolbar(true)} onMouseLeave={() => setShowToolbar(false)}>
      <motion.div 
        className={styles.pdfToolbar}
        initial={false}
        animate={{ y: showToolbar ? 0 : -60, opacity: showToolbar ? 1 : 0 }}
      >
        <div className={styles.toolbarLeft}>
          <div className={styles.fileInfo}>
            <div className={styles.fileIcon} style={{ background: theme.primary }}>
              <FileText size={20} color="white" />
            </div>
            <div>
              <h4>ملف PDF</h4>
              <span>{isGoogleDrive ? 'Google Drive' : 'PDF Document'}</span>
            </div>
          </div>
        </div>
        <div className={styles.toolbarRight}>
          <span className={styles.timeBadge}>
            <Clock size={14} />
            {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
          </span>
          <button onClick={handleOpenOriginal} className={styles.iconBtn} title="فتح في نافذة جديدة">
            <ExternalLink size={18} />
          </button>
          <button onClick={handleDownload} className={styles.downloadFab} style={{ background: theme.primary }}>
            <Download size={18} />
          </button>
        </div>
      </motion.div>

      <div className={styles.pdfViewerWrapper}>
        {isLoading ? (
          <div className={styles.pdfSkeleton}>
            <div className={styles.skeletonLine} style={{ width: '80%' }} />
            <div className={styles.skeletonLine} style={{ width: '60%' }} />
            <div className={styles.skeletonLine} style={{ width: '90%' }} />
            <div className={styles.skeletonLine} style={{ width: '70%' }} />
            <div className={styles.skeletonShimmer} />
          </div>
        ) : (
          <iframe 
            src={getViewerUrl()} 
            className={styles.pdfFrame} 
            title="PDF Viewer" 
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        )}
      </div>

      <div className={styles.pdfFooterBar}>
        <div className={styles.progressTrack}>
          <motion.div 
            className={styles.progressThumb}
            initial={{ width: 0 }}
            animate={{ width: progressSaved ? '100%' : '0%' }}
            transition={{ duration: 1 }}
            style={{ background: theme.success }}
          />
        </div>
        <div className={styles.footerInfo}>
          <span>{progressSaved ? '✓ تم حفظ التقدم' : 'جاري قراءة الملف...'}</span>
          <span className={styles.watermark}>منصة التعلم الذكي</span>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// ENHANCED EXAM VIEWER - NEW FORMAT
// ==========================================
function ModernExamViewer({ examContent, contentId, packageId, userId, theme, onComplete }: {
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
  const [totalMarks, setTotalMarks] = useState(0)
  const [obtainedMarks, setObtainedMarks] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{correct: number, wrong: number, unanswered: number} | null>(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // قراءة الأسئلة من حقل exam_questions الجديد
        const examQuestions: ExamQuestion[] = examContent?.exam_questions
        
        if (examQuestions && Array.isArray(examQuestions) && examQuestions.length > 0) {
          const formattedQuestions: Question[] = examQuestions.map((q, index) => ({
            id: index + 1,
            text: q.question,
            options: q.options.map((opt, optIndex) => ({
              id: String.fromCharCode(65 + optIndex), // A, B, C, D...
              text: opt
            })),
            correctAnswer: String.fromCharCode(65 + q.correct), // تحويل index إلى حرف
            marks: q.marks || 1
          }))
          
          setQuestions(formattedQuestions)
          const total = formattedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0)
          setTotalMarks(total)
          setTimeLeft((examContent?.duration_minutes || 10) * 60)
          setLoading(false)
          return
        }
        
        // Fallback: محاولة قراءة من الوصف القديم إذا لم يوجد exam_questions
        const contentText = examContent?.description || '';
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
                correctAnswer: q.correct,
                marks: q.marks || 1
              }));
              setQuestions(formattedQuestions);
              const total = formattedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0)
              setTotalMarks(total)
              setTimeLeft((examContent?.duration_minutes || 10) * 60);
              setLoading(false);
              return;
            }
          } catch (parseErr) {
            console.error('JSON Parse Error:', parseErr);
          }
        }
        
        setError('لا توجد أسئلة متاحة لهذا الامتحان. تأكد من إضافة الأسئلة في لوحة التحكم.')
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
    let wrongCount = 0
    let unansweredCount = 0
    let obtained = 0
    
    questions.forEach(q => { 
      const userAnswer = answers[q.id]
      if (!userAnswer) {
        unansweredCount++
      } else if (userAnswer === q.correctAnswer) {
        correctCount++
        obtained += (q.marks || 1)
      } else {
        wrongCount++
      }
    })
    
    const finalScore = totalMarks > 0 ? Math.round((obtained / totalMarks) * 100) : 0
    
    setScore(finalScore)
    setObtainedMarks(obtained)
    setResults({ 
      correct: correctCount, 
      wrong: wrongCount, 
      unanswered: unansweredCount 
    })
    setShowResults(true)
    setIsSubmitting(false)
    
    if (finalScore >= (examContent?.pass_score || 50)) onComplete()

    try {
      const supabase = getSupabase()
      if (supabase) await supabase.from('exam_results').insert({
        user_id: userId, 
        content_id: contentId, 
        score: finalScore,
        obtained_marks: obtained,
        total_marks: totalMarks,
        total_questions: questions.length, 
        correct_answers: correctCount, 
        wrong_answers: wrongCount,
        unanswered: unansweredCount,
        answers: answers
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
    <div className={styles.examLoading}>
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 size={48} color={theme.primary} />
      </motion.div>
      <p>جاري تحميل الامتحان...</p>
    </div>
  )

  if (error) return (
    <div className={styles.examError}>
      <div className={styles.errorCard}>
        <AlertTriangle size={48} color={theme.error} />
        <h3>خطأ في تحميل الامتحان</h3>
        <p>{error}</p>
        <button onClick={() => router.back()} className={styles.primaryBtn} style={{ background: theme.primary }}>
          العودة
        </button>
      </div>
    </div>
  )

  if (showResults) {
    const passed = score >= (examContent?.pass_score || 50)
    return (
      <div className={styles.resultsContainer}>
        <motion.div 
          className={styles.resultCard}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className={`${styles.resultIcon} ${passed ? styles.passed : styles.failed}`}>
            {passed ? <Trophy size={64} /> : <AlertCircle size={64} />}
          </div>
          <h2 className={passed ? styles.passText : styles.failText}>
            {passed ? 'مبروك! لقد نجحت' : 'للأسف، لم تنجح'}
          </h2>
          
          <div className={styles.scoreDetails}>
            <div className={styles.scoreCircle} style={{ 
              background: `conic-gradient(${passed ? theme.success : theme.error} ${score}%, #e5e7eb ${score}%)` 
            }}>
              <span>{score}%</span>
            </div>
            <div className={styles.marksInfo}>
              <span className={styles.obtainedMarks}>{obtainedMarks}</span>
              <span className={styles.totalMarks}>/ {totalMarks}</span>
              <span className={styles.marksLabel}>درجة</span>
            </div>
          </div>
          
          <p className={styles.passScore}>درجة النجاح المطلوبة: {examContent?.pass_score || 50}%</p>
          
          <div className={styles.statsGrid}>
            <div className={styles.statCard} style={{ borderColor: theme.success }}>
              <CheckCircle size={24} color={theme.success} />
              <span className={styles.statNumber} style={{ color: theme.success }}>{results?.correct ?? 0}</span>
              <span>صحيحة</span>
            </div>
            <div className={styles.statCard} style={{ borderColor: theme.error }}>
              <XCircle size={24} color={theme.error} />
              <span className={styles.statNumber} style={{ color: theme.error }}>{results?.wrong ?? 0}</span>
              <span>خاطئة</span>
            </div>
            <div className={styles.statCard} style={{ borderColor: theme.warning }}>
              <HelpCircle size={24} color={theme.warning} />
              <span className={styles.statNumber} style={{ color: theme.warning }}>{results?.unanswered ?? 0}</span>
              <span>بدون إجابة</span>
            </div>
          </div>
          
          <div className={styles.resultActions}>
            <button onClick={() => router.back()} className={styles.primaryBtn} style={{ background: theme.primary }}>
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
                className={styles.secondaryBtn}
                style={{ borderColor: theme.primary, color: theme.primary }}
              >
                <RefreshCw size={18} /> إعادة المحاولة
              </button>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const isLastQuestion = currentQuestion === questions.length - 1
  const progress = ((currentQuestion + 1) / questions.length) * 100
  const answeredCount = Object.keys(answers).length

  return (
    <div className={styles.examWrapper}>
      <div className={styles.examHeader} style={{ background: `${theme.primary}10` }}>
        <div className={styles.examHeaderLeft}>
          <div className={styles.examIcon} style={{ background: theme.primary }}>
            <Target size={24} color="white" />
          </div>
          <div>
            <h3>{examContent?.title || 'امتحان'}</h3>
            <p>{questions.length} سؤال | {totalMarks} درجة</p>
          </div>
        </div>
        <div 
          className={styles.timer}
          style={{ 
            background: timeLeft < 60 ? `${theme.error}20` : timeLeft < 300 ? `${theme.warning}20` : `${theme.success}20`,
            color: timeLeft < 60 ? theme.error : timeLeft < 300 ? theme.warning : theme.success
          }}
        >
          <Timer size={20} />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className={styles.examProgressContainer}>
        <div className={styles.answeredBadge}>
          <CheckCircle size={16} />
          <span>{answeredCount} / {questions.length}</span>
        </div>
        <div className={styles.progressBarBg}>
          <motion.div 
            className={styles.progressBarFill}
            style={{ background: theme.primary }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
        <span className={styles.progressText}>{Math.round(progress)}%</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentQuestion}
          className={styles.questionCard}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className={styles.questionHeader}>
            <div className={styles.questionMeta}>
              <span className={styles.questionNumber}>سؤال {currentQuestion + 1}</span>
              <span className={styles.marksBadge}>({currentQ.marks || 1} درجة)</span>
            </div>
            <span className={styles.questionBadge}>{questions.length} / {currentQuestion + 1}</span>
          </div>
          
          <h4 className={styles.questionText}>{currentQ.text}</h4>
          
          <div className={styles.optionsGrid}>
            {currentQ.options.map((option, idx) => (
              <motion.button 
                key={option.id}
                className={`${styles.optionCard} ${answers[currentQ.id] === option.id ? styles.selected : ''}`}
                onClick={() => handleAnswer(currentQ.id, option.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={answers[currentQ.id] === option.id ? { 
                  borderColor: theme.primary, 
                  background: `${theme.primary}10` 
                } : {}}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <span className={styles.optionLetter} style={{ 
                  background: answers[currentQ.id] === option.id ? theme.primary : '#e5e7eb',
                  color: answers[currentQ.id] === option.id ? 'white' : '#6b7280'
                }}>
                  {option.id}
                </span>
                <span className={styles.optionText}>{option.text}</span>
                {answers[currentQ.id] === option.id && (
                  <motion.div 
                    className={styles.checkIcon}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <CheckCircle size={20} color={theme.primary} />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className={styles.examNavigation}>
        <button 
          onClick={() => setCurrentQuestion(prev => prev - 1)} 
          disabled={currentQuestion === 0}
          className={styles.navBtn}
        >
          <ChevronRight size={20} />
          السابق
        </button>
        
        <div className={styles.dotsContainer}>
          {questions.map((_, idx) => (
            <motion.div 
              key={idx}
              className={`${styles.dot} ${idx === currentQuestion ? styles.active : ''} ${answers[questions[idx].id] ? styles.answered : ''}`}
              onClick={() => setCurrentQuestion(idx)}
              whileHover={{ scale: 1.2 }}
              style={{ 
                background: idx === currentQuestion ? theme.primary : answers[questions[idx].id] ? theme.success : '#e5e7eb'
              }}
            />
          ))}
        </div>
        
        {isLastQuestion ? (
          <button 
            onClick={() => setShowExitConfirm(true)}
            disabled={answeredCount === 0}
            className={styles.submitBtn}
            style={{ 
              background: answeredCount === 0 ? '#9ca3af' : theme.success
            }}
          >
            تسليم الامتحان
          </button>
        ) : (
          <button 
            onClick={() => setCurrentQuestion(prev => prev + 1)}
            className={styles.navBtnPrimary}
            style={{ background: theme.primary }}
          >
            التالي
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showExitConfirm && (
          <motion.div 
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className={styles.modal}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className={styles.modalIcon}>
                <AlertTriangle size={48} color={theme.warning} />
              </div>
              <h3>تأكيد تسليم الامتحان</h3>
              
              <div className={styles.submitSummary}>
                <div className={styles.summaryItem}>
                  <span>الأسئلة المجابة:</span>
                  <strong>{answeredCount} من {questions.length}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>الأسئلة المتبقية:</span>
                  <strong>{questions.length - answeredCount}</strong>
                </div>
              </div>

              <p className={styles.warningText}>لا يمكن التراجع عن هذا الإجراء بعد التسليم</p>
              
              <div className={styles.modalActions}>
                <button 
                  onClick={() => setShowExitConfirm(false)} 
                  className={styles.secondaryBtn}
                >
                  مواصلة الإجابة
                </button>
                <button 
                  onClick={handleSubmit} 
                  className={styles.primaryBtn}
                  style={{ background: theme.success }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className={styles.spin} /> : 'تأكيد التسليم'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ==========================================
// UTILS & THEME CONFIG
// ==========================================
function getGradeTheme(gradeSlug: string): Theme {
  const themes: Record<string, Theme> = {
    first: { 
      primary: '#4F46E5', 
      primaryLight: '#E0E7FF',
      primaryDark: '#4338CA',
      success: '#10b981', 
      warning: '#f59e0b',
      error: '#ef4444',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      text: '#1e293b',
      textLight: '#64748b',
      border: '#e2e8f0',
      gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
    },
    second: { 
      primary: '#7C3AED', 
      primaryLight: '#EDE9FE',
      primaryDark: '#6D28D9',
      success: '#10b981', 
      warning: '#f59e0b',
      error: '#ef4444',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      text: '#1e293b',
      textLight: '#64748b',
      border: '#e2e8f0',
      gradient: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)'
    },
    third: { 
      primary: '#059669', 
      primaryLight: '#D1FAE5',
      primaryDark: '#047857',
      success: '#10b981', 
      warning: '#f59e0b',
      error: '#ef4444',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      text: '#1e293b',
      textLight: '#64748b',
      border: '#e2e8f0',
      gradient: 'linear-gradient(135deg, #059669 0%, #0EA5E9 100%)'
    }
  }
  return themes[gradeSlug] || themes.first
}

// ==========================================
// SKELETON LOADING COMPONENTS
// ==========================================
function ContentSkeleton() {
  return (
    <div className={styles.skeletonPage}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonLine} style={{ width: '30%' }} />
        <div className={styles.skeletonLine} style={{ width: '50%' }} />
      </div>
      <div className={styles.skeletonContent}>
        <div className={styles.skeletonVideo} />
        <div className={styles.skeletonSidebar}>
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
        </div>
      </div>
    </div>
  )
}

// ==========================================
// MAIN CONTENT VIEWER
// ==========================================
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
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  
  const supabase = useMemo(() => getSupabase(), [])

  useEffect(() => {
    if (!supabase || !gradeSlug || !packageId || !contentId || authChecked) return

    const initializePage = async () => {
      try {
        setLoading(true)
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
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
          <CinematicVideoPlayer 
            videoUrl={content.content_url || ''} 
            {...commonProps}
            onProgress={handleVideoProgress}
          />
        )
      case 'pdf': 
        return <GlassPDFViewer pdfUrl={content.content_url || ''} {...commonProps} />
      case 'exam': 
        return <ModernExamViewer examContent={content} {...commonProps} onComplete={markAsCompleted} />
      case 'text': 
        return (
          <div className={styles.textContentCard}>
            <div className={styles.textHeader}>
              <FileText size={32} color={theme.primary} />
              <h3>المحتوى النصي</h3>
            </div>
            <div 
              className={styles.textBody}
              dangerouslySetInnerHTML={{ __html: content.content_url || content.description || 'لا يوجد محتوى' }} 
            />
          </div>
        )
      default: 
        return (
          <div className={styles.unsupportedCard}>
            <div className={styles.unsupportedIcon}>
              <AlertCircle size={48} color={theme.warning} />
            </div>
            <h3>نوع المحتوى غير مدعوم</h3>
            <p>عذرًا، نوع المحتوى هذا غير متاح حاليًا للعرض.</p>
          </div>
        )
    }
  }, [content, currentUser, contentId, packageId, theme, handleVideoProgress, markAsCompleted])

  const getContentTypeLabel = useCallback(() => {
    switch (content?.type) {
      case 'video': return 'فيديو تعليمي'
      case 'pdf': return 'ملف PDF'
      case 'exam': return 'اختبار'
      case 'text': return 'محتوى نصي'
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

  if (loading) return <ContentSkeleton />
  
  if (error) {
    return (
      <div className={styles.errorPage}>
        <motion.div 
          className={styles.errorCard}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className={styles.errorIconLarge} style={{ background: `${theme.error}20` }}>
            <AlertCircle size={64} color={theme.error} />
          </div>
          <h2>حدث خطأ</h2>
          <p>{error}</p>
          <button onClick={handleBack} className={styles.primaryBtn} style={{ background: theme.primary }}>
            العودة للباقة
          </button>
        </motion.div>
      </div>
    )
  }
  
  if (!content) return null

  return (
    <div className={styles.modernPage} style={{ background: theme.background }}>
      <motion.header 
        className={styles.glassHeader}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.3)'
        }}
      >
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button onClick={handleBack} className={styles.backFab}>
              <ArrowRight size={20} />
            </button>
            <nav className={styles.breadcrumbModern}>
              <button onClick={() => router.push('/')} className={styles.breadcrumbItem}>
                <Home size={14} />
              </button>
              <ChevronLeft size={14} className={styles.breadcrumbSep} />
              <button onClick={() => router.push(`/grades/${gradeSlug}`)}>
                {gradeSlug === 'first' ? 'الأول' : gradeSlug === 'second' ? 'الثاني' : 'الثالث'}
              </button>
              <ChevronLeft size={14} className={styles.breadcrumbSep} />
              <button onClick={() => router.push(`/grades/${gradeSlug}/packages/${packageId}`)}>
                الباقة
              </button>
              <ChevronLeft size={14} className={styles.breadcrumbSep} />
              <span className={styles.breadcrumbCurrent}>{content.title}</span>
            </nav>
          </div>
          
          <div className={styles.headerCenter}>
            <div 
              className={styles.typeBadge}
              style={{ 
                background: `${theme.primary}15`,
                color: theme.primary,
                border: `1px solid ${theme.primary}30`
              }}
            >
              {getContentTypeIcon()}
              <span>{getContentTypeLabel()}</span>
            </div>
          </div>

          <div className={styles.headerRight}>
            <button 
              className={styles.menuBtn}
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            >
              <PanelLeft size={20} />
            </button>
          </div>
        </div>
      </motion.header>

      <main className={styles.mainContainer}>
        <div className={styles.contentGrid}>
          <div className={styles.primaryColumn}>
            <motion.div 
              className={styles.titleCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.5)'
              }}
            >
              <h1>{content.title}</h1>
              <div className={styles.titleMeta}>
                <span><BookOpen size={16} /> {lecture?.title}</span>
                <span className={styles.dotSep}>•</span>
                <span><Calendar size={16} /> {new Date(content.created_at).toLocaleDateString('ar-EG')}</span>
              </div>
            </motion.div>

            <div className={styles.modernTabs}>
              <button 
                onClick={() => setActiveTab('viewer')} 
                className={`${styles.tabBtn} ${activeTab === 'viewer' ? styles.active : ''}`}
              >
                <Eye size={18} />
                <span>عرض المحتوى</span>
                {activeTab === 'viewer' && (
                  <motion.div 
                    className={styles.tabIndicator}
                    style={{ background: theme.primary }}
                    layoutId="tabIndicator"
                  />
                )}
              </button>
              <button 
                onClick={() => setActiveTab('info')} 
                className={`${styles.tabBtn} ${activeTab === 'info' ? styles.active : ''}`}
              >
                <Info size={18} />
                <span>المعلومات</span>
                {activeTab === 'info' && (
                  <motion.div 
                    className={styles.tabIndicator}
                    style={{ background: theme.primary }}
                    layoutId="tabIndicator"
                  />
                )}
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={styles.contentDisplay}
              >
                {activeTab === 'viewer' ? (
                  <>
                    {renderContent()}
                    
                    {content.type === 'video' && (
                      <motion.div 
                        className={styles.progressCard}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.6)',
                          backdropFilter: 'blur(8px)'
                        }}
                      >
                        <div className={styles.progressHeader}>
                          <div>
                            <h4>تقدم المشاهدة</h4>
                            <p>أكمل 80% للحصول على علامة اجتياز</p>
                          </div>
                          <span className={styles.progressPercent} style={{ color: theme.primary }}>
                            {videoProgress}%
                          </span>
                        </div>
                        <div className={styles.progressBarModern}>
                          <motion.div 
                            className={styles.progressFill}
                            style={{ background: theme.gradient }}
                            initial={{ width: 0 }}
                            animate={{ width: `${videoProgress}%` }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <div className={styles.infoGridModern}>
                    <div className={styles.infoCard}>
                      <div className={styles.infoIcon} style={{ background: `${theme.primary}15` }}>
                        <FileText color={theme.primary} size={24} />
                      </div>
                      <h4>الوصف</h4>
                      <p>{content.description || 'لا يوجد وصف'}</p>
                    </div>
                    
                    <div className={styles.infoCard}>
                      <div className={styles.infoIcon} style={{ background: `${theme.success}15` }}>
                        <Clock color={theme.success} size={24} />
                      </div>
                      <h4>تاريخ الإضافة</h4>
                      <p>{new Date(content.created_at).toLocaleDateString('ar-EG', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                    
                    <div className={styles.infoCard}>
                      <div className={styles.infoIcon} style={{ background: `${theme.warning}15` }}>
                        <BarChart3 color={theme.warning} size={24} />
                      </div>
                      <h4>الحالة</h4>
                      <p>{userProgress?.status === 'completed' ? '✓ مكتمل' : 
                          userProgress?.status === 'passed' ? '✓ ناجح' : 
                          userProgress?.status === 'in_progress' ? '⏳ قيد التقدم' : '○ جديد'}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.aside 
            className={`${styles.sidebarModern} ${showMobileSidebar ? styles.mobileOpen : ''}`}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div 
              className={styles.statusCardModern}
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.5)'
              }}
            >
              <h4>حالة التقدم</h4>
              <div className={styles.statusDisplay}>
                <motion.div 
                  className={styles.statusIcon}
                  animate={{ 
                    background: userProgress?.status === 'completed' || userProgress?.status === 'passed' 
                      ? theme.success 
                      : userProgress?.status === 'in_progress' 
                        ? theme.warning 
                        : '#e5e7eb'
                  }}
                >
                  {userProgress?.status === 'completed' || userProgress?.status === 'passed' ? 
                    <CheckCheck size={24} color="white" /> : 
                    userProgress?.status === 'in_progress' ? 
                      <Loader2 size={24} color="white" className={styles.spin} /> : 
                      <Circle size={24} color="#9ca3af" />
                  }
                </motion.div>
                <div>
                  <div className={styles.statusLabel}>
                    {userProgress?.status === 'completed' ? 'مكتمل' : 
                     userProgress?.status === 'passed' ? 'ناجح' : 
                     userProgress?.status === 'in_progress' ? 'قيد التقدم' : 'جديد'}
                  </div>
                  <div className={styles.statusDate}>
                    آخر زيارة: {userProgress?.last_accessed_at ? 
                      new Date(userProgress.last_accessed_at).toLocaleDateString('ar-EG') : 
                      'لم تبدأ بعد'}
                  </div>
                </div>
              </div>
              
              {content.type !== 'exam' && (
                <button 
                  onClick={markAsCompleted}
                  disabled={userProgress?.status === 'completed' || userProgress?.status === 'passed'}
                  className={styles.markCompleteBtn}
                  style={{ 
                    background: userProgress?.status === 'completed' || userProgress?.status === 'passed' 
                      ? '#e5e7eb' 
                      : theme.gradient,
                    color: userProgress?.status === 'completed' || userProgress?.status === 'passed' 
                      ? '#6b7280' 
                      : 'white'
                  }}
                >
                  {userProgress?.status === 'completed' || userProgress?.status === 'passed' ? 
                    <><CheckCheck size={18} /> تم الإكمال</> : 
                    <><CheckCircle size={18} /> تحديد كمكتمل</>
                  }
                </button>
              )}
            </div>

            <div 
              className={styles.lectureCard}
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className={styles.lectureHeader}>
                <div className={styles.lectureIcon} style={{ background: theme.gradient }}>
                  <BookOpen size={20} color="white" />
                </div>
                <div>
                  <h4>{lecture?.title}</h4>
                  <p>المحاضرة الحالية</p>
                </div>
              </div>
            </div>

            <div 
              className={styles.packageCard}
              style={{
                background: theme.gradient,
                color: 'white'
              }}
            >
              <Award size={32} />
              <h4>{packageData?.name}</h4>
              <p>صالح حتى: {new Date(userPackage?.expires_at || Date.now()).toLocaleDateString('ar-EG')}</p>
            </div>
          </motion.aside>
        </div>
      </main>

      {showMobileSidebar && (
        <motion.div 
          className={styles.mobileOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowMobileSidebar(false)}
        />
      )}
    </div>
  )
}

export default function ContentPage() {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ContentViewer />
    </Suspense>
  )
}
