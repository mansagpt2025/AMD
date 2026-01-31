'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import {
  PlayCircle, BookOpen, Clock, Lock, Unlock,
  CheckCircle, XCircle, AlertCircle, Home,
  ChevronRight, GraduationCap, BarChart3,
  Calendar, Video, File, Target, Loader2,
  ArrowRight, Shield, Users, Award, Sparkles,
  Play, FileText, HelpCircle, Crown, Star,
  Zap, TrendingUp, PlaySquare, MoreHorizontal
} from 'lucide-react'
import { getGradeTheme } from '@/lib/utils/grade-themes'
import styles from './PackagePage.module.css'

interface LectureContent {
  id: string
  lecture_id: string
  type: 'video' | 'pdf' | 'exam' | 'text'
  title: string
  description: string
  content_url: string
  duration_minutes: number
  order_number: number
  is_active: boolean
  max_attempts: number
  pass_score: number
  created_at: string
}

interface Lecture {
  id: string
  package_id: string
  title: string
  description: string
  image_url: string
  order_number: number
  is_active: boolean
  created_at: string
}

interface Package {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  grade: string
  type: 'weekly' | 'monthly' | 'term' | 'offer'
  lecture_count: number
  duration_days: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface UserProgress {
  id: string
  user_id: string
  lecture_content_id: string
  package_id: string
  status: 'not_started' | 'in_progress' | 'completed' | 'passed' | 'failed'
  score: number
  attempts: number
  last_accessed_at: string
  completed_at: string
  created_at: string
}

interface UserPackage {
  id: string
  user_id: string
  package_id: string
  purchased_at: string
  expires_at: string
  is_active: boolean
  source: string
}

declare global {
  var __packagePageSupabase: ReturnType<typeof createBrowserClient> | undefined
}

const getSupabase = () => {
  if (typeof window === 'undefined') return null
  
  if (!globalThis.__packagePageSupabase) {
    globalThis.__packagePageSupabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return globalThis.__packagePageSupabase
}

// Loading Component - تصميم جديد عصري
function LoadingState() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingWrapper}>
        <div className={styles.spinnerOrbit}>
          <div className={styles.spinnerPlanet}></div>
          <div className={styles.spinnerRing}></div>
          <div className={styles.spinnerRingSecondary}></div>
        </div>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={styles.loadingText}
        >
          جاري تحميل المحتوى التعليمي...
        </motion.p>
      </div>
    </div>
  )
}

// Error Component - تصميم جديد
function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className={styles.errorContainer}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={styles.errorContent}
      >
        <div className={styles.errorIllustration}>
          <div className={styles.errorCircle}>
            <AlertCircle className={styles.errorIcon} />
          </div>
          <div className={styles.errorDots}></div>
        </div>
        <h2 className={styles.errorTitle}>عذراً، حدث خطأ</h2>
        <p className={styles.errorMessage}>{message}</p>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack} 
          className={styles.backButton}
        >
          <ArrowRight size={18} />
          العودة إلى الصفحة الرئيسية
        </motion.button>
      </motion.div>
    </div>
  )
}

