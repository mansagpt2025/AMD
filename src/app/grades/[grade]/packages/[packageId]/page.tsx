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
  Zap, TrendingUp, PlaySquare, ChevronDown
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

// Loading Component - New Glass Design
function LoadingState() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingGlass}>
        <div className={styles.spinnerContainer}>
          <div className={styles.spinnerRing}></div>
          <div className={styles.spinnerRing}></div>
          <div className={styles.spinnerCenter}>
            <Loader2 className={styles.spinnerIcon} />
          </div>
        </div>
        <div className={styles.loadingText}>
          <span className={styles.loadingTitle}>جاري التحميل</span>
          <span className={styles.loadingDots}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
        <p className={styles.loadingSubtext}>نحضر لك المحتوى التعليمي...</p>
      </div>
    </div>
  )
}

// Error Component - New Clean Design
function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className={styles.errorContainer}>
      <motion.div 
        className={styles.errorCard}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.errorIconWrapper}>
          <div className={styles.errorIconBg}>
            <AlertCircle className={styles.errorIcon} />
          </div>
          <div className={styles.errorPulse} />
        </div>
        
        <h2 className={styles.errorTitle}>عذراً، حدث خطأ</h2>
        <p className={styles.errorMessage}>{message}</p>
        
        <button onClick={onBack} className={styles.errorBackButton}>
          <ArrowRight size={18} />
          <span>العودة للصفحة الرئيسية</span>
        </button>
      </motion.div>
    </div>
  )
}

