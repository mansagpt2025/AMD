'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import {
  Video, FileText, BookOpen, Clock, CheckCircle,
  X, ArrowRight, AlertCircle, Loader2, Download,
  Target, Lock, Eye, Home, ChevronRight, Shield, 
  Award, Zap, Play, Pause, Volume2, Maximize,
  ExternalLink, Trophy, ArrowLeft, RefreshCw, XCircle
} from 'lucide-react'

// ==========================================
// STYLES (نفس الكود السابق)
// ==========================================
const styles: Record<string, React.CSSProperties> = {
  pageContainer: { minHeight: '100vh', background: '#f8fafc' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' },
  loadingSpinner: { animation: 'spin 1s linear infinite', width: 40, height: 40, color: '#3b82f6' },
  loadingText: { color: '#64748b', fontSize: '1.125rem' },
  errorContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' },
  errorContent: { background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: 'center', maxWidth: 400 },
  errorIcon: { width: 48, height: 48, color: '#ef4444', margin: '0 auto 1rem' },
  errorTitle: { fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' },
  errorMessage: { color: '#64748b', marginBottom: '1.5rem' },
  backBtn: { background: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 600 },
  header: { background: 'white', borderBottom: '1px solid #e2e8f0', padding: '1.5rem 2rem' },
  headerContent: { maxWidth: '1400px', margin: '0 auto' },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem', flexWrap: 'wrap' },
  breadcrumbItem: { display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' },
  breadcrumbSeparator: { color: '#cbd5e1' },
  currentPage: { color: '#1e293b', fontWeight: 600 },
  contentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' },
  contentInfo: { flex: 1 },
  contentTitle: { fontSize: '1.875rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' },
  contentMeta: { display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.875rem', flexWrap: 'wrap' },
  contentType: { background: '#dbeafe', color: '#1e40af', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontWeight: 500 },
  contentSeparator: { color: '#cbd5e1' },
  headerActions: { display: 'flex', gap: '0.75rem' },
  backActionBtn: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid', background: 'white', cursor: 'pointer', fontWeight: 500 },
  mainContent: { maxWidth: '1400px', margin: '0 auto', padding: '2rem' },
  contentLayout: { display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' },
  leftColumn: { minWidth: 0 },
  rightColumn: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0' },
  tabButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: '2px solid transparent', marginBottom: '-2px', cursor: 'pointer', fontWeight: 500, color: '#64748b' },
  activeTab: { color: '#3b82f6', borderBottomColor: '#3b82f6' },
  contentArea: { background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' },
  infoContainer: { padding: '1rem' },
  infoContent: { maxWidth: '800px' },
  infoTitle: { fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1e293b' },
  infoGrid: { display: 'grid', gap: '1.5rem' },
  infoSection: { marginBottom: '1.5rem' },
  infoSectionTitle: { fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  infoDescription: { color: '#334155', lineHeight: 1.6 },
  infoDetails: { display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' },
  detailItem: { background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem' },
  detailLabel: { fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' },
  detailValue: { fontWeight: 600, color: '#1e293b' },
  detailBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' },
  progressTracking: { marginTop: '1.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '0.75rem' },
  progressHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' },
  progressTitle: { fontWeight: 600, color: '#1e293b' },
  progressPercentage: { fontWeight: 700, color: '#3b82f6' },
  progressBar: { height: '8px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.5rem' },
  progressFill: { height: '100%', background: '#3b82f6', borderRadius: '9999px', transition: 'width 0.3s ease' },
  progressLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' },
  statusCard: { background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' },
  cardTitle: { fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  statusContent: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1rem' },
  statusCompleted: { background: '#d1fae5', color: '#065f46' },
  statusFailed: { background: '#fee2e2', color: '#991b1b' },
  statusInProgress: { background: '#dbeafe', color: '#1e40af' },
  statusNotStarted: { background: '#f3f4f6', color: '#4b5563' },
  statusInfo: { flex: 1 },
  statusText: { fontWeight: 700 },
  statusDate: { fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 },
  completeButton: { width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#10b981' },
  completeButtonDisabled: { background: '#9ca3af', cursor: 'not-allowed' },
  actionsCard: { background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' },
  actionsList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  actionItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', textDecoration: 'none', color: 'inherit', transition: 'background 0.2s' },
  actionText: { fontWeight: 500 },
  packageCard: { background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' },
  packageInfo: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  packageItem: { display: 'flex', alignItems: 'center', gap: '1rem' },
  packageIcon: { width: 40, height: 40, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
  packageDetails: { flex: 1 },
  packageName: { fontWeight: 600, color: '#1e293b' },
  packageType: { fontSize: '0.875rem', color: '#64748b' },
  packageStatus: { fontSize: '0.875rem', color: '#059669' },
  tipsCard: { background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #f59e0b' },
  tipsHeader: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' },
  tipsIcon: { width: 20, height: 20 },
  tipsTitle: { fontWeight: 700, color: '#92400e' },
  tipsList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  tipItem: { fontSize: '0.875rem', color: '#78350f', paddingRight: '1.25rem', position: 'relative' },
  spinning: { animation: 'spin 1s linear infinite' },
  textContent: { padding: '2rem', lineHeight: 1.8, color: '#334155' },
  textContentInner: { maxWidth: '800px', margin: '0 auto' },
  unsupportedContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: '#64748b' },
  unsupportedIcon: { width: 48, height: 48, marginBottom: '1rem', color: '#cbd5e1' },
  unsupportedText: { fontSize: '1.125rem' },
  
  // Video Player
  videoPlayerContainer: { position: 'relative', background: '#000', borderRadius: '0.75rem', overflow: 'hidden', aspectRatio: '16/9' },
  videoElement: { width: '100%', height: '100%', objectFit: 'contain' },
  loadingOverlayVideo: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', color: 'white', zIndex: 10 },
  controlsOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', padding: '1rem', transition: 'opacity 0.3s' },
  progressSection: { marginBottom: '0.75rem' },
  progressBarVideo: { width: '100%', height: '6px', cursor: 'pointer', accentColor: '#3b82f6' },
  timeDisplay: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'white', marginTop: '0.25rem' },
  controlsBar: { display: 'flex', alignItems: 'center', gap: '1rem' },
  controlButton: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', transition: 'background 0.2s' },
  volumeControl: { display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' },
  volumeSlider: { width: 80, accentColor: 'white' },
  protectionIndicator: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(0,0,0,0.5)', padding: '0.25rem 0.75rem', borderRadius: '9999px' },
  protectionBadge: { position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.7)', color: '#fbbf24', padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 5 },
  youtubeContainer: { width: '100%', height: '100%', position: 'relative' },
  youtubeIframe: { position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' },
  errorContainerVideo: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: 'white', textAlign: 'center' },
  videoErrorHint: { fontSize: '0.875rem', marginTop: '0.5rem', opacity: 0.8 },
  
  // PDF Viewer
  pdfViewerContainer: { background: 'white', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e2e8f0' },
  pdfHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '1rem' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '1rem' },
  iconContainer: { width: 40, height: 40, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: 700, color: '#1e293b' },
  subtitle: { fontSize: '0.875rem', color: '#64748b' },
  headerActionsPdf: { display: 'flex', gap: '0.5rem' },
  openButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid', background: 'white', cursor: 'pointer', fontSize: '0.875rem' },
  downloadButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.875rem' },
  viewerContainer: { position: 'relative', height: '600px', background: '#f8fafc' },
  iframeContainer: { position: 'relative', width: '100%', height: '100%' },
  pdfFrame: { width: '100%', height: '100%', border: 'none' },
  protectionOverlay: { position: 'absolute', inset: 0, zIndex: 10, cursor: 'default' },
  pdfFooter: { padding: '1rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' },
  progressBarContainer: { height: '4px', background: '#e2e8f0', borderRadius: '9999px', marginBottom: '0.5rem', overflow: 'hidden' },
  progressBarFill: { height: '100%', transition: 'width 0.3s' },
  progressText: { fontSize: '0.875rem', color: '#059669', fontWeight: 500 },
  driveNotice: { fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' },
  watermark: { textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem' },
  
  // Exam Viewer
  examContainer: { background: 'white', borderRadius: '0.75rem', padding: '2rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' },
  examHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #e2e8f0' },
  examInfo: { display: 'flex', alignItems: 'center', gap: '1rem' },
  timer: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 700, fontFamily: 'monospace' },
  questionCard: { background: '#f8fafc', padding: '2rem', borderRadius: '1rem', marginBottom: '2rem' },
  questionHeader: { marginBottom: '1rem' },
  questionNumber: { background: '#3b82f6', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600 },
  questionText: { fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', marginTop: '1rem', lineHeight: 1.6 },
  options: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  option: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'white', border: '2px solid #e2e8f0', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'right' },
  selected: { borderColor: '#3b82f6', background: '#eff6ff' },
  optionLabel: { width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', borderRadius: '50%', fontWeight: 700, color: '#475569', flexShrink: 0 },
  optionText: { flex: 1, fontWeight: 500, color: '#334155' },
  radio: { width: 24, height: 24, border: '2px solid #cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  radioInner: { width: 12, height: 12, background: '#3b82f6', borderRadius: '50%' },
  navigation: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, color: '#475569' },
  progressDots: { display: 'flex', gap: '0.5rem' },
  dot: { width: 8, height: 8, borderRadius: '50%', background: '#e2e8f0', transition: 'all 0.2s' },
  active: { background: '#3b82f6', transform: 'scale(1.2)' },
  answered: { background: '#10b981' },
  submitButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 2rem', borderRadius: '0.5rem', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer' },
  resultsContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' },
  resultCard: { textAlign: 'center', padding: '3rem', borderRadius: '1rem', maxWidth: '500px', width: '100%' },
  passed: { background: '#d1fae5', border: '2px solid #059669' },
  failed: { background: '#fee2e2', border: '2px solid #dc2626' },
  resultIcon: { marginBottom: '1.5rem' },
  scoreText: { fontSize: '3rem', fontWeight: 800, margin: '1rem 0', color: '#1e293b' },
  passScoreText: { color: '#64748b', marginBottom: '1.5rem' },
  stats: { display: 'flex', justifyContent: 'center', gap: '2rem', margin: '2rem 0' },
  stat: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 },
  resultButtons: { display: 'flex', gap: '1rem', justifyContent: 'center' },
  retryButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '2px solid #3b82f6', background: 'white', color: '#3b82f6', fontWeight: 700, cursor: 'pointer' },
  backButtonExam: { padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer' }
}

// ==========================================
// SUPABASE CLIENT
// ==========================================
let supabaseInstance: SupabaseClient | null = null

const getSupabaseClient = (): SupabaseClient | null => {
  if (typeof window === 'undefined') return null
  
  if (supabaseInstance) return supabaseInstance
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    return null
  }
  
  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sb-auth-token',
      storage: window.localStorage
    }
  })
  
  return supabaseInstance
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
// VIDEO PLAYER
// ==========================================
function ProtectedVideoPlayer({ 
  videoUrl, contentId, userId, packageId, onProgress, theme 
}: { 
  videoUrl: string; contentId: string; userId: string; packageId: string
  onProgress: (progress: number) => void; theme: Theme
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(true)
  const lastSavedTimeRef = useRef(0)

  const isYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be')
  
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const youtubeId = isYouTube ? getYouTubeId(videoUrl) : null

  const saveProgress = useCallback(async (currentTimeValue: number, totalDuration: number) => {
    if (!userId || !contentId) return
    try {
      const supabase = getSupabaseClient()
      if (!supabase) return
      const progress = totalDuration > 0 ? (currentTimeValue / totalDuration) * 100 : 0
      if (Math.abs(currentTimeValue - lastSavedTimeRef.current) < 10 && progress < 95) return
      
      await supabase.from('user_progress').upsert({
        user_id: userId,
        lecture_content_id: contentId,
        package_id: packageId,
        status: progress >= 90 ? 'completed' : 'in_progress',
        score: Math.round(progress),
        last_accessed_at: new Date().toISOString(),
        ...(progress >= 90 && { completed_at: new Date().toISOString() })
      }, { onConflict: 'user_id,lecture_content_id' })

      lastSavedTimeRef.current = currentTimeValue
      onProgress(Math.round(progress))
    } catch (err) {
      console.error('Error saving progress:', err)
    }
  }, [userId, contentId, packageId, onProgress])

  useEffect(() => {
    if (isYouTube || !videoRef.current) return
    const video = videoRef.current
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      if (Math.floor(video.currentTime) % 10 === 0) saveProgress(video.currentTime, video.duration)
    }
    const handleLoadedMetadata = () => { setDuration(video.duration); setIsLoading(false) }
    const handleEnded = () => { setIsPlaying(false); saveProgress(video.duration, video.duration); onProgress(100) }
    const handleError = () => { setError('حدث خطأ في تحميل الفيديو'); setIsLoading(false) }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)
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
    if (isPlaying) videoRef.current.pause()
    else videoRef.current.play()
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

  if (isYouTube && youtubeId) {
    return (
      <div ref={containerRef} style={styles.videoPlayerContainer}>
        <div style={styles.youtubeContainer}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&showinfo=0&controls=1&disablekb=1&fs=1`}
            title="YouTube video player"
            style={styles.youtubeIframe}
            allowFullScreen
          />
        </div>
        <div style={styles.protectionBadge}>
          <Lock size={16} />
          <span>محمي ضد النسخ</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{...styles.videoPlayerContainer, ...styles.errorContainerVideo}}>
        <AlertCircle size={48} color="#ef4444" />
        <p>{error}</p>
        <p style={styles.videoErrorHint}>تأكد من أن رابط الفيديو صحيح</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      style={styles.videoPlayerContainer}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setTimeout(() => setShowControls(false), 3000)}
    >
      {isLoading && (
        <div style={styles.loadingOverlayVideo}>
          <Loader2 style={{...styles.loadingSpinner, color: theme.primary}} />
          <p>جاري تحميل الفيديو...</p>
        </div>
      )}
      <video
        ref={videoRef}
        src={videoUrl}
        style={styles.videoElement}
        controls={false}
        onClick={togglePlay}
        preload="metadata"
        playsInline
      />
      {showControls && !isLoading && (
        <div style={styles.controlsOverlay}>
          <div style={styles.progressSection}>
            <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} style={styles.progressBarVideo} />
            <div style={{...styles.timeDisplay, direction: 'ltr'}}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          <div style={styles.controlsBar}>
            <button onClick={togglePlay} style={styles.controlButton}>
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <div style={styles.volumeControl}>
              <Volume2 size={20} />
              <input type="range" min="0" max="1" step="0.1" value={volume} 
                onChange={(e) => { const vol = parseFloat(e.target.value); setVolume(vol); if (videoRef.current) videoRef.current.volume = vol }}
                style={styles.volumeSlider} />
            </div>
            <div style={styles.protectionIndicator}><Lock size={16} /><span>محمي</span></div>
            <button onClick={() => containerRef.current?.requestFullscreen()} style={styles.controlButton}>
              <Maximize size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ==========================================
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
      const supabase = getSupabaseClient()
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
      <div style={{...styles.pdfViewerContainer, padding: '2rem', textAlign: 'center'}}>
        <AlertCircle size={48} color="#ef4444" />
        <h3>حدث خطأ في تحميل الملف</h3>
        <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem'}}>
          <button onClick={handleOpenOriginal} style={{...styles.openButton, borderColor: theme.primary, color: theme.primary}}>
            <ExternalLink size={18} /> فتح الرابط الأصلي
          </button>
          {isGoogleDrive && (
            <button onClick={handleDownload} style={{...styles.downloadButton, background: theme.primary}}>
              <Download size={18} /> تحميل
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={styles.pdfViewerContainer}>
      <div style={styles.pdfHeader}>
        <div style={styles.headerLeft}>
          <div style={{...styles.iconContainer, background: theme.primary}}>
            <BookOpen size={24} color="white" />
          </div>
          <div>
            <h3 style={styles.title}>ملف PDF</h3>
            <p style={styles.subtitle}>
              {isGoogleDrive ? 'Google Drive' : 'PDF'}
              {timeSpent > 0 && ` | ${Math.floor(timeSpent / 60)}:${(timeSpent % 60).toString().padStart(2, '0')}`}
            </p>
          </div>
        </div>
        <div style={styles.headerActionsPdf}>
          <button onClick={handleOpenOriginal} style={{...styles.openButton, borderColor: theme.primary, color: theme.primary}}>
            <ExternalLink size={18} /><span>فتح في Drive</span>
          </button>
          <button onClick={handleDownload} style={{...styles.downloadButton, background: theme.primary}}>
            <Download size={18} /><span>تحميل</span>
          </button>
        </div>
      </div>
      <div style={styles.viewerContainer}>
        {isLoading ? (
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
            <Loader2 style={{...styles.loadingSpinner, color: theme.primary}} />
          </div>
        ) : (
          <div style={styles.iframeContainer}>
            <iframe src={getViewerUrl()} style={styles.pdfFrame} title="PDF Viewer" sandbox="allow-scripts allow-same-origin allow-popups" />
            <div style={styles.protectionOverlay} onContextMenu={(e) => e.preventDefault()} />
          </div>
        )}
      </div>
      <div style={styles.pdfFooter}>
        <div style={styles.progressBarContainer}>
          <div style={{...styles.progressBarFill, width: '100%', background: theme.success}} />
        </div>
        <div style={styles.progressText}>{progressSaved ? '✓ تم التحميل' : 'جاري التحميل...'}</div>
        {isGoogleDrive && <p style={styles.driveNotice}><AlertCircle size={14} /> قد تحتاج لتسجيل الدخول في Google</p>}
        <p style={styles.watermark}>الأبــارع محمود الـديــب © 2024</p>
      </div>
    </div>
  )
}

// ==========================================
// EXAM VIEWER
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

  useEffect(() => {
    const generateQuestions = () => {
      const qs: Question[] = []
      const count = examContent?.total_questions || 5
      for (let i = 1; i <= count; i++) {
        qs.push({
          id: i,
          text: examContent?.questions?.[i-1] || `السؤال ${i}: ما الإجابة الصحيحة؟`,
          options: [
            { id: 'A', text: 'الإجابة أ' },
            { id: 'B', text: 'الإجابة ب' },
            { id: 'C', text: 'الإجابة ج' },
            { id: 'D', text: 'الإجابة د' }
          ],
          correctAnswer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]
        })
      }
      return qs
    }
    setQuestions(generateQuestions())
    setTimeLeft((examContent?.duration_minutes || 10) * 60)
    setLoading(false)
  }, [examContent])

  useEffect(() => {
    if (showResults || loading) return
    const timer = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { clearInterval(timer); handleSubmit(); return 0 } return prev - 1 })
    }, 1000)
    return () => clearInterval(timer)
  }, [showResults, loading])

  const handleAnswer = (questionId: number, answerId: string) => setAnswers(prev => ({ ...prev, [questionId]: answerId }))

  const handleSubmit = async () => {
    setIsSubmitting(true)
    let correctCount = 0
    questions.forEach(q => { if (answers[q.id] === q.correctAnswer) correctCount++ })
    const finalScore = Math.round((correctCount / questions.length) * 100)
    setScore(finalScore)
    setShowResults(true)
    setIsSubmitting(false)
    if (finalScore >= (examContent?.pass_score || 50)) onComplete()

    try {
      const supabase = getSupabaseClient()
      if (supabase) await supabase.from('exam_results').insert({
        user_id: userId, content_id: contentId, score: finalScore,
        total_questions: questions.length, correct_answers: correctCount, wrong_answers: questions.length - correctCount
      })
    } catch (err) { console.error('Error saving exam results:', err) }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) return <div style={{...styles.loadingContainer, minHeight: '400px'}}><Loader2 style={{...styles.loadingSpinner, color: theme.primary}} /><p>جاري التحميل...</p></div>

  if (showResults) {
    const passed = score >= (examContent?.pass_score || 50)
    return (
      <div style={styles.resultsContainer}>
        <div style={{...styles.resultCard, ...(passed ? styles.passed : styles.failed)}}>
          <div style={styles.resultIcon}>{passed ? <Trophy size={64} color="#10b981" /> : <AlertCircle size={64} color="#ef4444" />}</div>
          <h2>{passed ? 'مبروك! لقد نجحت' : 'للأسف، لم تنجح'}</h2>
          <p style={styles.scoreText}>{score}%</p>
          <p style={styles.passScoreText}>درجة النجاح: {examContent?.pass_score || 50}%</p>
          <div style={styles.stats}>
            <div style={styles.stat}><CheckCircle color="#10b981" /><span>صحيحة: {Object.keys(answers).filter(id => answers[parseInt(id)] === questions.find(q => q.id === parseInt(id))?.correctAnswer).length}</span></div>
            <div style={styles.stat}><XCircle color="#ef4444" /><span>خاطئة: {questions.length - Object.keys(answers).filter(id => answers[parseInt(id)] === questions.find(q => q.id === parseInt(id))?.correctAnswer).length}</span></div>
          </div>
          <div style={styles.resultButtons}>
            <button onClick={() => router.back()} style={{...styles.backButtonExam, background: theme.primary}}>العودة للباقة</button>
            {!passed && <button onClick={() => { setShowResults(false); setAnswers({}); setCurrentQuestion(0); setTimeLeft((examContent?.duration_minutes || 10) * 60) }} style={styles.retryButton}><RefreshCw size={18} /> إعادة المحاولة</button>}
          </div>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const isLastQuestion = currentQuestion === questions.length - 1

  return (
    <div style={styles.examContainer}>
      <div style={styles.examHeader}>
        <div style={styles.examInfo}><Target style={{ color: theme.primary }} /><div><h3>{examContent?.title || 'امتحان'}</h3><p>سؤال {currentQuestion + 1} من {questions.length}</p></div></div>
        <div style={{...styles.timer, background: timeLeft < 60 ? '#fee2e2' : timeLeft < 300 ? '#fef3c7' : '#d1fae5', color: timeLeft < 60 ? '#dc2626' : timeLeft < 300 ? '#d97706' : '#059669'}}>
          <Clock size={20} /><span>{formatTime(timeLeft)}</span>
        </div>
      </div>
      <div style={styles.questionCard}>
        <div style={styles.questionHeader}><span style={styles.questionNumber}>سؤال {currentQuestion + 1}</span></div>
        <h4 style={styles.questionText}>{currentQ?.text}</h4>
        <div style={styles.options}>
          {currentQ?.options.map(option => (
            <button key={option.id} onClick={() => handleAnswer(currentQ.id, option.id)} style={{...styles.option, ...(answers[currentQ.id] === option.id ? styles.selected : {})}}>
              <span style={styles.optionLabel}>{option.id}</span>
              <span style={styles.optionText}>{option.text}</span>
              <div style={styles.radio}>{answers[currentQ.id] === option.id && <div style={styles.radioInner} />}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={styles.navigation}>
        <button onClick={() => setCurrentQuestion(prev => prev - 1)} disabled={currentQuestion === 0} style={{...styles.navButton, opacity: currentQuestion === 0 ? 0.5 : 1}}><ArrowRight size={20} /> السابق</button>
        <div style={styles.progressDots}>
          {questions.map((_, idx) => <div key={idx} style={{...styles.dot, ...(idx === currentQuestion ? styles.active : {}), ...(answers[questions[idx].id] ? styles.answered : {})}} />)}
        </div>
        {isLastQuestion ? (
          <button onClick={handleSubmit} disabled={isSubmitting} style={{...styles.submitButton, background: theme.success}}>{isSubmitting ? <Loader2 style={styles.spinning} /> : 'تسليم'}</button>
        ) : (
          <button onClick={() => setCurrentQuestion(prev => prev + 1)} style={{...styles.navButton, background: theme.primary, color: 'white', border: 'none'}}>التالي <ArrowLeft size={20} /></button>
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
    <div style={styles.loadingContainer}>
      <Loader2 style={styles.loadingSpinner} />
      <p style={styles.loadingText}>جاري تحميل المحتوى...</p>
    </div>
  )
}

function ContentViewer() {
  const router = useRouter()
  const params = useParams()
  const [mounted, setMounted] = useState(false)
  
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
  
  // CRITICAL: Prevent multiple auth checks and race conditions
  const authInitialized = useRef(false)
  const hasRedirected = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // ==========================================
  // CRITICAL FIX: Robust Auth Check
  // ==========================================
  useEffect(() => {
    if (!mounted || authInitialized.current || hasRedirected.current) return
    
    const supabase = getSupabaseClient()
    if (!supabase) {
      setError('فشل الاتصال بقاعدة البيانات')
      setLoading(false)
      return
    }

    authInitialized.current = true
    
    // Check if we have a token in localStorage first (quick check)
    const hasExistingSession = typeof window !== 'undefined' && 
      localStorage.getItem('sb-auth-token') !== null

    let authSubscription: { unsubscribe: () => void } | null = null
    
    const redirectToLogin = () => {
      if (hasRedirected.current) return
      hasRedirected.current = true
      
      const returnUrl = `/grades/${gradeSlug}/packages/${packageId}/content/${contentId}`
      router.replace(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
    }

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth State Change:', event, session?.user?.id ? 'User exists' : 'No user')
      
      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          // Auth confirmed, load content
          setCurrentUser(session.user)
          loadContentData(session.user, supabase)
        } else {
          // Only redirect if we're sure there's no session
          // Wait a bit to be sure (race condition protection)
          setTimeout(() => {
            if (!hasRedirected.current) {
              redirectToLogin()
            }
          }, 500)
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        setCurrentUser(session.user)
        loadContentData(session.user, supabase)
      } else if (event === 'SIGNED_OUT') {
        redirectToLogin()
      }
    })
    
    authSubscription = subscription

    // Fallback: If we know there's no token in localStorage, redirect faster
    if (!hasExistingSession) {
      setTimeout(() => {
        if (!hasRedirected.current && !currentUser) {
          redirectToLogin()
        }
      }, 3000)
    }

    return () => {
      authSubscription?.unsubscribe()
    }
  }, [mounted]) // Empty deps except mounted to prevent re-runs

  const loadContentData = async (user: any, supabase: SupabaseClient) => {
    try {
      // Fetch content
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
      
      // Parallel fetching for better performance
      const [lectureRes, packageRes, userPackageRes] = await Promise.all([
        supabase.from('lectures').select('*').eq('id', contentData.lecture_id).single(),
        supabase.from('packages').select('*').eq('id', packageId).single(),
        supabase
          .from('user_packages')
          .select('*')
          .eq('user_id', user.id)
          .eq('package_id', packageId)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle()
      ])
      
      setLecture(lectureRes.data)
      setPackageData(packageRes.data)
      
      if (!userPackageRes.data) {
        router.push(`/grades/${gradeSlug}/packages/${packageId}?error=no_access`)
        return
      }
      setUserPackage(userPackageRes.data)
      
      // Get or create progress
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lecture_content_id', contentId)
        .maybeSingle()
      
      const now = new Date().toISOString()
      
      if (!progressData) {
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
        if (progressData.status === 'not_started') {
          await supabase
            .from('user_progress')
            .update({ status: 'in_progress', last_accessed_at: now })
            .eq('id', progressData.id)
          setUserProgress({ ...progressData, status: 'in_progress', last_accessed_at: now })
        } else {
          await supabase
            .from('user_progress')
            .update({ last_accessed_at: now })
            .eq('id', progressData.id)
          setUserProgress(progressData)
        }
      }
    } catch (err: any) {
      console.error('Load content error:', err)
      setError(err?.message || 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  const handleVideoProgress = (progress: number) => {
    setVideoProgress(progress)
    if (progress >= 80 && content?.type === 'video') markAsCompleted()
  }

  const markAsCompleted = async () => {
    if (!userProgress || !content || !currentUser) return
    if (userProgress.status === 'completed' || userProgress.status === 'passed') return

    const status = content.type === 'exam' ? 'passed' : 'completed'
    const now = new Date().toISOString()
    
    try {
      const supabase = getSupabaseClient()
      if (!supabase) return
      await supabase.from('user_progress').update({ status, completed_at: now }).eq('id', userProgress.id)
      setUserProgress({ ...userProgress, status, completed_at: now })
    } catch (err) {
      console.error('Mark complete error:', err)
    }
  }

  const handleBack = () => router.push(`/grades/${gradeSlug}/packages/${packageId}`)

  const renderContent = () => {
    if (!content) return null
    switch (content.type) {
      case 'video': return <ProtectedVideoPlayer videoUrl={content.content_url || ''} contentId={contentId} userId={currentUser?.id} packageId={packageId} onProgress={handleVideoProgress} theme={theme} />
      case 'pdf': return <PDFViewer pdfUrl={content.content_url || ''} contentId={contentId} packageId={packageId} userId={currentUser?.id} theme={theme} />
      case 'exam': return <ExamViewer examContent={content} contentId={contentId} packageId={packageId} userId={currentUser?.id} theme={theme} onComplete={markAsCompleted} />
      case 'text': return <div style={styles.textContent}><div style={styles.textContentInner} dangerouslySetInnerHTML={{ __html: content.content_url || 'لا يوجد محتوى' }} /></div>
      default: return <div style={styles.unsupportedContent}><AlertCircle style={styles.unsupportedIcon} /><p>نوع المحتوى غير مدعوم</p></div>
    }
  }

  const getContentTypeLabel = () => {
    switch (content?.type) {
      case 'video': return 'فيديو'
      case 'pdf': return 'PDF'
      case 'exam': return 'امتحان'
      case 'text': return 'نص'
      default: return 'محتوى'
    }
  }

  if (!mounted) return <LoadingState />
  if (loading) return <LoadingState />
  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorContent}>
          <AlertCircle style={styles.errorIcon} />
          <h2 style={styles.errorTitle}>حدث خطأ</h2>
          <p style={styles.errorMessage}>{error}</p>
          <button onClick={handleBack} style={styles.backBtn}>العودة للباقة</button>
        </div>
      </div>
    )
  }
  if (!content) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorContent}>
          <AlertCircle style={styles.errorIcon} />
          <h2 style={styles.errorTitle}>حدث خطأ</h2>
          <p style={styles.errorMessage}>المحتوى غير موجود</p>
          <button onClick={handleBack} style={styles.backBtn}>العودة للباقة</button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.pageContainer}>
      <style jsx global>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.breadcrumb}>
            <button onClick={() => router.push('/')} style={styles.breadcrumbItem}><Home size={16} />الرئيسية</button>
            <ChevronRight size={16} style={styles.breadcrumbSeparator} />
            <button onClick={() => router.push(`/grades/${gradeSlug}`)} style={styles.breadcrumbItem}>{gradeSlug === 'first' ? 'الصف الأول' : gradeSlug === 'second' ? 'الصف الثاني' : 'الصف الثالث'}</button>
            <ChevronRight size={16} style={styles.breadcrumbSeparator} />
            <button onClick={() => router.push(`/grades/${gradeSlug}/packages/${packageId}`)} style={styles.breadcrumbItem}>{packageData?.name || 'الباقة'}</button>
            <ChevronRight size={16} style={styles.breadcrumbSeparator} />
            <span style={styles.currentPage}>{content.title}</span>
          </div>
          <div style={styles.contentHeader}>
            <div style={styles.contentInfo}>
              <h1 style={styles.contentTitle}>{content.title}</h1>
              <div style={styles.contentMeta}>
                <span style={styles.contentType}>{getContentTypeLabel()}</span>
                <span style={styles.contentSeparator}>•</span>
                <span>{lecture?.title}</span>
                <span style={styles.contentSeparator}>•</span>
                <span>{packageData?.name}</span>
              </div>
            </div>
            <div style={styles.headerActions}>
              <button onClick={handleBack} style={{...styles.backActionBtn, borderColor: theme.primary, color: theme.primary}}><ArrowRight size={18} />العودة</button>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.contentLayout}>
          <div style={styles.leftColumn}>
            <div style={styles.tabs}>
              <button onClick={() => setActiveTab('viewer')} style={{...styles.tabButton, ...(activeTab === 'viewer' ? {...styles.activeTab, borderColor: theme.primary, color: theme.primary} : {})}}><Eye size={18} /><span>العرض</span></button>
              <button onClick={() => setActiveTab('info')} style={{...styles.tabButton, ...(activeTab === 'info' ? {...styles.activeTab, borderColor: theme.primary, color: theme.primary} : {})}}><BookOpen size={18} /><span>المعلومات</span></button>
            </div>
            <div style={styles.contentArea}>
              {activeTab === 'viewer' ? renderContent() : (
                <div style={styles.infoContainer}>
                  <h3 style={styles.infoTitle}>معلومات المحتوى</h3>
                  <p>{content.description || 'لا يوجد وصف'}</p>
                </div>
              )}
              {content.type === 'video' && (
                <div style={styles.progressTracking}>
                  <div style={styles.progressHeader}><h4>تقدم المشاهدة</h4><span>{videoProgress}%</span></div>
                  <div style={styles.progressBar}><div style={{...styles.progressFill, width: `${videoProgress}%`, background: theme.primary}} /></div>
                </div>
              )}
            </div>
          </div>

          <div style={styles.rightColumn}>
            <div style={styles.statusCard}>
              <h4 style={styles.cardTitle}>الحالة</h4>
              <div style={{...styles.statusContent, ...(userProgress?.status === 'completed' || userProgress?.status === 'passed' ? styles.statusCompleted : userProgress?.status === 'failed' ? styles.statusFailed : userProgress?.status === 'in_progress' ? styles.statusInProgress : styles.statusNotStarted)}}>
                {userProgress?.status === 'completed' || userProgress?.status === 'passed' ? <CheckCircle size={24} /> : userProgress?.status === 'failed' ? <X size={24} /> : userProgress?.status === 'in_progress' ? <Loader2 style={styles.spinning} size={24} /> : <BookOpen size={24} />}
                <div style={styles.statusInfo}>
                  <div>{userProgress?.status === 'completed' ? 'مكتمل' : userProgress?.status === 'passed' ? 'ناجح' : userProgress?.status === 'failed' ? 'فاشل' : userProgress?.status === 'in_progress' ? 'قيد التقدم' : 'لم يبدأ'}</div>
                </div>
              </div>
              {content.type !== 'exam' && (
                <button onClick={markAsCompleted} disabled={userProgress?.status === 'completed' || userProgress?.status === 'passed'} style={{...styles.completeButton, ...(userProgress?.status === 'completed' || userProgress?.status === 'passed' ? styles.completeButtonDisabled : {background: theme.success})}}>
                  {userProgress?.status === 'completed' || userProgress?.status === 'passed' ? <><CheckCircle size={18} />تم</> : <><CheckCircle size={18} />تمييز كمكتمل</>}
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