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
  Zap, Trophy, Flame, ChevronDown, LockOpen,
  TrendingUp, PlayIcon, MoreHorizontal
} from 'lucide-react'
import { getGradeTheme } from '@/lib/utils/grade-themes'
import type { Variants } from 'framer-motion'



// ======= Types & Interfaces (كما هي) =======
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

// ======= Supabase Client (كما هو) =======
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

// ======= Animation Variants =======
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
}

const cardVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 20 }
  },
  hover: { 
    scale: 1.02,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  }
}

// ======= Loading Component (تصميم جديد) =======
function LoadingState() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_50%)]" />
      <div className="relative flex flex-col items-center gap-6">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 rounded-full border-4 border-indigo-100 border-t-indigo-600"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 rounded-full border-4 border-purple-100 border-t-purple-500"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-2">جاري التحميل...</h3>
          <p className="text-gray-500">نحضر لك المحتوى التعليمي</p>
        </motion.div>
      </div>
    </div>
  )
}

// ======= Error Component (تصميم جديد) =======
function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-100"
      >
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">حدث خطأ</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>
        <button 
          onClick={onBack}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          العودة للصفحة الرئيسية
        </button>
      </motion.div>
    </div>
  )
}

// ======= Floating Particles Component =======
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-indigo-400/20 rounded-full"
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut"
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`
          }}
        />
      ))}
    </div>
  )
}

// ======= Main Component =======
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

const cardVariants: Variants = {
  hidden: {
    scale: 0.95,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 20,
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 10,
    },
  },
}

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

  const getContentIcon = (type: string, status: string) => {
    const iconClass = "w-5 h-5"
    if (status === 'completed' || status === 'passed') {
      return <CheckCircle className={`${iconClass} text-emerald-500`} />
    }
    
    switch (type) {
      case 'video': return <PlayIcon className={`${iconClass} text-rose-500`} />
      case 'pdf': return <FileText className={`${iconClass} text-amber-500`} />
      case 'exam': return <HelpCircle className={`${iconClass} text-violet-500`} />
      case 'text': return <BookOpen className={`${iconClass} text-blue-500`} />
      default: return <PlayCircle className={iconClass} />
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
    <div className="min-h-screen bg-white font-sans">
      {/* Hero Section - Glassmorphism Design */}
      <div className="relative bg-white overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.08),transparent_50%)]" />
        <FloatingParticles />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_14px]" />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
          {/* Brand Header */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-xl rounded-full border border-gray-200 shadow-lg shadow-indigo-500/5">
              <Crown className="w-5 h-5 text-amber-500" />
              <span className="font-bold text-gray-800">البارع محمود الديب</span>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </div>
          </motion.div>

          {/* Breadcrumb */}
          <motion.nav 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-10"
          >
            <ol className="flex items-center gap-2 flex-wrap justify-center">
              <li>
                <button onClick={() => router.push('/')} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-all text-sm font-medium shadow-sm">
                  <Home className="w-4 h-4" />
                  الرئيسية
                </button>
              </li>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <li>
                <button onClick={() => router.push(`/grades/${gradeSlug}`)} className="px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-all text-sm font-medium shadow-sm">
                  {gradeSlug === 'first' ? 'الصف الأول' : gradeSlug === 'second' ? 'الصف الثاني' : 'الصف الثالث'}
                </button>
              </li>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <li>
                <span className="px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-bold">
                  {packageData.name}
                </span>
              </li>
            </ol>
          </motion.nav>

          {/* Package Hero Card */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-white/50 shadow-2xl shadow-indigo-500/10 overflow-hidden"
          >
            <div className="grid lg:grid-cols-5 gap-8 p-8">
              {/* Image Column */}
              <motion.div  className="lg:col-span-2">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                    {packageData.image_url ? (
                      <img 
                        src={packageData.image_url} 
                        alt={packageData.name} 
                        className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <GraduationCap className="w-24 h-24 text-indigo-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Floating Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="px-4 py-1.5 bg-white/95 backdrop-blur text-indigo-700 text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        باقة مميزة
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Content Column */}
              <motion.div  className="lg:col-span-3 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold border border-indigo-200">
                    {packageData.type === 'weekly' ? 'أسبوعي' : packageData.type === 'monthly' ? 'شهري' : packageData.type === 'term' ? 'ترم كامل' : 'عرض خاص'}
                  </span>
                  {completion > 0 && (
                    <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold border border-emerald-200 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" />
                      {completion}% مكتمل
                    </span>
                  )}
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
                  {packageData.name}
                </h1>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-2xl">
                  {packageData.description}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { icon: PlayCircle, value: lectures.length, label: 'محاضرة', color: 'text-rose-500', bg: 'bg-rose-50' },
                    { icon: Clock, value: packageData.duration_days, label: 'يوم', color: 'text-amber-500', bg: 'bg-amber-50' },
                    { icon: BookOpen, value: contents.length, label: 'محتوى', color: 'text-emerald-500', bg: 'bg-emerald-50' }
                  ].map((stat, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-lg shadow-gray-200/50 flex flex-col items-center text-center"
                    >
                      <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-2`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <span className="text-2xl font-black text-gray-900">{stat.value}</span>
                      <span className="text-sm text-gray-500 font-medium">{stat.label}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Progress Bar */}
                {contents.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg shadow-gray-200/30">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2 text-gray-700 font-bold">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                        <span>تقدمك في الباقة</span>
                      </div>
                      <span className="text-2xl font-black text-indigo-600">{completion}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${completion}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                      />
                    </div>
                    <div className="flex justify-between mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        مكتمل: {userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-amber-500" />
                        متبقي: {contents.length - userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-24 relative z-10">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 mb-8 flex items-center gap-4"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">محتوى الباقة</h2>
            <p className="text-gray-500">ابدأ رحلتك التعليمية وحقق التفوق</p>
          </div>
        </motion.div>

        {/* Lectures List */}
        {lectures.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200"
          >
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد محاضرات متاحة</h3>
            <p className="text-gray-500">سيتم إضافة المحاضرات قريباً</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {lectures.map((lecture, lectureIndex) => {
              const lectureContents = contents.filter(c => c.lecture_id === lecture.id)
              const isExpanded = activeSection === lecture.id
              const completedContents = lectureContents.filter(c => {
                const status = getContentStatus(c.id)
                return status === 'completed' || status === 'passed'
              }).length
              const progressPercent = lectureContents.length > 0 ? (completedContents / lectureContents.length) * 100 : 0
              
              return (
                <motion.div 
                  key={lecture.id}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover="hover"
                  className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden"
                >
                  {/* Lecture Header */}
                  <div 
                    onClick={() => toggleSection(lecture.id)}
                    className="p-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Lecture Number */}
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 text-white font-black text-2xl">
                            {lectureIndex + 1}
                          </div>
                          {progressPercent === 100 && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                              <CheckCircle className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{lecture.title}</h3>
                          {lecture.description && (
                            <p className="text-gray-500 text-sm line-clamp-1">{lecture.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {lectureContents.length} محتوى
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              {completedContents}/{lectureContents.length} مكتمل
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Circular Progress */}
                        <div className="relative w-14 h-14 hidden sm:block">
                          <svg className="w-full h-full -rotate-90">
                            <circle cx="28" cy="28" r="24" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                            <circle 
                              cx="28" cy="28" r="24" fill="none" 
                              stroke="url(#gradient)" strokeWidth="4"
                              strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 24}`}
                              strokeDashoffset={`${2 * Math.PI * 24 * (1 - progressPercent / 100)}`}
                              className="transition-all duration-1000"
                            />
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#a855f7" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                            {Math.round(progressPercent)}%
                          </span>
                        </div>

                        {/* Expand Button */}
                        <motion.div 
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                        >
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Contents List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-100 bg-gray-50/30"
                      >
                        <div className="p-6 space-y-3">
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
                                onClick={() => isAccessible && handleContentClick(content, lectureIndex, contentIndex)}
                                className={`group relative bg-white rounded-xl p-4 border-2 transition-all duration-300 ${
                                  isAccessible 
                                    ? 'border-gray-100 hover:border-indigo-300 hover:shadow-lg cursor-pointer' 
                                    : 'border-gray-100 opacity-60 cursor-not-allowed bg-gray-50'
                                } ${isCompleted ? 'border-emerald-200 bg-emerald-50/30' : ''}`}
                              >
                                <div className="flex items-center gap-4">
                                  {/* Icon */}
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                    isCompleted ? 'bg-emerald-100' : 
                                    isAccessible ? 'bg-indigo-50 group-hover:bg-indigo-100' : 'bg-gray-100'
                                  }`}>
                                    {getContentIcon(content.type, status)}
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 mb-1 truncate">{content.title}</h4>
                                    {content.description && (
                                      <p className="text-sm text-gray-500 line-clamp-1">{content.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs">
                                      <span className={`px-2 py-1 rounded-full font-medium ${
                                        content.type === 'video' ? 'bg-rose-100 text-rose-700' :
                                        content.type === 'pdf' ? 'bg-amber-100 text-amber-700' :
                                        content.type === 'exam' ? 'bg-violet-100 text-violet-700' :
                                        'bg-blue-100 text-blue-700'
                                      }`}>
                                        {content.type === 'video' ? 'فيديو' : content.type === 'pdf' ? 'PDF' : content.type === 'exam' ? 'امتحان' : 'نص'}
                                      </span>
                                      {content.duration_minutes > 0 && (
                                        <span className="flex items-center gap-1 text-gray-400">
                                          <Clock className="w-3 h-3" />
                                          {content.duration_minutes} دقيقة
                                        </span>
                                      )}
                                      {content.type === 'exam' && (
                                        <span className="flex items-center gap-1 text-violet-600 font-medium">
                                          <Target className="w-3 h-3" />
                                          النجاح: {content.pass_score}%
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action */}
                                  <div className="flex-shrink-0">
                                    {!isAccessible ? (
                                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-400 text-sm font-bold">
                                        <Lock className="w-4 h-4" />
                                        <span className="hidden sm:inline">مقفل</span>
                                      </div>
                                    ) : (
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-lg transition-all ${
                                          isCompleted ? 'bg-emerald-500 shadow-emerald-500/25 hover:bg-emerald-600' :
                                          status === 'failed' ? 'bg-red-500 shadow-red-500/25 hover:bg-red-600' :
                                          status === 'in_progress' ? 'bg-amber-500 shadow-amber-500/25 hover:bg-amber-600' :
                                          'bg-indigo-600 shadow-indigo-600/25 hover:bg-indigo-700'
                                        }`}
                                      >
                                        {isCompleted ? (
                                          <><CheckCircle className="w-4 h-4" /> مكتمل</>
                                        ) : status === 'failed' ? (
                                          <><XCircle className="w-4 h-4" /> إعادة</>
                                        ) : status === 'in_progress' ? (
                                          <><Play className="w-4 h-4" /> استكمال</>
                                        ) : (
                                          <><Play className="w-4 h-4" /> بدء</>
                                        )}
                                      </motion.button>
                                    )}
                                  </div>
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

        {/* Important Notes */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">ملاحظات هامة</h3>
              <ul className="space-y-2">
                {(packageData.type === 'monthly' || packageData.type === 'term') && (
                  <>
                    <li className="flex items-center gap-2 text-gray-700">
                      <Shield className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span>يجب إتمام كل محتوى قبل الانتقال للذي يليه</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <Target className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span>لابد من اجتياز الامتحان قبل الانتقال للمحاضرة التالية</span>
                    </li>
                  </>
                )}
                {userPackage?.expires_at && (
                  <li className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>مدة الاشتراك تنتهي في: <strong>{new Date(userPackage.expires_at).toLocaleDateString('ar-EG')}</strong></span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Back Button */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <button 
            onClick={() => router.push(`/grades/${gradeSlug}`)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-full font-bold hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-lg hover:shadow-xl"
          >
            <ArrowRight className="w-5 h-5" />
            العودة إلى الباقات
          </button>
        </motion.div>
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
