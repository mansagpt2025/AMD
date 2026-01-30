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
  Play, FileText, HelpCircle, Crown, Star
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
      <div className={styles.loadingWrapper}>
        <div className={styles.spinnerRing}></div>
        <div className={styles.spinnerRing}></div>
        <div className={styles.spinnerRing}></div>
      </div>
      <p className={styles.loadingText}>جاري تحميل البيانات...</p>
    </div>
  )
}

// Error Component
function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <div className={styles.errorGlow}>
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

// Wave Animation Component
function WaveAnimation() {
  return (
    <div className={styles.waveContainer}>
      <svg className={styles.waves} xmlns="http://www.w3.org/2000/svg" viewBox="0 24 150 28" preserveAspectRatio="none">
        <defs>
          <path id="wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
        </defs>
        <g className={styles.waveParallax}>
          <use href="#wave" x="48" y="0" fill="rgba(255,255,255,0.1)" />
          <use href="#wave" x="48" y="3" fill="rgba(255,255,255,0.07)" />
          <use href="#wave" x="48" y="5" fill="rgba(255,255,255,0.05)" />
          <use href="#wave" x="48" y="7" fill="rgba(255,255,255,0.03)" />
        </g>
      </svg>
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
      case 'video': return <Play className={styles.contentTypeIcon} />
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
      <div className={styles.header} style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}>
        <WaveAnimation />
        
        <div className={styles.headerContent}>
          {/* Brand Header */}
          <div className={styles.brandHeader}>
            <div className={styles.brandLogo}>
              <Crown className={styles.brandIcon} />
              <span className={styles.brandText}>البارع محمود الديب</span>
              <Sparkles className={styles.sparkleIcon} />
            </div>
          </div>

          <div className={styles.breadcrumb}>
            <button onClick={() => router.push('/')} className={styles.breadcrumbItem}>
              <Home className={styles.breadcrumbIcon} /> الرئيسية
            </button>
            <ChevronRight className={styles.breadcrumbSeparator} />
            <button onClick={() => router.push(`/grades/${gradeSlug}`)} className={styles.breadcrumbItem}>
              {gradeSlug === 'first' ? 'الصف الأول' : gradeSlug === 'second' ? 'الصف الثاني' : 'الصف الثالث'}
            </button>
            <ChevronRight className={styles.breadcrumbSeparator} />
            <span className={styles.currentPage}>{packageData.name}</span>
          </div>

          <div className={styles.packageHeader}>
            <div className={styles.packageImageContainer}>
              <motion.div 
                className={styles.imageWrapper}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                {packageData.image_url ? (
                  <>
                    <img src={packageData.image_url} alt={packageData.name} className={styles.packageImage} />
                    <div className={styles.imageOverlay} />
                    <div className={styles.imageGlow} style={{ background: theme.accent }} />
                  </>
                ) : (
                  <div className={styles.placeholderImage} style={{ background: theme.primary + '40' }}>
                    <GraduationCap className={styles.placeholderIcon} />
                  </div>
                )}
                <div className={styles.floatingBadge} style={{ background: theme.accent }}>
                  <Star size={16} fill="white" />
                  <span>مميز</span>
                </div>
              </motion.div>
            </div>

            <div className={styles.packageDetails}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className={styles.packageTag} style={{ background: theme.accent + '20', color: theme.accent }}>
                  {packageData.type === 'weekly' ? 'أسبوعي' : packageData.type === 'monthly' ? 'شهري' : packageData.type === 'term' ? 'ترم كامل' : 'عرض خاص'}
                </div>
                <h1 className={styles.packageTitle}>{packageData.name}</h1>
                <p className={styles.packageDescription}>{packageData.description}</p>
                
                <div className={styles.packageStats}>
                  <div className={styles.statItem} style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <div className={styles.statIconWrapper} style={{ background: theme.accent }}>
                      <PlayCircle size={20} />
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{lectures.length}</span>
                      <span className={styles.statLabel}>محاضرة</span>
                    </div>
                  </div>
                  <div className={styles.statItem} style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <div className={styles.statIconWrapper} style={{ background: theme.accent }}>
                      <Clock size={20} />
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{packageData.duration_days}</span>
                      <span className={styles.statLabel}>يوم</span>
                    </div>
                  </div>
                  <div className={styles.statItem} style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <div className={styles.statIconWrapper} style={{ background: theme.accent }}>
                      <BookOpen size={20} />
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{contents.length}</span>
                      <span className={styles.statLabel}>محتوى</span>
                    </div>
                  </div>
                </div>

                {contents.length > 0 && (
                  <div className={styles.progressContainer}>
                    <div className={styles.progressHeader}>
                      <div className={styles.progressLabel}>
                        <BarChart3 className={styles.progressIcon} />
                        <span>نسبة الإتمام</span>
                      </div>
                      <span className={styles.progressPercentage}>{completion}%</span>
                    </div>
                    <div className={styles.progressBar}>
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${completion}%` }} 
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className={styles.progressFill} 
                        style={{ background: `linear-gradient(90deg, ${theme.accent}, ${theme.primary})` }} 
                      />
                    </div>
                    <div className={styles.progressStats}>
                      <span className={styles.progressStat}>
                        <CheckCircle size={14} /> مكتمل: {userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length}
                      </span>
                      <span className={styles.progressStat}>
                        <Clock size={14} /> المتبقي: {contents.length - userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <main className={styles.mainContent}>
        <section className={styles.lecturesSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleContainer}>
              <div className={styles.sectionIconWrapper} style={{ background: theme.primary + '20' }}>
                <BookOpen className={styles.sectionIcon} style={{ color: theme.primary }} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>محاضرات الباقة</h2>
                <p className={styles.sectionSubtitle}>ابدأ رحلتك التعليمية الآن وحقق التفوق</p>
              </div>
            </div>
          </div>

          {lectures.length === 0 ? (
            <motion.div 
              className={styles.emptyState}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={styles.emptyIconWrapper}>
                <BookOpen className={styles.emptyIcon} />
              </div>
              <p className={styles.emptyText}>لا توجد محاضرات متاحة حالياً</p>
              <p className={styles.emptySubtext}>سيتم إضافة المحاضرات قريباً</p>
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
                
                return (
                  <motion.div 
                    key={lecture.id} 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: lectureIndex * 0.1 }}
                    className={`${styles.lectureCard} ${isExpanded ? styles.expanded : ''}`}
                  >
                    <div className={styles.lectureHeader} onClick={() => toggleSection(lecture.id)}>
                      <div className={styles.lectureInfo}>
                        <div className={styles.lectureNumberBadge} style={{ background: theme.primary + '15', color: theme.primary }}>
                          <span>المحاضرة {lectureIndex + 1}</span>
                        </div>
                        <h3 className={styles.lectureTitle}>{lecture.title}</h3>
                        {lecture.description && <p className={styles.lectureDescription}>{lecture.description}</p>}
                        <div className={styles.lectureMeta}>
                          <span className={styles.contentCount}>
                            <FileText size={14} /> {lectureContents.length} محتوى
                          </span>
                          <span className={styles.completionBadge}>
                            <CheckCircle size={14} /> {completedContents}/{lectureContents.length}
                          </span>
                        </div>
                      </div>
                      <div className={styles.lectureControls}>
                        <div className={styles.progressCircle} style={{ 
                          background: `conic-gradient(${theme.primary} ${(completedContents/lectureContents.length)*360}deg, #e2e8f0 0deg)` 
                        }}>
                          <span>{Math.round((completedContents/lectureContents.length)*100)}%</span>
                        </div>
                        <motion.div 
                          className={styles.expandIcon}
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          style={{ background: isExpanded ? theme.primary : '#f1f5f9' }}
                        >
                          <ChevronRight className={styles.chevronIcon} style={{ color: isExpanded ? 'white' : '#64748b' }} />
                        </motion.div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className={styles.contentsContainer}
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
                                  className={`${styles.contentItem} ${isAccessible ? styles.accessible : styles.locked} ${status === 'completed' || status === 'passed' ? styles.completed : ''}`} 
                                  onClick={() => isAccessible && handleContentClick(content, lectureIndex, contentIndex)}
                                >
                                  <div className={styles.contentMain}>
                                    <div className={styles.contentIconWrapper} style={{ 
                                      background: status === 'completed' || status === 'passed' ? '#10b98120' : 
                                                 status === 'failed' ? '#ef444420' :
                                                 status === 'in_progress' ? '#f59e0b20' :
                                                 isAccessible ? theme.primary + '20' : '#f1f5f9',
                                      color: status === 'completed' || status === 'passed' ? '#10b981' : 
                                             status === 'failed' ? '#ef4444' :
                                             status === 'in_progress' ? '#f59e0b' :
                                             isAccessible ? theme.primary : '#94a3b8'
                                    }}>
                                      {getContentIcon(content.type)}
                                      {status === 'completed' || status === 'passed' ? (
                                        <div className={styles.statusIconOverlay}>
                                          <CheckCircle size={12} />
                                        </div>
                                      ) : null}
                                    </div>
                                    
                                    <div className={styles.contentDetails}>
                                      <h4 className={styles.contentTitle}>{content.title}</h4>
                                      {content.description && <p className={styles.contentDescription}>{content.description}</p>}
                                      <div className={styles.contentMeta}>
                                        <span className={styles.contentType}>
                                          {content.type === 'video' ? 'فيديو' : content.type === 'pdf' ? 'ملف PDF' : content.type === 'exam' ? 'امتحان' : 'نص'}
                                        </span>
                                        {content.duration_minutes > 0 && (
                                          <span className={styles.contentDuration}>
                                            <Clock size={12} /> {content.duration_minutes} دقيقة
                                          </span>
                                        )}
                                        {content.type === 'exam' && (
                                          <span className={styles.examInfo}>
                                            <Target size={12} /> النجاح: {content.pass_score}%
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className={styles.contentActions}>
                                    {!isAccessible ? (
                                      <div className={styles.lockBadge}>
                                        <Lock size={14} />
                                        <span>مقفل</span>
                                      </div>
                                    ) : (
                                      <motion.button 
                                        className={styles.actionButton}
                                        style={{ 
                                          background: status === 'completed' || status === 'passed' ? '#10b981' : 
                                                     status === 'failed' ? '#ef4444' :
                                                     theme.primary
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        {status === 'completed' || status === 'passed' ? (
                                          <><CheckCircle size={16} /> مكتمل</>
                                        ) : status === 'failed' ? (
                                          <><XCircle size={16} /> إعادة المحاولة</>
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

        <motion.section 
          className={styles.notesSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className={styles.notesContainer} style={{ background: theme.primary + '08' }}>
            <div className={styles.notesHeader}>
              <div className={styles.notesIconWrapper} style={{ background: theme.primary + '20' }}>
                <Award className={styles.notesIcon} style={{ color: theme.primary }} />
              </div>
              <h3 className={styles.notesTitle}>ملاحظات هامة</h3>
            </div>
            <ul className={styles.notesList}>
              {packageData.type === 'monthly' || packageData.type === 'term' ? (
                <>
                  <li className={styles.noteItem}>
                    <div className={styles.noteIconWrapper} style={{ background: theme.accent + '20' }}>
                      <Shield size={16} style={{ color: theme.accent }} />
                    </div>
                    <span>يجب إتمام كل محتوى قبل الانتقال للذي يليه</span>
                  </li>
                  <li className={styles.noteItem}>
                    <div className={styles.noteIconWrapper} style={{ background: theme.accent + '20' }}>
                      <Target size={16} style={{ color: theme.accent }} />
                    </div>
                    <span>لابد من اجتياز الامتحان قبل الانتقال للمحاضرة التالية</span>
                  </li>
                </>
              ) : null}
              {userPackage?.expires_at && (
                <li className={styles.noteItem}>
                  <div className={styles.noteIconWrapper} style={{ background: theme.accent + '20' }}>
                    <Calendar size={16} style={{ color: theme.accent }} />
                  </div>
                  <span>مدة الاشتراك تنتهي في: <strong>{new Date(userPackage.expires_at).toLocaleDateString('ar-EG')}</strong></span>
                </li>
              )}
            </ul>
          </div>
        </motion.section>

        <motion.div 
          className={styles.backSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button 
            onClick={() => router.push(`/grades/${gradeSlug}`)} 
            className={styles.backActionButton}
            style={{ color: theme.primary, borderColor: theme.primary + '40' }}
          >
            <ArrowRight size={18} />
            <span>العودة إلى الباقات</span>
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