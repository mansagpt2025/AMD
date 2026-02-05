// src/app/grades/[grade]/packages/[packageId]/page.tsx
'use client'

import { useState, useEffect, Suspense, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import {
  PlayCircle, BookOpen, Clock, Lock,
  CheckCircle, XCircle, AlertCircle, Home,
  ChevronLeft, GraduationCap, BarChart3,
  Video, File, Target, TrendingUp,
  Play, FileText, HelpCircle, Crown,
  ChevronDown, Share2, CalendarDays,
  Zap, Bookmark, Eye, Ban
} from 'lucide-react'
import styles from './PackagePage.module.css'

// ==================== Types ====================
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

interface ContentView {
  id: string
  user_id: string
  content_id: string
  view_count: number
  last_viewed_at: string
  created_at: string
}

// ==================== Supabase Singleton ====================
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

const getSupabase = () => {
  if (typeof window === 'undefined') return null
  
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseInstance
}

// ==================== Loading Component ====================
function LoadingState() {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingLogo}>
          <motion.div 
            className={styles.loadingRing}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
          <GraduationCap className={styles.loadingIcon} size={28} />
        </div>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          جاري تحميل البيانات...
        </motion.p>
      </div>
    </div>
  )
}

// ==================== Error Component ====================
function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className={styles.errorScreen}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={styles.errorContent}
      >
        <div className={styles.errorIconWrapper}>
          <AlertCircle size={40} />
        </div>
        <h2>حدث خطأ</h2>
        <p>{message}</p>
        <button onClick={onBack} className={styles.errorButton}>
          <ChevronLeft size={18} />
          <span>العودة للصفحة السابقة</span>
        </button>
      </motion.div>
    </div>
  )
}

