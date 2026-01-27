'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClientBrowser } from '@/lib/supabase/sf-client'
import {
  PlayCircle, BookOpen, Clock, Lock, Unlock,
  CheckCircle, XCircle, AlertCircle, Home,
  ChevronRight, GraduationCap, BarChart3,
  Calendar, Video, File, Target, Loader2,
  ArrowRight, Shield, Users, Award
} from 'lucide-react'
import { getGradeTheme } from '@/lib/utils/grade-themes'
import styles from './PackagePage.module.css'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

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

export default function PackagePage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClientBrowser()
  
  const gradeSlug = params?.grade as 'first' | 'second' | 'third'
  const packageId = params?.packageId as string
  
  const theme = getGradeTheme(gradeSlug)

  const [packageData, setPackageData] = useState<Package | null>(null)
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [contents, setContents] = useState<LectureContent[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [userPackage, setUserPackage] = useState<UserPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completion, setCompletion] = useState(0)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const calculateCompletion = useCallback((progress: UserProgress[], allContents: LectureContent[]) => {
    if (allContents.length === 0) {
      setCompletion(0)
      return
    }
    const completed = progress.filter(p => p.status === 'completed' || p.status === 'passed').length
    setCompletion(Math.round((completed / allContents.length) * 100))
  }, [])

  useEffect(() => {
    checkAccessAndLoadData()
  }, [packageId, gradeSlug])

  const checkAccessAndLoadData = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/login?returnUrl=/grades/${gradeSlug}/packages/${packageId}`)
        return
      }

      const { data: userPackageData } = await supabase
        .from('user_packages')
        .select('*')
        .eq('user_id', user.id)
        .eq('package_id', packageId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (!userPackageData) {
        router.push(`/grades/${gradeSlug}?error=not_subscribed&package=${packageId}`)
        return
      }
      
      setUserPackage(userPackageData)

      const { data: pkgData, error: pkgError } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single()

      if (pkgError || !pkgData) {
        setError('الباقة غير موجودة')
        return
      }
      
      if (pkgData.grade !== gradeSlug) {
        router.push(`/grades/${pkgData.grade}/packages/${packageId}`)
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

      let fetchedContents: LectureContent[] = []
      if (lecturesData && lecturesData.length > 0) {
        const lectureIds = lecturesData.map(l => l.id)
        const { data: contentsData, error: contentsError } = await supabase
          .from('lecture_contents')
          .select('*')
          .in('lecture_id', lectureIds)
          .eq('is_active', true)
          .order('order_number', { ascending: true })

        if (contentsError) throw contentsError
        fetchedContents = contentsData || []
        setContents(fetchedContents)
      }

      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('package_id', packageId)

      if (progressError) throw progressError
      setUserProgress(progressData || [])
      calculateCompletion(progressData || [], fetchedContents)

    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message || 'حدث خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const isContentAccessible = (lectureIndex: number, contentIndex: number, content: LectureContent) => {
    if (packageData?.type === 'weekly') return true
    if (packageData?.type === 'monthly' || packageData?.type === 'term') {
      if (lectureIndex === 0 && contentIndex === 0) return true
      const previousContents = getPreviousContents(lectureIndex, contentIndex)
      for (const prevContent of previousContents) {
        const progress = userProgress.find(p => p.lecture_content_id === prevContent.id)
        if (!progress || (progress.status !== 'completed' && progress.status !== 'passed')) return false
        if (prevContent.type === 'exam' && progress.status !== 'passed') return false
      }
    }
    return true
  }

  const getPreviousContents = (lectureIndex: number, contentIndex: number) => {
    const previous: LectureContent[] = []
    for (let i = 0; i < lectureIndex; i++) {
      const lecture = lectures[i]
      const lectureContents = contents.filter(c => c.lecture_id === lecture.id)
      previous.push(...lectureContents)
    }
    const currentLecture = lectures[lectureIndex]
    const currentContents = contents.filter(c => c.lecture_id === currentLecture.id)
    previous.push(...currentContents.slice(0, contentIndex))
    return previous
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
    setActiveSection(activeSection === sectionId ? null : sectionId)
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.loadingSpinner} style={{ color: theme.primary }} />
        <p className={styles.loadingText}>جاري تحميل بيانات الباقة...</p>
      </div>
    )
  }

  if (error || !packageData) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <AlertCircle className={styles.errorIcon} />
          <h2 className={styles.errorTitle}>حدث خطأ</h2>
          <p className={styles.errorMessage}>{error || 'الباقة غير موجودة'}</p>
          <button onClick={() => router.push(`/grades/${gradeSlug}`)} className={styles.backButton} style={{ background: theme.primary }}>
            العودة إلى الباقات
          </button>
        </div>
      </div>
    )
  }

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

              <div className={styles.progressContainer}>
                <div className={styles.progressHeader}>
                  <div className={styles.progressLabel}>
                    <BarChart3 className={styles.progressIcon} />
                    <span>نسبة الإتمام</span>
                  </div>
                  <span className={styles.progressPercentage}>{completion}%</span>
                </div>
                <div className={styles.progressBar}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${completion}%` }} className={styles.progressFill} style={{ background: theme.accent }} />
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
                  <motion.div key={lecture.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={styles.lectureCard}>
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

                    <motion.div initial={false} animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }} transition={{ duration: 0.3 }} className={styles.contentsContainer}>
                      <div className={styles.contentsList}>
                        {lectureContents.map((content, contentIndex) => {
                          const isAccessible = isContentAccessible(lectureIndex, contentIndex, content)
                          const status = getContentStatus(content.id)
                          
                          return (
                            <div key={content.id} className={`${styles.contentItem} ${isAccessible ? styles.accessible : styles.locked}`} onClick={() => isAccessible && handleContentClick(content, lectureIndex, contentIndex)}>
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
                                        <Clock className={styles.metaIcon} /> {content.duration_minutes} دقيقة
                                      </span>
                                    )}
                                    {content.type === 'exam' && (
                                      <span className={styles.examInfo}><Target className={styles.metaIcon} /> النجاح: {content.pass_score}%</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className={styles.contentActions}>
                                {status === 'completed' || status === 'passed' ? (
                                  <div className={`${styles.statusBadge} ${styles.completed}`}>
                                    <CheckCircle className={styles.statusIcon} />
                                    <span>{status === 'passed' ? 'ناجح' : 'مكتمل'}</span>
                                  </div>
                                ) : status === 'failed' ? (
                                  <div className={`${styles.statusBadge} ${styles.failed}`}><XCircle className={styles.statusIcon} /><span>فاشل</span></div>
                                ) : status === 'in_progress' ? (
                                  <div className={`${styles.statusBadge} ${styles.inProgress}`}><Clock className={styles.statusIcon} /><span>قيد التقدم</span></div>
                                ) : null}

                                <button className={`${styles.actionButton} ${isAccessible ? styles.activeButton : styles.disabledButton}`} style={isAccessible ? { background: theme.primary } : {}} disabled={!isAccessible}>
                                  {isAccessible ? (<>{status === 'not_started' ? 'بدء' : 'استكمال'}<ArrowRight className={styles.buttonIcon} /></>) : (<><Lock className={styles.buttonIcon} />مقفل</>)}
                                </button>
                              </div>
                              {!isAccessible && <div className={styles.lockMessage}><AlertCircle className={styles.alertIcon} /><span>يجب إتمام المحتوى السابق أولاً</span></div>}
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
                  <li className={styles.noteItem}><Shield className={styles.noteIcon} />يجب إتمام كل محتوى قبل الانتقال للذي يليه</li>
                  <li className={styles.noteItem}><Target className={styles.noteIcon} />لابد من اجتياز الامتحان قبل الانتقال للمحاضرة التالية</li>
                  <li className={styles.noteItem}><Users className={styles.noteIcon} />يمكنك إعادة الامتحان حتى 3 مرات</li>
                </>
              ) : (
                <>
                  <li className={styles.noteItem}><Unlock className={styles.noteIcon} />جميع المحاضرات متاحة مباشرة</li>
                  <li className={styles.noteItem}><PlayCircle className={styles.noteIcon} />يمكنك البدء بأي محاضرة تريد</li>
                </>
              )}
              {userPackage?.expires_at && (
                <li className={styles.noteItem}><Calendar className={styles.noteIcon} />مدة الاشتراك تنتهي في: {new Date(userPackage.expires_at).toLocaleDateString('ar-EG')}</li>
              )}
            </ul>
          </div>
        </section>

        <div className={styles.backSection}>
          <button onClick={() => router.push(`/grades/${gradeSlug}`)} className={styles.backActionButton} style={{ borderColor: theme.primary, color: theme.primary }}>
            <ArrowRight className={styles.backButtonIcon} />العودة إلى الباقات
          </button>
        </div>
      </main>
    </div>
  )
}