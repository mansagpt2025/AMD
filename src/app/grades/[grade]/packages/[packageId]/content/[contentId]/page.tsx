'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClientBrowser } from '@/lib/supabase/sf-client'
import {
  Video, FileText, BookOpen, Clock, CheckCircle,
  X, ArrowRight, AlertCircle, Loader2, Download,
  Play, Target, Lock, Eye, Home,
  ChevronRight, Shield, Award, Users,
  Maximize, Settings, Volume2, Pause,
  BarChart, Zap, Star, Crown
} from 'lucide-react'
import { getGradeTheme } from '@/lib/utils/grade-themes'
import ProtectedVideoPlayer from '@/components/content/ProtectedVideoPlayer'
import PDFViewer from '@/components/content/PDFViewer'
import ExamViewer from '@/components/content/ExamViewer'
import styles from './ContentPage.module.css'

export default function ContentPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClientBrowser()
  
  const gradeSlug = params?.grade as 'first' | 'second' | 'third'
  const packageId = params?.packageId as string
  const contentId = params?.contentId as string
  
  const theme = getGradeTheme(gradeSlug)

  const [content, setContent] = useState<any>(null)
  const [lecture, setLecture] = useState<any>(null)
  const [packageData, setPackageData] = useState<any>(null)
  const [userProgress, setUserProgress] = useState<any>(null)
  const [userPackage, setUserPackage] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'viewer' | 'info'>('viewer')
  const [videoProgress, setVideoProgress] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  useEffect(() => {
    loadContent()
  }, [contentId])

  const loadContent = async () => {
    try {
      // التحقق من الوصول
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/login?returnUrl=/grades/${gradeSlug}/packages/${packageId}/content/${contentId}`)
        return
      }
      setCurrentUser(user)

      // جلب المحتوى
      const { data: contentData } = await supabase
        .from('lecture_contents')
        .select('*')
        .eq('id', contentId)
        .single()
      setContent(contentData)

      // جلب المحاضرة
      const { data: lectureData } = await supabase
        .from('lectures')
        .select('*')
        .eq('id', contentData.lecture_id)
        .single()
      setLecture(lectureData)

      // جلب الباقة
      const { data: packageData } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single()
      setPackageData(packageData)

      // جلب بيانات اشتراك المستخدم
      const { data: userPackageData } = await supabase
        .from('user_packages')
        .select('*')
        .eq('user_id', user.id)
        .eq('package_id', packageId)
        .eq('is_active', true)
        .single()
      setUserPackage(userPackageData)

      // جلب تقدم المستخدم أو إنشاؤه
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lecture_content_id', contentId)
        .maybeSingle()

      if (!progressData) {
        // إنشاء تقدم جديد
        const { data: newProgress, error: progressError } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            lecture_content_id: contentId,
            package_id: packageId,
            status: 'not_started',
            last_accessed_at: new Date().toISOString()
          })
          .select()
          .single()

        if (!progressError && newProgress) {
          setUserProgress(newProgress)
          
          // تسجيل الوصول بعد الإنشاء
          await supabase
            .from('user_progress')
            .update({
              last_accessed_at: new Date().toISOString()
            })
            .eq('id', newProgress.id)
        }
      } else {
        setUserProgress(progressData)
        
        // تسجيل الوصول
        await supabase
          .from('user_progress')
          .update({
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', progressData.id)
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoProgress = (progress: number) => {
    setVideoProgress(progress)
    
    // إذا شاهد 80% من الفيديو، تمييز كمكتمل
    if (progress >= 80 && content?.type === 'video') {
      markAsCompleted()
    }
  }

  const handleVideoPlay = (playing: boolean) => {
    setIsVideoPlaying(playing)
  }

  const markAsCompleted = async () => {
    if (!userProgress || !content) return
    if (userProgress.status === 'completed' || userProgress.status === 'passed') return

    const status = content.type === 'exam' ? 'passed' : 'completed'
    
    const { error } = await supabase
      .from('user_progress')
      .update({
        status,
        completed_at: new Date().toISOString()
      })
      .eq('id', userProgress.id)

    if (!error) {
      setUserProgress({ ...userProgress, status })
    }
  }

  const handleBack = () => {
    router.push(`/grades/${gradeSlug}/packages/${packageId}`)
  }

  const renderContent = () => {
    if (!content) return null

    switch (content.type) {
      case 'video':
        return (
          <ProtectedVideoPlayer
            videoUrl={content.content_url || ''}
            contentId={contentId}
            userId={currentUser?.id}
            onProgress={handleVideoProgress}
            theme={theme}
          />
        )
      case 'pdf':
        return (
          <PDFViewer
            pdfUrl={content.content_url || ''}
            contentId={contentId}
            userId={currentUser?.id}
            theme={theme}
          />
        )
      case 'exam':
        return (
          <ExamViewer
            examContent={content}
            contentId={contentId}
            packageId={packageId}
            userId={currentUser?.id}
            theme={theme}
            onComplete={markAsCompleted}
          />
        )
      case 'text':
        return (
          <div className={styles.textContent}>
            <div className={styles.textContentInner}>
              {content.content_url ? (
                <div dangerouslySetInnerHTML={{ __html: content.content_url }} />
              ) : (
                'لا يوجد محتوى نصي'
              )}
            </div>
          </div>
        )
      default:
        return (
          <div className={styles.unsupportedContent}>
            <AlertCircle className={styles.unsupportedIcon} />
            <p className={styles.unsupportedText}>نوع المحتوى غير مدعوم</p>
          </div>
        )
    }
  }

  const getContentTypeLabel = () => {
    switch (content?.type) {
      case 'video': return 'فيديو تعليمي'
      case 'pdf': return 'ملف PDF'
      case 'exam': return 'امتحان تقييمي'
      case 'text': return 'نص تعليمي'
      default: return 'محتوى'
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.loadingSpinner} style={{ color: theme.primary }} />
        <p className={styles.loadingText}>جاري تحميل المحتوى...</p>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <AlertCircle className={styles.errorIcon} />
          <h2 className={styles.errorTitle}>حدث خطأ</h2>
          <p className={styles.errorMessage}>{error || 'المحتوى غير موجود'}</p>
          <button
            onClick={handleBack}
            className={styles.backButton}
            style={{ background: theme.primary }}
          >
            العودة للباقة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.header}>
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
            <button
              onClick={() => router.push(`/grades/${gradeSlug}/packages/${packageId}`)}
              className={styles.breadcrumbItem}
            >
              {packageData?.name}
            </button>
            <ChevronRight className={styles.breadcrumbSeparator} />
            <span className={styles.currentPage}>{content.title}</span>
          </div>

          {/* Content Header */}
          <div className={styles.contentHeader}>
            <div className={styles.contentInfo}>
              <h1 className={styles.contentTitle}>{content.title}</h1>
              <div className={styles.contentMeta}>
                <span className={styles.contentType}>
                  {getContentTypeLabel()}
                </span>
                <span className={styles.contentSeparator}>•</span>
                <span className={styles.lectureName}>{lecture?.title}</span>
                <span className={styles.contentSeparator}>•</span>
                <span className={styles.packageName}>{packageData?.name}</span>
              </div>
            </div>

            <div className={styles.headerActions}>
              <button
                onClick={handleBack}
                className={styles.backActionButton}
                style={{ borderColor: theme.primary, color: theme.primary }}
              >
                <ArrowRight className={styles.backActionIcon} />
                العودة
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.contentLayout}>
          {/* Left Column - Content Viewer */}
          <div className={styles.leftColumn}>
            {/* Tabs */}
            <div className={styles.tabs}>
              <button
                onClick={() => setActiveTab('viewer')}
                className={`${styles.tabButton} ${activeTab === 'viewer' ? styles.activeTab : ''}`}
                style={activeTab === 'viewer' ? { 
                  borderColor: theme.primary, 
                  color: theme.primary 
                } : {}}
              >
                <Eye className={styles.tabIcon} />
                <span>عارض المحتوى</span>
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`${styles.tabButton} ${activeTab === 'info' ? styles.activeTab : ''}`}
                style={activeTab === 'info' ? { 
                  borderColor: theme.primary, 
                  color: theme.primary 
                } : {}}
              >
                <BookOpen className={styles.tabIcon} />
                <span>معلومات المحتوى</span>
              </button>
            </div>

            {/* Content Area */}
            <div className={styles.contentArea}>
              {activeTab === 'viewer' ? (
                <div className={styles.viewerContainer}>
                  {renderContent()}
                </div>
              ) : (
                <div className={styles.infoContainer}>
                  <div className={styles.infoContent}>
                    <h3 className={styles.infoTitle}>معلومات المحتوى</h3>
                    
                    <div className={styles.infoGrid}>
                      <div className={styles.infoSection}>
                        <h4 className={styles.infoSectionTitle}>الوصف</h4>
                        <p className={styles.infoDescription}>
                          {content.description || 'لا يوجد وصف متاح'}
                        </p>
                      </div>
                      
                      <div className={styles.infoDetails}>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>نوع المحتوى</div>
                          <div className={styles.detailValue}>
                            <span className={styles.detailBadge}>
                              {content.type === 'video' ? (
                                <>
                                  <Video className={styles.detailIcon} />
                                  فيديو
                                </>
                              ) : content.type === 'pdf' ? (
                                <>
                                  <FileText className={styles.detailIcon} />
                                  ملف PDF
                                </>
                              ) : content.type === 'exam' ? (
                                <>
                                  <Target className={styles.detailIcon} />
                                  امتحان
                                </>
                              ) : (
                                <>
                                  <BookOpen className={styles.detailIcon} />
                                  نص
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                        
                        {content.duration_minutes > 0 && (
                          <div className={styles.detailItem}>
                            <div className={styles.detailLabel}>المدة الزمنية</div>
                            <div className={styles.detailValue}>
                              <span className={styles.detailBadge}>
                                <Clock className={styles.detailIcon} />
                                {content.duration_minutes} دقيقة
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {content.type === 'exam' && (
                          <>
                            <div className={styles.detailItem}>
                              <div className={styles.detailLabel}>درجة النجاح</div>
                              <div className={styles.detailValue}>
                                <span className={styles.detailBadge}>
                                  <Target className={styles.detailIcon} />
                                  {content.pass_score}%
                                </span>
                              </div>
                            </div>
                            <div className={styles.detailItem}>
                              <div className={styles.detailLabel}>عدد المحاولات</div>
                              <div className={styles.detailValue}>
                                <span className={styles.detailBadge}>
                                  <Users className={styles.detailIcon} />
                                  {content.max_attempts} محاولة
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Tracking */}
              {content.type === 'video' && (
                <div className={styles.progressTracking}>
                  <div className={styles.progressHeader}>
                    <h4 className={styles.progressTitle}>تقدم المشاهدة</h4>
                    <span className={styles.progressPercentage}>{videoProgress}%</span>
                  </div>
                  
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ 
                        width: `${videoProgress}%`, 
                        background: theme.primary 
                      }}
                    />
                  </div>
                  
                  <div className={styles.progressLabels}>
                    <span className={styles.progressLabel}>لم يشاهد</span>
                    <span className={styles.progressLabel}>مشاهدة كاملة</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Actions & Info */}
          <div className={styles.rightColumn}>
            {/* Content Status */}
            <div className={styles.statusCard}>
              <h4 className={styles.cardTitle}>حالة المحتوى</h4>
              
              <div className={`${styles.statusContent} ${
                userProgress?.status === 'completed' || userProgress?.status === 'passed' 
                  ? styles.statusCompleted
                  : userProgress?.status === 'failed'
                  ? styles.statusFailed
                  : userProgress?.status === 'in_progress'
                  ? styles.statusInProgress
                  : styles.statusNotStarted
              }`}>
                {userProgress?.status === 'completed' || userProgress?.status === 'passed' ? (
                  <CheckCircle className={styles.statusIcon} />
                ) : userProgress?.status === 'failed' ? (
                  <X className={styles.statusIcon} />
                ) : userProgress?.status === 'in_progress' ? (
                  <Loader2 className={`${styles.statusIcon} ${styles.spinning}`} />
                ) : (
                  <BookOpen className={styles.statusIcon} />
                )}
                <div className={styles.statusInfo}>
                  <div className={styles.statusText}>
                    {userProgress?.status === 'completed' ? 'مكتمل' :
                     userProgress?.status === 'passed' ? 'ناجح' :
                     userProgress?.status === 'failed' ? 'فاشل' :
                     userProgress?.status === 'in_progress' ? 'قيد التقدم' : 'لم يبدأ'}
                  </div>
                  {userProgress?.completed_at && (
                    <div className={styles.statusDate}>
                      تم الإكمال: {new Date(userProgress.completed_at).toLocaleDateString('ar-EG')}
                    </div>
                  )}
                </div>
              </div>

              {/* Mark as Complete Button */}
              {content.type !== 'exam' && (
                <button
                  onClick={markAsCompleted}
                  disabled={userProgress?.status === 'completed' || userProgress?.status === 'passed'}
                  className={`${styles.completeButton} ${
                    userProgress?.status === 'completed' || userProgress?.status === 'passed'
                      ? styles.completeButtonDisabled : ''
                  }`}
                  style={!(userProgress?.status === 'completed' || userProgress?.status === 'passed') ? 
                    { background: theme.success } : {}}
                >
                  {userProgress?.status === 'completed' || userProgress?.status === 'passed' ? (
                    <>
                      <CheckCircle className={styles.completeIcon} />
                      تم الإكمال
                    </>
                  ) : (
                    <>
                      <CheckCircle className={styles.completeIcon} />
                      تمييز كمكتمل
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className={styles.actionsCard}>
              <h4 className={styles.cardTitle}>إجراءات سريعة</h4>
              
              <div className={styles.actionsList}>
                {content.type === 'pdf' && (
                  <a
                    href={content.content_url || '#'}
                    download
                    className={styles.actionItem}
                  >
                    <span className={styles.actionText}>تحميل الملف</span>
                    <Download className={styles.actionIcon} />
                  </a>
                )}
                
                <button
                  onClick={() => router.push(`/grades/${gradeSlug}/packages/${packageId}`)}
                  className={styles.actionItem}
                >
                  <span className={styles.actionText}>العودة للباقة</span>
                  <ArrowRight className={styles.actionIcon} />
                </button>
                
                <button
                  onClick={() => router.push(`/grades/${gradeSlug}`)}
                  className={styles.actionItem}
                >
                  <span className={styles.actionText}>جميع باقات الصف</span>
                  <BookOpen className={styles.actionIcon} />
                </button>
              </div>
            </div>

            {/* Package Info */}
            <div className={styles.packageCard}>
              <h4 className={styles.cardTitle}>معلومات الباقة</h4>
              
              <div className={styles.packageInfo}>
                <div className={styles.packageItem}>
                  <div className={styles.packageIcon} style={{ background: theme.primary }}>
                    <Award className={styles.packageItemIcon} />
                  </div>
                  <div className={styles.packageDetails}>
                    <div className={styles.packageName}>{packageData?.name}</div>
                    <div className={styles.packageType}>
                      {packageData?.type === 'weekly' ? 'أسبوعي' : 
                       packageData?.type === 'monthly' ? 'شهري' : 'ترم كامل'}
                    </div>
                  </div>
                </div>
                
                <div className={styles.packageItem}>
                  <div className={styles.packageIcon} style={{ background: theme.success }}>
                    <Shield className={styles.packageItemIcon} />
                  </div>
                  <div className={styles.packageDetails}>
                    <div className={styles.packageName}>حالة الاشتراك</div>
                    <div className={styles.packageStatus}>
                      {userPackage?.expires_at 
                        ? `نشط حتى ${new Date(userPackage.expires_at).toLocaleDateString('ar-EG')}`
                        : 'غير متاح'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className={styles.tipsCard}>
              <div className={styles.tipsHeader}>
                <Zap className={styles.tipsIcon} style={{ color: theme.warning || '#f59e0b' }} />
                <h5 className={styles.tipsTitle}>نصائح للتعلم</h5>
              </div>
              <ul className={styles.tipsList}>
                <li className={styles.tipItem}>خذ ملاحظات أثناء المشاهدة</li>
                <li className={styles.tipItem}>كرر الأجزاء المهمة</li>
                <li className={styles.tipItem}>اختبر فهمك بعد كل محتوى</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}