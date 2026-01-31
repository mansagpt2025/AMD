'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import {
  PlayCircle, BookOpen, Clock, Lock, Unlock,
  CheckCircle, XCircle, AlertCircle, Home,
  ChevronRight, GraduationCap, BarChart3,
  Calendar, Target, ArrowRight, Shield,
  Play, FileText, HelpCircle, Crown,
  ChevronDown, Share2, CalendarDays,
  Users, Award, File, Video, Sparkles,
  Bookmark, Download, Star, Eye, Zap,
  Brain, Target as TargetIcon, Trophy, Lightbulb
} from 'lucide-react'
import { getGradeTheme } from '@/lib/utils/grade-themes'

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="w-12 h-12 text-blue-600 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-800">جاري تحميل الباقة التعليمية</h3>
          <p className="text-gray-600">يرجى الانتظار قليلاً...</p>
        </div>
      </div>
    </div>
  )
}

// Error Component
function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">حدث خطأ</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>
          <button
            onClick={onBack}
            className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-4 px-8 rounded-xl w-full hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <span className="flex items-center justify-center gap-3">
              <ArrowRight className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              العودة إلى الصفحة الرئيسية
            </span>
            <div className="absolute inset-0 bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </button>
        </div>
      </motion.div>
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
      case 'video': return <PlayCircle className="w-5 h-5" />
      case 'pdf': return <FileText className="w-5 h-5" />
      case 'exam': return <HelpCircle className="w-5 h-5" />
      case 'text': return <BookOpen className="w-5 h-5" />
      default: return <PlayCircle className="w-5 h-5" />
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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'failed':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      case 'in_progress':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200'
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

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'weekly': return { text: 'أسبوعي', color: 'bg-blue-500' }
      case 'monthly': return { text: 'شهري', color: 'bg-purple-500' }
      case 'term': return { text: 'ترم كامل', color: 'bg-emerald-500' }
      case 'offer': return { text: 'عرض خاص', color: 'bg-amber-500' }
      default: return { text: type, color: 'bg-blue-500' }
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'weekly': return <Calendar className="w-4 h-4" />
      case 'monthly': return <Calendar className="w-4 h-4" />
      case 'term': return <Trophy className="w-4 h-4" />
      case 'offer': return <Zap className="w-4 h-4" />
      default: return <Calendar className="w-4 h-4" />
    }
  }

  if (!mounted) return <LoadingState />
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onBack={() => router.push(`/grades/${gradeSlug || ''}`)} />
  if (!packageData) return <ErrorState message="لم يتم العثور على الباقة" onBack={() => router.push('/')} />

  const typeBadge = getTypeBadge(packageData.type)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 group"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                  <Home className="w-4 h-4" />
                </div>
                <span className="font-medium">الرئيسية</span>
              </button>
              
              <div className="hidden md:flex items-center gap-4">
                <div className="w-1 h-6 bg-gray-200 rounded-full"></div>
                <button
                  onClick={() => router.push(`/grades/${gradeSlug}`)}
                  className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
                >
                  {gradeSlug === 'first' ? 'الصف الأول' : gradeSlug === 'second' ? 'الصف الثاني' : 'الصف الثالث'}
                </button>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="text-blue-600 font-semibold truncate max-w-xs">
                  {packageData.name}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl border border-blue-100">
                <Crown className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-700">البارع محمود الديب</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Package Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-gray-50 shadow-xl border border-gray-200/50 mb-8"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
          
          <div className="relative p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Package Image & Stats */}
              <div className="lg:w-2/5 space-y-6">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg overflow-hidden">
                    {packageData.image_url ? (
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={packageData.image_url}
                          alt={packageData.name}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <GraduationCap className="w-16 h-16 text-white" />
                      </div>
                    )}
                    
                    {/* Type Badge */}
                    <div className="absolute top-4 left-4">
                      <div className={`${typeBadge.color} text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg`}>
                        {getTypeIcon(packageData.type)}
                        <span className="font-semibold">{typeBadge.text}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <PlayCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{lectures.length}</div>
                        <div className="text-sm text-gray-600">محاضرة</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{contents.length}</div>
                        <div className="text-sm text-gray-600">محتوى</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{packageData.duration_days}</div>
                        <div className="text-sm text-gray-600">يوم</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Details */}
              <div className="lg:w-3/5 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-3">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                      {packageData.name}
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {packageData.description}
                    </p>
                  </div>
                  
                  <button className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                    <Share2 className="w-5 h-5" />
                    مشاركة الباقة
                    <div className="absolute inset-0 bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                </div>

                {/* Progress Section */}
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-200/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">تقدمك في الباقة</h3>
                        <p className="text-sm text-gray-600">تابع تقدمك التعليمي</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">{completion}%</div>
                      <div className="text-sm text-gray-600">
                        {userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length} من {contents.length}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-6">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completion}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-full"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </motion.div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length}
                          </div>
                          <div className="text-sm text-gray-600">مكتمل</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {userProgress.filter(p => p.status === 'in_progress').length}
                          </div>
                          <div className="text-sm text-gray-600">قيد التقدم</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-xl p-4 border border-rose-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                          <XCircle className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {userProgress.filter(p => p.status === 'failed').length}
                          </div>
                          <div className="text-sm text-gray-600">فشل</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <TargetIcon className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {contents.length - userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length}
                          </div>
                          <div className="text-sm text-gray-600">متبقي</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lectures Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">محاضرات الباقة</h2>
                <p className="text-gray-600">ابدأ رحلتك التعليمية الآن وحقق التفوق</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-5 h-5" />
              <span className="font-semibold">{lectures.length} محاضرة</span>
            </div>
          </div>

          {lectures.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-lg border border-gray-200/50 p-12 text-center"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">لا توجد محاضرات متاحة حالياً</h3>
              <p className="text-gray-600 text-lg">سيتم إضافة المحاضرات قريباً</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
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
                    className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    <div
                      className="p-6 cursor-pointer hover:bg-gray-50/50 transition-colors duration-200"
                      onClick={() => toggleSection(lecture.id)}
                    >
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Lecture Number */}
                          <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                              <span className="text-2xl font-bold text-white">{lectureIndex + 1}</span>
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                              {progressPercentage === 100 ? (
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              ) : progressPercentage > 0 ? (
                                <Clock className="w-4 h-4 text-amber-600" />
                              ) : (
                                <Star className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>

                          {/* Lecture Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900 truncate">{lecture.title}</h3>
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                                  progressPercentage === 100 ? 'completed' : 
                                  progressPercentage > 0 ? 'in_progress' : 'not_started'
                                )}`}>
                                  {progressPercentage === 100 ? 'مكتمل' : progressPercentage > 0 ? 'قيد التقدم' : 'لم يبدأ'}
                                </span>
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                                  {lectureContents.length} محتوى
                                </span>
                              </div>
                            </div>
                            
                            {lecture.description && (
                              <p className="text-gray-600 mb-4 leading-relaxed">{lecture.description}</p>
                            )}

                            {/* Progress & Stats */}
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                                  <span className="text-sm text-gray-600">
                                    {completedContents} مكتمل
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-amber-600" />
                                  <span className="text-sm text-gray-600">
                                    {lectureContents.length - completedContents} متبقي
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex-1 max-w-xs">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-gray-600">التقدم</span>
                                  <span className="text-sm font-bold text-blue-600">{progressPercentage}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expand Button */}
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-200"
                        >
                          <ChevronDown className="w-6 h-6" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Contents */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-gray-200/50 bg-gradient-to-b from-gray-50/50 to-white"
                        >
                          <div className="p-6">
                            <div className="grid grid-cols-1 gap-3">
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
                                    className={`group/item bg-white rounded-xl border ${isCompleted ? 'border-emerald-200' : 'border-gray-200'} shadow-sm hover:shadow-md transition-all duration-300 ${isAccessible ? 'cursor-pointer hover:-translate-y-0.5' : 'opacity-75'}`}
                                    onClick={() => isAccessible && handleContentClick(content, lectureIndex, contentIndex)}
                                  >
                                    <div className="p-4">
                                      <div className="flex items-center justify-between gap-4">
                                        {/* Content Info */}
                                        <div className="flex items-start gap-4 flex-1">
                                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                            isCompleted ? 'bg-emerald-100' :
                                            status === 'failed' ? 'bg-rose-100' :
                                            status === 'in_progress' ? 'bg-amber-100' :
                                            isAccessible ? 'bg-blue-100' : 'bg-gray-100'
                                          }`}>
                                            <div className={`
                                              ${isCompleted ? 'text-emerald-600' :
                                                status === 'failed' ? 'text-rose-600' :
                                                status === 'in_progress' ? 'text-amber-600' :
                                                isAccessible ? 'text-blue-600' : 'text-gray-400'
                                              }
                                            `}>
                                              {getContentIcon(content.type)}
                                            </div>
                                            {isCompleted && (
                                              <div className="absolute -mt-8 -ml-8">
                                                <div className="w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center">
                                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                                </div>
                                              </div>
                                            )}
                                          </div>

                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <h4 className="font-semibold text-gray-900 truncate">{content.title}</h4>
                                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                                {getStatusText(status)}
                                              </span>
                                            </div>
                                            
                                            {content.description && (
                                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{content.description}</p>
                                            )}

                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                              <span className="flex items-center gap-1">
                                                {content.type === 'video' ? 'فيديو' : content.type === 'pdf' ? 'ملف PDF' : content.type === 'exam' ? 'امتحان' : 'نص'}
                                              </span>
                                              {content.duration_minutes > 0 && (
                                                <span className="flex items-center gap-1">
                                                  <Clock className="w-3 h-3" />
                                                  {content.duration_minutes} دقيقة
                                                </span>
                                              )}
                                              {content.type === 'exam' && (
                                                <span className="flex items-center gap-1">
                                                  <TargetIcon className="w-3 h-3" />
                                                  النجاح: {content.pass_score}%
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="flex-shrink-0">
                                          {!isAccessible ? (
                                            <div className="flex items-center gap-2 text-gray-400 px-4 py-2 rounded-lg bg-gray-100">
                                              <Lock className="w-4 h-4" />
                                              <span className="text-sm font-medium">مقفل</span>
                                            </div>
                                          ) : (
                                            <button
                                              className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all duration-300 transform hover:scale-105 ${
                                                isCompleted
                                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                  : status === 'failed'
                                                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                                  : status === 'in_progress'
                                                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg'
                                              }`}
                                            >
                                              {isCompleted ? (
                                                <>
                                                  <CheckCircle className="w-4 h-4" />
                                                  مكتمل
                                                </>
                                              ) : status === 'failed' ? (
                                                <>
                                                  <XCircle className="w-4 h-4" />
                                                  إعادة المحاولة
                                                </>
                                              ) : status === 'in_progress' ? (
                                                <>
                                                  <Play className="w-4 h-4" />
                                                  استكمال
                                                </>
                                              ) : (
                                                <>
                                                  <Play className="w-4 h-4" />
                                                  بدء الآن
                                                </>
                                              )}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          {/* Important Notes */}
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-xl border border-blue-100/50 p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                <Award className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">ملاحظات هامة</h3>
                <p className="text-gray-600">نصائح للاستفادة القصوى من الباقة</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {packageData.type === 'monthly' || packageData.type === 'term' ? (
                <>
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border border-blue-200">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">نظام التقدم المتسلسل</h4>
                      <p className="text-sm text-gray-600">يجب إتمام كل محتوى قبل الانتقال للذي يليه</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl border border-purple-200">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TargetIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">الامتحانات</h4>
                      <p className="text-sm text-gray-600">لابد من اجتياز الامتحان قبل الانتقال للمحاضرة التالية</p>
                    </div>
                  </div>
                </>
              ) : null}
              
              {userPackage?.expires_at && (
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">مدة الاشتراك</h4>
                    <p className="text-sm text-gray-600">
                      تنتهي صلاحية اشتراكك في:{' '}
                      <span className="font-bold text-emerald-700">
                        {new Date(userPackage.expires_at).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">نصائح الدراسة</h4>
                  <p className="text-sm text-gray-600">نوصي بدراسة محتوى واحد يومياً لتحقيق أفضل النتائج</p>
                </div>
              </div>
            </div>
          </div>

          {/* Package Summary */}
          <div className="bg-gradient-to-br from-white to-purple-50 rounded-3xl shadow-xl border border-purple-100/50 p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center">
                <Brain className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">ملخص الباقة</h3>
                <p className="text-gray-600">معلومات شاملة عن محتويات الباقة</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">نوع الباقة</span>
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full text-sm font-semibold">
                    {getTypeBadge(packageData.type).text}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">المدة</span>
                  <span className="text-lg font-bold text-gray-900">{packageData.duration_days} يوم</span>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">توزيع المحتويات</h4>
                <div className="space-y-3">
                  {['video', 'pdf', 'exam', 'text'].map((type) => {
                    const count = contents.filter(c => c.type === type).length
                    if (count === 0) return null
                    
                    const percentage = Math.round((count / contents.length) * 100)
                    const colors = {
                      video: { bg: 'from-blue-500 to-blue-600', text: 'text-blue-600' },
                      pdf: { bg: 'from-rose-500 to-rose-600', text: 'text-rose-600' },
                      exam: { bg: 'from-purple-500 to-purple-600', text: 'text-purple-600' },
                      text: { bg: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600' }
                    }
                    
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[type as keyof typeof colors].text.replace('text-', 'bg-')}20`}>
                              {getContentIcon(type)}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {type === 'video' ? 'فيديوهات' : type === 'pdf' ? 'ملفات PDF' : type === 'exam' ? 'امتحانات' : 'نصوص'}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-gray-900">{count} ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${colors[type as keyof typeof colors].bg}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-3">نصائح للدراسة</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-3 h-3 text-blue-600" />
                    </div>
                    <span>احرص على إكمال المحتوى بالترتيب المحدد</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-3 h-3 text-blue-600" />
                    </div>
                    <span>خصص وقتاً ثابتاً للدراسة يومياً</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-3 h-3 text-blue-600" />
                    </div>
                    <span>استخدم الملاحظات أثناء مشاهدة الفيديوهات</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <button
            onClick={() => router.push(`/grades/${gradeSlug}`)}
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-white to-gray-50 text-blue-600 border border-blue-200 px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <ArrowRight className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            العودة إلى الباقات
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300"></div>
          </button>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-lg">البارع محمود الديب</div>
                <div className="text-sm text-gray-400">نحو تعليم أفضل لمستقبل مشرق</div>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <div className="text-sm text-gray-400 mb-2">© {new Date().getFullYear()} جميع الحقوق محفوظة</div>
              <div className="text-xs text-gray-500">مصمم بحب لتجربة تعليمية استثنائية</div>
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