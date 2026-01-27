'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase/sf-client'
import {
  Video, FileText, BookOpen, Clock, CheckCircle,
  X, ArrowRight, AlertCircle, Loader2, Download,
  Target, Lock, Eye, Home, ChevronRight, Shield, 
  Award, Zap
} from 'lucide-react'
import { getGradeTheme } from '@/lib/utils/grade-themes'
import ProtectedVideoPlayer from '@/components/content/ProtectedVideoPlayer'
import PDFViewer from '@/components/content/PDFViewer'
import ExamViewer from '@/components/content/ExamViewer'
import styles from './ContentPage.module.css'

function LoadingState() {
  return (
    <div className={styles.loadingContainer}>
      <Loader2 className={styles.loadingSpinner} />
      <p className={styles.loadingText}>جاري تحميل المحتوى...</p>
    </div>
  )
}

function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <AlertCircle className={styles.errorIcon} />
        <h2 className={styles.errorTitle}>حدث خطأ</h2>
        <p className={styles.errorMessage}>{message}</p>
        <button onClick={onBack} className={styles.backButton}>
          العودة للباقة
        </button>
      </div>
    </div>
  )
}

function ContentViewer() {
  const router = useRouter()
  const params = useParams()
  const [mounted, setMounted] = useState(false)
  
  const gradeSlug = params?.grade as string
  const packageId = params?.packageId as string
  const contentId = params?.contentId as string
  
  const theme = getGradeTheme(gradeSlug as any)

  const [content, setContent] = useState<any>(null)
  const [lecture, setLecture] = useState<any>(null)
  const [packageData, setPackageData] = useState<any>(null)
  const [userProgress, setUserProgress] = useState<any>(null)
  const [userPackage, setUserPackage] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'viewer' | 'info'>('viewer')
  const [videoProgress, setVideoProgress] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && contentId && packageId && gradeSlug) {
      loadContent()
    }
  }, [mounted, contentId, packageId, gradeSlug])

  const loadContent = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClientBrowser()
      
      // Check auth
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        router.push(`/login?returnUrl=/grades/${gradeSlug}/packages/${packageId}/content/${contentId}`)
        return
      }
      setCurrentUser(user)

      // Fetch content
      const { data: contentData, error: contentError } = await supabase
        .from('lecture_contents')
        .select('*')
        .eq('id', contentId)
        .single()
      
      if (contentError || !contentData) {
        setError('المحتوى غير موجود أو تم حذفه')
        return
      }
      setContent(contentData)

      // Fetch lecture
      const { data: lectureData, error: lectureError } = await supabase
        .from('lectures')
        .select('*')
        .eq('id', contentData.lecture_id)
        .single()
      
      if (lectureError) throw lectureError
      setLecture(lectureData)

      // Fetch package
      const { data: pkgData, error: pkgError } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single()
      
      if (pkgError) throw pkgError
      setPackageData(pkgData)

      // Check access
      const { data: userPackageData } = await supabase
        .from('user_packages')
        .select('*')
        .eq('user_id', user.id)
        .eq('package_id', packageId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (!userPackageData) {
        router.push(`/grades/${gradeSlug}/packages/${packageId}?error=no_access`)
        return
      }
      setUserPackage(userPackageData)

      // Get or create progress
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lecture_content_id', contentId)
        .maybeSingle()

      const now = new Date().toISOString()
      
      if (!progressData) {
        const { data: newProgress, error: insertError } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            lecture_content_id: contentId,
            package_id: packageId,
            status: 'in_progress',
            last_accessed_at: now,
            created_at: now
          })
          .select()
          .single()

        if (insertError) throw insertError
        setUserProgress(newProgress)
      } else {
        if (progressData.status === 'not_started') {
          await supabase.from('user_progress').update({ 
            status: 'in_progress', 
            last_accessed_at: now 
          }).eq('id', progressData.id)
          setUserProgress({ ...progressData, status: 'in_progress', last_accessed_at: now })
        } else {
          await supabase.from('user_progress').update({ 
            last_accessed_at: now 
          }).eq('id', progressData.id)
          setUserProgress(progressData)
        }
      }

    } catch (err: any) {
      console.error('Error loading content:', err)
      setError(err?.message || 'حدث خطأ في تحميل المحتوى')
    } finally {
      setLoading(false)
    }
  }

  const handleVideoProgress = (progress: number) => {
    setVideoProgress(progress)
    if (progress >= 80 && content?.type === 'video') {
      markAsCompleted()
    }
  }

  const markAsCompleted = async () => {
    if (!userProgress || !content || !currentUser) return
    if (userProgress.status === 'completed' || userProgress.status === 'passed') return

    const status = content.type === 'exam' ? 'passed' : 'completed'
    const now = new Date().toISOString()
    
    try {
      const supabase = createClientBrowser()
      const { error } = await supabase
        .from('user_progress')
        .update({ status, completed_at: now })
        .eq('id', userProgress.id)

      if (!error) {
        setUserProgress({ ...userProgress, status, completed_at: now })
      }
    } catch (err) {
      console.error('Error marking complete:', err)
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
            packageId={packageId}
            onProgress={handleVideoProgress}
            theme={theme}
          />
        )
      case 'pdf':
        return (
          <PDFViewer
            pdfUrl={content.content_url || ''}
            contentId={contentId}
            packageId={packageId}
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

  if (!mounted) return <LoadingState />
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onBack={handleBack} />
  if (!content) return <ErrorState message="المحتوى غير موجود" onBack={handleBack} />

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.breadcrumb}>
            <button onClick={() => router.push('/')} className={styles.breadcrumbItem}>
              <Home size={16} />الرئيسية
            </button>
            <ChevronRight size={16} className={styles.breadcrumbSeparator} />
            <button onClick={() => router.push(`/grades/${gradeSlug}`)} className={styles.breadcrumbItem}>
              {gradeSlug === 'first' ? 'الصف الأول' : gradeSlug === 'second' ? 'الصف الثاني' : 'الصف الثالث'}
            </button>
            <ChevronRight size={16} className={styles.breadcrumbSeparator} />
            <button onClick={() => router.push(`/grades/${gradeSlug}/packages/${packageId}`)} className={styles.breadcrumbItem}>
              {packageData?.name || 'الباقة'}
            </button>
            <ChevronRight size={16} className={styles.breadcrumbSeparator} />
            <span className={styles.currentPage}>{content.title}</span>
          </div>

          <div className={styles.contentHeader}>
            <div className={styles.contentInfo}>
              <h1 className={styles.contentTitle}>{content.title}</h1>
              <div className={styles.contentMeta}>
                <span className={styles.contentType}>{getContentTypeLabel()}</span>
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
                <ArrowRight size={18} />العودة
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.contentLayout}>
          <div className={styles.leftColumn}>
            <div className={styles.tabs}>
              <button 
                onClick={() => setActiveTab('viewer')} 
                className={`${styles.tabButton} ${activeTab === 'viewer' ? styles.activeTab : ''}`} 
                style={activeTab === 'viewer' ? { borderColor: theme.primary, color: theme.primary } : {}}
              >
                <Eye size={18} /><span>عارض المحتوى</span>
              </button>
              <button 
                onClick={() => setActiveTab('info')} 
                className={`${styles.tabButton} ${activeTab === 'info' ? styles.activeTab : ''}`} 
                style={activeTab === 'info' ? { borderColor: theme.primary, color: theme.primary } : {}}
              >
                <BookOpen size={18} /><span>معلومات المحتوى</span>
              </button>
            </div>

            <div className={styles.contentArea}>
              {activeTab === 'viewer' ? (
                <div className={styles.viewerContainer}>{renderContent()}</div>
              ) : (
                <div className={styles.infoContainer}>
                  <div className={styles.infoContent}>
                    <h3 className={styles.infoTitle}>معلومات المحتوى</h3>
                    <div className={styles.infoGrid}>
                      <div className={styles.infoSection}>
                        <h4 className={styles.infoSectionTitle}>الوصف</h4>
                        <p className={styles.infoDescription}>{content.description || 'لا يوجد وصف متاح'}</p>
                      </div>
                      <div className={styles.infoDetails}>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>نوع المحتوى</div>
                          <div className={styles.detailValue}>
                            <span className={styles.detailBadge}>
                              {content.type === 'video' ? (<><Video size={16} />فيديو</>) : 
                               content.type === 'pdf' ? (<><FileText size={16} />ملف PDF</>) : 
                               content.type === 'exam' ? (<><Target size={16} />امتحان</>) : 
                               (<><BookOpen size={16} />نص</>)}
                            </span>
                          </div>
                        </div>
                        {content.duration_minutes > 0 && (
                          <div className={styles.detailItem}>
                            <div className={styles.detailLabel}>المدة الزمنية</div>
                            <div className={styles.detailValue}>
                              <span className={styles.detailBadge}><Clock size={14} />{content.duration_minutes} دقيقة</span>
                            </div>
                          </div>
                        )}
                        {content.type === 'exam' && (
                          <>
                            <div className={styles.detailItem}>
                              <div className={styles.detailLabel}>درجة النجاح</div>
                              <div className={styles.detailValue}>
                                <span className={styles.detailBadge}><Target size={14} />{content.pass_score}%</span>
                              </div>
                            </div>
                            <div className={styles.detailItem}>
                              <div className={styles.detailLabel}>عدد المحاولات</div>
                              <div className={styles.detailValue}>
                                <span className={styles.detailBadge}><Clock size={14} />{content.max_attempts} محاولة</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {content.type === 'video' && (
                <div className={styles.progressTracking}>
                  <div className={styles.progressHeader}>
                    <h4 className={styles.progressTitle}>تقدم المشاهدة</h4>
                    <span className={styles.progressPercentage}>{videoProgress}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${videoProgress}%`, background: theme.primary }} 
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

          <div className={styles.rightColumn}>
            <div className={styles.statusCard}>
              <h4 className={styles.cardTitle}>حالة المحتوى</h4>
              <div 
                className={`${styles.statusContent} ${
                  userProgress?.status === 'completed' || userProgress?.status === 'passed' ? styles.statusCompleted :
                  userProgress?.status === 'failed' ? styles.statusFailed :
                  userProgress?.status === 'in_progress' ? styles.statusInProgress : styles.statusNotStarted
                }`}
              >
                {userProgress?.status === 'completed' || userProgress?.status === 'passed' ? (
                  <CheckCircle size={24} />
                ) : userProgress?.status === 'failed' ? (
                  <X size={24} />
                ) : userProgress?.status === 'in_progress' ? (
                  <Loader2 className={styles.spinning} size={24} />
                ) : (
                  <BookOpen size={24} />
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

              {content.type !== 'exam' && (
                <button 
                  onClick={markAsCompleted} 
                  disabled={userProgress?.status === 'completed' || userProgress?.status === 'passed'}
                  className={`${styles.completeButton} ${userProgress?.status === 'completed' || userProgress?.status === 'passed' ? styles.completeButtonDisabled : ''}`}
                  style={!(userProgress?.status === 'completed' || userProgress?.status === 'passed') ? { background: theme.success } : {}}
                >
                  {userProgress?.status === 'completed' || userProgress?.status === 'passed' ? (
                    <><CheckCircle size={18} />تم الإكمال</>
                  ) : (
                    <><CheckCircle size={18} />تمييز كمكتمل</>
                  )}
                </button>
              )}
            </div>

            <div className={styles.actionsCard}>
              <h4 className={styles.cardTitle}>إجراءات سريعة</h4>
              <div className={styles.actionsList}>
                {content.type === 'pdf' && content.content_url && (
                  <a 
                    href={content.content_url} 
                    download 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.actionItem}
                  >
                    <span className={styles.actionText}>تحميل الملف</span>
                    <Download size={18} />
                  </a>
                )}
                <button 
                  onClick={() => router.push(`/grades/${gradeSlug}/packages/${packageId}`)} 
                  className={styles.actionItem}
                >
                  <span className={styles.actionText}>العودة للباقة</span>
                  <ArrowRight size={18} />
                </button>
                <button 
                  onClick={() => router.push(`/grades/${gradeSlug}`)} 
                  className={styles.actionItem}
                >
                  <span className={styles.actionText}>جميع باقات الصف</span>
                  <BookOpen size={18} />
                </button>
              </div>
            </div>

            <div className={styles.packageCard}>
              <h4 className={styles.cardTitle}>معلومات الباقة</h4>
              <div className={styles.packageInfo}>
                <div className={styles.packageItem}>
                  <div className={styles.packageIcon} style={{ background: theme.primary }}>
                    <Award size={20} />
                  </div>
                  <div className={styles.packageDetails}>
                    <div className={styles.packageName}>{packageData?.name}</div>
                    <div className={styles.packageType}>
                      {packageData?.type === 'weekly' ? 'أسبوعي' : packageData?.type === 'monthly' ? 'شهري' : 'ترم كامل'}
                    </div>
                  </div>
                </div>
                <div className={styles.packageItem}>
                  <div className={styles.packageIcon} style={{ background: theme.success }}>
                    <Shield size={20} />
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

            <div className={styles.tipsCard}>
              <div className={styles.tipsHeader}>
                <Zap className={styles.tipsIcon} style={{ color: '#f59e0b' }} />
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

export default function ContentPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ContentViewer />
    </Suspense>
  )
}