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
  ChevronDown, ExternalLink, Bookmark,
  Download, Share2, CalendarDays, UsersIcon,
  ChevronLeft
} from 'lucide-react'
import { getGradeTheme } from '@/lib/utils/grade-themes'
import styles from './PackagePage.module.css'

// ... بقية الـ interfaces تبقى كما هي ...

// Loading Component
function LoadingState() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingSpinner}></div>
        <GraduationCap className={styles.loadingIcon} size={24} />
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
        <div className={styles.errorIconContainer}>
          <AlertCircle className={styles.errorIcon} size={32} />
        </div>
        <h2 className={styles.errorTitle}>حدث خطأ</h2>
        <p className={styles.errorMessage}>{message}</p>
        <button onClick={onBack} className={styles.backButton}>
          <ArrowRight size={20} />
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

  // ... بقية الـ useEffect والـ functions تبقى كما هي ...

  const isContentAccessible = (lectureIndex: number, contentIndex: number, content: LectureContent) => {
    // ... نفس المنطق ...
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <PlayCircle size={20} className="text-blue-600" />
      case 'pdf': return <FileText size={20} className="text-red-500" />
      case 'exam': return <HelpCircle size={20} className="text-purple-600" />
      case 'text': return <BookOpen size={20} className="text-green-600" />
      default: return <PlayCircle size={20} className="text-blue-600" />
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'passed':
        return `${styles.bgGreen50} ${styles.textGreen600} ${styles.borderGreen200}`
      case 'failed':
        return `${styles.bgRed50} ${styles.textRed600} ${styles.borderRed200}`
      case 'in_progress':
        return `${styles.bgYellow50} ${styles.textYellow600} ${styles.borderYellow200}`
      default:
        return `${styles.bgGray50} ${styles.textGray600} ${styles.borderGray200}`
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتمل'
      case 'passed':
        return 'ناجح'
      case 'failed':
        return 'فشل'
      case 'in_progress':
        return 'قيد التقدم'
      default:
        return 'لم يبدأ'
    }
  }

  if (!mounted) return <LoadingState />
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onBack={() => router.push(`/grades/${gradeSlug || ''}`)} />
  if (!packageData) return <ErrorState message="لم يتم العثور على الباقة" onBack={() => router.push('/')} />

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.navContainer}>
            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
              <button
                onClick={() => router.push('/')}
                className={styles.breadcrumbItem}
              >
                <Home className={styles.breadcrumbIcon} size={20} />
                الرئيسية
              </button>
              <ChevronLeft className={styles.breadcrumbSeparator} size={16} />
              <button
                onClick={() => router.push(`/grades/${gradeSlug}`)}
                className={styles.breadcrumbItem}
              >
                {gradeSlug === 'first' ? 'الصف الأول' : gradeSlug === 'second' ? 'الصف الثاني' : 'الصف الثالث'}
              </button>
              <ChevronLeft className={styles.breadcrumbSeparator} size={16} />
              <span className={styles.currentPage}>{packageData.name}</span>
            </div>
            
            {/* Brand */}
            <div className={styles.brandContainer}>
              <div className={styles.brandBadge}>
                <Crown className={styles.brandIcon} size={18} />
                <span className={styles.brandText}>البارع محمود الديب</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.container}>
        {/* Package Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${styles.packageHeader} ${styles.bgWhite} ${styles.rounded2xl} ${styles.shadowLg} ${styles.p8} ${styles.mb8}`}
        >
          <div className={styles.lgFlexRow}>
            {/* Package Image */}
            <div className={styles.packageImageContainer}>
              <div className={styles.imageWrapper}>
                <div className={styles.typeBadge}>
                  {packageData.type === 'weekly' ? 'أسبوعي' : packageData.type === 'monthly' ? 'شهري' : packageData.type === 'term' ? 'ترم كامل' : 'عرض خاص'}
                </div>
                {packageData.image_url ? (
                  <img
                    src={packageData.image_url}
                    alt={packageData.name}
                    className={styles.packageImage}
                  />
                ) : (
                  <div className={styles.placeholderImage}>
                    <GraduationCap className={styles.placeholderIcon} size={64} />
                  </div>
                )}
              </div>
              
              {/* Stats */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIconContainer}>
                    <PlayCircle className={styles.statIcon} />
                  </div>
                  <span className={styles.statValue}>{lectures.length}</span>
                  <span className={styles.statLabel}>محاضرة</span>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIconContainer}>
                    <BookOpen className={styles.statIcon} />
                  </div>
                  <span className={styles.statValue}>{contents.length}</span>
                  <span className={styles.statLabel}>محتوى</span>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIconContainer}>
                    <Clock className={styles.statIcon} />
                  </div>
                  <span className={styles.statValue}>{packageData.duration_days}</span>
                  <span className={styles.statLabel}>يوم</span>
                </div>
              </div>
            </div>

            {/* Package Info */}
            <div className={styles.packageInfo}>
              <div className={styles.packageHeaderContent}>
                <div>
                  <h1 className={styles.packageTitle}>{packageData.name}</h1>
                  <p className={styles.packageDescription}>{packageData.description}</p>
                </div>
                <button className={styles.shareButton}>
                  <Share2 size={18} />
                  مشاركة
                </button>
              </div>

              {/* Progress Section */}
              <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                  <div className={styles.progressIconContainer}>
                    <BarChart3 className={styles.progressIcon} size={18} />
                  </div>
                  <span className={styles.progressLabel}>تقدمك في الباقة</span>
                  <span className={styles.progressPercentage}>{completion}%</span>
                </div>
                
                <div className={styles.progressBarContainer}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completion}%` }}
                    transition={{ duration: 1 }}
                    className={styles.progressBar}
                  />
                </div>
                
                <div className={styles.progressLabels}>
                  <span>لم يبدأ</span>
                  <span>مكتمل</span>
                </div>

                {/* Stats */}
                <div className={styles.statsGridLarge}>
                  <div className={styles.statCardLarge}>
                    <div className={styles.statHeader}>
                      <div className={`${styles.statIconSmall} ${styles.bgGreen50}`}>
                        <CheckCircle size={16} className={styles.textGreen600} />
                      </div>
                      <span className={styles.statTitle}>مكتمل</span>
                    </div>
                    <div className={styles.statValueLarge}>
                      {userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length}
                    </div>
                  </div>
                  
                  <div className={styles.statCardLarge}>
                    <div className={styles.statHeader}>
                      <div className={`${styles.statIconSmall} ${styles.bgYellow50}`}>
                        <Clock size={16} className={styles.textYellow600} />
                      </div>
                      <span className={styles.statTitle}>قيد التقدم</span>
                    </div>
                    <div className={styles.statValueLarge}>
                      {userProgress.filter(p => p.status === 'in_progress').length}
                    </div>
                  </div>
                  
                  <div className={styles.statCardLarge}>
                    <div className={styles.statHeader}>
                      <div className={`${styles.statIconSmall} ${styles.bgRed50}`}>
                        <XCircle size={16} className={styles.textRed600} />
                      </div>
                      <span className={styles.statTitle}>فشل</span>
                    </div>
                    <div className={styles.statValueLarge}>
                      {userProgress.filter(p => p.status === 'failed').length}
                    </div>
                  </div>
                  
                  <div className={styles.statCardLarge}>
                    <div className={styles.statHeader}>
                      <div className={`${styles.statIconSmall} ${styles.bgGray50}`}>
                        <Target size={16} className={styles.textGray600} />
                      </div>
                      <span className={styles.statTitle}>متبقي</span>
                    </div>
                    <div className={styles.statValueLarge}>
                      {contents.length - userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lectures Section */}
        <div className={styles.mb8}>
          <div className={styles.lecturesHeader}>
            <div className={styles.lecturesTitleContainer}>
              <div className={styles.lecturesIconContainer}>
                <BookOpen className={styles.lecturesIcon} size={24} />
              </div>
              <div>
                <h2 className={styles.lecturesTitle}>محاضرات الباقة</h2>
                <p className={styles.lecturesSubtitle}>ابدأ رحلتك التعليمية الآن وحقق التفوق</p>
              </div>
            </div>
            <div className={styles.lecturesCount}>
              {lectures.length} محاضرة
            </div>
          </div>

          {lectures.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.emptyState}
            >
              <div className={styles.emptyIconContainer}>
                <BookOpen className={styles.emptyIcon} size={32} />
              </div>
              <h3 className={styles.emptyTitle}>لا توجد محاضرات متاحة حالياً</h3>
              <p className={styles.emptyText}>سيتم إضافة المحاضرات قريباً</p>
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
                const progressPercentage = lectureContents.length > 0 ? Math.round((completedContents / lectureContents.length) * 100) : 0

                return (
                  <motion.div
                    key={lecture.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: lectureIndex * 0.1 }}
                    className={styles.lectureCard}
                  >
                    <div
                      className={styles.lectureHeader}
                      onClick={() => toggleSection(lecture.id)}
                    >
                      <div className={styles.lectureContent}>
                        <div className={styles.lectureNumberBadge}>
                          <div className={styles.lectureNumberContainer}>
                            <span className={styles.lectureNumber}>{lectureIndex + 1}</span>
                          </div>
                          <div className={styles.lectureBadge}>
                            {progressPercentage === 100 ? '✓' : progressPercentage > 0 ? '→' : '•'}
                          </div>
                        </div>
                        
                        <div className={styles.lectureInfo}>
                          <div className={styles.lectureTitleRow}>
                            <h3 className={styles.lectureTitle}>{lecture.title}</h3>
                            <div className={styles.lectureTags}>
                              <span className={`${styles.lectureTag} ${getStatusColor(
                                progressPercentage === 100 ? 'completed' : 
                                progressPercentage > 0 ? 'in_progress' : 'not_started'
                              )}`}>
                                {progressPercentage === 100 ? 'مكتمل' : progressPercentage > 0 ? 'قيد التقدم' : 'لم يبدأ'}
                              </span>
                              <span className={`${styles.lectureTag} ${styles.bgGray100} ${styles.textGray600}`}>
                                {lectureContents.length} محتوى
                              </span>
                            </div>
                          </div>
                          
                          {lecture.description && (
                            <p className={styles.lectureDescription}>{lecture.description}</p>
                          )}
                          
                          <div className={styles.lectureMeta}>
                            <div className={styles.metaItem}>
                              <CheckCircle size={16} />
                              <span>{completedContents} مكتمل</span>
                            </div>
                            <div className={styles.metaItem}>
                              <Clock size={16} />
                              <span>{lectureContents.length - completedContents} متبقي</span>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className={styles.progressContainer}>
                            <div className={styles.progressInfo}>
                              <span className={styles.progressLabelSmall}>التقدم</span>
                              <span className={styles.progressValue}>{progressPercentage}%</span>
                            </div>
                            <div className={styles.progressBarSmall}>
                              <div
                                className={styles.progressFill}
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
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
                              const isCompleted = status === 'completed' || status === 'passed'

                              return (
                                <motion.div
                                  key={content.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: contentIndex * 0.05 }}
                                  className={`${styles.contentItem} ${isCompleted ? styles.completed : ''} ${!isAccessible ? styles.locked : ''}`}
                                  onClick={() => isAccessible && handleContentClick(content, lectureIndex, contentIndex)}
                                >
                                  <div className={styles.contentMain}>
                                    <div className={styles.contentIconContainer} style={{
                                      background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 
                                                 status === 'failed' ? 'rgba(239, 68, 68, 0.1)' :
                                                 status === 'in_progress' ? 'rgba(245, 158, 11, 0.1)' :
                                                 isAccessible ? 'rgba(59, 130, 246, 0.1)' : 'rgba(156, 163, 175, 0.1)'
                                    }}>
                                      {getContentIcon(content.type)}
                                      {isCompleted && (
                                        <div className={styles.statusBadge}>
                                          <CheckCircle size={12} className={styles.textGreen600} />
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className={styles.contentDetails}>
                                      <div className={styles.contentHeader}>
                                        <h4 className={styles.contentTitle}>{content.title}</h4>
                                        <span className={`${styles.contentStatus} ${getStatusColor(status)}`}>
                                          {getStatusText(status)}
                                        </span>
                                      </div>
                                      
                                      {content.description && (
                                        <p className={styles.contentDescription}>{content.description}</p>
                                      )}
                                      
                                      <div className={styles.contentMeta}>
                                        <span className={styles.metaItemSmall}>
                                          {content.type === 'video' ? 'فيديو' : content.type === 'pdf' ? 'ملف PDF' : content.type === 'exam' ? 'امتحان' : 'نص'}
                                        </span>
                                        {content.duration_minutes > 0 && (
                                          <span className={styles.metaItemSmall}>
                                            <Clock size={14} />
                                            {content.duration_minutes} دقيقة
                                          </span>
                                        )}
                                        {content.type === 'exam' && (
                                          <span className={styles.metaItemSmall}>
                                            <Target size={14} />
                                            النجاح: {content.pass_score}%
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className={styles.contentActions}>
                                    {!isAccessible ? (
                                      <div className={styles.lockBadge}>
                                        <Lock size={18} />
                                        <span>مقفل</span>
                                      </div>
                                    ) : (
                                      <button
                                        className={styles.actionButton}
                                        style={{
                                          background: isCompleted ? '#10b981' : 
                                                     status === 'failed' ? '#ef4444' :
                                                     status === 'in_progress' ? '#f59e0b' :
                                                     '#3b82f6',
                                          color: 'white'
                                        }}
                                      >
                                        {isCompleted ? (
                                          <>
                                            <CheckCircle size={16} />
                                            مكتمل
                                          </>
                                        ) : status === 'failed' ? (
                                          <>
                                            <XCircle size={16} />
                                            إعادة المحاولة
                                          </>
                                        ) : status === 'in_progress' ? (
                                          <>
                                            <Play size={16} />
                                            استكمال
                                          </>
                                        ) : (
                                          <>
                                            <Play size={16} />
                                            بدء
                                          </>
                                        )}
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
          )}
        </div>

        {/* Notes & Info Section */}
        <div className={styles.gridContainer}>
          {/* Important Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={styles.notesCard}
          >
            <div className={styles.notesHeader}>
              <div className={styles.notesIconContainer}>
                <Award className={styles.notesIcon} size={24} />
              </div>
              <div>
                <h3 className={styles.notesTitle}>ملاحظات هامة</h3>
                <p className={styles.notesSubtitle}>نصائح للاستفادة القصوى من الباقة</p>
              </div>
            </div>
            
            <div className={styles.notesList}>
              {packageData.type === 'monthly' || packageData.type === 'term' ? (
                <>
                  <div className={styles.noteItem}>
                    <div className={`${styles.noteIconContainer} ${styles.bgBlue50}`}>
                      <Shield size={16} className={styles.textBlue600} />
                    </div>
                    <div className={styles.noteText}>
                      <strong>نظام التقدم المتسلسل:</strong> يجب إتمام كل محتوى قبل الانتقال للذي يليه
                    </div>
                  </div>
                  
                  <div className={styles.noteItem}>
                    <div className={`${styles.noteIconContainer} ${styles.bgPurple50}`}>
                      <Target size={16} className={styles.textPurple600} />
                    </div>
                    <div className={styles.noteText}>
                      <strong>الامتحانات:</strong> لابد من اجتياز الامتحان قبل الانتقال للمحاضرة التالية
                    </div>
                  </div>
                </>
              ) : null}
              
              {userPackage?.expires_at && (
                <div className={styles.noteItem}>
                  <div className={`${styles.noteIconContainer} ${styles.bgGreen50}`}>
                    <CalendarDays size={16} className={styles.textGreen600} />
                  </div>
                  <div className={styles.noteText}>
                    <strong>مدة الاشتراك:</strong> تنتهي صلاحية اشتراكك في:{' '}
                    <strong>
                      {new Date(userPackage.expires_at).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </strong>
                  </div>
                </div>
              )}
              
              <div className={styles.noteItem}>
                <div className={`${styles.noteIconContainer} ${styles.bgGray50}`}>
                  <Clock size={16} className={styles.textGray600} />
                </div>
                <div className={styles.noteText}>
                  <strong>جدول الدراسة:</strong> نوصي بدراسة محتوى واحد يومياً لتحقيق أفضل النتائج
                </div>
              </div>
            </div>
          </motion.div>

          {/* Package Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={styles.summaryCard}
          >
            <div className={styles.summaryHeader}>
              <div className={styles.summaryIconContainer}>
                <GraduationCap className={styles.summaryIcon} size={24} />
              </div>
              <div>
                <h3 className={styles.summaryTitle}>ملخص الباقة</h3>
                <p className={styles.summarySubtitle}>معلومات شاملة عن محتويات الباقة</p>
              </div>
            </div>
            
            <div className={styles.summaryContent}>
              <div className={styles.summaryItem}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>نوع الباقة</span>
                  <span className={styles.typeBadgeSmall}>
                    {packageData.type === 'weekly' ? 'أسبوعي' : packageData.type === 'monthly' ? 'شهري' : packageData.type === 'term' ? 'ترم كامل' : 'عرض خاص'}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>المدة</span>
                  <span className={styles.summaryValue}>{packageData.duration_days} يوم</span>
                </div>
              </div>
              
              <div className={styles.summaryItem}>
                <h4 className={styles.summarySectionTitle}>توزيع المحتويات</h4>
                <div className={styles.distributionList}>
                  {['video', 'pdf', 'exam', 'text'].map((type) => {
                    const count = contents.filter(c => c.type === type).length
                    if (count === 0) return null
                    
                    const percentage = Math.round((count / contents.length) * 100)
                    const colors = {
                      video: { bg: '#3b82f6', text: '#3b82f6' },
                      pdf: { bg: '#ef4444', text: '#ef4444' },
                      exam: { bg: '#8b5cf6', text: '#8b5cf6' },
                      text: { bg: '#10b981', text: '#10b981' }
                    }
                    
                    return (
                      <div key={type} className={styles.distributionItem}>
                        <div className={styles.distributionHeader}>
                          <div className={styles.distributionInfo}>
                            {getContentIcon(type)}
                            <span className={styles.distributionLabel}>
                              {type === 'video' ? 'فيديوهات' : type === 'pdf' ? 'ملفات PDF' : type === 'exam' ? 'امتحانات' : 'نصوص'}
                            </span>
                          </div>
                          <span className={styles.distributionCount}>{count} ({percentage}%)</span>
                        </div>
                        <div className={styles.distributionBar}>
                          <div
                            className={styles.distributionFill}
                            style={{
                              width: `${percentage}%`,
                              background: colors[type as keyof typeof colors].bg
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div className={styles.summaryItem}>
                <h4 className={styles.summarySectionTitle}>نصائح للدراسة</h4>
                <div className={styles.tipsList}>
                  <div className={styles.tipItem}>
                    <div className={styles.tipIcon}>
                      <CheckCircle size={12} className={styles.textBlue600} />
                    </div>
                    <p className={styles.tipText}>احرص على إكمال المحتوى بالترتيب المحدد</p>
                  </div>
                  <div className={styles.tipItem}>
                    <div className={styles.tipIcon}>
                      <CheckCircle size={12} className={styles.textBlue600} />
                    </div>
                    <p className={styles.tipText}>خصص وقتاً ثابتاً للدراسة يومياً</p>
                  </div>
                  <div className={styles.tipItem}>
                    <div className={styles.tipIcon}>
                      <CheckCircle size={12} className={styles.textBlue600} />
                    </div>
                    <p className={styles.tipText}>استخدم الملاحظات أثناء مشاهدة الفيديوهات</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={styles.backSection}
        >
          <button
            onClick={() => router.push(`/grades/${gradeSlug}`)}
            className={styles.backActionButton}
          >
            <ArrowRight size={20} />
            العودة إلى الباقات
          </button>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerContainer}>
            <div className={styles.footerBrand}>
              <Crown className={styles.footerBrandIcon} size={20} />
              <span className={styles.footerBrandText}>البارع محمود الديب</span>
            </div>
            <div className={styles.footerCopyright}>
              © {new Date().getFullYear()} جميع الحقوق محفوظة
            </div>
          </div>
        </div>
      </footer>
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