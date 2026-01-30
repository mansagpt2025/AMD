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
  ChevronDown, Check, LockKeyhole, TrendingUp
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

// Loading Component
function LoadingState() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingCard}>
        <div className={styles.spinner}>
          <div className={styles.spinnerInner}></div>
        </div>
        <p className={styles.loadingText}>جاري تحميل البيانات...</p>
      </div>
    </div>
  )
}

// Error Component
function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorCard}>
        <div className={styles.errorIconWrapper}>
          <AlertCircle className={styles.errorIcon} />
        </div>
        <h2 className={styles.errorTitle}>حدث خطأ</h2>
        <p className={styles.errorMessage}>{message}</p>
        <button onClick={onBack} className={styles.backButton}>
          <ArrowRight size={18} />
          العودة إلى الصفحة الرئيسية
        </button>
      </div>
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

  const getContentIcon = (type: string, status: string) => {
    const iconClass = status === 'completed' || status === 'passed' ? styles.iconSuccess :
                     status === 'failed' ? styles.iconError :
                     status === 'in_progress' ? styles.iconWarning : styles.iconDefault
    
    switch (type) {
      case 'video': return <Play className={iconClass} size={20} />
      case 'pdf': return <FileText className={iconClass} size={20} />
      case 'exam': return <HelpCircle className={iconClass} size={20} />
      case 'text': return <BookOpen className={iconClass} size={20} />
      default: return <PlayCircle className={iconClass} size={20} />
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
      {/* Top Navigation Bar */}
      <nav className={styles.topNav}>
        <div className={styles.navContent}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>
              <Crown size={24} color="#4F46E5" />
            </div>
            <span className={styles.brandText}>البارع محمود الديب</span>
          </div>
          <div className={styles.navLinks}>
            <button onClick={() => router.push('/')} className={styles.navLink}>الرئيسية</button>
            <ChevronRight size={16} className={styles.navSep} />
            <button onClick={() => router.push(`/grades/${gradeSlug}`)} className={styles.navLink}>
              {gradeSlug === 'first' ? 'الصف الأول' : gradeSlug === 'second' ? 'الصف الثاني' : 'الصف الثالث'}
            </button>
            <ChevronRight size={16} className={styles.navSep} />
            <span className={styles.navCurrent}>{packageData.name}</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroGrid}>
            {/* Image Side */}
            <motion.div 
              className={styles.heroImageWrapper}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className={styles.imageCard}>
                {packageData.image_url ? (
                  <img src={packageData.image_url} alt={packageData.name} className={styles.heroImage} />
                ) : (
                  <div className={styles.placeholderImage} style={{ background: `linear-gradient(135deg, ${theme.primary}20, ${theme.primary}40)` }}>
                    <GraduationCap size={80} color={theme.primary} />
                  </div>
                )}
                <div className={styles.imageBadge} style={{ background: theme.primary }}>
                  <Star size={16} fill="white" color="white" />
                  <span>باقة مميزة</span>
                </div>
              </div>
            </motion.div>

            {/* Content Side */}
            <motion.div 
              className={styles.heroText}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className={styles.tag} style={{ color: theme.primary, background: `${theme.primary}15` }}>
                {packageData.type === 'weekly' ? 'أسبوعي' : packageData.type === 'monthly' ? 'شهري' : packageData.type === 'term' ? 'ترم كامل' : 'عرض خاص'}
              </div>
              <h1 className={styles.title}>{packageData.name}</h1>
              <p className={styles.description}>{packageData.description}</p>

              {/* Stats Grid */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                    <BookOpen size={24} />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statNumber}>{lectures.length}</span>
                    <span className={styles.statLabel}>محاضرة</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: '#F0FDF4', color: '#16A34A' }}>
                    <Clock size={24} />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statNumber}>{packageData.duration_days}</span>
                    <span className={styles.statLabel}>يوم</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: '#FEF3C7', color: '#D97706' }}>
                    <Target size={24} />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statNumber}>{contents.length}</span>
                    <span className={styles.statLabel}>محتوى</span>
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              {contents.length > 0 && (
                <div className={styles.progressBox}>
                  <div className={styles.progressHeader}>
                    <div className={styles.progressTitle}>
                      <TrendingUp size={20} style={{ color: theme.primary }} />
                      <span>نسبة الإنجاز</span>
                    </div>
                    <span className={styles.progressPercent} style={{ color: theme.primary }}>{completion}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${completion}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={styles.progressFill}
                      style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent || theme.primary})` }}
                    />
                  </div>
                  <div className={styles.progressMeta}>
                    <span>تم إنجاز {userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length} من {contents.length} محتوى</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.container}>
          
          {/* Section Title */}
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} style={{ background: `${theme.primary}15` }}>
              <BookOpen size={28} style={{ color: theme.primary }} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>محتوى الباقة التعليمي</h2>
              <p className={styles.sectionSubtitle}>اختر المحاضرة لبدء رحلتك التعليمية</p>
            </div>
          </div>

          {/* Lectures Accordion */}
          <div className={styles.lecturesList}>
            {lectures.map((lecture, lectureIndex) => {
              const lectureContents = contents.filter(c => c.lecture_id === lecture.id)
              const isExpanded = activeSection === lecture.id
              const completedCount = lectureContents.filter(c => {
                const status = getContentStatus(c.id)
                return status === 'completed' || status === 'passed'
              }).length
              const progressPercent = lectureContents.length > 0 ? (completedCount / lectureContents.length) * 100 : 0

              return (
                <motion.div 
                  key={lecture.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: lectureIndex * 0.1 }}
                  className={`${styles.lectureItem} ${isExpanded ? styles.expanded : ''}`}
                >
                  <button 
                    className={styles.lectureButton}
                    onClick={() => toggleSection(lecture.id)}
                  >
                    <div className={styles.lectureMain}>
                      <div className={styles.lectureNumber} style={{ background: `${theme.primary}10`, color: theme.primary }}>
                        {lectureIndex + 1}
                      </div>
                      <div className={styles.lectureInfo}>
                        <h3 className={styles.lectureTitle}>{lecture.title}</h3>
                        {lecture.description && (
                          <p className={styles.lectureDesc}>{lecture.description}</p>
                        )}
                        <div className={styles.lectureMeta}>
                          <span className={styles.metaItem}>
                            <FileText size={14} />
                            {lectureContents.length} محتوى
                          </span>
                          <span className={styles.metaItem}>
                            <CheckCircle size={14} />
                            {completedCount} مكتمل
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.lectureActions}>
                      <div className={styles.miniProgress}>
                        <svg viewBox="0 0 36 36" className={styles.circularChart}>
                          <path
                            className={styles.circleBg}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className={styles.circle}
                            strokeDasharray={`${progressPercent}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            style={{ stroke: theme.primary }}
                          />
                        </svg>
                        <span className={styles.miniPercent}>{Math.round(progressPercent)}%</span>
                      </div>
                      <motion.div 
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        className={styles.expandBtn}
                      >
                        <ChevronDown size={20} color="#64748B" />
                      </motion.div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className={styles.contentsWrapper}
                      >
                        <div className={styles.contentsList}>
                          {lectureContents.map((content, contentIndex) => {
                            const isAccessible = isContentAccessible(lectureIndex, contentIndex, content)
                            const status = getContentStatus(content.id)
                            
                            return (
                              <motion.div
                                key={content.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: contentIndex * 0.05 }}
                                className={`${styles.contentCard} ${!isAccessible ? styles.locked : ''} ${status === 'completed' || status === 'passed' ? styles.done : ''}`}
                                onClick={() => isAccessible && handleContentClick(content, lectureIndex, contentIndex)}
                              >
                                <div className={styles.contentLeft}>
                                  <div className={`${styles.contentIcon} ${styles[status]}`}>
                                    {getContentIcon(content.type, status)}
                                    {(status === 'completed' || status === 'passed') && (
                                      <div className={styles.checkBadge}>
                                        <Check size={10} />
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className={styles.contentBody}>
                                    <h4 className={styles.contentTitle}>{content.title}</h4>
                                    {content.description && (
                                      <p className={styles.contentDesc}>{content.description}</p>
                                    )}
                                    <div className={styles.contentTags}>
                                      <span className={styles.tagItem}>
                                        {content.type === 'video' ? 'فيديو' : content.type === 'pdf' ? 'PDF' : content.type === 'exam' ? 'اختبار' : 'مقال'}
                                      </span>
                                      {content.duration_minutes > 0 && (
                                        <span className={styles.tagItem}>
                                          <Clock size={12} />
                                          {content.duration_minutes} د
                                        </span>
                                      )}
                                      {content.type === 'exam' && (
                                        <span className={`${styles.tagItem} ${styles.examTag}`}>
                                          النجاح {content.pass_score}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className={styles.contentRight}>
                                  {!isAccessible ? (
                                    <div className={styles.lockBadge}>
                                      <LockKeyhole size={16} />
                                      <span>مقفل</span>
                                    </div>
                                  ) : (
                                    <button className={`${styles.actionBtn} ${styles[status]}`}>
                                      {status === 'completed' || status === 'passed' ? (
                                        <>عرض النتيجة</>
                                      ) : status === 'failed' ? (
                                        <>إعادة المحاولة</>
                                      ) : status === 'in_progress' ? (
                                        <>متابعة</>
                                      ) : (
                                        <>ابدأ الآن</>
                                      )}
                                      <ArrowRight size={16} />
                                    </button>
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

          {/* Info Cards */}
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon} style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                <Shield size={24} />
              </div>
              <h3>نظام التقدم التدريجي</h3>
              <p>يجب إتمام كل محتوى قبل الانتقال للتالي لضمان أفضل استفادة</p>
            </div>
            
            <div className={styles.infoCard}>
              <div className={styles.infoIcon} style={{ background: '#F0FDF4', color: '#16A34A' }}>
                <Award size={24} />
              </div>
              <h3>شهادات الإتمام</h3>
              <p>احصل على شهادة إتمام بعد الانتهاء من جميع المحتويات بنجاح</p>
            </div>
            
            <div className={styles.infoCard}>
              <div className={styles.infoIcon} style={{ background: '#FEF3C7', color: '#D97706' }}>
                <Calendar size={24} />
              </div>
              <h3>مدة الوصول</h3>
              <p>صلاحية الوصول حتى: <strong>{userPackage?.expires_at ? new Date(userPackage.expires_at).toLocaleDateString('ar-EG') : 'غير محدد'}</strong></p>
            </div>
          </div>

          {/* Back Button */}
          <div className={styles.backSection}>
            <button 
              onClick={() => router.push(`/grades/${gradeSlug}`)}
              className={styles.backBtn}
            >
              <ArrowRight size={20} />
              <span>العودة إلى الصفحة السابقة</span>
            </button>
          </div>
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