// ==================== Main Component ====================
function PackageContent() {
  const router = useRouter()
  const params = useParams()
  
  const gradeSlug = params?.grade as string
  const packageId = params?.packageId as string

  // State
  const [mounted, setMounted] = useState(false)
  const [packageData, setPackageData] = useState<Package | null>(null)
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [contents, setContents] = useState<LectureContent[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [userPackage, setUserPackage] = useState<UserPackage | null>(null)
  const [contentViews, setContentViews] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [processingContent, setProcessingContent] = useState<string | null>(null)

  const supabase = useMemo(() => getSupabase(), [])

  // Mount effect
  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate completion percentage
  const completion = useMemo(() => {
    if (contents.length === 0) return 0
    const completed = userProgress.filter(
      p => p.status === 'completed' || p.status === 'passed'
    ).length
    return Math.round((completed / contents.length) * 100)
  }, [userProgress, contents])

  // Stats
  const stats = useMemo(() => {
    const completedCount = userProgress.filter(
      p => p.status === 'completed' || p.status === 'passed'
    ).length
    const inProgressCount = userProgress.filter(
      p => p.status === 'in_progress'
    ).length
    return {
      completed: completedCount,
      inProgress: inProgressCount,
      remaining: contents.length - completedCount
    }
  }, [userProgress, contents])

  // Fetch all data
  useEffect(() => {
    if (!mounted || !gradeSlug || !packageId || !supabase) return

    const fetchData = async () => {
      try {
        // Check auth
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setError('حدث خطأ في التحقق من الجلسة')
          setLoading(false)
          return
        }

        if (!session?.user) {
          router.replace(`/login?returnUrl=/grades/${gradeSlug}/packages/${packageId}`)
          return
        }

        const currentUserId = session.user.id
        setUserId(currentUserId)

        // Check user package access
        const { data: userPackageData, error: accessError } = await supabase
          .from('user_packages')
          .select('*')
          .eq('user_id', currentUserId)
          .eq('package_id', packageId)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle()

        if (accessError) {
          console.error('Access error:', accessError)
        }

        if (!userPackageData) {
          router.replace(`/grades/${gradeSlug}?error=not_subscribed&package=${packageId}`)
          return
        }
        
        setUserPackage(userPackageData)

        // Fetch package details
        const { data: pkgData, error: pkgError } = await supabase
          .from('packages')
          .select('*')
          .eq('id', packageId)
          .single()

        if (pkgError || !pkgData) {
          setError('الباقة غير موجودة أو تم حذفها')
          setLoading(false)
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

        if (lecturesError) {
          console.error('Lectures error:', lecturesError)
        }
        
        setLectures(lecturesData || [])

        if (lecturesData && lecturesData.length > 0) {
          const lectureIds = lecturesData.map((l: { id: any }) => l.id)
          
          // Fetch contents
          const { data: contentsData, error: contentsError } = await supabase
            .from('lecture_contents')
            .select('*')
            .in('lecture_id', lectureIds)
            .eq('is_active', true)
            .order('order_number', { ascending: true })

          if (contentsError) {
            console.error('Contents error:', contentsError)
          }
          
          setContents(contentsData || [])
          
          // Fetch user progress
          const { data: progressData, error: progressError } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', currentUserId)
            .eq('package_id', packageId)

          if (progressError) {
            console.error('Progress error:', progressError)
          }
          
          setUserProgress(progressData || [])

          // Fetch content views from database
          if (contentsData && contentsData.length > 0) {
            const contentIds = contentsData.map((c: { id: any }) => c.id)
            
            const { data: viewsData, error: viewsError } = await supabase
              .from('content_views')
              .select('*')
              .eq('user_id', currentUserId)
              .in('content_id', contentIds)

            if (viewsError) {
              console.error('Views error:', viewsError)
            }

            if (viewsData) {
              const viewsMap = new Map<string, number>()
              viewsData.forEach((v: ContentView) => {
                viewsMap.set(v.content_id, v.view_count)
              })
              setContentViews(viewsMap)
            }
          }
          
          // Set initial active section
          if (lecturesData.length > 0) {
            setActiveSection(lecturesData[0].id)
          }
        }

        setLoading(false)

      } catch (err) {
        console.error('Error:', err)
        setError('حدث خطأ في تحميل البيانات')
        setLoading(false)
      }
    }

    fetchData()
  }, [mounted, gradeSlug, packageId, supabase, router])

  // Check if content is accessible based on sequential progress
  const isContentAccessible = useCallback((
    lectureIndex: number, 
    contentIndex: number
  ): boolean => {
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
  }, [packageData, lectures, contents, userProgress])

  // Get view info for content
  const getViewInfo = useCallback((contentId: string, maxAttempts: number) => {
    const currentViews = contentViews.get(contentId) || 0
    return {
      current: currentViews,
      max: maxAttempts,
      exhausted: currentViews >= maxAttempts,
      remaining: Math.max(0, maxAttempts - currentViews)
    }
  }, [contentViews])

  // Record view and navigate to content
  const handleContentClick = useCallback(async (
    content: LectureContent, 
    lectureIndex: number, 
    contentIndex: number
  ) => {
    if (!supabase || !userId) return
    
    const accessible = isContentAccessible(lectureIndex, contentIndex)
    const viewInfo = getViewInfo(content.id, content.max_attempts)
    
    // Check if locked or exhausted
    if (!accessible || viewInfo.exhausted) return
    
    // Set processing state
    setProcessingContent(content.id)
    
    try {
      // Check existing view record
      const { data: existingView, error: fetchError } = await supabase
        .from('content_views')
        .select('*')
        .eq('user_id', userId)
        .eq('content_id', content.id)
        .maybeSingle()

      if (fetchError) {
        console.error('Error fetching view:', fetchError)
      }

      if (existingView) {
        // Update existing record - increment view count
        const newViewCount = existingView.view_count + 1
        
        const { error: updateError } = await supabase
          .from('content_views')
          .update({
            view_count: newViewCount,
            last_viewed_at: new Date().toISOString()
          })
          .eq('id', existingView.id)

        if (updateError) {
          console.error('Error updating view:', updateError)
          setProcessingContent(null)
          return
        }

        // Update local state
        setContentViews(prev => {
          const newMap = new Map(prev)
          newMap.set(content.id, newViewCount)
          return newMap
        })
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('content_views')
          .insert({
            user_id: userId,
            content_id: content.id,
            view_count: 1,
            last_viewed_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('Error inserting view:', insertError)
          setProcessingContent(null)
          return
        }

        // Update local state
        setContentViews(prev => {
          const newMap = new Map(prev)
          newMap.set(content.id, 1)
          return newMap
        })
      }

      // Navigate to content page
      router.push(`/grades/${gradeSlug}/packages/${packageId}/content/${content.id}`)
      
    } catch (err) {
      console.error('Error recording view:', err)
      setProcessingContent(null)
    }
  }, [supabase, userId, isContentAccessible, getViewInfo, gradeSlug, packageId, router])

  // Get content icon
  const getContentIcon = useCallback((type: string, isCompleted: boolean) => {
    const iconClass = `${styles.contentTypeIcon} ${
      type === 'video' ? styles.iconVideo :
      type === 'pdf' ? styles.iconPdf :
      type === 'exam' ? styles.iconExam :
      styles.iconText
    } ${isCompleted ? styles.iconCompleted : ''}`
    
    const IconComponent = type === 'video' ? Play :
      type === 'pdf' ? FileText :
      type === 'exam' ? HelpCircle :
      BookOpen

    return <div className={iconClass}><IconComponent size={18} /></div>
  }, [])

  // Get content status
  const getContentStatus = useCallback((contentId: string) => {
    const progress = userProgress.find(p => p.lecture_content_id === contentId)
    return progress?.status || 'not_started'
  }, [userProgress])

  // Toggle section
  const toggleSection = useCallback((sectionId: string) => {
    setActiveSection(prev => prev === sectionId ? null : sectionId)
  }, [])

  // Get status text
  const getStatusText = useCallback((status: string) => {
    const statusMap: Record<string, string> = {
      'completed': 'مكتمل',
      'passed': 'ناجح',
      'failed': 'فشل',
      'in_progress': 'قيد التقدم',
      'not_started': 'متاح'
    }
    return statusMap[status] || 'متاح'
  }, [])

  // Get type badge
  const getTypeBadge = useCallback((type: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      weekly: { text: 'أسبوعي', className: styles.badgeWeekly },
      monthly: { text: 'شهري', className: styles.badgeMonthly },
      term: { text: 'ترم كامل', className: styles.badgeTerm },
      offer: { text: 'عرض خاص', className: styles.badgeOffer }
    }
    return badges[type] || { text: type, className: styles.badgeDefault }
  }, [])

  // Get grade name
  const getGradeName = useCallback((slug: string) => {
    const grades: Record<string, string> = {
      'first': 'الصف الأول الثانوي',
      'second': 'الصف الثاني الثانوي',
      'third': 'الصف الثالث الثانوي'
    }
    return grades[slug] || slug
  }, [])

  // Share handler
  const handleShare = useCallback(async () => {
    const shareData = {
      title: packageData?.name || 'باقة تعليمية',
      text: packageData?.description || '',
      url: window.location.href
    }
    
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
      }
    } catch {
      // Silently handle error
    }
  }, [packageData])

  // Render states
  if (!mounted) return <LoadingState />
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onBack={() => router.push(`/grades/${gradeSlug || ''}`)} />
  if (!packageData) return <ErrorState message="لم يتم العثور على الباقة" onBack={() => router.push('/')} />

  const typeBadge = getTypeBadge(packageData.type)

  return (
    <div className={styles.pageWrapper}>
      {/* Background Effects */}
      <div className={styles.bgEffects}>
        <div className={styles.bgGradient1} />
        <div className={styles.bgGradient2} />
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.headerContent}
          >
            <nav className={styles.breadcrumb}>
              <button onClick={() => router.push('/')} className={styles.breadcrumbItem}>
                <Home size={16} />
                <span>الرئيسية</span>
              </button>
              <ChevronLeft size={14} className={styles.breadcrumbSep} />
              <button onClick={() => router.push(`/grades/${gradeSlug}`)} className={styles.breadcrumbItem}>
                <span>{getGradeName(gradeSlug)}</span>
              </button>
              <ChevronLeft size={14} className={styles.breadcrumbSep} />
              <span className={styles.breadcrumbCurrent}>{packageData.name}</span>
            </nav>

            <div className={styles.headerBrand}>
              <div className={styles.brandMark}>
                <Crown size={16} />
              </div>
              <span>البارع محمود الديب</span>
            </div>
          </motion.div>
        </div>
      </header>

      <main className={styles.mainContent}>
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={styles.heroSection}
        >
          <div className={styles.heroContainer}>
            {/* Package Visual */}
            <div className={styles.heroVisual}>
              <div className={styles.packageImageCard}>
                <div className={`${styles.packageTypeBadge} ${typeBadge.className}`}>
                  {typeBadge.text}
                </div>
                {packageData.image_url ? (
                  <img 
                    src={packageData.image_url} 
                    alt={packageData.name} 
                    className={styles.packageImage}
                    loading="eager"
                  />
                ) : (
                  <div className={styles.packageImagePlaceholder}>
                    <GraduationCap size={56} />
                  </div>
                )}
                <div className={styles.imageOverlay} />
              </div>
              
              <div className={styles.quickStatsGrid}>
                <div className={styles.quickStatItem}>
                  <div className={`${styles.quickStatIcon} ${styles.statIconBlue}`}>
                    <PlayCircle size={18} />
                  </div>
                  <div className={styles.quickStatInfo}>
                    <span className={styles.quickStatValue}>{lectures.length}</span>
                    <span className={styles.quickStatLabel}>محاضرة</span>
                  </div>
                </div>
                
                <div className={styles.quickStatItem}>
                  <div className={`${styles.quickStatIcon} ${styles.statIconPurple}`}>
                    <BookOpen size={18} />
                  </div>
                  <div className={styles.quickStatInfo}>
                    <span className={styles.quickStatValue}>{contents.length}</span>
                    <span className={styles.quickStatLabel}>محتوى</span>
                  </div>
                </div>
                
                <div className={styles.quickStatItem}>
                  <div className={`${styles.quickStatIcon} ${styles.statIconOrange}`}>
                    <Clock size={18} />
                  </div>
                  <div className={styles.quickStatInfo}>
                    <span className={styles.quickStatValue}>{packageData.duration_days}</span>
                    <span className={styles.quickStatLabel}>يوم</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Package Info */}
            <div className={styles.heroInfo}>
              <div className={styles.heroHeader}>
                <div>
                  <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className={styles.packageTitle}
                  >
                    {packageData.name}
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className={styles.packageDescription}
                  >
                    {packageData.description}
                  </motion.p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className={styles.shareButton}
                  aria-label="مشاركة الباقة"
                >
                  <Share2 size={18} />
                </motion.button>
              </div>

              {/* Progress Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={styles.progressCard}
              >
                <div className={styles.progressHeader}>
                  <div className={styles.progressTitleSection}>
                    <div className={styles.progressIcon}>
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <h3>تقدمك في الباقة</h3>
                      <p>أكمل المحتوى لإتقان المادة</p>
                    </div>
                  </div>
                  <div className={styles.progressPercentage}>
                    <span>{completion}</span>%
                  </div>
                </div>

                <div className={styles.progressBarWrapper}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${completion}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                    className={styles.progressBarFill}
                  />
                </div>

                <div className={styles.progressStatsRow}>
                  <div className={`${styles.progressStatItem} ${styles.statCompleted}`}>
                    <CheckCircle size={14} />
                    <span>{stats.completed} مكتمل</span>
                  </div>
                  <div className={`${styles.progressStatItem} ${styles.statInProgress}`}>
                    <Clock size={14} />
                    <span>{stats.inProgress} قيد التقدم</span>
                  </div>
                  <div className={`${styles.progressStatItem} ${styles.statRemaining}`}>
                    <Target size={14} />
                    <span>{stats.remaining} متبقي</span>
                  </div>
                </div>
              </motion.div>

              {/* Expiry Notice */}
              {userPackage?.expires_at && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className={styles.expiryNotice}
                >
                  <CalendarDays size={16} />
                  <span>ينتهي اشتراكك في: {new Date(userPackage.expires_at).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Content Section */}
        <section className={styles.contentSection}>
          <div className={styles.contentLayout}>
            {/* Lectures Column */}
            <div className={styles.lecturesColumn}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.sectionHeaderCard}
              >
                <div className={styles.sectionTitleArea}>
                  <div className={styles.sectionIcon}>
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <h2>محاضرات الباقة</h2>
                    <p>تابع تقدمك واستكمل رحلتك التعليمية</p>
                  </div>
                </div>
                <div className={styles.lectureCounter}>
                  {lectures.length} محاضرة
                </div>
              </motion.div>

              {lectures.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={styles.emptyLectures}
                >
                  <div className={styles.emptyIcon}>
                    <BookOpen size={40} />
                  </div>
                  <h3>لا توجد محاضرات متاحة</h3>
                  <p>سيتم إضافة المحاضرات قريباً</p>
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
                    const progressPercent = lectureContents.length > 0 
                      ? Math.round((completedContents / lectureContents.length) * 100) 
                      : 0
                    const isFullyCompleted = progressPercent === 100

                    return (
                      <motion.div
                        key={lecture.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: lectureIndex * 0.05 }}
                        className={`${styles.lectureCard} ${isFullyCompleted ? styles.lectureCompleted : ''}`}
                      >
                        <div 
                          className={styles.lectureHeader}
                          onClick={() => toggleSection(lecture.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && toggleSection(lecture.id)}
                        >
                          <div className={styles.lectureHeaderLeft}>
                            <div className={styles.lectureNumber}>
                              <span>{lectureIndex + 1}</span>
                              {isFullyCompleted && (
                                <motion.div 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className={styles.completedCheckmark}
                                >
                                  <CheckCircle size={10} />
                                </motion.div>
                              )}
                            </div>
                            
                            <div className={styles.lectureInfo}>
                              <div className={styles.lectureTitleRow}>
                                <h3>{lecture.title}</h3>
                                <div className={styles.lectureMeta}>
                                  <span className={`${styles.lectureStatusBadge} ${
                                    isFullyCompleted ? styles.badgeSuccess : 
                                    progressPercent > 0 ? styles.badgeWarning : 
                                    styles.badgeDefault
                                  }`}>
                                    {isFullyCompleted ? 'مكتمل' : progressPercent > 0 ? 'قيد التقدم' : 'جديد'}
                                  </span>
                                  <span className={styles.contentCountBadge}>
                                    {lectureContents.length} محتوى
                                  </span>
                                </div>
                              </div>
                              
                              {lecture.description && (
                                <p className={styles.lectureDescription}>{lecture.description}</p>
                              )}
                              
                              <div className={styles.lectureProgressBar}>
                                <div className={styles.lectureProgressInfo}>
                                  <span>التقدم</span>
                                  <span>{progressPercent}%</span>
                                </div>
                                <div className={styles.lectureProgressTrack}>
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.6, delay: 0.1 }}
                                    className={`${styles.lectureProgressFill} ${
                                      isFullyCompleted ? styles.fillSuccess : 
                                      progressPercent > 0 ? styles.fillWarning : ''
                                    }`}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <motion.div 
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className={styles.expandButton}
                          >
                            <ChevronDown size={22} />
                          </motion.div>
                        </div>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className={styles.lectureContentsWrapper}
                            >
                              <div className={styles.contentsList}>
                                {lectureContents.map((content, contentIndex) => {
                                  const isAccessible = isContentAccessible(lectureIndex, contentIndex)
                                  const status = getContentStatus(content.id)
                                  const isCompleted = status === 'completed' || status === 'passed'
                                  const isFailed = status === 'failed'
                                  const isInProgressStatus = status === 'in_progress'
                                  
                                  const viewInfo = getViewInfo(content.id, content.max_attempts)
                                  const isExpiredViews = viewInfo.exhausted
                                  const isProcessing = processingContent === content.id
                                  
                                  return (
                                    <motion.div
                                      key={content.id}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: contentIndex * 0.03 }}
                                      className={`${styles.contentItem} ${
                                        isCompleted ? styles.contentCompleted : ''
                                      } ${!isAccessible ? styles.contentLocked : ''} ${
                                        isFailed ? styles.contentFailed : ''
                                      } ${isExpiredViews ? styles.contentExpired : ''}`}
                                      onClick={() => !isProcessing && handleContentClick(content, lectureIndex, contentIndex)}
                                      role="button"
                                      tabIndex={isAccessible && !isExpiredViews ? 0 : -1}
                                      style={{ pointerEvents: isProcessing ? 'none' : 'auto' }}
                                    >
                                      <div className={styles.contentMain}>
                                        {getContentIcon(content.type, isCompleted)}
                                        
                                        <div className={styles.contentDetails}>
                                          <div className={styles.contentTitleRow}>
                                            <h4>{content.title}</h4>
                                            <span className={`${styles.contentStatusBadge} ${
                                              isExpiredViews ? styles.statusExpired :
                                              isCompleted ? styles.statusSuccess :
                                              isFailed ? styles.statusDanger :
                                              isInProgressStatus ? styles.statusWarning :
                                              styles.statusDefault
                                            }`}>
                                              {isExpiredViews ? 'منتهي' : getStatusText(status)}
                                            </span>
                                          </div>
                                          
                                          {content.description && (
                                            <p className={styles.contentDescription}>{content.description}</p>
                                          )}
                                          
                                          <div className={styles.contentMetaTags}>
                                            <span className={styles.metaTag}>
                                              {content.type === 'video' ? 'فيديو' : 
                                               content.type === 'pdf' ? 'PDF' : 
                                               content.type === 'exam' ? 'امتحان' : 'مقال'}
                                            </span>
                                            {content.duration_minutes > 0 && (
                                              <span className={styles.metaTag}>
                                                <Clock size={12} />
                                                {content.duration_minutes} دقيقة
                                              </span>
                                            )}
                                            {content.type === 'exam' && content.pass_score > 0 && (
                                              <span className={styles.metaTag}>
                                                <Target size={12} />
                                                النجاح: {content.pass_score}%
                                              </span>
                                            )}
                                            {/* View Count Badge - Real Data */}
                                            <span className={`${styles.viewCountBadge} ${
                                              viewInfo.exhausted ? styles.viewsExpired :
                                              viewInfo.remaining <= 2 ? styles.viewsLimited :
                                              styles.viewsAvailable
                                            }`}>
                                              <Eye size={12} />
                                              {viewInfo.current} / {viewInfo.max}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className={styles.contentAction}>
                                        {!isAccessible ? (
                                          <div className={styles.lockedBadge}>
                                            <Lock size={14} />
                                            <span>مقفل</span>
                                          </div>
                                        ) : isExpiredViews ? (
                                          <div className={styles.expiredBadge}>
                                            <Ban size={14} />
                                            <span>انتهت المشاهدات</span>
                                          </div>
                                        ) : isProcessing ? (
                                          <motion.button
                                            className={`${styles.actionButton} ${styles.btnPrimary}`}
                                            disabled
                                          >
                                            <motion.div
                                              animate={{ rotate: 360 }}
                                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            >
                                              <Clock size={14} />
                                            </motion.div>
                                            جاري الفتح...
                                          </motion.button>
                                        ) : (
                                          <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`${styles.actionButton} ${
                                              isCompleted ? styles.btnSuccess : 
                                              isFailed ? styles.btnDanger : 
                                              isInProgressStatus ? styles.btnWarning : 
                                              styles.btnPrimary
                                            }`}
                                          >
                                            {isCompleted ? (
                                              <><CheckCircle size={14} /> مراجعة</>
                                            ) : isFailed ? (
                                              <><XCircle size={14} /> إعادة</>
                                            ) : isInProgressStatus ? (
                                              <><Play size={14} /> استكمال</>
                                            ) : (
                                              <><Play size={14} /> بدء</>
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
            </div>

            {/* Sidebar */}
            <aside className={styles.sidebar}>
              {/* Tips Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={styles.sidebarCard}
              >
                <div className={styles.cardHeader}>
                  <div className={`${styles.cardIcon} ${styles.iconWarning}`}>
                    <Zap size={18} />
                  </div>
                  <div>
                    <h3>نصائح مهمة</h3>
                    <p>للحصول على أفضل النتائج</p>
                  </div>
                </div>
                
                <div className={styles.notesList}>
                  {(packageData.type === 'monthly' || packageData.type === 'term') && (
                    <>
                      <div className={styles.noteItem}>
                        <div className={`${styles.noteIcon} ${styles.noteBlue}`}>
                          <Lock size={14} />
                        </div>
                        <p>يجب إتمام كل محتوى قبل الانتقال للتالي</p>
                      </div>
                      <div className={styles.noteItem}>
                        <div className={`${styles.noteIcon} ${styles.notePurple}`}>
                          <Target size={14} />
                        </div>
                        <p>اجتياز الامتحان إلزامي للمتابعة</p>
                      </div>
                    </>
                  )}
                  
                  <div className={styles.noteItem}>
                    <div className={`${styles.noteIcon} ${styles.noteGreen}`}>
                      <Clock size={14} />
                    </div>
                    <p>خصص وقتاً يومياً للدراسة</p>
                  </div>
                  
                  <div className={styles.noteItem}>
                    <div className={`${styles.noteIcon} ${styles.noteOrange}`}>
                      <Eye size={14} />
                    </div>
                    <p>لكل محتوى عدد مشاهدات محدود - استخدمها بحكمة</p>
                  </div>
                </div>
              </motion.div>

              {/* Content Distribution */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={styles.sidebarCard}
              >
                <div className={styles.cardHeader}>
                  <div className={`${styles.cardIcon} ${styles.iconInfo}`}>
                    <BarChart3 size={18} />
                  </div>
                  <div>
                    <h3>توزيع المحتوى</h3>
                    <p>إحصائيات الباقة</p>
                  </div>
                </div>
                
                <div className={styles.distributionList}>
                  {[
                    { type: 'video', label: 'فيديوهات', colorClass: styles.distBlue, icon: Video },
                    { type: 'pdf', label: 'ملفات PDF', colorClass: styles.distRed, icon: File },
                    { type: 'exam', label: 'امتحانات', colorClass: styles.distPurple, icon: HelpCircle },
                    { type: 'text', label: 'مقالات', colorClass: styles.distGreen, icon: BookOpen }
                  ].map(({ type, label, colorClass, icon: Icon }) => {
                    const count = contents.filter(c => c.type === type).length
                    if (count === 0) return null
                    const percent = contents.length > 0 
                      ? Math.round((count / contents.length) * 100) 
                      : 0
                    
                    return (
                      <div key={type} className={styles.distItem}>
                        <div className={styles.distHeader}>
                          <div className={styles.distLabel}>
                            <Icon size={14} />
                            <span>{label}</span>
                          </div>
                          <span className={styles.distValue}>{count}</span>
                        </div>
                        <div className={styles.distBar}>
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className={`${styles.distFill} ${colorClass}`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Study Strategy */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className={styles.sidebarCard}
              >
                <div className={styles.cardHeader}>
                  <div className={`${styles.cardIcon} ${styles.iconSuccess}`}>
                    <Target size={18} />
                  </div>
                  <div>
                    <h3>استراتيجية الدراسة</h3>
                    <p>خطة للتفوق</p>
                  </div>
                </div>
                
                <div className={styles.tipsList}>
                  {[
                    'ابدأ بالمحاضرة الأولى واتبع الترتيب',
                    'شاهد الفيديوهات بتركيز دون تسريع',
                    'حل الامتحانات بصدق لقياس مستواك',
                    'راجع ملاحظاتك باستمرار'
                  ].map((tip, idx) => (
                    <div key={idx} className={styles.tipItem}>
                      <div className={styles.tipNumber}>{idx + 1}</div>
                      <p>{tip}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </aside>
          </div>
        </section>

        {/* Back Button */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={styles.backSection}
        >
          <button onClick={() => router.push(`/grades/${gradeSlug}`)} className={styles.backButton}>
            <ChevronLeft size={18} />
            <span>العودة إلى الباقات</span>
          </button>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <Crown size={20} />
            <span>البارع محمود الديب</span>
          </div>
          <p className={styles.footerText}>منصة تعليمية متكاملة للتفوق الدراسي</p>
          <div className={styles.footerCopy}>
            جميع الحقوق محفوظة © {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  )
}

// ==================== Export ====================
export default function PackagePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PackageContent />
    </Suspense>
  )
}