// Floating Particles Component
function FloatingParticles() {
  return (
    <div className={styles.particlesContainer}>
      {[...Array(6)].map((_, i) => (
        <div 
          key={i} 
          className={styles.particle}
          style={{ 
            '--delay': `${i * 0.5}s`,
            '--size': `${Math.random() * 10 + 5}px`,
            '--left': `${Math.random() * 100}%`
          } as React.CSSProperties}
        />
      ))}
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
      <FloatingParticles />
      
      {/* Top Navigation Bar */}
      <nav className={styles.topNav}>
        <div className={styles.navContent}>
          <div className={styles.brandBadge}>
            <Crown className={styles.brandIconSmall} />
            <span>البارع محمود الديب</span>
          </div>
          
          <div className={styles.breadcrumbModern}>
            <button onClick={() => router.push('/')} className={styles.breadcrumbLink}>
              الرئيسية
            </button>
            <ChevronRight className={styles.breadcrumbArrow} size={16} />
            <button onClick={() => router.push(`/grades/${gradeSlug}`)} className={styles.breadcrumbLink}>
              {gradeSlug === 'first' ? 'الصف الأول' : gradeSlug === 'second' ? 'الصف الثاني' : 'الصف الثالث'}
            </button>
            <ChevronRight className={styles.breadcrumbArrow} size={16} />
            <span className={styles.breadcrumbCurrent}>{packageData.name}</span>
          </div>
        </div>
      </nav>

      {/* Hero Section - Clean White Design */}
      <header className={styles.heroSection} style={{ 
        background: `linear-gradient(135deg, ${theme.primary}08 0%, ${theme.accent}05 100%)`,
        borderBottom: `1px solid ${theme.primary}15`
      }}>
        <div className={styles.heroGrid}>
          {/* Left: Image Card */}
          <motion.div 
            className={styles.heroImageCard}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className={styles.imageFrame} style={{ borderColor: theme.primary + '20' }}>
              {packageData.image_url ? (
                <>
                  <img src={packageData.image_url} alt={packageData.name} className={styles.heroImage} />
                  <div className={styles.imageOverlay} />
                  <div className={styles.imageBadge} style={{ background: theme.accent }}>
                    <Sparkles size={14} />
                    <span>باقة مميزة</span>
                  </div>
                </>
              ) : (
                <div className={styles.placeholderImage} style={{ background: theme.primary + '08' }}>
                  <GraduationCap size={64} style={{ color: theme.primary }} />
                </div>
              )}
              
              {/* Floating Stats */}
              <div className={styles.floatingStat} style={{ 
                background: theme.primary,
                boxShadow: `0 10px 30px ${theme.primary}40`
              }}>
                <PlayCircle size={20} />
                <div>
                  <span className={styles.floatingStatValue}>{lectures.length}</span>
                  <span className={styles.floatingStatLabel}>محاضرة</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div 
            className={styles.heroContent}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            <div className={styles.tagRow}>
              <span 
                className={styles.packageTypeTag}
                style={{ 
                  color: theme.primary,
                  background: theme.primary + '10',
                  border: `1px solid ${theme.primary}20`
                }}
              >
                {packageData.type === 'weekly' ? 'أسبوعي' : packageData.type === 'monthly' ? 'شهري' : packageData.type === 'term' ? 'ترم كامل' : 'عرض خاص'}
              </span>
              
              {completion > 0 && (
                <span className={styles.progressBadge}>
                  <TrendingUp size={14} />
                  {completion}% إنجاز
                </span>
              )}
            </div>

            <h1 className={styles.heroTitle} style={{ color: theme.primary }}>
              {packageData.name}
            </h1>
            
            <p className={styles.heroDescription}>
              {packageData.description}
            </p>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard} style={{ background: theme.primary + '05' }}>
                <div className={styles.statIconBox} style={{ background: theme.primary + '15', color: theme.primary }}>
                  <Clock size={22} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{packageData.duration_days}</span>
                  <span className={styles.statLabel}>يوم</span>
                </div>
              </div>

              <div className={styles.statCard} style={{ background: theme.accent + '05' }}>
                <div className={styles.statIconBox} style={{ background: theme.accent + '15', color: theme.accent }}>
                  <BookOpen size={22} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{contents.length}</span>
                  <span className={styles.statLabel}>محتوى</span>
                </div>
              </div>

              <div className={styles.statCard} style={{ background: '#f0fdf4' }}>
                <div className={styles.statIconBox} style={{ background: '#dcfce7', color: '#16a34a' }}>
                  <Zap size={22} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>
                    {userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length}
                  </span>
                  <span className={styles.statLabel}>مكتمل</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {contents.length > 0 && (
              <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                  <span className={styles.progressLabel}>
                    <BarChart3 size={18} style={{ color: theme.primary }} />
                    نسبة الإنجاز
                  </span>
                  <span className={styles.progressPercent} style={{ color: theme.primary }}>
                    {completion}%
                  </span>
                </div>
                <div className={styles.progressBarContainer}>
                  <div className={styles.progressTrack}>
                    <motion.div 
                      className={styles.progressFill}
                      initial={{ width: 0 }}
                      animate={{ width: `${completion}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      style={{ 
                        background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`,
                        boxShadow: `0 0 20px ${theme.primary}40`
                      }}
                    />
                  </div>
                </div>
                <div className={styles.progressMeta}>
                  <span>
                    <CheckCircle size={14} style={{ color: '#16a34a' }} />
                    {userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length} مكتمل
                  </span>
                  <span>
                    <Clock size={14} style={{ color: '#64748b' }} />
                    {contents.length - userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length} متبقي
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Section Header */}
        <div className={styles.sectionHeaderModern}>
          <div className={styles.sectionTitleBlock}>
            <div 
              className={styles.sectionIconCircle}
              style={{ 
                background: `linear-gradient(135deg, ${theme.primary}15, ${theme.accent}10)`,
                color: theme.primary
              }}
            >
              <BookOpen size={28} />
            </div>
            <div>
              <h2 className={styles.sectionMainTitle}>محتوى الباقة</h2>
              <p className={styles.sectionSubTitle}>اختر المحاضرة لبدء رحلتك التعليمية</p>
            </div>
          </div>
        </div>

        {/* Lectures Accordion */}
        {lectures.length === 0 ? (
          <motion.div 
            className={styles.emptyStateModern}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.emptyIconCircle} style={{ background: theme.primary + '10' }}>
              <BookOpen size={40} style={{ color: theme.primary }} />
            </div>
            <h3>لا توجد محاضرات متاحة</h3>
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
                  className={`${styles.lectureItem} ${isExpanded ? styles.expanded : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: lectureIndex * 0.1 }}
                  style={{
                    borderLeft: isExpanded ? `4px solid ${theme.primary}` : '4px solid transparent'
                  }}
                >
                  {/* Lecture Header */}
                  <div 
                    className={styles.lectureHeaderModern}
                    onClick={() => toggleSection(lecture.id)}
                  >
                    <div className={styles.lectureHeaderLeft}>
                      <div 
                        className={styles.lectureNumber}
                        style={{ 
                          background: isExpanded ? theme.primary : theme.primary + '10',
                          color: isExpanded ? 'white' : theme.primary
                        }}
                      >
                        {lectureIndex + 1}
                      </div>
                      
                      <div className={styles.lectureInfoModern}>
                        <h3 className={styles.lectureTitleModern}>{lecture.title}</h3>
                        {lecture.description && (
                          <p className={styles.lectureDescModern}>{lecture.description}</p>
                        )}
                        <div className={styles.lectureMetaModern}>
                          <span className={styles.metaItem}>
                            <FileText size={14} />
                            {lectureContents.length} محتوى
                          </span>
                          <span className={styles.metaItem} style={{ color: progressPercent === 100 ? '#16a34a' : '#64748b' }}>
                            <CheckCircle size={14} />
                            {completedContents}/{lectureContents.length} مكتمل
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.lectureHeaderRight}>
                      {/* Circular Progress */}
                      <div className={styles.circularProgress} style={{
                        background: `conic-gradient(${theme.primary} ${progressPercent * 3.6}deg, #e2e8f0 0deg)`
                      }}>
                        <div className={styles.circularProgressInner}>
                          <span style={{ color: theme.primary }}>{progressPercent}%</span>
                        </div>
                      </div>

                      <motion.div 
                        className={styles.expandButton}
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        style={{ 
                          background: isExpanded ? theme.primary : '#f1f5f9',
                          color: isExpanded ? 'white' : '#64748b'
                        }}
                      >
                        <ChevronDown size={20} />
                      </motion.div>
                    </div>
                  </div>

                  {/* Lecture Contents */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className={styles.lectureContents}
                      >
                        <div className={styles.contentsGrid}>
                          {lectureContents.map((content, contentIndex) => {
                            const isAccessible = isContentAccessible(lectureIndex, contentIndex, content)
                            const status = getContentStatus(content.id)
                            
                            const statusConfig = {
                              completed: { bg: '#dcfce7', color: '#16a34a', icon: CheckCircle, text: 'مكتمل' },
                              passed: { bg: '#dcfce7', color: '#16a34a', icon: CheckCircle, text: 'ناجح' },
                              failed: { bg: '#fee2e2', color: '#dc2626', icon: XCircle, text: 'راسب' },
                              in_progress: { bg: '#fef3c7', color: '#d97706', icon: Play, text: 'متابعة' },
                              not_started: { bg: '#f1f5f9', color: '#64748b', icon: Lock, text: 'مقفل' }
                            }

                            const config = statusConfig[status] || statusConfig.not_started
                            const StatusIcon = config.icon

                            return (
                              <motion.div
                                key={content.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: contentIndex * 0.05 }}
                                className={`${styles.contentCard} ${!isAccessible ? styles.lockedCard : ''} ${status === 'completed' || status === 'passed' ? styles.completedCard : ''}`}
                                onClick={() => isAccessible && handleContentClick(content, lectureIndex, contentIndex)}
                                style={{
                                  cursor: isAccessible ? 'pointer' : 'not-allowed',
                                  opacity: isAccessible ? 1 : 0.7
                                }}
                              >
                                <div className={styles.contentCardHeader}>
                                  <div 
                                    className={styles.contentIconBox}
                                    style={{ 
                                      background: isAccessible ? theme.primary + '10' : '#f1f5f9',
                                      color: isAccessible ? theme.primary : '#94a3b8'
                                    }}
                                  >
                                    {getContentIcon(content.type)}
                                  </div>
                                  
                                  <div className={styles.contentCardInfo}>
                                    <h4 className={styles.contentCardTitle}>{content.title}</h4>
                                    {content.description && (
                                      <p className={styles.contentCardDesc}>{content.description}</p>
                                    )}
                                    <div className={styles.contentCardMeta}>
                                      <span className={styles.contentTypeTag}>
                                        {content.type === 'video' ? 'فيديو' : content.type === 'pdf' ? 'PDF' : content.type === 'exam' ? 'اختبار' : 'نص'}
                                      </span>
                                      {content.duration_minutes > 0 && (
                                        <span className={styles.contentDurationTag}>
                                          <Clock size={12} />
                                          {content.duration_minutes} دقيقة
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className={styles.contentCardAction}>
                                  {!isAccessible ? (
                                    <div className={styles.lockedBadge}>
                                      <Lock size={14} />
                                      <span>مقفل</span>
                                    </div>
                                  ) : (
                                    <motion.button
                                      className={styles.actionBtnModern}
                                      style={{ 
                                        background: status === 'completed' || status === 'passed' ? '#dcfce7' : status === 'failed' ? '#fee2e2' : theme.primary,
                                        color: status === 'completed' || status === 'passed' ? '#16a34a' : status === 'failed' ? '#dc2626' : 'white'
                                      }}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <StatusIcon size={16} />
                                      <span>{config.text}</span>
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

        {/* Info Section */}
        <motion.section 
          className={styles.infoSection}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className={styles.infoCard} style={{ background: theme.primary + '04' }}>
            <div className={styles.infoHeader}>
              <div 
                className={styles.infoIconBox}
                style={{ 
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                  boxShadow: `0 10px 25px ${theme.primary}40`
                }}
              >
                <Award size={24} color="white" />
              </div>
              <h3>معلومات مهمة</h3>
            </div>
            
            <div className={styles.infoList}>
              {(packageData.type === 'monthly' || packageData.type === 'term') && (
                <>
                  <div className={styles.infoItem}>
                    <div className={styles.infoItemIcon} style={{ background: theme.accent + '15', color: theme.accent }}>
                      <Shield size={18} />
                    </div>
                    <p>يجب إتمام كل محتوى قبل الانتقال للذي يليه</p>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoItemIcon} style={{ background: theme.accent + '15', color: theme.accent }}>
                      <Target size={18} />
                    </div>
                    <p>لابد من اجتياز الاختبار بنجاح قبل الانتقال للمحاضرة التالية</p>
                  </div>
                </>
              )}
              
              {userPackage?.expires_at && (
                <div className={styles.infoItem}>
                  <div className={styles.infoItemIcon} style={{ background: '#dbeafe', color: '#2563eb' }}>
                    <Calendar size={18} />
                  </div>
                  <p>
                    ينتهي اشتراكك في: <strong>{new Date(userPackage.expires_at).toLocaleDateString('ar-EG')}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Back Button */}
        <motion.div 
          className={styles.backSectionModern}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button 
            onClick={() => router.push(`/grades/${gradeSlug}`)}
            className={styles.backButtonModern}
            style={{ 
              color: theme.primary,
              borderColor: theme.primary + '30'
            }}
          >
            <ArrowRight size={20} />
            <span>العودة للباقات</span>
          </button>
        </motion.div>
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
