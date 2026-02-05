// src/app/grades/[grade]/packages/[packageId]/content/[contentId]/page.tsx
'use client'

import { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import {
  Video, FileText, BookOpen, Clock, CheckCircle,
  ArrowRight, AlertCircle, Loader2, Download,
  Target, Eye, Home, Shield, Award, Play, Pause,
  Volume2, Maximize, ExternalLink, Trophy, RefreshCw,
  XCircle, ChevronLeft, Timer, RotateCcw, Minimize2,
  VolumeX, HelpCircle, AlertTriangle, CheckCheck,
  Circle, Calendar, Menu
} from 'lucide-react'
import styles from './ContentPage.module.css'

// ==================== Types ====================
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

interface LectureContent {
  id: string
  lecture_id: string
  type: 'video' | 'pdf' | 'exam' | 'text'
  title: string
  description: string
  content_url: string
  duration_minutes: number
  max_attempts: number
  pass_score: number
  exam_questions?: ExamQuestion[]
  created_at: string
}

interface Lecture {
  id: string
  title: string
  description: string
}

interface Package {
  id: string
  name: string
  description: string
}

interface UserProgress {
  id: string
  user_id: string
  lecture_content_id: string
  package_id: string
  status: 'not_started' | 'in_progress' | 'completed' | 'passed' | 'failed'
  score?: number
  last_accessed_at: string
  completed_at?: string
}

interface UserPackage {
  id: string
  expires_at: string
}

interface User {
  id: string
  email?: string
}

// ==================== Supabase Singleton ====================
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

const getSupabase = () => {
  if (typeof window === 'undefined') return null
  
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseInstance
}

// ==================== Loading Component ====================
function LoadingState() {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingLogo}>
          <motion.div 
            className={styles.loadingRing}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
          <BookOpen className={styles.loadingIcon} size={28} />
        </div>
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          جاري تحميل المحتوى
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          يرجى الانتظار...
        </motion.p>
      </div>
    </div>
  )
}

// ==================== Error Component ====================
function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className={styles.errorScreen}>
      <motion.div 
        className={styles.errorCard}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className={styles.errorIconWrapper}>
          <AlertCircle size={48} />
        </div>
        <h2>حدث خطأ</h2>
        <p>{message}</p>
        <button onClick={onBack} className={styles.primaryBtn}>
          <ArrowRight size={18} />
          العودة للباقة
        </button>
      </motion.div>
    </div>
  )
}

// ==================== Video Player ====================
interface VideoPlayerProps {
  videoUrl: string
  onProgress: (progress: number) => void
}

