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
  MoreHorizontal, Bookmark, CheckIcon, XIcon,
  ChevronUp, BarChart, Target as TargetIcon,
  FileVideo, BookCheck, Timer, AwardIcon,
  Download, Eye, StarIcon, UserCheck,
  Rocket, Brain, Target as TargetLucide,
  Medal, Clock4, Globe, Users as UsersIcon,
  BookmarkIcon, ZapIcon, CrownIcon,
  SparklesIcon, TrendingUp as TrendingUpIcon,
  ShieldCheck
} from 'lucide-react'
import styles from './PackagePage.module.css'

// Types (نفس الأنواع مع تعديلات طفيفة)
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
  var __packagePageNewSupabase: ReturnType<typeof createBrowserClient> | undefined
}

const getSupabase = () => {
  if (typeof window === 'undefined') return null
  
  if (!globalThis.__packagePageNewSupabase) {
    globalThis.__packagePageNewSupabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return globalThis.__packagePageNewSupabase
}

// Loading Component الجديد
function LoadingState() {
  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingContainer}>
        <div className={styles.loadingAnimation}>
          <div className={styles.loadingOrbit}>
            <div className={styles.loadingCore}>
              <GraduationCap className={styles.loadingIcon} size={32} />
            </div>
            <div className={styles.orbitRing}></div>
            <div className={styles.orbitRing}></div>
            <div className={styles.orbitRing}></div>
          </div>
        </div>
        <div className={styles.loadingText}>
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            جاري تحميل الباقة
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            نجهز أفضل تجربة تعليمية لك...
          </motion.p>
        </div>
      </div>
    </div>
  )
}

// Error Component الجديد
function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className={styles.errorOverlay}>
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={styles.errorCard}
      >
        <div className={styles.errorVisual}>
          <div className={styles.errorOrb}></div>
          <AlertCircle className={styles.errorIcon} size={64} />
        </div>
        <div className={styles.errorContent}>
          <h2>عذراً، حدث خطأ</h2>
          <p>{message}</p>
          <div className={styles.errorActions}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className={styles.errorButtonPrimary}
            >
              <Home size={18} />
              العودة للرئيسية
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className={styles.errorButtonSecondary}
            >
              <RefreshCw size={18} />
              إعادة المحاولة
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Import missing icon
import { RefreshCw } from 'lucide-react'