// Main Component - نفس الوظائف تماماً مع تصميم جديد
function PackageContent() {
  const router = useRouter()
  const params = useParams()
  const [mounted, setMounted] = useState(false)
  
  const gradeSlug = params?.grade as string
  const packageId = params?.packageId as string
  
  const theme = getGradeTheme(gradeSlug as any)

  const [packageData, setPackageData] = useState<Package | null>(null)
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [contents, setContents] = useState<LectureContent[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [userPackage, setUserPackage] = useState<UserPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completion, setCompletion] = useState(0)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  const supabase = useMemo(() => getSupabase(), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  const calculateCompletion = (progress: UserProgress[], allContents: LectureContent[]) => {
    if (!allContents || allContents.length === 0) {
      setCompletion(0)
      return
    }
    const completed = progress.filter(p => p.status === 'completed' || p.status === 'passed').length
    setCompletion(Math.round((completed / allContents.length) * 100))
  }

  useEffect(() => {
    if (!mounted || !gradeSlug || !packageId || !supabase || authChecked) return

    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setError('حدث خطأ في التحقق من الجلسة')
          setLoading(false)
          setAuthChecked(true)
          return
        }

        if (!session?.user) {
          console.log('No session, redirecting...')
          router.replace(`/login?returnUrl=/grades/${gradeSlug}/packages/${packageId}`)
          return
        }

        const user = session.user

        const { data: userPackageData, error: accessError } = await supabase
          .from('user_packages')
          .select('*')
          .eq('user_id', user.id)
          .eq('package_id', packageId)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (accessError || !userPackageData) {
          router.replace(`/grades/${gradeSlug}?error=not_subscribed&package=${packageId}`)
          return
        }
        
        setUserPackage(userPackageData)

        const { data: pkgData, error: pkgError } = await supabase
          .from('packages')
          .select('*')
          .eq('id', packageId)
          .single()

        if (pkgError || !pkgData) {
          setError('الباقة غير موجودة أو تم حذفها')
          setLoading(false)
          setAuthChecked(true)
          return
        }
        
        if (pkgData.grade !== gradeSlug) {
          router.replace(`/grades/${pkgData.grade}/packages/${packageId}`)
          return
        }
        
        setPackageData(pkgData)

        const { data: lecturesData, error: lecturesError } = await supabase
          .from('lectures')
          .select('*')
          .eq('package_id', packageId)
          .eq('is_active', true)
          .order('order_number', { ascending: true })

        if (lecturesError) throw lecturesError
        setLectures(lecturesData || [])

        if (lecturesData && lecturesData.length > 0) {
          const lectureIds = lecturesData.map((l: { id: any }) => l.id)
          const { data: contentsData, error: contentsError } = await supabase
            .from('lecture_contents')
            .select('*')
            .in('lecture_id', lectureIds)
            .eq('is_active', true)
            .order('order_number', { ascending: true })

          if (contentsError) throw contentsError
          setContents(contentsData || [])
          
          const { data: progressData, error: progressError } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('package_id', packageId)

          if (progressError) throw progressError
          setUserProgress(progressData || [])
          calculateCompletion(progressData || [], contentsData || [])
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

    checkAuth()
  }, [mounted, gradeSlug, packageId, supabase, authChecked, router])

  const isContentAccessible = (lectureIndex: number, contentIndex: number, content: LectureContent) => {
    if (!packageData) return false
    if (packageData.type === 'weekly') return true
    
    if (packageData.type === 'monthly' || packageData.type === 'term') {
      if (lectureIndex === 0 && contentIndex === 0) return true
      
      const previousContents: LectureContent[] = []
      for (let i = 0; i < lectureIndex; i++) {
        const lecture = lectures[i]
        if (lecture) {
          const lectureContents = contents.filter(c => c.lecture_id === lecture.id)
          previousContents.push(...lectureContents)
        }
      }
      
      const currentLecture = lectures[lectureIndex]
      if (currentLecture) {
        const currentContents = contents.filter(c => c.lecture_id === currentLecture.id)
        previousContents.push(...currentContents.slice(0, contentIndex))
      }
      
      for (const prevContent of previousContents) {
        const progress = userProgress.find(p => p.lecture_content_id === prevContent.id)
        if (!progress || (progress.status !== 'completed' && progress.status !== 'passed')) {
          return false
        }
        if (prevContent.type === 'exam' && progress.status !== 'passed') {
          return false
        }
      }
    }
    return true
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <PlaySquare className={styles.contentTypeIcon} />
      case 'pdf': return <FileText className={styles.contentTypeIcon} />
      case 'exam': return <HelpCircle className={styles.contentTypeIcon} />
      case 'text': return <BookOpen className={styles.contentTypeIcon} />
      default: return <PlayCircle className={styles.contentTypeIcon} />
    }
  }

  const getContentStatus = (contentId: string) => {
    const progress = userProgress.find(p => p.lecture_content_id === contentId)
    return progress?.status || 'not_started'
  }

  const handleContentClick = (content: LectureContent, lectureIndex: number, contentIndex: number) => {
    if (!isContentAccessible(lectureIndex, contentIndex, content)) {
      alert('يجب إتمام المحتوى السابق أولاً')
      return
    }
    router.push(`/grades/${gradeSlug}/packages/${packageId}/content/${content.id}`)
  }

  const toggleSection = (sectionId: string) => {
    setActiveSection(prev => prev === sectionId ? null : sectionId)
  }

  if (!mounted) return <LoadingState />
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onBack={() => router.push(`/grades/${gradeSlug || ''}`)} />
  if (!packageData) return <ErrorState message="لم يتم العثور على الباقة" onBack={() => router.push('/')} />

  return (
    <div className={styles.pageContainer}>
      {/* Header Section - تصميم جديد عصري */}
      <header className={styles.header}>
        {/* Background Effects */}
        <div className={styles.headerBackground}>
          <div className={styles.gradientBlob} style={{ background: `linear-gradient(135deg, ${theme.primary}20, ${theme.accent}10)` }}></div>
          <div className={styles.gridPattern}></div>
          <div className={styles.blurOverlay}></div>
        </div>

        <div className={styles.headerContent}>
          {/* Brand Bar */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.brandBar}
          >
            <div className={styles.brandLogo}>
              <div className={styles.logoIcon} style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}>
                <Crown size={20} />
              </div>
              <span className={styles.brandText}>البارع محمود الديب</span>
              <Sparkles className={styles.sparkleIcon} size={16} />
            </div>
            <div className={styles.headerActions}>
              <button onClick={() => router.push('/')} className={styles.iconButton}>
                <Home size={20} />
              </button>
            </div>
          </motion.div>

          {/* Breadcrumb */}
          <motion.nav 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={styles.breadcrumb}
          >
            <button onClick={() => router.push('/')} className={styles.breadcrumbItem}>
              الرئيسية
            </button>
            <ChevronRight size={16} className={styles.breadcrumbSeparator} />
            <button onClick={() => router.push(`/grades/${gradeSlug}`)} className={styles.breadcrumbItem}>
              {gradeSlug === 'first' ? 'الصف الأول' : gradeSlug === 'second' ? 'الصف الثاني' : 'الصف الثالث'}
            </button>
            <ChevronRight size={16} className={styles.breadcrumbSeparator} />
            <span className={styles.currentPage}>{packageData.name}</span>
          </motion.nav>

          {/* Package Hero */}
          <div className={styles.heroSection}>
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={styles.packageVisual}
            >
              <div className={styles.imageFrame}>
                {packageData.image_url ? (
                  <>
                    <img src={packageData.image_url} alt={packageData.name} className={styles.packageImage} />
                    <div className={styles.imageShine}></div>
                  </>
                ) : (
                  <div className={styles.placeholderImage} style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}>
                    <GraduationCap size={60} />
                  </div>
                )}
                <div className={styles.badgeFloating} style={{ background: theme.accent }}>
                  <Star size={14} fill="currentColor" />
                  مميز
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className={styles.packageInfo}
            >
              <div className={styles.tagRow}>
                <span className={styles.packageTag} style={{ 
                  background: `${theme.primary}15`, 
                  color: theme.primary,
                  border: `1px solid ${theme.primary}30`
                }}>
                  {packageData.type === 'weekly' ? 'أسبوعي' : packageData.type === 'monthly' ? 'شهري' : packageData.type === 'term' ? 'ترم كامل' : 'عرض خاص'}
                </span>
                {completion > 0 && (
                  <span className={styles.progressBadge}>
                    <TrendingUp size={14} />
                    {completion}% مكتمل
                  </span>
                )}
              </div>

              <h1 className={styles.packageTitle}>{packageData.name}</h1>
              <p className={styles.packageDescription}>{packageData.description}</p>

              <div className={styles.statsGrid}>
                <div className={styles.statCard} style={{ borderTopColor: theme.primary }}>
                  <div className={styles.statIcon} style={{ background: `${theme.primary}15`, color: theme.primary }}>
                    <PlaySquare size={22} />
                  </div>
                  <div className={styles.statDetails}>
                    <span className={styles.statValue}>{lectures.length}</span>
                    <span className={styles.statLabel}>محاضرة</span>
                  </div>
                </div>

                <div className={styles.statCard} style={{ borderTopColor: theme.accent }}>
                  <div className={styles.statIcon} style={{ background: `${theme.accent}15`, color: theme.accent }}>
                    <Clock size={22} />
                  </div>
                  <div className={styles.statDetails}>
                    <span className={styles.statValue}>{packageData.duration_days}</span>
                    <span className={styles.statLabel}>يوم</span>
                  </div>
                </div>

                <div className={styles.statCard} style={{ borderTopColor: '#10b981' }}>
                  <div className={styles.statIcon} style={{ background: '#10b98115', color: '#10b981' }}>
                    <BookOpen size={22} />
                  </div>
                  <div className={styles.statDetails}>
                    <span className={styles.statValue}>{contents.length}</span>
                    <span className={styles.statLabel}>محتوى</span>
                  </div>
                </div>
              </div>

              {contents.length > 0 && (
                <div className={styles.progressSection}>
                  <div className={styles.progressHeader}>
                    <span className={styles.progressTitle}>
                      <BarChart3 size={18} />
                      نسبة الإتمام
                    </span>
                    <span className={styles.progressPercentage} style={{ color: theme.primary }}>{completion}%</span>
                  </div>
                  <div className={styles.progressBarContainer}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${completion}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={styles.progressBar}
                      style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})` }}
                    />
                  </div>
                  <div className={styles.progressStats}>
                    <span className={styles.statChip}>
                      <CheckCircle size={14} style={{ color: '#10b981' }} />
                      مكتمل: {userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length}
                    </span>
                    <span className={styles.statChip}>
                      <Clock size={14} style={{ color: '#f59e0b' }} />
                      المتبقي: {contents.length - userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.container}>
          {/* Lectures Section */}
          <section className={styles.lecturesSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleWrapper}>
                <div className={styles.iconBox} style={{ background: `${theme.primary}15`, color: theme.primary }}>
                  <BookOpen size={24} />
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>محاضرات الباقة</h2>
                  <p className={styles.sectionSubtitle}>ابدأ رحلتك التعليمية وحقق التفوق</p>
                </div>
              </div>
            </div>

            {lectures.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.emptyState}
              >
                <div className={styles.emptyIcon}>
                  <BookOpen size={48} />
                </div>
                <h3>لا توجد محاضرات متاحة حالياً</h3>
                <p>سيتم إضافة المحاضرات قريباً</p>
              </motion.div>
            ) : (
              <div className={styles.lecturesAccordion}>
                {lectures.map((lecture, lectureIndex) => {
                  const lectureContents = contents.filter(c => c.lecture_id === lecture.id)
                  const isExpanded = activeSection === lecture.id
                  const completedContents = lectureContents.filter(c => {
                    const status = getContentStatus(c.id)
                    return status === 'completed' || status === 'passed'
                  }).length
                  const progressPercent = lectureContents.length > 0 ? Math.round((completedContents / lectureContents.length) * 100) : 0
                  
                  return (
                    <motion.div 
                      key={lecture.id} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: lectureIndex * 0.05 }}
                      className={`${styles.lecturePanel} ${isExpanded ? styles.expanded : ''}`}
                    >
                      <button 
                        onClick={() => toggleSection(lecture.id)}
                        className={styles.lectureTrigger}
                      >
                        <div className={styles.lectureMain}>
                          <div className={styles.lectureNumber} style={{ 
                            background: isExpanded ? theme.primary : '#f1f5f9',
                            color: isExpanded ? 'white' : '#64748b'
                          }}>
                            {lectureIndex + 1}
                          </div>
                          <div className={styles.lectureData}>
                            <h3 className={styles.lectureTitle}>{lecture.title}</h3>
                            {lecture.description && (
                              <p className={styles.lectureDescription}>{lecture.description}</p>
                            )}
                            <div className={styles.lectureMeta}>
                              <span className={styles.metaItem}>
                                <FileText size={14} />
                                {lectureContents.length} محتوى
                              </span>
                              <span className={styles.metaItem}>
                                <CheckCircle size={14} style={{ color: progressPercent === 100 ? '#10b981' : '#94a3b8' }} />
                                {completedContents}/{lectureContents.length} مكتمل
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className={styles.lectureSide}>
                          {progressPercent > 0 && (
                            <div className={styles.circularProgress}>
                              <svg viewBox="0 0 36 36">
                                <path
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="#e2e8f0"
                                  strokeWidth="3"
                                />
                                <path
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke={theme.primary}
                                  strokeWidth="3"
                                  strokeDasharray={`${progressPercent}, 100`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <span className={styles.progressValue}>{progressPercent}%</span>
                            </div>
                          )}
                          <motion.div 
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            className={styles.expandButton}
                            style={{ background: isExpanded ? theme.primary : '#f1f5f9' }}
                          >
                            <ChevronRight size={20} style={{ color: isExpanded ? 'white' : '#64748b' }} />
                          </motion.div>
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className={styles.lectureContent}
                          >
                            <div className={styles.contentsList}>
                              {lectureContents.map((content, contentIndex) => {
                                const isAccessible = isContentAccessible(lectureIndex, contentIndex, content)
                                const status = getContentStatus(content.id)
                                
                                return (
                                  <motion.div 
                                    key={content.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: contentIndex * 0.03 }}
                                    onClick={() => isAccessible && handleContentClick(content, lectureIndex, contentIndex)}
                                    className={`${styles.contentRow} ${!isAccessible ? styles.lockedRow : ''} ${status === 'completed' || status === 'passed' ? styles.completedRow : ''}`}
                                  >
                                    <div className={styles.contentLeft}>
                                      <div 
                                        className={styles.contentStatusIcon}
                                        style={{
                                          background: status === 'completed' || status === 'passed' ? '#10b98115' : 
                                                     status === 'failed' ? '#ef444415' :
                                                     status === 'in_progress' ? '#f59e0b15' :
                                                     isAccessible ? `${theme.primary}15` : '#f1f5f9',
                                          color: status === 'completed' || status === 'passed' ? '#10b981' : 
                                                 status === 'failed' ? '#ef4444' :
                                                 status === 'in_progress' ? '#f59e0b' :
                                                 isAccessible ? theme.primary : '#cbd5e1'
                                        }}
                                      >
                                        {getContentIcon(content.type)}
                                        {(status === 'completed' || status === 'passed') && (
                                          <div className={styles.checkOverlay}>
                                            <CheckCircle size={12} strokeWidth={3} />
                                          </div>
                                        )}
                                      </div>

                                      <div className={styles.contentDetails}>
                                        <h4 className={styles.contentTitle}>{content.title}</h4>
                                        {content.description && (
                                          <p className={styles.contentDescription}>{content.description}</p>
                                        )}
                                        <div className={styles.contentBadges}>
                                          <span className={styles.typeBadge}>
                                            {content.type === 'video' ? 'فيديو' : content.type === 'pdf' ? 'ملف PDF' : content.type === 'exam' ? 'امتحان' : 'نص'}
                                          </span>
                                          {content.duration_minutes > 0 && (
                                            <span className={styles.durationBadge}>
                                              <Clock size={12} />
                                              {content.duration_minutes} دقيقة
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className={styles.contentRight}>
                                      {!isAccessible ? (
                                        <div className={styles.lockBadge}>
                                          <Lock size={14} />
                                          <span>مقفل</span>
                                        </div>
                                      ) : (
                                        <motion.button 
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          className={styles.actionButton}
                                          style={{ 
                                            background: status === 'completed' || status === 'passed' ? '#10b981' : 
                                                       status === 'failed' ? '#ef4444' :
                                                       theme.primary
                                          }}
                                        >
                                          {status === 'completed' || status === 'passed' ? (
                                            <><CheckCircle size={16} /> تم</>
                                          ) : status === 'failed' ? (
                                            <><XCircle size={16} /> إعادة</>
                                          ) : status === 'in_progress' ? (
                                            <><Play size={16} /> استكمال</>
                                          ) : (
                                            <><Play size={16} /> بدء</>
                                          )}
                                        </motion.button>
                                      )}
                                    </div>
                                  </motion.div>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Notes Section */}
          <motion.aside 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={styles.infoPanel}
          >
            <div className={styles.infoCard} style={{ borderRightColor: theme.primary }}>
              <div className={styles.infoHeader}>
                <div className={styles.infoIcon} style={{ background: `${theme.primary}15`, color: theme.primary }}>
                  <Zap size={24} />
                </div>
                <h3>ملاحظات هامة</h3>
              </div>
              <ul className={styles.infoList}>
                {(packageData.type === 'monthly' || packageData.type === 'term') && (
                  <>
                    <li className={styles.infoItem}>
                      <div className={styles.bullet} style={{ background: theme.accent }}></div>
                      <span>يجب إتمام كل محتوى قبل الانتقال للذي يليه</span>
                    </li>
                    <li className={styles.infoItem}>
                      <div className={styles.bullet} style={{ background: theme.accent }}></div>
                      <span>لابد من اجتياز الامتحان قبل الانتقال للمحاضرة التالية</span>
                    </li>
                  </>
                )}
                {userPackage?.expires_at && (
                  <li className={styles.infoItem}>
                    <div className={styles.bullet} style={{ background: '#f59e0b' }}></div>
                    <span>
                      مدة الاشتراك تنتهي في: 
                      <strong>{new Date(userPackage.expires_at).toLocaleDateString('ar-EG')}</strong>
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </motion.aside>

          {/* Back Button */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={styles.footerActions}
          >
            <button 
              onClick={() => router.push(`/grades/${gradeSlug}`)} 
              className={styles.outlineButton}
              style={{ borderColor: `${theme.primary}30`, color: theme.primary }}
            >
              <ArrowRight size={18} />
              <span>العودة إلى الباقات</span>
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function PackagePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PackageContent />
    </Suspense>
  )
}