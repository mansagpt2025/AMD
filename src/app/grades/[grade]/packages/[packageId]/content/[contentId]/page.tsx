'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase/sf-client'
import {
  Video,
  FileText,
  BookOpen,
  Clock,
  CheckCircle,
  X,
  ArrowRight,
  AlertCircle,
  Loader2,
  Download,
  Play,
  Target
} from 'lucide-react'
import styles from './styles.module.css'

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
}

interface UserProgress {
  id: string
  user_id: string
  lecture_content_id: string
  package_id: string
  status: 'not_started' | 'in_progress' | 'completed' | 'passed' | 'failed'
  score: number | null
  attempts: number
}

export default function ContentPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClientBrowser()
  
  const gradeSlug = params?.grade as string
  const packageId = params?.packageId as string
  const contentId = params?.contentId as string

  const [content, setContent] = useState<LectureContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [videoTime, setVideoTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)

  useEffect(() => {
    loadContent()
  }, [contentId])

  const loadContent = async () => {
    setLoading(true)
    try {
      // التحقق من الوصول
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/login?returnUrl=/grades/${gradeSlug}/packages/${packageId}/content/${contentId}`)
        return
      }

      // جلب بيانات المحتوى
      const { data: contentData, error: contentError } = await supabase
        .from('lecture_contents')
        .select('*')
        .eq('id', contentId)
        .eq('is_active', true)
        .single()

      if (contentError || !contentData) {
        throw new Error('المحتوى غير موجود')
      }
      setContent(contentData)

      // جلب تقدم المستخدم
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lecture_content_id', contentId)
        .maybeSingle()

      setProgress(progressData || null)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoProgress = (currentTime: number, duration: number) => {
    setVideoTime(currentTime)
    setTotalDuration(duration)
    
    // إذا شاهد 80% من الفيديو، تمييز كمكتمل
    if (duration > 0 && currentTime / duration >= 0.8) {
      markAsCompleted()
    }
  }

  const markAsCompleted = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !content) return

    const status = content.type === 'exam' ? 'passed' : 'completed'
    
    await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        lecture_content_id: contentId,
        package_id: packageId,
        status: status,
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,lecture_content_id'
      })

    // تحديث التقدم المحلي
    setProgress({
      id: progress?.id || `temp-${Date.now()}`,
      user_id: user.id,
      lecture_content_id: contentId,
      package_id: packageId,
      status: status,
      score: null,
      attempts: (progress?.attempts || 0) + 1
    })
  }

  const handleBack = () => {
    router.push(`/grades/${gradeSlug}/packages/${packageId}`)
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className="w-8 h-8 animate-spin" />
        <p>جاري تحميل المحتوى...</p>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2>حدث خطأ</h2>
        <p>{error || 'المحتوى غير موجود'}</p>
        <button onClick={handleBack} className={styles.backButton}>
          <ArrowRight className="w-5 h-5" />
          العودة للباقة
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={handleBack} className={styles.backButton}>
          <ArrowRight className="w-5 h-5" />
          العودة
        </button>
        
        <div className={styles.titleSection}>
          <h1>{content.title}</h1>
          {content.description && <p>{content.description}</p>}
        </div>

        <div className={styles.metaInfo}>
          <span>
            {content.type === 'video' ? 'فيديو' : 
             content.type === 'pdf' ? 'ملف PDF' : 
             content.type === 'exam' ? 'امتحان' : 'نص'}
          </span>
          {content.duration_minutes > 0 && (
            <span>
              <Clock className="w-4 h-4" />
              {content.duration_minutes} دقيقة
            </span>
          )}
        </div>
      </div>

      <div className={styles.contentArea}>
        {content.type === 'video' && content.content_url ? (
          <div className={styles.videoContainer}>
            <video
              controls
              className={styles.videoPlayer}
              onTimeUpdate={(e) => handleVideoProgress(
                e.currentTarget.currentTime,
                e.currentTarget.duration
              )}
            >
              <source src={content.content_url} type="video/mp4" />
              متصفحك لا يدعم تشغيل الفيديو.
            </video>
          </div>
        ) : content.type === 'pdf' && content.content_url ? (
          <div className={styles.pdfContainer}>
            <iframe
              src={content.content_url}
              className={styles.pdfViewer}
              title={content.title}
            />
            <a
              href={content.content_url}
              download
              className={styles.downloadButton}
            >
              <Download className="w-5 h-5" />
              تحميل الملف
            </a>
          </div>
        ) : content.type === 'text' ? (
          <div className={styles.textContainer}>
            <div className={styles.textContent}>
              {content.content_url ? (
                <iframe src={content.content_url} className={styles.textViewer} />
              ) : (
                <p>المحتوى النصي غير متاح حالياً.</p>
              )}
            </div>
          </div>
        ) : content.type === 'exam' ? (
          <div className={styles.examContainer}>
            <div className={styles.examInfo}>
              <Target className="w-8 h-8" />
              <h3>امتحان: {content.title}</h3>
              <p>درجة النجاح: {content.pass_score}%</p>
              <p>عدد المحاولات المتاحة: {content.max_attempts}</p>
              
              {progress?.status === 'passed' ? (
                <div className={styles.successMessage}>
                  <CheckCircle className="w-6 h-6" />
                  <span>مبروك! لقد نجحت في هذا الامتحان.</span>
                </div>
              ) : progress?.status === 'failed' ? (
                <div className={styles.errorMessage}>
                  <X className="w-6 h-6" />
                  <span>لم تنجح في هذا الامتحان. يمكنك المحاولة مرة أخرى.</span>
                </div>
              ) : (
                <button
                  onClick={() => router.push(`/exam/${contentId}`)}
                  className={styles.startExamButton}
                >
                  <Play className="w-5 h-5" />
                  بدء الامتحان
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.unsupportedContainer}>
            <AlertCircle className="w-12 h-12" />
            <p>نوع المحتوى غير مدعوم.</p>
          </div>
        )}

        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <h4>حالة المحتوى</h4>
            {progress && (
              <span className={
                progress.status === 'completed' || progress.status === 'passed' 
                  ? styles.completedBadge 
                  : styles.inProgressBadge
              }>
                {progress.status === 'completed' ? 'مكتمل' :
                 progress.status === 'passed' ? 'ناجح' :
                 progress.status === 'failed' ? 'فاشل' : 'قيد التقدم'}
              </span>
            )}
          </div>

          {content.type === 'video' && totalDuration > 0 && (
            <div className={styles.videoProgress}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${(videoTime / totalDuration) * 100}%` }}
                />
              </div>
              <span>{Math.round(videoTime)} / {Math.round(totalDuration)} ثانية</span>
            </div>
          )}

          <button
            onClick={markAsCompleted}
            disabled={progress?.status === 'completed' || progress?.status === 'passed'}
            className={styles.markCompleteButton}
          >
            {progress?.status === 'completed' || progress?.status === 'passed' ? (
              <>
                <CheckCircle className="w-5 h-5" />
                تم الإكمال
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                تمييز كمكتمل
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}