// Main Component الجديد
function PackageContentNew() {
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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
            <TargetIcon size={20} />
          </div>
        )
      case 'text':
        return (
          <div className={`${styles.contentIcon} ${styles.iconText} ${isCompleted ? styles.iconCompleted : ''}`}>
            <BookCheck size={20} />
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
      weekly: { text: 'أسبوعي', color: styles.badgeWeekly, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      monthly: { text: 'شهري', color: styles.badgeMonthly, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
      term: { text: 'ترم كامل', color: styles.badgeTerm, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
      offer: { text: 'عرض خاص', color: styles.badgeOffer, gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }
    }
    return badges[type as keyof typeof badges] || { text: type, color: styles.badgeDefault, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
  }

  const getGradeName = (slug: string) => {
    const grades: { [key: string]: string } = {
      'first': 'الصف الأول الثانوي',
      'second': 'الصف الثاني الثانوي',
      'third': 'الصف الثالث الثانوي'
    }
    return grades[slug] || slug
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
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
    <div className={styles.pageContainer}>
      {/* Animated Background */}
      <div className={styles.backgroundEffects}>
        <div className={styles.gradientOrb}></div>
        <div className={styles.gradientOrb}></div>
        <div className={styles.gradientOrb}></div>
        <div className={styles.floatingShapes}>
          <div className={styles.shape}></div>
          <div className={styles.shape}></div>
          <div className={styles.shape}></div>
        </div>
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className={styles.header}
      >
        <div className={styles.headerContent}>
          {/* Logo and Navigation */}
          <div className={styles.headerMain}>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className={styles.logoSection}
            >
              <div className={styles.logo}>
                <CrownIcon size={28} />
                <span className={styles.logoText}>البارع محمود الديب</span>
              </div>
            </motion.div>

            <nav className={styles.navigation}>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/')}
                className={styles.navButton}
              >
                <Home size={20} />
                <span>الرئيسية</span>
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(`/grades/${gradeSlug}`)}
                className={styles.navButton}
              >
                <GraduationCap size={20} />
                <span>{getGradeName(gradeSlug)}</span>
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={styles.navButton}
              >
                <BarChart3 size={20} />
                <span>الإحصائيات</span>
              </motion.button>
            </nav>
          </div>

          {/* User Actions */}
          <div className={styles.headerActions}>
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              className={styles.shareButton}
            >
              <Share2 size={22} />
            </motion.button>
            
            <div className={styles.userInfo}>
              <div className={styles.userProgress}>
                <div className={styles.progressCircle}>
                  <motion.svg
                    viewBox="0 0 36 36"
                    className={styles.progressCircleSvg}
                  >
                    <path
                      className={styles.progressCircleBg}
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: completion / 100 }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      className={styles.progressCircleFill}
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </motion.svg>
                  <span className={styles.progressText}>{completion}%</span>
                </div>
                <span className={styles.progressLabel}>تقدمك</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className={styles.mainContent}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={styles.heroContainer}
          >
            {/* Package Header Card */}
            <div className={styles.heroCard}>
              <div className={styles.heroVisual}>
                <div className={styles.imageContainer}>
                  <div className={styles.imageWrapper}>
                    {packageData.image_url ? (
                      <img 
                        src={packageData.image_url} 
                        alt={packageData.name}
                        className={styles.packageImage}
                      />
                    ) : (
                      <div className={styles.imagePlaceholder}>
                        <GraduationCap size={64} />
                      </div>
                    )}
                    <div className={styles.imageGradient}></div>
                  </div>
                  
                  {/* Floating Badges */}
                  <div className={styles.floatingBadges}>
                    <motion.div 
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                      className={`${styles.typeBadge} ${typeBadge.color}`}
                      style={{ background: typeBadge.gradient }}
                    >
                      {typeBadge.text}
                    </motion.div>
                    
                    <motion.div 
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', delay: 0.4 }}
                      className={styles.gradeBadge}
                    >
                      {getGradeName(gradeSlug)}
                    </motion.div>
                  </div>
                </div>
              </div>

              <div className={styles.heroContent}>
                <div className={styles.heroHeader}>
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h1 className={styles.packageTitle}>{packageData.name}</h1>
                    <p className={styles.packageDescription}>{packageData.description}</p>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className={styles.heroStats}
                  >
                    <div className={styles.statItem}>
                      <div className={styles.statIcon}>
                        <BookOpen size={24} />
                      </div>
                      <div>
                        <span className={styles.statNumber}>{lectures.length}</span>
                        <span className={styles.statLabel}>محاضرة</span>
                      </div>
                    </div>
                    
                    <div className={styles.statItem}>
                      <div className={styles.statIcon}>
                        <Video size={24} />
                      </div>
                      <div>
                        <span className={styles.statNumber}>{contents.length}</span>
                        <span className={styles.statLabel}>محتوى</span>
                      </div>
                    </div>
                    
                    <div className={styles.statItem}>
                      <div className={styles.statIcon}>
                        <Clock4 size={24} />
                      </div>
                      <div>
                        <span className={styles.statNumber}>{packageData.duration_days}</span>
                        <span className={styles.statLabel}>يوم</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Progress Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className={styles.progressSection}
                >
                  <div className={styles.progressHeader}>
                    <div className={styles.progressTitle}>
                      <TrendingUpIcon size={24} />
                      <div>
                        <h3>مسار تقدمك</h3>
                        <p>تابع رحلتك التعليمية</p>
                      </div>
                    </div>
                    <div className={styles.completionRate}>
                      <span>{completion}</span>%
                    </div>
                  </div>

                  <div className={styles.progressBarContainer}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${completion}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={styles.progressBar}
                      style={{ background: typeBadge.gradient }}
                    >
                      <div className={styles.progressGlow}></div>
                    </motion.div>
                  </div>

                  <div className={styles.progressDetails}>
                    <div className={styles.progressStat}>
                      <div className={`${styles.statDot} ${styles.dotCompleted}`}></div>
                      <span>{completedCount} مكتمل</span>
                    </div>
                    <div className={styles.progressStat}>
                      <div className={`${styles.statDot} ${styles.dotProgress}`}></div>
                      <span>{inProgressCount} قيد التقدم</span>
                    </div>
                    <div className={styles.progressStat}>
                      <div className={`${styles.statDot} ${styles.dotPending}`}></div>
                      <span>{remainingCount} متبقي</span>
                    </div>
                  </div>
                </motion.div>

                {/* Expiry Info */}
                {userPackage?.expires_at && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className={styles.expiryInfo}
                  >
                    <CalendarDays size={20} />
                    <span>
                      ينتهي الاشتراك في: 
                      <strong>
                        {new Date(userPackage.expires_at).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </strong>
                    </span>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Content Section */}
        <section className={styles.contentSection}>
          <div className={styles.contentLayout}>
            {/* Main Content */}
            <div className={styles.mainContentArea}>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={styles.contentHeader}
              >
                <div className={styles.sectionTitle}>
                  <BookOpen size={32} />
                  <div>
                    <h2>المحاضرات والمواد التعليمية</h2>
                    <p>ابدأ رحلة التعلم والتفوق</p>
                  </div>
                </div>
                
                <div className={styles.contentStats}>
                  <span className={styles.statPill}>
                    {lectures.length} محاضرة
                  </span>
                  <span className={styles.statPill}>
                    {contents.length} محتوى
                  </span>
                </div>
              </motion.div>

              {/* Lectures List */}
              <div className={styles.lecturesContainer}>
                {lectures.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={styles.emptyState}
                  >
                    <div className={styles.emptyIllustration}>
                      <BookOpen size={64} />
                    </div>
                    <h3>لا توجد محاضرات متاحة حالياً</h3>
                    <p>سيتم إضافة المحتوى قريباً</p>
                  </motion.div>
                ) : (
                  lectures.map((lecture, lectureIndex) => {
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
                        className={`${styles.lectureCard} ${isFullyCompleted ? styles.completed : ''}`}
                      >
                        <div 
                          className={styles.lectureHeader}
                          onClick={() => toggleSection(lecture.id)}
                        >
                          <div className={styles.lectureInfo}>
                            <div className={styles.lectureNumber}>
                              <span>{lectureIndex + 1}</span>
                              {isFullyCompleted && (
                                <motion.div 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className={styles.completedBadge}
                                >
                                  <CheckIcon size={16} />
                                </motion.div>
                              )}
                            </div>
                            
                            <div className={styles.lectureContent}>
                              <div className={styles.lectureTitleRow}>
                                <h3>{lecture.title}</h3>
                                <div className={styles.lectureMeta}>
                                  <span className={`${styles.statusTag} ${
                                    isFullyCompleted ? styles.tagSuccess : 
                                    progressPercent > 0 ? styles.tagWarning : 
                                    styles.tagInfo
                                  }`}>
                                    {isFullyCompleted ? 'مكتمل' : progressPercent > 0 ? 'قيد الدراسة' : 'جديد'}
                                  </span>
                                  <span className={styles.contentCount}>
                                    {lectureContents.length} عنصر
                                  </span>
                                </div>
                              </div>
                              
                              {lecture.description && (
                                <p className={styles.lectureDescription}>{lecture.description}</p>
                              )}
                              
                              <div className={styles.lectureProgress}>
                                <div className={styles.progressInfo}>
                                  <span>مستوى الإنجاز</span>
                                  <span>{progressPercent}%</span>
                                </div>
                                <div className={styles.progressTrack}>
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 1, delay: 0.2 }}
                                    className={`${styles.progressFill} ${
                                      isFullyCompleted ? styles.fillSuccess : 
                                      progressPercent > 0 ? styles.fillWarning : ''
                                    }`}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <motion.div 
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                            className={styles.expandButton}
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
                              <div className={styles.contentsGrid}>
                                {lectureContents.map((content, contentIndex) => {
                                  const isAccessible = isContentAccessible(lectureIndex, contentIndex, content)
                                  const status = getContentStatus(content.id)
                                  const isCompleted = status === 'completed' || status === 'passed'
                                  const isFailed = status === 'failed'
                                  const isInProgress = status === 'in_progress'
                                  
                                  return (
                                    <motion.div
                                      key={content.id}
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: contentIndex * 0.05 }}
                                      className={`${styles.contentCard} ${
                                        !isAccessible ? styles.locked : 
                                        isCompleted ? styles.completed : 
                                        isFailed ? styles.failed : ''
                                      }`}
                                      onMouseEnter={() => setHoveredContent(content.id)}
                                      onMouseLeave={() => setHoveredContent(null)}
                                      onClick={() => handleContentClick(content, lectureIndex, contentIndex)}
                                    >
                                      <div className={styles.contentCardInner}>
                                        <div className={styles.contentHeader}>
                                          <div className={styles.contentIconWrapper}>
                                            {getContentIcon(content.type, status)}
                                          </div>
                                          
                                          <div className={styles.contentDetails}>
                                            <h4>{content.title}</h4>
                                            {content.description && (
                                              <p className={styles.contentDescription}>{content.description}</p>
                                            )}
                                            
                                            <div className={styles.contentMeta}>
                                              <span className={styles.metaTag}>
                                                {content.type === 'video' ? 'فيديو' : 
                                                 content.type === 'pdf' ? 'PDF' : 
                                                 content.type === 'exam' ? 'امتحان' : 'مقال'}
                                              </span>
                                              {content.duration_minutes > 0 && (
                                                <span className={styles.metaTag}>
                                                  <Clock size={14} />
                                                  {content.duration_minutes} دقيقة
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          
                                          <div className={styles.contentStatus}>
                                            <span className={`${styles.statusBadge} ${getStatusColor(status)}`}>
                                              {getStatusText(status)}
                                            </span>
                                            
                                            {content.type === 'exam' && content.pass_score && (
                                              <span className={styles.passScore}>
                                                <TargetIcon size={14} />
                                                {content.pass_score}% للنجاح
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div className={styles.contentActions}>
                                          {!isAccessible ? (
                                            <div className={styles.lockedMessage}>
                                              <Lock size={18} />
                                              <span>محظور - أكمل المتطلبات السابقة</span>
                                            </div>
                                          ) : (
                                            <motion.button
                                              whileHover={{ scale: 1.05 }}
                                              whileTap={{ scale: 0.95 }}
                                              className={`${styles.actionButton} ${
                                                isCompleted ? styles.buttonSuccess : 
                                                isFailed ? styles.buttonDanger : 
                                                isInProgress ? styles.buttonWarning : 
                                                styles.buttonPrimary
                                              }`}
                                            >
                                              {isCompleted ? (
                                                <>
                                                  <CheckCircle size={18} />
                                                  <span>تم الإكمال</span>
                                                </>
                                              ) : isFailed ? (
                                                <>
                                                  <XCircle size={18} />
                                                  <span>إعادة المحاولة</span>
                                                </>
                                              ) : isInProgress ? (
                                                <>
                                                  <Play size={18} />
                                                  <span>استكمال</span>
                                                </>
                                              ) : (
                                                <>
                                                  <Play size={18} />
                                                  <span>بدء الدرس</span>
                                                </>
                                              )}
                                            </motion.button>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Hover Effect */}
                                      {hoveredContent === content.id && isAccessible && (
                                        <motion.div
                                          layoutId="contentHover"
                                          className={styles.cardHoverEffect}
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
                  })
                )}
              </div>
            </div>

            {/* Sidebar */}
            <motion.aside 
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}
            >
              <button 
                onClick={toggleSidebar}
                className={styles.sidebarToggle}
              >
                <ChevronLeft size={20} />
              </button>

              <div className={styles.sidebarContent}>
                {/* Content Distribution */}
                <div className={styles.sidebarCard}>
                  <div className={styles.cardHeader}>
                    <BarChart3 size={24} />
                    <div>
                      <h3>توزيع المحتوى</h3>
                      <p>تحليل تفصيلي</p>
                    </div>
                  </div>
                  
                  <div className={styles.distribution}>
                    {[
                      { type: 'video', label: 'فيديوهات', icon: Video, color: styles.distBlue },
                      { type: 'pdf', label: 'ملفات PDF', icon: File, color: styles.distRed },
                      { type: 'exam', label: 'امتحانات', icon: TargetIcon, color: styles.distPurple },
                      { type: 'text', label: 'نصوص', icon: BookOpen, color: styles.distGreen }
                    ].map((item) => {
                      const count = contents.filter(c => c.type === item.type).length
                      if (count === 0) return null
                      const percentage = Math.round((count / contents.length) * 100)
                      
                      return (
                        <div key={item.type} className={styles.distItem}>
                          <div className={styles.distHeader}>
                            <div className={styles.distLabel}>
                              <item.icon size={18} />
                              <span>{item.label}</span>
                            </div>
                            <span className={styles.distValue}>{count}</span>
                          </div>
                          <div className={styles.distBar}>
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                              className={`${styles.distFill} ${item.color}`}
                            />
                            <span className={styles.distPercent}>{percentage}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Study Tips */}
                <div className={styles.sidebarCard}>
                  <div className={styles.cardHeader}>
                    <SparklesIcon size={24} />
                    <div>
                      <h3>نصائح للتفوق</h3>
                      <p>استراتيجيات التعلم</p>
                    </div>
                  </div>
                  
                  <div className={styles.tipsList}>
                    {[
                      { icon: Brain, text: 'ابدأ بالمحتوى بالترتيب المحدد' },
                      { icon: Clock, text: 'خصص وقتاً يومياً للدراسة' },
                      { icon: BookmarkIcon, text: 'خذ ملاحظات أثناء المشاهدة' },
                      { icon: RefreshCw, text: 'راجع المواد السابقة بانتظام' }
                    ].map((tip, index) => (
                      <div key={index} className={styles.tipItem}>
                        <div className={styles.tipIcon}>
                          <tip.icon size={18} />
                        </div>
                        <p>{tip.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Requirements */}
                <div className={styles.sidebarCard}>
                  <div className={styles.cardHeader}>
                    <ShieldCheck size={24} />
                    <div>
                      <h3>متطلبات النظام</h3>
                      <p>قواعد الباقة</p>
                    </div>
                  </div>
                  
                  <div className={styles.systemInfo}>
                    {(packageData.type === 'monthly' || packageData.type === 'term') && (
                      <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>
                          <Lock size={16} />
                        </div>
                        <p>يجب إكمال كل درس قبل الانتقال للآخر</p>
                      </div>
                    )}
                    
                    <div className={styles.infoItem}>
                      <div className={styles.infoIcon}>
                        <Award size={16} />
                      </div>
                      <p>احصل على شهادة عند إكمال جميع المحتويات</p>
                    </div>
                    
                    <div className={styles.infoItem}>
                      <div className={styles.infoIcon}>
                        <Download size={16} />
                      </div>
                      <p>يمكنك تحميل المواد للدراسة دون اتصال</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </section>
      </main>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className={styles.footer}
      >
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.brandLogo}>
              <Crown size={32} />
            </div>
            <div className={styles.brandInfo}>
              <h3>منصة البارع محمود الديب</h3>
              <p>رحلة تعليمية نحو التفوق والتميز</p>
            </div>
          </div>
          
          <div className={styles.footerLinks}>
            <button onClick={() => router.push('/')} className={styles.footerLink}>
              الرئيسية
            </button>
            <button onClick={() => router.push('/about')} className={styles.footerLink}>
              عن المنصة
            </button>
            <button onClick={() => router.push('/contact')} className={styles.footerLink}>
              تواصل معنا
            </button>
            <button onClick={() => router.push('/privacy')} className={styles.footerLink}>
              الخصوصية
            </button>
          </div>
          
          <div className={styles.footerCopyright}>
            © {new Date().getFullYear()} جميع الحقوق محفوظة لمنصة البارع محمود الديب
          </div>
        </div>
      </motion.footer>
    </div>
  )
}

export default function PackagePageNew() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PackageContentNew />
    </Suspense>
  )
}