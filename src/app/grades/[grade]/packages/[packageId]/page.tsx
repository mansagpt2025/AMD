'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import {
  PlayCircle, BookOpen, Clock, Lock, Unlock,
  CheckCircle, XCircle, AlertCircle, Home,
  ChevronRight, GraduationCap, BarChart3,
  Calendar, Video, File, Target, Loader2,
  ArrowRight, Shield, Users, Award
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

// FIX: Global singleton to prevent "Multiple GoTrueClient instances"
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
      <Loader2 className={styles.loadingSpinner} />
      <p className={styles.loadingText}>جاري تحميل البيانات...</p>
    </div>
  )
}

// Error Component
function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <AlertCircle className={styles.errorIcon} />
        <h2 className={styles.errorTitle}>حدث خطأ</h2>
        <p className={styles.errorMessage}>{message}</p>
        <button onClick={onBack} className={styles.backButton}>
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

  // FIX: Single supabase instance per component lifecycle
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

  // FIX: Single auth check effect with early exit
  useEffect(() => {
    if (!mounted || !gradeSlug || !packageId || !supabase || authChecked) return

    const checkAuth = async () => {
      try {
        // Check session once
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

        // Check package access
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

        // Fetch package data
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

        // Fetch lectures
        const { data: lecturesData, error: lecturesError } = await supabase
          .from('lectures')
          .select('*')
          .eq('package_id', packageId)
          .eq('is_active', true)
          .order('order_number', { ascending: true })

        if (lecturesError) throw lecturesError
        setLectures(lecturesData || [])

        // Fetch contents
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
          
          // Fetch progress
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
      case 'video': return <Video className={styles.contentTypeIcon} />
      case 'pdf': return <File className={styles.contentTypeIcon} />
      case 'exam': return <Target className={styles.contentTypeIcon} />
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
      <div className={styles.header} style={{ background: theme.header }}>
        <div className={styles.headerContent}>
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
              {packageData.image_url ? (
                <div className={styles.imageWrapper}>
                  <img src={packageData.image_url} alt={packageData.name} className={styles.packageImage} />
                  <div className={styles.imageOverlay} />
                </div>
              ) : (
                <div className={styles.placeholderImage} style={{ background: theme.primary + '40' }}>
                  <GraduationCap className={styles.placeholderIcon} />
                </div>
              )}
            </div>

            <div className={styles.packageDetails}>
              <h1 className={styles.packageTitle}>{packageData.name}</h1>
              <p className={styles.packageDescription}>{packageData.description}</p>
              
              <div className={styles.packageStats}>
                <div className={styles.statItem}>
                  <PlayCircle className={styles.statIcon} />
                  <span className={styles.statValue}>{lectures.length}</span>
                  <span className={styles.statLabel}>محاضرة</span>
                </div>
                <div className={styles.statItem}>
                  <Clock className={styles.statIcon} />
                  <span className={styles.statValue}>{packageData.duration_days}</span>
                  <span className={styles.statLabel}>يوم</span>
                </div>
                <div className={styles.statItem}>
                  <Calendar className={styles.statIcon} />
                  <span className={styles.statValue}>
                    {packageData.type === 'weekly' ? 'أسبوعي' : packageData.type === 'monthly' ? 'شهري' : packageData.type === 'term' ? 'ترم كامل' : 'عرض خاص'}
                  </span>
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
                      className={styles.progressFill} 
                      style={{ background: theme.accent }} 
                    />
                  </div>
                  <div className={styles.progressStats}>
                    <span className={styles.progressStat}>
                      مكتمل: {userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length}
                    </span>
                    <span className={styles.progressStat}>
                      المتبقي: {contents.length - userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length}
                    </span>
                    <span className={styles.progressStat}>الإجمالي: {contents.length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className={styles.mainContent}>
        <section className={styles.lecturesSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleContainer}>
              <BookOpen className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>محاضرات الباقة</h2>
            </div>
            <p className={styles.sectionSubtitle}>ابدأ رحلتك التعليمية الآن</p>
          </div>

          {lectures.length === 0 ? (
            <div className={styles.emptyState}>
              <BookOpen className={styles.emptyIcon} />
              <p className={styles.emptyText}>لا توجد محاضرات متاحة حالياً</p>
              <p className={styles.emptySubtext}>سيتم إضافة المحاضرات قريباً</p>
            </div>
          ) : (
            <div className={styles.lecturesList}>
              {lectures.map((lecture, lectureIndex) => {
                const lectureContents = contents.filter(c => c.lecture_id === lecture.id)
                const isExpanded = activeSection === lecture.id
                
                return (
                  <motion.div 
                    key={lecture.id} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className={styles.lectureCard}
                  >
                    <div className={styles.lectureHeader} onClick={() => toggleSection(lecture.id)}>
                      <div className={styles.lectureInfo}>
                        <div className={styles.lectureNumber}>المحاضرة {lectureIndex + 1}</div>
                        <h3 className={styles.lectureTitle}>{lecture.title}</h3>
                        {lecture.description && <p className={styles.lectureDescription}>{lecture.description}</p>}
                      </div>
                      <div className={styles.lectureControls}>
                        <div className={styles.contentsCount}>{lectureContents.length} محتوى</div>
                        <div className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
                          <ChevronRight className={styles.chevronIcon} />
                        </div>
                      </div>
                    </div>

                    <motion.div 
                      initial={false} 
                      animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }} 
                      transition={{ duration: 0.3 }} 
                      className={styles.contentsContainer}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className={styles.contentsList}>
                        {lectureContents.map((content, contentIndex) => {
                          const isAccessible = isContentAccessible(lectureIndex, contentIndex, content)
                          const status = getContentStatus(content.id)
                          
                          return (
                            <div 
                              key={content.id} 
                              className={`${styles.contentItem} ${isAccessible ? styles.accessible : styles.locked}`} 
                              onClick={() => isAccessible && handleContentClick(content, lectureIndex, contentIndex)}
                            >
                              <div className={styles.contentInfo}>
                                <div className={styles.contentIcon}>{getContentIcon(content.type)}</div>
                                <div className={styles.contentDetails}>
                                  <h4 className={styles.contentTitle}>{content.title}</h4>
                                  {content.description && <p className={styles.contentDescription}>{content.description}</p>}
                                  <div className={styles.contentMeta}>
                                    <span className={styles.contentType}>
                                      {content.type === 'video' ? 'فيديو' : content.type === 'pdf' ? 'ملف PDF' : content.type === 'exam' ? 'امتحان' : 'نص'}
                                    </span>
                                    {content.duration_minutes > 0 && (
                                      <span className={styles.contentDuration}>
                                        <Clock className={styles.metaIcon} size={14} /> {content.duration_minutes} دقيقة
                                      </span>
                                    )}
                                    {content.type === 'exam' && (
                                      <span className={styles.examInfo}><Target className={styles.metaIcon} size={14} /> النجاح: {content.pass_score}%</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className={styles.contentActions}>
                                {status === 'completed' || status === 'passed' ? (
                                  <div className={`${styles.statusBadge} ${styles.completed}`}>
                                    <CheckCircle size={16} />
                                    <span>{status === 'passed' ? 'ناجح' : 'مكتمل'}</span>
                                  </div>
                                ) : status === 'failed' ? (
                                  <div className={`${styles.statusBadge} ${styles.failed}`}><XCircle size={16} /><span>فاشل</span></div>
                                ) : status === 'in_progress' ? (
                                  <div className={`${styles.statusBadge} ${styles.inProgress}`}><Clock size={16} /><span>قيد التقدم</span></div>
                                ) : null}

                                <button 
                                  className={`${styles.actionButton} ${isAccessible ? styles.activeButton : styles.disabledButton}`} 
                                  style={isAccessible ? { background: theme.primary } : {}} 
                                  disabled={!isAccessible}
                                >
                                  {isAccessible ? (
                                    <>{status === 'not_started' ? 'بدء' : 'استكمال'}<ArrowRight size={16} /></>
                                  ) : (
                                    <><Lock size={16} />مقفل</>
                                  )}
                                </button>
                              </div>
                              {!isAccessible && (
                                <div className={styles.lockMessage}>
                                  <AlertCircle size={14} />
                                  <span>يجب إتمام المحتوى السابق أولاً</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>

        <section className={styles.notesSection}>
          <div className={styles.notesContainer}>
            <div className={styles.notesHeader}>
              <Award className={styles.notesIcon} />
              <h3 className={styles.notesTitle}>ملاحظات هامة</h3>
            </div>
            <ul className={styles.notesList}>
              {packageData.type === 'monthly' || packageData.type === 'term' ? (
                <>
                  <li className={styles.noteItem}><Shield size={16} />يجب إتمام كل محتوى قبل الانتقال للذي يليه</li>
                  <li className={styles.noteItem}><Target size={16} />لابد من اجتياز الامتحان قبل الانتقال للمحاضرة التالية</li>
                  <li className={styles.noteItem}><Users size={16} />يمكنك إعادة الامتحان حتى 3 مرات</li>
                </>
              ) : (
                <>
                  <li className={styles.noteItem}><Unlock size={16} />جميع المحاضرات متاحة مباشرة</li>
                  <li className={styles.noteItem}><PlayCircle size={16} />يمكنك البدء بأي محاضرة تريد</li>
                </>
              )}
              {userPackage?.expires_at && (
                <li className={styles.noteItem}><Calendar size={16} />مدة الاشتراك تنتهي في: {new Date(userPackage.expires_at).toLocaleDateString('ar-EG')}</li>
              )}
            </ul>
          </div>
        </section>

        <div className={styles.backSection}>
          <button 
            onClick={() => router.push(`/grades/${gradeSlug}`)} 
            className={styles.backActionButton} 
            style={{ borderColor: theme.primary, color: theme.primary }}
          >
            <ArrowRight size={18} />العودة إلى الباقات
          </button>
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