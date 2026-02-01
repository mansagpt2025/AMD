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
  ChevronDown, Share2, CalendarDays, ChevronLeft,
  Zap, TrendingUp, PlayIcon, LockIcon,
  MoreHorizontal, Bookmark, CheckIcon, XIcon
} from 'lucide-react'
import styles from './PackagePage.module.css'

// Types
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

// Loading Component
function LoadingState() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingWrapper}>
        <div className={styles.loadingCard}>
          <div className={styles.spinnerRing}></div>
          <div className={styles.spinnerRing}></div>
          <div className={styles.spinnerRing}></div>
          <GraduationCap className={styles.loadingIcon} size={32} />
        </div>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={styles.loadingText}
        >
          جاري تحميل البيانات...
        </motion.p>
      </div>
    </div>
  )
}

// Error Component
function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className={styles.errorContainer}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={styles.errorCard}
      >
        <div className={styles.errorIconWrapper}>
          <div className={styles.errorRipple}></div>
          <AlertCircle className={styles.errorIcon} size={40} />
        </div>
        <h2 className={styles.errorTitle}>حدث خطأ</h2>
        <p className={styles.errorMessage}>{message}</p>
        <button onClick={onBack} className={styles.errorButton}>
          <ArrowRight size={20} />
          العودة إلى الصفحة الرئيسية
        </button>
      </motion.div>
    </div>
  )
}

