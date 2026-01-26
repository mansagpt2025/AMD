'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClientBrowser } from '@/lib/supabase/sf-client'
import {
  PlayCircle, BookOpen, Clock, Lock, Unlock,
  CheckCircle, XCircle, AlertCircle, Home,
  ChevronRight, GraduationCap, BarChart3,
  Calendar, Video, File, Target, Loader2,
  ArrowRight, Shield, Users, Award, Zap,
  Star, Crown, TrendingUp, Brain, Rocket
} from 'lucide-react'
import { getGradeTheme } from '@/lib/utils/grade-themes'
import styles from './PackagePage.module.css'

export default function PackagePage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClientBrowser()
  
  const gradeSlug = params?.grade as 'first' | 'second' | 'third'
  const packageId = params?.packageId as string
  
  const theme = getGradeTheme(gradeSlug)

  const [packageData, setPackageData] = useState<any>(null)
  const [lectures, setLectures] = useState<any[]>([])
  const [contents, setContents] = useState<any[]>([])
  const [userProgress, setUserProgress] = useState<any[]>([])
  const [userPackage, setUserPackage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completion, setCompletion] = useState(0)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  useEffect(() => {
    checkAccessAndLoadData()
  }, [])

  const checkAccessAndLoadData = async () => {
    try {
      // 1. التحقق من تسجيل الدخول
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/login?returnUrl=/grades/${gradeSlug}/packages/${packageId}`)
        return
      }

      // 2. التحقق من الاشتراك
      const { data: userPackageData } = await supabase
        .from('user_packages')
        .select('*')
        .eq('user_id', user.id)
        .eq('package_id', packageId)
        .eq('is_active', true)
        .single()

      if (!userPackageData) {
        router.push(`/grades/${gradeSlug}?error=not_subscribed`)
        return
      }
      setUserPackage(userPackageData)

      // 3. جلب بيانات الباقة
      const { data: packageData } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single()
      setPackageData(packageData)

      // 4. جلب المحاضرات
      const { data: lecturesData } = await supabase
        .from('lectures')
        .select('*')
        .eq('package_id', packageId)
        .eq('is_active', true)
        .order('order_number')
      setLectures(lecturesData || [])

      // 5. جلب محتويات المحاضرات
      if (lecturesData?.length) {
        const lectureIds = lecturesData.map(l => l.id)
        const { data: contentsData } = await supabase
          .from('lecture_contents')
          .select('*')
          .in('lecture_id', lectureIds)
          .eq('is_active', true)
          .order('order_number')
        setContents(contentsData || [])
      }

      // 6. جلب تقدم المستخدم
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('package_id', packageId)
      setUserProgress(progressData || [])

      // 7. حساب نسبة الإتمام
      calculateCompletion(progressData || [], contents)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const calculateCompletion = (progress: any[], allContents: any[]) => {
    if (allContents.length === 0) {
      setCompletion(0)
      return
    }

    const completed = progress.filter(p => 
      p.status === 'completed' || p.status === 'passed'
    ).length

    setCompletion(Math.round((completed / allContents.length) * 100))
  }

  const isContentAccessible = (lectureIndex: number, contentIndex: number, content: any) => {
    // الباقات الأسبوعية: كل المحتويات مفتوحة
    if (packageData?.type === 'weekly') return true

    // الباقات الشهرية والترم: نظام تسلسلي
    if (packageData?.type === 'monthly' || packageData?.type === 'term') {
      // المحتوى الأول في المحاضرة الأولى مفتوح
      if (lectureIndex === 0 && contentIndex === 0) return true

      // الحصول على المحتويات السابقة
      const previousContents = getPreviousContents(lectureIndex, contentIndex)
      
      // التحقق من إتمام جميع المحتويات السابقة
      for (const prevContent of previousContents) {
        const progress = userProgress.find(p => p.lecture_content_id === prevContent.id)
        if (!progress || (progress.status !== 'completed' && progress.status !== 'passed')) {
          return false
        }
        
        // إذا كان المحتوى السابق امتحان، يجب اجتيازه
        if (prevContent.type === 'exam' && progress.status !== 'passed') {
          return false
        }
      }
    }

    return true
  }

  const getPreviousContents = (lectureIndex: number, contentIndex: number) => {
    const previous: any[] = []
    
    // جمع محتويات المحاضرات السابقة
    for (let i = 0; i < lectureIndex; i++) {
      const lecture = lectures[i]
      const lectureContents = contents.filter(c => c.lecture_id === lecture.id)
      previous.push(...lectureContents)
    }

    // جمع محتويات المحاضرة الحالية قبل هذا المحتوى
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

  const handleContentClick = (content: any, lectureIndex: number, contentIndex: number) => {
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
          <button
            onClick={() => router.push(`/grades/${gradeSlug}`)}
            className={styles.backButton}
            style={{ background: theme.primary }}
          >
            العودة إلى الباقات
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.header} style={{ background: theme.header }}>
        <div className={styles.headerContent}>
          {/* Breadcrumb */}
          <div className={styles.breadcrumb}>
            <button
              onClick={() => router.push('/')}
              className={styles.breadcrumbItem}
            >
              <Home className={styles.breadcrumbIcon} />
              الرئيسية
            </button>
            <ChevronRight className={styles.breadcrumbSeparator} />
            <button
              onClick={() => router.push(`/grades/${gradeSlug}`)}
              className={styles.breadcrumbItem}
            >
              {gradeSlug === 'first' ? 'الصف الأول' : gradeSlug === 'second' ? 'الصف الثاني' : 'الصف الثالث'}
            </button>
            <ChevronRight className={styles.breadcrumbSeparator} />
            <span className={styles.currentPage}>{packageData.name}</span>
          </div>

          {/* Package Info */}
          <div className={styles.packageHeader}>
            {/* Image */}
            <div className={styles.packageImageContainer}>
              {packageData.image_url ? (
                <div className={styles.imageWrapper}>
                  <img
                    src={packageData.image_url}
                    alt={packageData.name}
                    className={styles.packageImage}
                  />
                  <div className={styles.imageOverlay} />
                </div>
              ) : (
                <div className={styles.placeholderImage} style={{ background: theme.primary + '40' }}>
                  <GraduationCap className={styles.placeholderIcon} />
                </div>
              )}
            </div>

            {/* Details */}
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
                    {packageData.type === 'weekly' ? 'أسبوعي' :
                     packageData.type === 'monthly' ? 'شهري' :
                     packageData.type === 'term' ? 'ترم كامل' : 'عرض خاص'}
                  </span>
                </div>
              </div>

              {/* Progress */}
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
                  <span className={styles.progressStat}>
                    الإجمالي: {contents.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Lectures */}
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
                    {/* Lecture Header */}
                    <div 
                      className={styles.lectureHeader}
                      onClick={() => toggleSection(lecture.id)}
                    >
                      <div className={styles.lectureInfo}>
                        <div className={styles.lectureNumber}>
                          المحاضرة {lectureIndex + 1}
                        </div>
                        <h3 className={styles.lectureTitle}>{lecture.title}</h3>
                        {lecture.description && (
                          <p className={styles.lectureDescription}>{lecture.description}</p>
                        )}
                      </div>
                      <div className={styles.lectureControls}>
                        <div className={styles.contentsCount}>
                          {lectureContents.length} محتوى
                        </div>
                        <div className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
                          <ChevronRight className={styles.chevronIcon} />
                        </div>
                      </div>
                    </div>

                    {/* Contents - Collapsible */}
                    <motion.div
                      initial={false}
                      animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                      className={styles.contentsContainer}
                    >
                      <div className={styles.contentsList}>
                        {lectureContents.map((content, contentIndex) => {
                          const isAccessible = isContentAccessible(lectureIndex, contentIndex, content)
                          const status = getContentStatus(content.id)
                          
                          return (
                            <div
                              key={content.id}
                              className={`${styles.contentItem} ${
                                isAccessible ? styles.accessible : styles.locked
                              }`}
                              onClick={() => isAccessible && handleContentClick(content, lectureIndex, contentIndex)}
                            >
                              <div className={styles.contentInfo}>
                                <div className={styles.contentIcon}>
                                  {getContentIcon(content.type)}
                                </div>
                                <div className={styles.contentDetails}>
                                  <h4 className={styles.contentTitle}>{content.title}</h4>
                                  {content.description && (
                                    <p className={styles.contentDescription}>{content.description}</p>
                                  )}
                                  <div className={styles.contentMeta}>
                                    <span className={styles.contentType}>
                                      {content.type === 'video' ? 'فيديو' :
                                       content.type === 'pdf' ? 'ملف PDF' :
                                       content.type === 'exam' ? 'امتحان' : 'نص'}
                                    </span>
                                    {content.duration_minutes > 0 && (
                                      <span className={styles.contentDuration}>
                                        <Clock className={styles.metaIcon} />
                                        {content.duration_minutes} دقيقة
                                      </span>
                                    )}
                                    {content.type === 'exam' && (
                                      <span className={styles.examInfo}>
                                        <Target className={styles.metaIcon} />
                                        النجاح: {content.pass_score}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className={styles.contentActions}>
                                {/* Status */}
                                {status === 'completed' || status === 'passed' ? (
                                  <div className={`${styles.statusBadge} ${styles.completed}`}>
                                    <CheckCircle className={styles.statusIcon} />
                                    <span>{status === 'passed' ? 'ناجح' : 'مكتمل'}</span>
                                  </div>
                                ) : status === 'failed' ? (
                                  <div className={`${styles.statusBadge} ${styles.failed}`}>
                                    <XCircle className={styles.statusIcon} />
                                    <span>فاشل</span>
                                  </div>
                                ) : status === 'in_progress' ? (
                                  <div className={`${styles.statusBadge} ${styles.inProgress}`}>
                                    <Clock className={styles.statusIcon} />
                                    <span>قيد التقدم</span>
                                  </div>
                                ) : null}

                                {/* Action Button */}
                                <button
                                  className={`${styles.actionButton} ${
                                    isAccessible ? styles.activeButton : styles.disabledButton
                                  }`}
                                  style={isAccessible ? { background: theme.primary } : {}}
                                  disabled={!isAccessible}
                                >
                                  {isAccessible ? (
                                    <>
                                      {status === 'not_started' ? 'بدء' : 'استكمال'}
                                      <ArrowRight className={styles.buttonIcon} />
                                    </>
                                  ) : (
                                    <>
                                      <Lock className={styles.buttonIcon} />
                                      مقفل
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Lock Message */}
                              {!isAccessible && (
                                <div className={styles.lockMessage}>
                                  <AlertCircle className={styles.alertIcon} />
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

        {/* Important Notes */}
        <section className={styles.notesSection}>
          <div className={styles.notesContainer}>
            <div className={styles.notesHeader}>
              <Award className={styles.notesIcon} />
              <h3 className={styles.notesTitle}>ملاحظات هامة</h3>
            </div>
            
            <ul className={styles.notesList}>
              {packageData.type === 'monthly' || packageData.type === 'term' ? (
                <>
                  <li className={styles.noteItem}>
                    <Shield className={styles.noteIcon} />
                    يجب إتمام كل محتوى قبل الانتقال للذي يليه
                  </li>
                  <li className={styles.noteItem}>
                    <Target className={styles.noteIcon} />
                    لابد من اجتياز الامتحان قبل الانتقال للمحاضرة التالية
                  </li>
                  <li className={styles.noteItem}>
                    <Users className={styles.noteIcon} />
                    يمكنك إعادة الامتحان حتى 3 مرات
                  </li>
                </>
              ) : (
                <>
                  <li className={styles.noteItem}>
                    <Unlock className={styles.noteIcon} />
                    جميع المحاضرات متاحة مباشرة
                  </li>
                  <li className={styles.noteItem}>
                    <PlayCircle className={styles.noteIcon} />
                    يمكنك البدء بأي محاضرة تريد
                  </li>
                </>
              )}
              <li className={styles.noteItem}>
                <Calendar className={styles.noteIcon} />
                مدة الاشتراك تنتهي في: {new Date(userPackage?.expires_at).toLocaleDateString('ar-EG')}
              </li>
            </ul>
          </div>
        </section>

        {/* Back Button */}
        <div className={styles.backSection}>
          <button
            onClick={() => router.push(`/grades/${gradeSlug}`)}
            className={styles.backActionButton}
            style={{ 
              borderColor: theme.primary,
              color: theme.primary
            }}
          >
            <ArrowRight className={styles.backButtonIcon} />
            العودة إلى الباقات
          </button>
        </div>
      </main>
    </div>
  )
}