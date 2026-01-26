'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClientBrowser } from '@/lib/supabase/sf-client'
import {
  PlayCircle,
  BookOpen,
  FileText,
  Clock,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Home,
  ChevronRight,
  GraduationCap,
  BarChart3,
  Target,
  Calendar,
  Video,
  File,
  AlertTriangle,
  Award,
  Loader2
} from 'lucide-react'
import styles from './styles.module.css'

// ================== Types ==================
interface Package {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  type: 'weekly' | 'monthly' | 'term' | 'offer'
  lecture_count: number
  grade: string
  duration_days: number
  is_active: boolean
}

interface Lecture {
  id: string
  package_id: string
  title: string
  description: string | null
  image_url: string | null
  order_number: number
  is_active: boolean
  created_at: string
}

interface LectureContent {
  id: string
  lecture_id: string
  type: 'video' | 'pdf' | 'exam' | 'text'
  title: string
  description: string | null
  content_url: string | null
  duration_minutes: number
  order_number: number
  is_active: boolean
  max_attempts: number
  pass_score: number
  created_at: string
}

interface UserProgress {
  id: string
  user_id: string
  lecture_content_id: string
  package_id: string
  status: 'not_started' | 'in_progress' | 'completed' | 'passed' | 'failed'
  score: number | null
  attempts: number
  last_accessed_at: string | null
  completed_at: string | null
}

interface ExamResult {
  id: string
  user_id: string
  content_id: string
  score: number
  total_questions: number | null
  correct_answers: number | null
  wrong_answers: number | null
  completed_at: string
}

interface UserPackage {
  id: string
  user_id: string
  package_id: string
  purchased_at: string
  expires_at: string
  is_active: boolean
}