function VideoPlayer({ videoUrl, onProgress }: VideoPlayerProps) {
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
  
  const youtubeId = useMemo(() => {
    if (!isYouTube) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/|live\/)([^#&?]*).*/
    const match = videoUrl.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }, [videoUrl, isYouTube])

  useEffect(() => {
    if (!isYouTube || !youtubeId) return
    
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

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer()
    } else {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
      ;(window as any).onYouTubeIframeAPIReady = initPlayer
    }

    return () => { 
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.destroy()
      }
    }
  }, [isYouTube, youtubeId, onProgress])

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

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (isYouTube && youtubePlayerRef.current && isYouTubeReady) {
      youtubePlayerRef.current.seekTo(time, true)
    } else if (videoRef.current) {
      videoRef.current.currentTime = time
    }
    setCurrentTime(time)
  }, [isYouTube, isYouTubeReady])

  const changeSpeed = useCallback((speed: number) => {
    if (isYouTube && youtubePlayerRef.current && isYouTubeReady) {
      youtubePlayerRef.current.setPlaybackRate(speed)
    } else if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
    setPlaybackRate(speed)
    setShowSettings(false)
  }, [isYouTube, isYouTubeReady])

  const toggleMute = useCallback(() => {
    if (isYouTube && youtubePlayerRef.current && isYouTubeReady) {
      isMuted ? youtubePlayerRef.current.unMute() : youtubePlayerRef.current.mute()
    } else if (videoRef.current) {
      videoRef.current.muted = !isMuted
    }
    setIsMuted(!isMuted)
  }, [isMuted, isYouTube, isYouTubeReady])

  const handleVolumeChange = useCallback((v: number) => {
    setVolume(v)
    if (isYouTube && youtubePlayerRef.current && isYouTubeReady) {
      youtubePlayerRef.current.setVolume(v * 100)
    } else if (videoRef.current) {
      videoRef.current.volume = v
    }
    if (v === 0) setIsMuted(true)
    else if (isMuted) setIsMuted(false)
  }, [isYouTube, isYouTubeReady, isMuted])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error)
    } else {
      document.exitFullscreen()
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000)
    }
  }, [isPlaying])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

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
              const target = e.currentTarget
              setCurrentTime(target.currentTime)
              setDuration(target.duration || 0)
              if (target.duration > 0) {
                onProgress((target.currentTime / target.duration) * 100)
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
            <div className={styles.spinner} />
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
            <Play size={32} fill="currentColor" />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.div 
        className={styles.controlsBar}
        initial={false}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
        transition={{ duration: 0.2 }}
      >
        <div className={styles.progressContainer}>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className={styles.progressInput}
            style={{ 
              background: `linear-gradient(to right, #6366f1 ${progress}%, rgba(255,255,255,0.3) ${progress}%)` 
            }}
          />
          <div className={styles.timeDisplay}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className={styles.controlsRow}>
          <div className={styles.leftControls}>
            <button className={`${styles.controlBtn} ${styles.playPauseBtn}`} onClick={togglePlay}>
              {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
            </button>
            
            <button className={styles.controlBtn} onClick={() => skip(-10)}>
              <RotateCcw size={18} />
            </button>
            <button className={styles.controlBtn} onClick={() => skip(10)}>
              <RefreshCw size={18} />
            </button>

            <div 
              className={styles.volumeControl}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button className={styles.controlBtn} onClick={toggleMute}>
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <AnimatePresence>
                {showVolumeSlider && (
                  <motion.div 
                    className={styles.volumeSlider}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 70, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                  >
                    <input 
                      type="range" 
                      min={0} 
                      max={1} 
                      step={0.1} 
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      style={{ 
                        background: `linear-gradient(to right, white ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) ${(isMuted ? 0 : volume) * 100}%)` 
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className={styles.rightControls}>
            <div 
              className={styles.speedBadge} 
              onClick={() => setShowSettings(!showSettings)}
            >
              {playbackRate}x
            </div>
            
            <button className={styles.controlBtn} onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize size={18} />}
            </button>
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
                  {playbackRate === speed && <CheckCheck size={14} />}
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

// ==================== PDF Viewer ====================
interface PDFViewerProps {
  pdfUrl: string
  contentId: string
  userId: string
  packageId: string
  onComplete: () => void
}

function PDFViewer({ pdfUrl, contentId, userId, packageId, onComplete }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [completed, setCompleted] = useState(false)

  const isGoogleDrive = pdfUrl?.includes('drive.google.com') || pdfUrl?.includes('docs.google.com')
  
  const driveId = useMemo(() => {
    if (!isGoogleDrive) return null
    const match = pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || pdfUrl.match(/id=([a-zA-Z0-9_-]+)/)
    return match ? match[1] : null
  }, [pdfUrl, isGoogleDrive])
  
  const viewerUrl = useMemo(() => {
    if (!pdfUrl) return ''
    if (isGoogleDrive && driveId) return `https://drive.google.com/file/d/${driveId}/preview`
    if (pdfUrl.includes('dropbox.com')) {
      return pdfUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '?dl=1')
    }
    if (!pdfUrl.endsWith('.pdf')) return pdfUrl
    return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(pdfUrl)}`
  }, [pdfUrl, isGoogleDrive, driveId])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
      if (!completed) {
        setCompleted(true)
        onComplete()
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [completed, onComplete])

  const handleDownload = useCallback(() => {
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
  }, [pdfUrl, isGoogleDrive, driveId, contentId])

  const handleOpenOriginal = useCallback(() => {
    window.open(pdfUrl, '_blank')
  }, [pdfUrl])

  return (
    <div className={styles.pdfContainer}>
      <div className={styles.pdfToolbar}>
        <div className={styles.pdfInfo}>
          <div className={styles.pdfIcon}>
            <FileText size={20} />
          </div>
          <div>
            <h4>ملف PDF</h4>
            <span>{isGoogleDrive ? 'Google Drive' : 'PDF Document'}</span>
          </div>
        </div>
        <div className={styles.pdfActions}>
          <button onClick={handleOpenOriginal} className={styles.pdfActionBtn} title="فتح في نافذة جديدة">
            <ExternalLink size={18} />
          </button>
          <button onClick={handleDownload} className={`${styles.pdfActionBtn} ${styles.downloadBtn}`} title="تحميل">
            <Download size={18} />
          </button>
        </div>
      </div>

      <div className={styles.pdfViewerWrapper}>
        {isLoading ? (
          <div className={styles.pdfLoading}>
            <Loader2 size={40} className={styles.spinAnimation} />
            <p>جاري تحميل الملف...</p>
          </div>
        ) : (
          <iframe 
            src={viewerUrl} 
            className={styles.pdfFrame} 
            title="PDF Viewer" 
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        )}
      </div>

      <div className={styles.pdfFooter}>
        <span className={styles.pdfStatus}>
          {completed ? '✓ تم حفظ التقدم' : 'جاري القراءة...'}
        </span>
        <div className={styles.pdfProgress}>
          <div 
            className={styles.pdfProgressFill}
            style={{ width: completed ? '100%' : '0%' }}
          />
        </div>
      </div>
    </div>
  )
}

// ==================== Exam Viewer ====================
interface ExamViewerProps {
  examContent: LectureContent
  contentId: string
  packageId: string
  userId: string
  onComplete: () => void
}

function ExamViewer({ examContent, contentId, packageId, userId, onComplete }: ExamViewerProps) {
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
  const [results, setResults] = useState<{correct: number; wrong: number; unanswered: number} | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    try {
      const examQuestions = examContent?.exam_questions
      
      if (examQuestions && Array.isArray(examQuestions) && examQuestions.length > 0) {
        const formattedQuestions: Question[] = examQuestions.map((q, index) => ({
          id: index + 1,
          text: q.question,
          options: q.options.map((opt, optIndex) => ({
            id: String.fromCharCode(65 + optIndex),
            text: opt
          })),
          correctAnswer: String.fromCharCode(65 + q.correct),
          marks: q.marks || 1
        }))
        
        setQuestions(formattedQuestions)
        const total = formattedQuestions.reduce((sum, q) => sum + q.marks, 0)
        setTotalMarks(total)
        setTimeLeft((examContent?.duration_minutes || 10) * 60)
        setLoading(false)
        return
      }
      
      setError('لا توجد أسئلة متاحة لهذا الامتحان')
      setLoading(false)
    } catch (err) {
      console.error('Exam fetch error:', err)
      setError('حدث خطأ في تحميل الامتحان')
      setLoading(false)
    }
  }, [examContent])

  useEffect(() => {
    if (showResults || loading || error) return
    const timer = setInterval(() => {
      setTimeLeft(prev => { 
        if (prev <= 1) { 
          clearInterval(timer)
          handleSubmit()
          return 0 
        } 
        return prev - 1 
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [showResults, loading, error])

  const handleAnswer = useCallback((questionId: number, answerId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setShowConfirm(false)
    
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
        obtained += q.marks
      } else {
        wrongCount++
      }
    })
    
    const finalScore = totalMarks > 0 ? Math.round((obtained / totalMarks) * 100) : 0
    
    setScore(finalScore)
    setObtainedMarks(obtained)
    setResults({ correct: correctCount, wrong: wrongCount, unanswered: unansweredCount })
    setShowResults(true)
    setIsSubmitting(false)
    
    if (finalScore >= (examContent?.pass_score || 50)) {
      onComplete()
    }

    try {
      const supabase = getSupabase()
      if (supabase) {
        await supabase.from('exam_results').insert({
          user_id: userId, 
          content_id: contentId, 
          score: finalScore,
          total_questions: questions.length, 
          correct_answers: correctCount, 
          wrong_answers: wrongCount
        })
      }
    } catch (err) { 
      console.error('Error saving exam results:', err) 
    }
  }, [isSubmitting, questions, answers, totalMarks, examContent?.pass_score, onComplete, userId, contentId])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const handleRetry = useCallback(() => {
    setShowResults(false)
    setAnswers({})
    setCurrentQuestion(0)
    setTimeLeft((examContent?.duration_minutes || 10) * 60)
  }, [examContent?.duration_minutes])

  if (loading) {
    return (
      <div className={styles.examLoading}>
        <Loader2 size={48} className={styles.spinAnimation} />
        <p>جاري تحميل الامتحان...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.examError}>
        <AlertTriangle size={48} />
        <h3>خطأ في تحميل الامتحان</h3>
        <p>{error}</p>
        <button onClick={() => router.back()} className={styles.primaryBtn}>
          العودة
        </button>
      </div>
    )
  }

  if (showResults) {
    const passed = score >= (examContent?.pass_score || 50)
    
    return (
      <div className={styles.examContainer}>
        <div className={styles.resultsContainer}>
          <motion.div 
            className={styles.resultCard}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className={`${styles.resultIconWrapper} ${passed ? styles.resultPassed : styles.resultFailed}`}>
              {passed ? <Trophy size={56} /> : <AlertCircle size={56} />}
            </div>
            
            <h2 className={`${styles.resultTitle} ${passed ? styles.resultTitlePassed : styles.resultTitleFailed}`}>
              {passed ? 'مبروك! لقد نجحت' : 'للأسف، لم تنجح'}
            </h2>
            
            <div className={styles.scoreDisplay}>
              <div 
                className={styles.scoreCircle}
                style={{ 
                  background: `conic-gradient(${passed ? '#059669' : '#dc2626'} ${score}%, #e5e7eb ${score}%)` 
                }}
              >
                <span className={styles.scoreValue}>{score}%</span>
              </div>
              <div className={styles.marksDisplay}>
                <span className={styles.obtainedMarks}>{obtainedMarks}</span>
                <span className={styles.totalMarks}>/ {totalMarks}</span>
                <span className={styles.marksLabel}>درجة</span>
              </div>
            </div>
            
            <p className={styles.passScoreNote}>
              درجة النجاح المطلوبة: {examContent?.pass_score || 50}%
            </p>
            
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <CheckCircle size={24} color="#059669" />
                <span className={styles.statValue} style={{ color: '#059669' }}>{results?.correct ?? 0}</span>
                <span className={styles.statLabel}>صحيحة</span>
              </div>
              <div className={styles.statCard}>
                <XCircle size={24} color="#dc2626" />
                <span className={styles.statValue} style={{ color: '#dc2626' }}>{results?.wrong ?? 0}</span>
                <span className={styles.statLabel}>خاطئة</span>
              </div>
              <div className={styles.statCard}>
                <HelpCircle size={24} color="#d97706" />
                <span className={styles.statValue} style={{ color: '#d97706' }}>{results?.unanswered ?? 0}</span>
                <span className={styles.statLabel}>بدون إجابة</span>
              </div>
            </div>
            
            <div className={styles.resultActions}>
              <button onClick={() => router.back()} className={styles.primaryBtn}>
                العودة للباقة
              </button>
              {!passed && (
                <button onClick={handleRetry} className={styles.secondaryBtn}>
                  <RefreshCw size={18} />
                  إعادة المحاولة
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const isLastQuestion = currentQuestion === questions.length - 1
  const progress = ((currentQuestion + 1) / questions.length) * 100
  const answeredCount = Object.keys(answers).length

  const getTimerClass = () => {
    if (timeLeft < 60) return styles.timerDanger
    if (timeLeft < 300) return styles.timerWarning
    return styles.timerNormal
  }

  return (
    <div className={styles.examContainer}>
      <div className={styles.examHeader}>
        <div className={styles.examHeaderInfo}>
          <div className={styles.examIcon}>
            <Target size={24} />
          </div>
          <div>
            <h3>{examContent?.title || 'امتحان'}</h3>
            <p>{questions.length} سؤال | {totalMarks} درجة</p>
          </div>
        </div>
        <div className={`${styles.timer} ${getTimerClass()}`}>
          <Timer size={20} />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className={styles.examProgress}>
        <div className={styles.answeredBadge}>
          <CheckCircle size={14} />
          <span>{answeredCount} / {questions.length}</span>
        </div>
        <div className={styles.progressBar}>
          <motion.div 
            className={styles.progressFill}
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
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -30, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className={styles.questionHeader}>
            <div className={styles.questionMeta}>
              <span className={styles.questionNumber}>سؤال {currentQuestion + 1}</span>
              <span className={styles.marksBadge}>({currentQ.marks} درجة)</span>
            </div>
            <span className={styles.questionCounter}>{currentQuestion + 1} / {questions.length}</span>
          </div>
          
          <h4 className={styles.questionText}>{currentQ.text}</h4>
          
          <div className={styles.optionsGrid}>
            {currentQ.options.map((option, idx) => (
              <motion.button 
                key={option.id}
                className={`${styles.optionCard} ${answers[currentQ.id] === option.id ? styles.optionSelected : ''}`}
                onClick={() => handleAnswer(currentQ.id, option.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <span className={styles.optionLetter}>{option.id}</span>
                <span className={styles.optionText}>{option.text}</span>
                {answers[currentQ.id] === option.id && (
                  <CheckCircle size={20} className={styles.optionCheck} />
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
          <ChevronLeft size={18} style={{ transform: 'rotate(180deg)' }} />
          السابق
        </button>
        
        <div className={styles.dotsContainer}>
          {questions.map((_, idx) => (
            <button 
              key={idx}
              className={`${styles.questionDot} ${idx === currentQuestion ? styles.dotActive : ''} ${answers[questions[idx].id] ? styles.dotAnswered : ''}`}
              onClick={() => setCurrentQuestion(idx)}
            />
          ))}
        </div>
        
        {isLastQuestion ? (
          <button 
            onClick={() => setShowConfirm(true)}
            disabled={answeredCount === 0}
            className={`${styles.navBtn} ${styles.submitBtn}`}
          >
            تسليم الامتحان
          </button>
        ) : (
          <button 
            onClick={() => setCurrentQuestion(prev => prev + 1)}
            className={`${styles.navBtn} ${styles.navBtnPrimary}`}
          >
            التالي
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirm(false)}
          >
            <motion.div 
              className={styles.modal}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalIcon}>
                <AlertTriangle size={40} color="#d97706" />
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

              <p className={styles.warningText}>لا يمكن التراجع عن هذا الإجراء</p>
              
              <div className={styles.modalActions}>
                <button onClick={() => setShowConfirm(false)} className={styles.secondaryBtn}>
                  متابعة الإجابة
                </button>
                <button 
                  onClick={handleSubmit} 
                  className={styles.primaryBtn}
                  disabled={isSubmitting}
                  style={{ background: '#059669' }}
                >
                  {isSubmitting ? <Loader2 className={styles.spinAnimation} size={18} /> : 'تأكيد التسليم'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ==================== Main Content Viewer ====================
function ContentViewer() {
  const router = useRouter()
  const params = useParams()
  
  const gradeSlug = params?.grade as string
  const packageId = params?.packageId as string
  const contentId = params?.contentId as string

  const [content, setContent] = useState<LectureContent | null>(null)
  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [packageData, setPackageData] = useState<Package | null>(null)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [userPackage, setUserPackage] = useState<UserPackage | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoProgress, setVideoProgress] = useState(0)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  
  const supabase = useMemo(() => getSupabase(), [])

  useEffect(() => {
    if (!supabase || !gradeSlug || !packageId || !contentId) return

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
        
        const { data: userPackageData } = await supabase
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
          
          setUserProgress({ ...progressRes.data, last_accessed_at: now })
        }
        
        setLoading(false)
        
      } catch (err) {
        console.error('Error:', err)
        setError('حدث خطأ في تحميل البيانات')
        setLoading(false)
      }
    }
    
    initializePage()
  }, [gradeSlug, packageId, contentId, supabase, router])

  const handleVideoProgress = useCallback((progress: number) => {
    setVideoProgress(Math.round(progress))
    if (progress >= 80 && content?.type === 'video') {
      markAsCompleted()
    }
  }, [content])

  const markAsCompleted = useCallback(async () => {
    if (!userProgress || !content || !currentUser || !supabase) return
    if (userProgress.status === 'completed' || userProgress.status === 'passed') return

    const status = content.type === 'exam' ? 'passed' : 'completed'
    const now = new Date().toISOString()
    
    try {
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
  }, [userProgress, content, currentUser, supabase])

  const handleBack = useCallback(() => {
    router.push(`/grades/${gradeSlug}/packages/${packageId}`)
  }, [router, gradeSlug, packageId])

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
      case 'video': return <Video size={16} />
      case 'pdf': return <FileText size={16} />
      case 'exam': return <Target size={16} />
      case 'text': return <BookOpen size={16} />
      default: return <FileText size={16} />
    }
  }, [content])

  const getStatusColor = useCallback(() => {
    switch (userProgress?.status) {
      case 'completed':
      case 'passed':
        return '#059669'
      case 'in_progress':
        return '#d97706'
      default:
        return '#94a3b8'
    }
  }, [userProgress])

  const getStatusLabel = useCallback(() => {
    switch (userProgress?.status) {
      case 'completed': return 'مكتمل'
      case 'passed': return 'ناجح'
      case 'in_progress': return 'قيد التقدم'
      default: return 'جديد'
    }
  }, [userProgress])

  const renderContent = useCallback(() => {
    if (!content || !currentUser) return null
    
    switch (content.type) {
      case 'video': 
        return (
          <VideoPlayer 
            videoUrl={content.content_url || ''} 
            onProgress={handleVideoProgress}
          />
        )
      case 'pdf': 
        return (
          <PDFViewer 
            pdfUrl={content.content_url || ''} 
            contentId={contentId}
            userId={currentUser.id}
            packageId={packageId}
            onComplete={markAsCompleted}
          />
        )
      case 'exam': 
        return (
          <ExamViewer 
            examContent={content}
            contentId={contentId}
            packageId={packageId}
            userId={currentUser.id}
            onComplete={markAsCompleted}
          />
        )
      case 'text': 
        return (
          <div className={styles.textContainer}>
            <div className={styles.textHeader}>
              <FileText size={28} color="#4f46e5" />
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
          <div className={styles.unsupportedContainer}>
            <div className={styles.unsupportedIcon}>
              <AlertCircle size={40} color="#d97706" />
            </div>
            <h3>نوع المحتوى غير مدعوم</h3>
            <p>عذرًا، نوع المحتوى هذا غير متاح حاليًا</p>
          </div>
        )
    }
  }, [content, currentUser, contentId, packageId, handleVideoProgress, markAsCompleted])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onBack={handleBack} />
  if (!content) return null

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div className={styles.headerContent}>
            <div className={styles.headerRight}>
              <button onClick={handleBack} className={styles.backButton}>
                <ArrowRight size={20} />
              </button>
              
              <div className={styles.headerTitle}>
                <h1>{content.title}</h1>
                <p>{lecture?.title}</p>
              </div>
            </div>

            <div className={styles.typeBadge}>
              {getContentTypeIcon()}
              <span>{getContentTypeLabel()}</span>
            </div>

            <button 
              className={styles.menuButton}
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentGrid}>
          {/* Primary Column */}
          <div className={styles.primaryColumn}>
            {/* Content Info */}
            <motion.div 
              className={styles.contentInfoCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2>{content.title}</h2>
              <div className={styles.contentMeta}>
                <span className={styles.metaItem}>
                  <BookOpen size={16} />
                  {lecture?.title}
                </span>
                <span className={styles.metaItem}>
                  <Calendar size={16} />
                  {new Date(content.created_at).toLocaleDateString('ar-EG')}
                </span>
                {content.duration_minutes > 0 && (
                  <span className={styles.metaItem}>
                    <Clock size={16} />
                    {content.duration_minutes} دقيقة
                  </span>
                )}
              </div>
            </motion.div>

            {/* Content Viewer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {renderContent()}
            </motion.div>

            {/* Video Progress Card */}
            {content.type === 'video' && (
              <motion.div 
                className={styles.progressCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className={styles.progressHeader}>
                  <div>
                    <h4>تقدم المشاهدة</h4>
                    <p>أكمل 80% للحصول على علامة اجتياز</p>
                  </div>
                  <span className={styles.progressPercent}>{videoProgress}%</span>
                </div>
                <div className={styles.progressBarLarge}>
                  <motion.div 
                    className={styles.progressBarFillAnimated}
                    initial={{ width: 0 }}
                    animate={{ width: `${videoProgress}%` }}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <aside className={`${styles.sidebar} ${showMobileSidebar ? styles.sidebarOpen : ''}`}>
            {/* Status Card */}
            <div className={styles.statusCard}>
              <h4>حالة التقدم</h4>
              <div className={styles.statusDisplay}>
                <div 
                  className={styles.statusIconWrapper}
                  style={{ background: `${getStatusColor()}15` }}
                >
                  {userProgress?.status === 'completed' || userProgress?.status === 'passed' ? (
                    <CheckCheck size={24} color={getStatusColor()} />
                  ) : userProgress?.status === 'in_progress' ? (
                    <Loader2 size={24} color={getStatusColor()} className={styles.spinAnimation} />
                  ) : (
                    <Circle size={24} color={getStatusColor()} />
                  )}
                </div>
                <div className={styles.statusInfo}>
                  <div className={styles.statusLabel}>{getStatusLabel()}</div>
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
                      : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    color: userProgress?.status === 'completed' || userProgress?.status === 'passed' 
                      ? '#6b7280' 
                      : 'white'
                  }}
                >
                  {userProgress?.status === 'completed' || userProgress?.status === 'passed' ? (
                    <><CheckCheck size={18} /> تم الإكمال</>
                  ) : (
                    <><CheckCircle size={18} /> تحديد كمكتمل</>
                  )}
                </button>
              )}
            </div>

            {/* Lecture Card */}
            <div className={styles.lectureCard}>
              <div className={styles.lectureCardContent}>
                <div className={styles.lectureIcon}>
                  <BookOpen size={20} />
                </div>
                <div className={styles.lectureInfo}>
                  <h4>{lecture?.title}</h4>
                  <p>المحاضرة الحالية</p>
                </div>
              </div>
            </div>

            {/* Package Card */}
            <div className={styles.packageCard}>
              <Award size={28} />
              <h4>{packageData?.name}</h4>
              <p>صالح حتى: {new Date(userPackage?.expires_at || Date.now()).toLocaleDateString('ar-EG')}</p>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Overlay */}
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

// ==================== Export ====================
export default function ContentPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ContentViewer />
    </Suspense>
  )
}