// Main Component
function PackageContent() {
  const router = useRouter()
  const params = useParams()
  const [mounted, setMounted] = useState(false)
  
  const gradeSlug = params?.grade as string
  const packageId = params?.packageId as string

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
  const [hoveredContent, setHoveredContent] = useState<string | null>(null)

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
          
          // Auto-expand first incomplete lecture
          const firstIncompleteLecture = lecturesData.find((lecture: Lecture) => {
            const lectureContents = contentsData?.filter((c: LectureContent) => c.lecture_id === lecture.id) || []
            const hasIncomplete = lectureContents.some((c: LectureContent) => {
              const progress = progressData?.find((p: UserProgress) => p.lecture_content_id === c.id)
              return !progress || (progress.status !== 'completed' && progress.status !== 'passed')
            })
            return hasIncomplete || lectureContents.length > 0
          })
          
          if (firstIncompleteLecture) {
            setActiveSection(firstIncompleteLecture.id)
          }
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

  const getContentIcon = (type: string, status: string) => {
    const isCompleted = status === 'completed' || status === 'passed'
    
    switch (type) {
      case 'video':
        return (
          <div className={`${styles.contentIcon} ${styles.iconVideo} ${isCompleted ? styles.iconCompleted : ''}`}>
            <PlayIcon size={20} />
          </div>
        )
      case 'pdf':
        return (
          <div className={`${styles.contentIcon} ${styles.iconPdf} ${isCompleted ? styles.iconCompleted : ''}`}>
            <FileText size={20} />
          </div>
        )
      case 'exam':
        return (
          <div className={`${styles.contentIcon} ${styles.iconExam} ${isCompleted ? styles.iconCompleted : ''}`}>
            <HelpCircle size={20} />
          </div>
        )
      case 'text':
        return (
          <div className={`${styles.contentIcon} ${styles.iconText} ${isCompleted ? styles.iconCompleted : ''}`}>
            <BookOpen size={20} />
          </div>
        )
      default:
        return (
          <div className={`${styles.contentIcon} ${isCompleted ? styles.iconCompleted : ''}`}>
            <PlayCircle size={20} />
          </div>
        )
    }
  }

  const getContentStatus = (contentId: string) => {
    const progress = userProgress.find(p => p.lecture_content_id === contentId)
    return progress?.status || 'not_started'
  }

  const handleContentClick = (content: LectureContent, lectureIndex: number, contentIndex: number) => {
    if (!isContentAccessible(lectureIndex, contentIndex, content)) {
      return
    }
    router.push(`/grades/${gradeSlug}/packages/${packageId}/content/${content.id}`)
  }

  const toggleSection = (sectionId: string) => {
    setActiveSection(prev => prev === sectionId ? null : sectionId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'passed':
        return styles.statusSuccess
      case 'failed':
        return styles.statusDanger
      case 'in_progress':
        return styles.statusWarning
      default:
        return styles.statusDefault
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتمل'
      case 'passed':
        return 'ناجح'
      case 'failed':
        return 'فشل'
      case 'in_progress':
        return 'قيد التقدم'
      default:
        return 'متاح'
    }
  }

  const getTypeBadge = (type: string) => {
    const badges = {
      weekly: { text: 'أسبوعي', color: styles.badgeCyan },
      monthly: { text: 'شهري', color: styles.badgeBlue },
      term: { text: 'ترم كامل', color: styles.badgePurple },
      offer: { text: 'عرض خاص', color: styles.badgePink }
    }
    return badges[type as keyof typeof badges] || { text: type, color: styles.badgeGray }
  }

  const getGradeName = (slug: string) => {
    const grades: { [key: string]: string } = {
      'first': 'الصف الأول',
      'second': 'الصف الثاني',
      'third': 'الصف الثالث'
    }
    return grades[slug] || slug
  }

  if (!mounted) return <LoadingState />
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onBack={() => router.push(`/grades/${gradeSlug || ''}`)} />
  if (!packageData) return <ErrorState message="لم يتم العثور على الباقة" onBack={() => router.push('/')} />

  const typeBadge = getTypeBadge(packageData.type)
  const completedCount = userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length
  const inProgressCount = userProgress.filter(p => p.status === 'in_progress').length
  const remainingCount = contents.length - completedCount

  return (
    <div className={styles.page}>
      {/* Background Effects */}
      <div className={styles.bgEffects}>
        <div className={`${styles.bgGradient} ${styles.bgGradient1}`}></div>
        <div className={`${styles.bgGradient} ${styles.bgGradient2}`}></div>
        <div className={styles.bgGrid}></div>
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.headerContent}
          >
            {/* Breadcrumb */}
            <nav className={styles.breadcrumb}>
              <button onClick={() => router.push('/')} className={styles.breadcrumbLink}>
                <Home size={16} />
                <span>الرئيسية</span>
              </button>
              <ChevronLeft size={14} className={styles.breadcrumbSeparator} />
              <button onClick={() => router.push(`/grades/${gradeSlug}`)} className={styles.breadcrumbLink}>
                {getGradeName(gradeSlug)}
              </button>
              <ChevronLeft size={14} className={styles.breadcrumbSeparator} />
              <span className={styles.breadcrumbCurrent}>{packageData.name}</span>
            </nav>

            {/* Brand */}
            <div className={styles.brand}>
              <div className={styles.brandBadge}>
                <Crown size={18} className={styles.brandIcon} />
                <span>البارع محمود الديب</span>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={styles.hero}
        >
          <div className={styles.heroContainer}>
            {/* Package Image & Quick Stats */}
            <div className={styles.heroVisual}>
              <div className={styles.imageCard}>
                <div className={styles.imageWrapper}>
                  <div className={`${styles.typeBadge} ${typeBadge.color}`}>
                    {typeBadge.text}
                  </div>
                  {packageData.image_url ? (
                    <img src={packageData.image_url} alt={packageData.name} className={styles.packageImage} />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      <GraduationCap size={64} className={styles.placeholderIcon} />
                    </div>
                  )}
                  <div className={styles.imageOverlay}></div>
                </div>
                
                {/* Quick Stats Grid */}
                <div className={styles.quickStats}>
                  <div className={styles.statItem}>
                    <div className={`${styles.statIconBox} ${styles.statBlue}`}>
                      <PlayCircle size={20} />
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{lectures.length}</span>
                      <span className={styles.statLabel}>محاضرة</span>
                    </div>
                  </div>
                  
                  <div className={styles.statItem}>
                    <div className={`${styles.statIconBox} ${styles.statPurple}`}>
                      <BookOpen size={20} />
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{contents.length}</span>
                      <span className={styles.statLabel}>محتوى</span>
                    </div>
                  </div>
                  
                  <div className={styles.statItem}>
                    <div className={`${styles.statIconBox} ${styles.statOrange}`}>
                      <Clock size={20} />
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{packageData.duration_days}</span>
                      <span className={styles.statLabel}>يوم</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Package Info */}
            <div className={styles.heroContent}>
              <div className={styles.heroHeader}>
                <div>
                  <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className={styles.title}
                  >
                    {packageData.name}
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className={styles.description}
                  >
                    {packageData.description}
                  </motion.p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={styles.shareButton}
                >
                  <Share2 size={18} />
                </motion.button>
              </div>

              {/* Progress Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={styles.progressCard}
              >
                <div className={styles.progressHeader}>
                  <div className={styles.progressTitle}>
                    <div className={styles.progressIcon}>
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <h3>تقدمك في الباقة</h3>
                      <p>أكمل المحتوى لإتقان المادة</p>
                    </div>
                  </div>
                  <div className={styles.progressPercent}>
                    <span>{completion}</span>%
                  </div>
                </div>

                <div className={styles.progressBarContainer}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${completion}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={styles.progressBar}
                  >
                    <div className={styles.progressGlow}></div>
                  </motion.div>
                </div>

                <div className={styles.progressStats}>
                  <div className={`${styles.progressStat} ${styles.statCompleted}`}>
                    <CheckCircle size={16} />
                    <span>{completedCount} مكتمل</span>
                  </div>
                  <div className={`${styles.progressStat} ${styles.statInProgress}`}>
                    <Clock size={16} />
                    <span>{inProgressCount} قيد التقدم</span>
                  </div>
                  <div className={`${styles.progressStat} ${styles.statRemaining}`}>
                    <Target size={16} />
                    <span>{remainingCount} متبقي</span>
                  </div>
                </div>
              </motion.div>

              {/* Expiry Notice */}
              {userPackage?.expires_at && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className={styles.expiryCard}
                >
                  <CalendarDays size={18} />
                  <span>ينتهي اشتراكك في: {new Date(userPackage.expires_at).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Content Section */}
        <section className={styles.contentSection}>
          <div className={styles.contentGrid}>
            {/* Lectures Column */}
            <div className={styles.lecturesColumn}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.sectionHeader}
              >
                <div className={styles.sectionTitle}>
                  <div className={styles.titleIcon}>
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h2>محاضرات الباقة</h2>
                    <p>تابع تقدمك واستكمل رحلتك التعليمية</p>
                  </div>
                </div>
                <div className={styles.lectureCount}>
                  {lectures.length} محاضرة
                </div>
              </motion.div>

              {lectures.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={styles.emptyState}
                >
                  <div className={styles.emptyIcon}>
                    <BookOpen size={48} />
                  </div>
                  <h3>لا توجد محاضرات متاحة</h3>
                  <p>سيتم إضافة المحاضرات قريباً</p>
                </motion.div>
              ) : (
                <div className={styles.lecturesList}>
                  {lectures.map((lecture, lectureIndex) => {
                    const lectureContents = contents.filter(c => c.lecture_id === lecture.id)
                    const isExpanded = activeSection === lecture.id
                    const completedContents = lectureContents.filter(c => {
                      const status = getContentStatus(c.id)
                      return status === 'completed' || status === 'passed'
                    }).length
                    const progressPercent = lectureContents.length > 0 
                      ? Math.round((completedContents / lectureContents.length) * 100) 
                      : 0
                    const isFullyCompleted = progressPercent === 100

                    return (
                      <motion.div
                        key={lecture.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: lectureIndex * 0.1 }}
                        className={`${styles.lectureCard} ${isFullyCompleted ? styles.lectureCompleted : ''}`}
                      >
                        <div 
                          className={styles.lectureHeader}
                          onClick={() => toggleSection(lecture.id)}
                        >
                          <div className={styles.lectureHeaderContent}>
                            <div className={styles.lectureNumber}>
                              <span>{lectureIndex + 1}</span>
                              {isFullyCompleted && (
                                <motion.div 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className={styles.completedCheck}
                                >
                                  <CheckIcon size={12} />
                                </motion.div>
                              )}
                            </div>
                            
                            <div className={styles.lectureInfo}>
                              <div className={styles.lectureTitleRow}>
                                <h3>{lecture.title}</h3>
                                <div className={styles.lectureMeta}>
                                  <span className={`${styles.lectureBadge} ${isFullyCompleted ? styles.badgeSuccess : progressPercent > 0 ? styles.badgeWarning : styles.badgeDefault}`}>
                                    {isFullyCompleted ? 'مكتمل' : progressPercent > 0 ? 'قيد التقدم' : 'جديد'}
                                  </span>
                                  <span className={styles.contentCount}>
                                    {lectureContents.length} محتوى
                                  </span>
                                </div>
                              </div>
                              
                              {lecture.description && (
                                <p className={styles.lectureDesc}>{lecture.description}</p>
                              )}
                              
                              <div className={styles.lectureProgress}>
                                <div className={styles.progressInfo}>
                                  <span>التقدم</span>
                                  <span>{progressPercent}%</span>
                                </div>
                                <div className={styles.progressTrack}>
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    className={`${styles.progressFill} ${isFullyCompleted ? styles.fillSuccess : progressPercent > 0 ? styles.fillWarning : ''}`}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <motion.div 
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                            className={styles.expandIcon}
                          >
                            <ChevronDown size={24} />
                          </motion.div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.4, ease: "easeInOut" }}
                              className={styles.lectureContents}
                            >
                              <div className={styles.contentsList}>
                                {lectureContents.map((content, contentIndex) => {
                                  const isAccessible = isContentAccessible(lectureIndex, contentIndex, content)
                                  const status = getContentStatus(content.id)
                                  const isCompleted = status === 'completed' || status === 'passed'
                                  const isFailed = status === 'failed'
                                  const isInProgress = status === 'in_progress'
                                  
                                  return (
                                    <motion.div
                                      key={content.id}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: contentIndex * 0.05 }}
                                      className={`
                                        ${styles.contentItem} 
                                        ${isCompleted ? styles.itemCompleted : ''} 
                                        ${!isAccessible ? styles.itemLocked : ''}
                                        ${isFailed ? styles.itemFailed : ''}
                                      `}
                                      onMouseEnter={() => setHoveredContent(content.id)}
                                      onMouseLeave={() => setHoveredContent(null)}
                                      onClick={() => handleContentClick(content, lectureIndex, contentIndex)}
                                    >
                                      <div className={styles.contentMain}>
                                        {getContentIcon(content.type, status)}
                                        
                                        <div className={styles.contentDetails}>
                                          <div className={styles.contentHeader}>
                                            <h4>{content.title}</h4>
                                            <span className={`${styles.statusBadge} ${getStatusColor(status)}`}>
                                              {getStatusText(status)}
                                            </span>
                                          </div>
                                          
                                          {content.description && (
                                            <p className={styles.contentDesc}>{content.description}</p>
                                          )}
                                          
                                          <div className={styles.contentMeta}>
                                            <span className={styles.metaTag}>
                                              {content.type === 'video' ? 'فيديو' : 
                                               content.type === 'pdf' ? 'PDF' : 
                                               content.type === 'exam' ? 'امتحان' : 'مقال'}
                                            </span>
                                            {content.duration_minutes > 0 && (
                                              <span className={styles.metaTag}>
                                                <Clock size={12} />
                                                {content.duration_minutes} دقيقة
                                              </span>
                                            )}
                                            {content.type === 'exam' && content.pass_score && (
                                              <span className={styles.metaTag}>
                                                <Target size={12} />
                                                النجاح: {content.pass_score}%
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className={styles.contentAction}>
                                        {!isAccessible ? (
                                          <div className={styles.lockBadge}>
                                            <LockIcon size={16} />
                                            <span>مقفل</span>
                                          </div>
                                        ) : (
                                          <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`
                                              ${styles.actionBtn} 
                                              ${isCompleted ? styles.btnSuccess : 
                                                isFailed ? styles.btnDanger : 
                                                isInProgress ? styles.btnWarning : 
                                                styles.btnPrimary}
                                            `}
                                          >
                                            {isCompleted ? (
                                              <><CheckCircle size={16} /> مكتمل</>
                                            ) : isFailed ? (
                                              <><XIcon size={16} /> إعادة</>
                                            ) : isInProgress ? (
                                              <><Play size={16} /> استكمال</>
                                            ) : (
                                              <><Play size={16} /> بدء</>
                                            )}
                                          </motion.button>
                                        )}
                                      </div>

                                      {/* Hover Glow Effect */}
                                      {hoveredContent === content.id && isAccessible && (
                                        <motion.div
                                          layoutId="hoverGlow"
                                          className={styles.hoverGlow}
                                          transition={{ duration: 0.2 }}
                                        />
                                      )}
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
            </div>

            {/* Sidebar */}
            <aside className={styles.sidebar}>
              {/* Important Notes */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={styles.sidebarCard}
              >
                <div className={styles.cardHeader}>
                  <div className={`${styles.cardIcon} ${styles.iconWarning}`}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3>نصائح مهمة</h3>
                    <p>للحصول على أفضل النتائج</p>
                  </div>
                </div>
                
                <div className={styles.notesList}>
                  {(packageData.type === 'monthly' || packageData.type === 'term') && (
                    <>
                      <div className={styles.noteItem}>
                        <div className={`${styles.noteIcon} ${styles.noteBlue}`}>
                          <Shield size={16} />
                        </div>
                        <p>يجب إتمام كل محتوى قبل الانتقال للتالي</p>
                      </div>
                      <div className={styles.noteItem}>
                        <div className={`${styles.noteIcon} ${styles.notePurple}`}>
                          <Target size={16} />
                        </div>
                        <p>اجتياز الامتحان إلزامي للمتابعة</p>
                      </div>
                    </>
                  )}
                  
                  <div className={styles.noteItem}>
                    <div className={`${styles.noteIcon} ${styles.noteGreen}`}>
                      <Clock size={16} />
                    </div>
                    <p>خصص وقتاً يومياً للدراسة</p>
                  </div>
                  
                  <div className={styles.noteItem}>
                    <div className={`${styles.noteIcon} ${styles.noteOrange}`}>
                      <Bookmark size={16} />
                    </div>
                    <p>دوّن ملاحظاتك أثناء الدراسة</p>
                  </div>
                </div>
              </motion.div>

              {/* Content Distribution */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className={styles.sidebarCard}
              >
                <div className={styles.cardHeader}>
                  <div className={`${styles.cardIcon} ${styles.iconInfo}`}>
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h3>توزيع المحتوى</h3>
                    <p>إحصائيات الباقة</p>
                  </div>
                </div>
                
                <div className={styles.distribution}>
                  {[
                    { type: 'video', label: 'فيديوهات', color: styles.distBlue, icon: Video },
                    { type: 'pdf', label: 'ملفات PDF', color: styles.distRed, icon: File },
                    { type: 'exam', label: 'امتحانات', color: styles.distPurple, icon: HelpCircle },
                    { type: 'text', label: 'مقالات', color: styles.distGreen, icon: BookOpen }
                  ].map(({ type, label, color, icon: Icon }) => {
                    const count = contents.filter(c => c.type === type).length
                    if (count === 0) return null
                    const percent = Math.round((count / contents.length) * 100)
                    
                    return (
                      <div key={type} className={styles.distItem}>
                        <div className={styles.distHeader}>
                          <div className={styles.distLabel}>
                            <Icon size={16} />
                            <span>{label}</span>
                          </div>
                          <span className={styles.distValue}>{count}</span>
                        </div>
                        <div className={styles.distBar}>
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className={`${styles.distFill} ${color}`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Study Tips */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className={styles.sidebarCard}
              >
                <div className={styles.cardHeader}>
                  <div className={`${styles.cardIcon} ${styles.iconSuccess}`}>
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3>استراتيجية الدراسة</h3>
                    <p>خطة للتفوق</p>
                  </div>
                </div>
                
                <div className={styles.tipsList}>
                  {[
                    'ابدأ بالمحاضرة الأولى واتبع الترتيب',
                    'شاهد الفيديوهات بتركيز دون تسريع',
                    'حل الامتحانات بصدق لقياس مستواك',
                    'راجع ملاحظاتك باستمرار'
                  ].map((tip, idx) => (
                    <div key={idx} className={styles.tipItem}>
                      <div className={styles.tipNumber}>{idx + 1}</div>
                      <p>{tip}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </aside>
          </div>
        </section>

        {/* Back Button */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className={styles.backSection}
        >
          <button onClick={() => router.push(`/grades/${gradeSlug}`)} className={styles.backButton}>
            <ArrowRight size={20} />
            <span>العودة إلى الباقات</span>
          </button>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <Crown size={24} />
            <span>البارع محمود الديب</span>
          </div>
          <p className={styles.footerText}>منصة تعليمية متكاملة للتفوق الدراسي</p>
          <div className={styles.footerCopy}>
            © {new Date().getFullYear()} جميع الحقوق محفوظة
          </div>
        </div>
      </footer>
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