// ================== Page Component ==================
export default function PackagePage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClientBrowser()
  
  const gradeSlug = params?.grade as string
  const packageId = params?.packageId as string

  // State
  const [packageData, setPackageData] = useState<Package | null>(null)
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [lectureContents, setLectureContents] = useState<LectureContent[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [userPackage, setUserPackage] = useState<UserPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completionPercentage, setCompletionPercentage] = useState(0)

  // ================== Load Data ==================
  useEffect(() => {
    if (gradeSlug && packageId) {
      checkAccessAndLoadData()
    }
  }, [gradeSlug, packageId])

  const checkAccessAndLoadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. التحقق من تسجيل الدخول
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/login?returnUrl=/grades/${gradeSlug}/packages/${packageId}`)
        return
      }

      // 2. جلب بيانات الباقة
      const { data: packageData, error: packageError } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .eq('is_active', true)
        .single()

      if (packageError) throw new Error('الباقة غير موجودة أو غير متاحة')
      if (!packageData) throw new Error('الباقة غير موجودة')
      setPackageData(packageData)

      // 3. التحقق من أن المستخدم مشترك في الباقة
      const { data: userPackageData, error: userPackageError } = await supabase
        .from('user_packages')
        .select('*')
        .eq('user_id', user.id)
        .eq('package_id', packageId)
        .eq('is_active', true)
        .maybeSingle()

      if (userPackageError) throw new Error('خطأ في التحقق من الاشتراك')
      if (!userPackageData) {
        router.push(`/grades/${gradeSlug}?error=not_subscribed`)
        return
      }
      setUserPackage(userPackageData)

      // 4. التحقق من صلاحية الاشتراك
      const now = new Date()
      const expiresAt = new Date(userPackageData.expires_at)
      if (now > expiresAt) {
        // تحديث حالة الاشتراك
        await supabase
          .from('user_packages')
          .update({ is_active: false })
          .eq('id', userPackageData.id)
        
        router.push(`/grades/${gradeSlug}?error=expired`)
        return
      }

      // 5. جلب بيانات المحاضرات
      await Promise.all([
        loadLectures(),
        loadUserProgress(user.id)
      ])

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadLectures = async () => {
    try {
      // جلب المحاضرات
      const { data: lecturesData, error: lecturesError } = await supabase
        .from('lectures')
        .select('*')
        .eq('package_id', packageId)
        .eq('is_active', true)
        .order('order_number', { ascending: true })

      if (lecturesError) throw new Error('خطأ في تحميل المحاضرات')
      setLectures(lecturesData || [])

      // جلب محتويات المحاضرات
      if (lecturesData && lecturesData.length > 0) {
        const lectureIds = lecturesData.map(l => l.id)
        
        const { data: contentsData, error: contentsError } = await supabase
          .from('lecture_contents')
          .select('*')
          .in('lecture_id', lectureIds)
          .eq('is_active', true)
          .order('order_number', { ascending: true })

        if (contentsError) throw new Error('خطأ في تحميل محتويات المحاضرات')
        setLectureContents(contentsData || [])
      }

    } catch (err: any) {
      throw err
    }
  }

  const loadUserProgress = async (userId: string) => {
    try {
      // جلب تقدم المستخدم
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('package_id', packageId)

      if (progressError) throw new Error('خطأ في تحميل التقدم')
      setUserProgress(progressData || [])

      // جلب نتائج الامتحانات
      const lectureContentIds = lectureContents
        .filter(content => content.type === 'exam')
        .map(content => content.id)

      if (lectureContentIds.length > 0) {
        const { data: examResultsData, error: examResultsError } = await supabase
          .from('exam_results')
          .select('*')
          .eq('user_id', userId)
          .in('content_id', lectureContentIds)
          .order('completed_at', { ascending: false })

        if (examResultsError) throw new Error('خطأ في تحميل نتائج الامتحانات')
        setExamResults(examResultsData || [])
      }

      // حساب نسبة الإتمام
      calculateCompletionPercentage(progressData || [])

    } catch (err: any) {
      throw err
    }
  }

  const calculateCompletionPercentage = (progress: UserProgress[]) => {
    if (lectureContents.length === 0) {
      setCompletionPercentage(0)
      return
    }

    const completedContents = progress.filter(p => 
      p.status === 'completed' || p.status === 'passed'
    ).length

    const percentage = Math.round((completedContents / lectureContents.length) * 100)
    setCompletionPercentage(percentage)
  }

  // ================== Helper Functions ==================
  const getLectureContents = (lectureId: string) => {
    return lectureContents
      .filter(content => content.lecture_id === lectureId)
      .sort((a, b) => a.order_number - b.order_number)
  }

  const getUserProgressForContent = (contentId: string) => {
    return userProgress.find(progress => progress.lecture_content_id === contentId)
  }

  const getExamResultForContent = (contentId: string) => {
    return examResults.find(result => result.content_id === contentId)
  }

  const isContentAccessible = (lectureIndex: number, contentIndex: number, content: LectureContent) => {
    // إذا كانت الباقة أسبوعية، كل المحتويات متاحة
    if (packageData?.type === 'weekly') return true

    // إذا كانت الباقة شهرية أو ترم كامل
    if (packageData?.type === 'monthly' || packageData?.type === 'term') {
      // المحاضرة الأولى والمحتوى الأول متاحان دائمًا
      if (lectureIndex === 0 && contentIndex === 0) return true

      // الحصول على المحاضرة الحالية
      const currentLecture = lectures[lectureIndex]
      const currentContents = getLectureContents(currentLecture.id)

      // إذا كان هذا أول محتوى في المحاضرة
      if (contentIndex === 0) {
        // إذا كانت هذه أول محاضرة، المحتوى الأول متاح
        if (lectureIndex === 0) return true

        // الحصول على المحاضرة السابقة
        const previousLecture = lectures[lectureIndex - 1]
        const previousContents = getLectureContents(previousLecture.id)

        // التحقق من وجود امتحان في المحاضرة السابقة
        const previousExam = previousContents.find(c => c.type === 'exam')
        
        if (!previousExam) {
          // إذا لم يكن هناك امتحان في المحاضرة السابقة، متاح
          return true
        } else {
          // التحقق من اجتياز الامتحان السابق
          const examProgress = getUserProgressForContent(previousExam.id)
          return examProgress?.status === 'passed'
        }
      } else {
        // إذا لم يكن أول محتوى، التحقق من إتمام المحتوى السابق
        const previousContent = currentContents[contentIndex - 1]
        const previousProgress = getUserProgressForContent(previousContent.id)
        
        // إذا كان المحتوى السابق امتحان، يجب اجتيازه
        if (previousContent.type === 'exam') {
          return previousProgress?.status === 'passed'
        } else {
          // إذا لم يكن امتحان، يكفي إتمامه
          return previousProgress?.status === 'completed'
        }
      }
    }

    return true
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5" />
      case 'pdf': return <File className="w-5 h-5" />
      case 'exam': return <Target className="w-5 h-5" />
      case 'text': return <FileText className="w-5 h-5" />
      default: return <BookOpen className="w-5 h-5" />
    }
  }

  const getContentStatus = (contentId: string) => {
    const progress = getUserProgressForContent(contentId)
    if (!progress) return 'not_started'
    
    switch (progress.status) {
      case 'completed': return 'completed'
      case 'passed': return 'passed'
      case 'failed': return 'failed'
      case 'in_progress': return 'in_progress'
      default: return 'not_started'
    }
  }

  const getContentStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return null
    }
  }

  const handleContentClick = async (lectureIndex: number, contentIndex: number, content: LectureContent) => {
    // التحقق من إمكانية الوصول
    if (!isContentAccessible(lectureIndex, contentIndex, content)) {
      alert('يجب إتمام المحتوى السابق أولاً')
      return
    }

    // تسجيل الوصول
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lecture_content_id: content.id,
          package_id: packageId,
          status: 'in_progress',
          last_accessed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lecture_content_id'
        })
    }

    // التوجيه إلى صفحة المحتوى
    router.push(`/grades/${gradeSlug}/packages/${packageId}/content/${content.id}`)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} دقيقة`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours} ساعة ${remainingMinutes > 0 ? `${remainingMinutes} دقيقة` : ''}`
  }

  // ================== Loading State ==================
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>
          <Loader2 className="w-12 h-12 animate-spin" />
        </div>
        <p className={styles.loadingText}>جاري تحميل الباقة...</p>
      </div>
    )
  }

  // ================== Error State ==================
  if (error || !packageData) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <AlertTriangle className="w-16 h-16 text-red-500" />
          <h2 className={styles.errorTitle}>حدث خطأ</h2>
          <p className={styles.errorMessage}>{error || 'الباقة غير موجودة'}</p>
          <button 
            onClick={() => router.push(`/grades/${gradeSlug}`)}
            className={styles.backButton}
          >
            <ArrowRight className="w-5 h-5" />
            العودة إلى الباقات
          </button>
        </div>
      </div>
    )
  }

  // ================== Main Page ==================
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <button 
            onClick={() => router.push('/')}
            className={styles.breadcrumbItem}
          >
            <Home className="w-4 h-4" />
            الرئيسية
          </button>
          <ChevronRight className="w-4 h-4" />
          <button 
            onClick={() => router.push(`/grades/${gradeSlug}`)}
            className={styles.breadcrumbItem}
          >
            {gradeSlug === 'first' ? 'الصف الأول الثانوي' : 
             gradeSlug === 'second' ? 'الصف الثاني الثانوي' : 
             'الصف الثالث الثانوي'}
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className={styles.breadcrumbCurrent}>{packageData.name}</span>
        </div>

        <div className={styles.packageHeader}>
          <div className={styles.packageImage}>
            {packageData.image_url ? (
              <img 
                src={packageData.image_url} 
                alt={packageData.name}
                className={styles.image}
              />
            ) : (
              <div className={styles.imagePlaceholder}>
                <GraduationCap className="w-16 h-16 text-white" />
              </div>
            )}
          </div>

          <div className={styles.packageInfo}>
            <h1 className={styles.packageTitle}>{packageData.name}</h1>
            <p className={styles.packageDescription}>{packageData.description}</p>
            
            <div className={styles.packageStats}>
              <div className={styles.statItem}>
                <PlayCircle className="w-5 h-5" />
                <span>{lectures.length} محاضرة</span>
              </div>
              <div className={styles.statItem}>
                <Clock className="w-5 h-5" />
                <span>{packageData.duration_days} يوم</span>
              </div>
              <div className={styles.statItem}>
                <Calendar className="w-5 h-5" />
                <span>
                  {packageData.type === 'weekly' ? 'أسبوعي' : 
                   packageData.type === 'monthly' ? 'شهري' : 
                   packageData.type === 'term' ? 'ترم كامل' : 'عرض خاص'}
                </span>
              </div>
            </div>

            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <BarChart3 className="w-5 h-5" />
                <span>نسبة الإتمام</span>
                <span className={styles.percentage}>{completionPercentage}%</span>
              </div>
              
              <div className={styles.progressBar}>
                <motion.div 
                  className={styles.progressFill}
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
              </div>
              
              <div className={styles.progressDetails}>
                <span>مكتمل: {userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length}</span>
                <span>المتبقي: {lectureContents.length - userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length}</span>
                <span>الإجمالي: {lectureContents.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lectures List */}
      <div className={styles.lecturesContainer}>
        <h2 className={styles.lecturesTitle}>
          <BookOpen className="w-6 h-6" />
          محاضرات الباقة
        </h2>

        {lectures.length === 0 ? (
          <div className={styles.emptyLectures}>
            <BookOpen className="w-12 h-12 text-gray-400" />
            <p>لا توجد محاضرات متاحة حالياً</p>
          </div>
        ) : (
          <div className={styles.lecturesList}>
            {lectures.map((lecture, lectureIndex) => (
              <div key={lecture.id} className={styles.lectureCard}>
                <div className={styles.lectureHeader}>
                  <div className={styles.lectureInfo}>
                    <h3 className={styles.lectureTitle}>
                      المحاضرة {lectureIndex + 1}: {lecture.title}
                    </h3>
                    {lecture.description && (
                      <p className={styles.lectureDescription}>{lecture.description}</p>
                    )}
                  </div>
                  
                  <div className={styles.lectureOrder}>
                    <span className={styles.orderBadge}>المحاضرة {lecture.order_number + 1}</span>
                  </div>
                </div>

                <div className={styles.contentsList}>
                  {getLectureContents(lecture.id).map((content, contentIndex) => {
                    const isAccessible = isContentAccessible(lectureIndex, contentIndex, content)
                    const contentStatus = getContentStatus(content.id)
                    const examResult = getExamResultForContent(content.id)

                    return (
                      <motion.div
                        key={content.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: contentIndex * 0.1 }}
                        className={`${styles.contentItem} ${
                          isAccessible ? styles.contentAccessible : styles.contentLocked
                        }`}
                      >
                        <div className={styles.contentHeader}>
                          <div className={styles.contentIcon}>
                            {getContentIcon(content.type)}
                          </div>
                          
                          <div className={styles.contentInfo}>
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
                                  <Clock className="w-4 h-4" />
                                  {formatDuration(content.duration_minutes)}
                                </span>
                              )}
                              {content.type === 'exam' && (
                                <span className={styles.examInfo}>
                                  <Target className="w-4 h-4" />
                                  النجاح: {content.pass_score}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className={styles.contentActions}>
                          <div className={styles.contentStatus}>
                            {getContentStatusIcon(contentStatus)}
                            {contentStatus === 'passed' && examResult && (
                              <span className={styles.examScore}>الدرجة: {examResult.score}%</span>
                            )}
                            {contentStatus === 'failed' && (
                              <span className={styles.failedText}>لم يتم النجاح</span>
                            )}
                            {contentStatus === 'completed' && (
                              <span className={styles.completedText}>مكتمل</span>
                            )}
                          </div>

                          <button
                            onClick={() => handleContentClick(lectureIndex, contentIndex, content)}
                            disabled={!isAccessible}
                            className={`${styles.contentButton} ${
                              isAccessible ? styles.buttonEnabled : styles.buttonDisabled
                            }`}
                          >
                            {isAccessible ? (
                              <>
                                {contentStatus === 'not_started' ? 'بدء' : 'استكمال'}
                                <PlayCircle className="w-5 h-5" />
                              </>
                            ) : (
                              <>
                                غير متاح
                                <Lock className="w-5 h-5" />
                              </>
                            )}
                          </button>
                        </div>

                        {!isAccessible && (
                          <div className={styles.lockMessage}>
                            <AlertCircle className="w-4 h-4" />
                            <span>يجب إتمام المحتوى السابق أولاً</span>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Package Info Footer */}
      <div className={styles.packageFooter}>
        <div className={styles.footerCard}>
          <Award className="w-8 h-8" />
          <div className={styles.footerInfo}>
            <h4>ملاحظات هامة</h4>
            <ul className={styles.notesList}>
              {packageData.type === 'monthly' || packageData.type === 'term' ? (
                <>
                  <li>يجب إتمام كل محتوى قبل الانتقال للذي يليه</li>
                  <li>لابد من اجتياز الامتحان قبل الانتقال للمحاضرة التالية</li>
                  <li>يمكنك إعادة الامتحان حتى 3 مرات</li>
                </>
              ) : (
                <>
                  <li>جميع المحاضرات متاحة مباشرة</li>
                  <li>يمكنك البدء بأي محاضرة تريد</li>
                </>
              )}
              <li>مدة الاشتراك: {userPackage?.expires_at ? 
                new Date(userPackage.expires_at).toLocaleDateString('ar-EG') : 'غير محددة'}</li>
            </ul>
          </div>
        </div>

        <button
          onClick={() => router.push(`/grades/${gradeSlug}`)}
          className={styles.backToPackages}
        >
          <ArrowRight className="w-5 h-5" />
          العودة إلى الباقات
        </button>
      </div>
    </div>
  )
}