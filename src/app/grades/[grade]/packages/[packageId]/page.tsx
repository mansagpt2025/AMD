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
  ArrowRight, Shield, Users, Award
} from 'lucide-react'
import { getGradeTheme } from '@/lib/utils/grade-themes'

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
      case 'video': return <Video className="w-5 h-5" />
      case 'pdf': return <File className="w-5 h-5" />
      case 'exam': return <Target className="w-5 h-5" />
      case 'text': return <BookOpen className="w-5 h-5" />
      default: return <PlayCircle className="w-5 h-5" />
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: theme.primary }} />
      </div>
    )
  }

  if (error || !packageData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">حدث خطأ</h2>
          <p className="text-gray-600 mb-4">{error || 'الباقة غير موجودة'}</p>
          <button
            onClick={() => router.push(`/grades/${gradeSlug}`)}
            className="px-6 py-3 rounded-lg font-medium"
            style={{ background: theme.primary, color: 'white' }}
          >
            العودة إلى الباقات
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: theme.background }}>
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: theme.header }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-white/80 mb-6">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1 hover:text-white"
            >
              <Home className="w-4 h-4" />
              الرئيسية
            </button>
            <ChevronRight className="w-4 h-4" />
            <button
              onClick={() => router.push(`/grades/${gradeSlug}`)}
              className="hover:text-white"
            >
              {gradeSlug === 'first' ? 'الصف الأول' : gradeSlug === 'second' ? 'الصف الثاني' : 'الصف الثالث'}
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-medium">{packageData.name}</span>
          </div>

          {/* Package Info */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Image */}
            <div className="w-full md:w-1/3">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                {packageData.image_url ? (
                  <img
                    src={packageData.image_url}
                    alt={packageData.name}
                    className="w-full h-64 object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-64 rounded-xl flex items-center justify-center" style={{ background: theme.primary + '40' }}>
                    <GraduationCap className="w-20 h-20 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{packageData.name}</h1>
              <p className="text-lg mb-6 text-white/90">{packageData.description}</p>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  <span>{lectures.length} محاضرة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{packageData.duration_days} يوم</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>
                    {packageData.type === 'weekly' ? 'أسبوعي' :
                     packageData.type === 'monthly' ? 'شهري' :
                     packageData.type === 'term' ? 'ترم كامل' : 'عرض خاص'}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>نسبة الإتمام</span>
                  </div>
                  <span className="text-2xl font-bold">{completion}%</span>
                </div>
                
                <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completion}%` }}
                    className="h-full rounded-full"
                    style={{ background: theme.accent }}
                  />
                </div>
                
                <div className="flex justify-between mt-3 text-sm">
                  <span>مكتمل: {userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length}</span>
                  <span>المتبقي: {contents.length - userProgress.filter(p => p.status === 'completed' || p.status === 'passed').length}</span>
                  <span>الإجمالي: {contents.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lectures */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: theme.text }}>
          <BookOpen className="w-6 h-6" />
          محاضرات الباقة
        </h2>

        {lectures.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">لا توجد محاضرات متاحة حالياً</p>
          </div>
        ) : (
          <div className="space-y-6">
            {lectures.map((lecture, lectureIndex) => {
              const lectureContents = contents.filter(c => c.lecture_id === lecture.id)
              
              return (
                <motion.div
                  key={lecture.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg border overflow-hidden"
                  style={{ borderColor: theme.border }}
                >
                  {/* Lecture Header */}
                  <div className="p-6 border-b" style={{ borderColor: theme.border }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold mb-2" style={{ color: theme.text }}>
                          المحاضرة {lectureIndex + 1}: {lecture.title}
                        </h3>
                        {lecture.description && (
                          <p className="text-gray-600">{lecture.description}</p>
                        )}
                      </div>
                      <div className="px-3 py-1 rounded-full text-sm font-medium text-white" style={{ background: theme.primary }}>
                        {lectureContents.length} محتوى
                      </div>
                    </div>
                  </div>

                  {/* Contents */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {lectureContents.map((content, contentIndex) => {
                        const isAccessible = isContentAccessible(lectureIndex, contentIndex, content)
                        const status = getContentStatus(content.id)
                        
                        return (
                          <div
                            key={content.id}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              isAccessible 
                                ? 'hover:border-blue-500 cursor-pointer border-gray-200' 
                                : 'border-gray-100 opacity-60'
                            }`}
                            onClick={() => isAccessible && handleContentClick(content, lectureIndex, contentIndex)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg" style={{ background: theme.primary + '20' }}>
                                  {getContentIcon(content.type)}
                                </div>
                                <div>
                                  <h4 className="font-bold" style={{ color: theme.text }}>
                                    {content.title}
                                  </h4>
                                  {content.description && (
                                    <p className="text-sm text-gray-600">{content.description}</p>
                                  )}
                                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                      {content.type === 'video' ? 'فيديو' :
                                       content.type === 'pdf' ? 'ملف PDF' :
                                       content.type === 'exam' ? 'امتحان' : 'نص'}
                                    </span>
                                    {content.duration_minutes > 0 && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {content.duration_minutes} دقيقة
                                      </span>
                                    )}
                                    {content.type === 'exam' && (
                                      <span className="flex items-center gap-1">
                                        <Target className="w-4 h-4" />
                                        النجاح: {content.pass_score}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                {/* Status */}
                                {status === 'completed' || status === 'passed' ? (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="w-5 h-5" />
                                    <span>{status === 'passed' ? 'ناجح' : 'مكتمل'}</span>
                                  </div>
                                ) : status === 'failed' ? (
                                  <div className="flex items-center gap-1 text-red-600">
                                    <XCircle className="w-5 h-5" />
                                    <span>فاشل</span>
                                  </div>
                                ) : status === 'in_progress' ? (
                                  <div className="flex items-center gap-1 text-yellow-600">
                                    <Clock className="w-5 h-5" />
                                    <span>قيد التقدم</span>
                                  </div>
                                ) : null}

                                {/* Action Button */}
                                <button
                                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                                    isAccessible 
                                      ? 'text-white' 
                                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  }`}
                                  style={isAccessible ? { background: theme.primary } : {}}
                                  disabled={!isAccessible}
                                >
                                  {isAccessible ? (
                                    <>
                                      {status === 'not_started' ? 'بدء' : 'استكمال'}
                                      <ArrowRight className="w-4 h-4" />
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="w-4 h-4" />
                                      مقفل
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Lock Message */}
                            {!isAccessible && (
                              <div className="mt-3 p-3 rounded-lg bg-yellow-50 text-yellow-800 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                <span>يجب إتمام المحتوى السابق أولاً</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Important Notes */}
        <div className="mt-12 p-6 rounded-2xl border" style={{ borderColor: theme.border, background: theme.backgroundLight }}>
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-6 h-6" style={{ color: theme.primary }} />
            <h3 className="text-xl font-bold" style={{ color: theme.text }}>ملاحظات هامة</h3>
          </div>
          
          <ul className="space-y-2 text-gray-600">
            {packageData.type === 'monthly' || packageData.type === 'term' ? (
              <>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4" style={{ color: theme.primary }} />
                  يجب إتمام كل محتوى قبل الانتقال للذي يليه
                </li>
                <li className="flex items-center gap-2">
                  <Target className="w-4 h-4" style={{ color: theme.primary }} />
                  لابد من اجتياز الامتحان قبل الانتقال للمحاضرة التالية
                </li>
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4" style={{ color: theme.primary }} />
                  يمكنك إعادة الامتحان حتى 3 مرات
                </li>
              </>
            ) : (
              <>
                <li className="flex items-center gap-2">
                  <Unlock className="w-4 h-4" style={{ color: theme.primary }} />
                  جميع المحاضرات متاحة مباشرة
                </li>
                <li className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" style={{ color: theme.primary }} />
                  يمكنك البدء بأي محاضرة تريد
                </li>
              </>
            )}
            <li className="flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: theme.primary }} />
              مدة الاشتراك تنتهي في: {new Date(userPackage?.expires_at).toLocaleDateString('ar-EG')}
            </li>
          </ul>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push(`/grades/${gradeSlug}`)}
            className="px-8 py-3 rounded-xl font-medium border-2 hover:shadow-lg transition-all"
            style={{ 
              borderColor: theme.primary,
              color: theme.primary
            }}
          >
            <ArrowRight className="w-5 h-5 inline ml-2" />
            العودة إلى الباقات
          </button>
        </div>
      </div>
    </div>
  )
}