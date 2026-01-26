'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClientBrowser } from '@/lib/supabase/sf-client'
import {
  Video, FileText, BookOpen, Clock, CheckCircle,
  X, ArrowRight, AlertCircle, Loader2, Download,
  Play, Target, Lock, Eye, Home,
  ChevronRight, Shield, Award, Users
} from 'lucide-react'
import { getGradeTheme } from '@/lib/utils/grade-themes'
import ProtectedVideoPlayer from '@/components/content/ProtectedVideoPlayer'
import PDFViewer from '@/components/content/PDFViewer'
import ExamViewer from '@/components/content/ExamViewer'

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
          <div className="bg-white rounded-2xl p-8 border" style={{ borderColor: theme.border }}>
            <div className="prose max-w-none">
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
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">نوع المحتوى غير مدعوم</p>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: theme.primary }} />
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">حدث خطأ</h2>
          <p className="text-gray-600 mb-4">{error || 'المحتوى غير موجود'}</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 rounded-lg font-medium"
            style={{ background: theme.primary, color: 'white' }}
          >
            العودة للباقة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: theme.background }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: theme.border, background: theme.backgroundLight }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1 hover:text-gray-900"
            >
              <Home className="w-4 h-4" />
              الرئيسية
            </button>
            <ChevronRight className="w-4 h-4" />
            <button
              onClick={() => router.push(`/grades/${gradeSlug}`)}
              className="hover:text-gray-900"
            >
              {gradeSlug === 'first' ? 'الصف الأول' : gradeSlug === 'second' ? 'الصف الثاني' : 'الصف الثالث'}
            </button>
            <ChevronRight className="w-4 h-4" />
            <button
              onClick={() => router.push(`/grades/${gradeSlug}/packages/${packageId}`)}
              className="hover:text-gray-900"
            >
              {packageData?.name}
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium" style={{ color: theme.text }}>{content.title}</span>
          </div>

          {/* Content Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: theme.text }}>
                {content.title}
              </h1>
              <p className="text-gray-600">
                {lecture?.title} • {packageData?.name}
              </p>
            </div>

            <button
              onClick={handleBack}
              className="px-4 py-2 rounded-lg border flex items-center gap-2"
              style={{ borderColor: theme.primary, color: theme.primary }}
            >
              <ArrowRight className="w-4 h-4" />
              العودة
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Content Viewer */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex border-b mb-6" style={{ borderColor: theme.border }}>
              <button
                onClick={() => setActiveTab('viewer')}
                className={`px-6 py-3 font-medium border-b-2 transition-all ${
                  activeTab === 'viewer' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
                }`}
                style={activeTab === 'viewer' ? { borderColor: theme.primary, color: theme.primary } : {}}
              >
                <Eye className="w-4 h-4 inline ml-2" />
                العارض
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`px-6 py-3 font-medium border-b-2 transition-all ${
                  activeTab === 'info' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
                }`}
                style={activeTab === 'info' ? { borderColor: theme.primary, color: theme.primary } : {}}
              >
                <BookOpen className="w-4 h-4 inline ml-2" />
                المعلومات
              </button>
            </div>

            {/* Content Area */}
            {activeTab === 'viewer' ? (
              <div className="bg-white rounded-2xl shadow-lg border overflow-hidden" style={{ borderColor: theme.border }}>
                {renderContent()}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border p-6" style={{ borderColor: theme.border }}>
                <h3 className="text-xl font-bold mb-4" style={{ color: theme.text }}>معلومات المحتوى</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 text-gray-700">الوصف</h4>
                    <p className="text-gray-600">{content.description || 'لا يوجد وصف'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2 text-gray-700">النوع</h4>
                      <p className="flex items-center gap-2">
                        {content.type === 'video' ? <Video className="w-4 h-4" /> :
                         content.type === 'pdf' ? <FileText className="w-4 h-4" /> :
                         content.type === 'exam' ? <Target className="w-4 h-4" /> :
                         <BookOpen className="w-4 h-4" />}
                        {content.type === 'video' ? 'فيديو' :
                         content.type === 'pdf' ? 'ملف PDF' :
                         content.type === 'exam' ? 'امتحان' : 'نص'}
                      </p>
                    </div>
                    
                    {content.duration_minutes > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 text-gray-700">المدة</h4>
                        <p className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {content.duration_minutes} دقيقة
                        </p>
                      </div>
                    )}
                    
                    {content.type === 'exam' && (
                      <>
                        <div>
                          <h4 className="font-medium mb-2 text-gray-700">درجة النجاح</h4>
                          <p className="flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            {content.pass_score}%
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2 text-gray-700">المحاولات</h4>
                          <p className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {content.max_attempts} محاولة
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Progress Tracking */}
            {content.type === 'video' && (
              <div className="mt-6 bg-white rounded-2xl border p-6" style={{ borderColor: theme.border }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold" style={{ color: theme.text }}>تقدم المشاهدة</h4>
                  <span className="text-lg font-bold">{videoProgress}%</span>
                </div>
                
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${videoProgress}%`, background: theme.primary }}
                  />
                </div>
                
                <div className="flex justify-between mt-2 text-sm text-gray-600">
                  <span>لم يشاهد</span>
                  <span>مشاهدة كاملة</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Actions & Info */}
          <div className="space-y-6">
            {/* Content Status */}
            <div className="bg-white rounded-2xl border p-6" style={{ borderColor: theme.border }}>
              <h4 className="font-bold mb-4" style={{ color: theme.text }}>حالة المحتوى</h4>
              
              <div className={`p-4 rounded-lg mb-4 flex items-center gap-3 ${
                userProgress?.status === 'completed' || userProgress?.status === 'passed' 
                  ? 'bg-green-50 text-green-700'
                  : userProgress?.status === 'failed'
                  ? 'bg-red-50 text-red-700'
                  : userProgress?.status === 'in_progress'
                  ? 'bg-yellow-50 text-yellow-700'
                  : 'bg-gray-50 text-gray-700'
              }`}>
                {userProgress?.status === 'completed' || userProgress?.status === 'passed' ? (
                  <CheckCircle className="w-6 h-6" />
                ) : userProgress?.status === 'failed' ? (
                  <X className="w-6 h-6" />
                ) : userProgress?.status === 'in_progress' ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <BookOpen className="w-6 h-6" />
                )}
                <div>
                  <div className="font-bold">
                    {userProgress?.status === 'completed' ? 'مكتمل' :
                     userProgress?.status === 'passed' ? 'ناجح' :
                     userProgress?.status === 'failed' ? 'فاشل' :
                     userProgress?.status === 'in_progress' ? 'قيد التقدم' : 'لم يبدأ'}
                  </div>
                  {userProgress?.completed_at && (
                    <div className="text-sm mt-1">
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
                  className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                    userProgress?.status === 'completed' || userProgress?.status === 'passed'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'text-white'
                  }`}
                  style={!(userProgress?.status === 'completed' || userProgress?.status === 'passed') ? 
                    { background: theme.success } : {}}
                >
                  {userProgress?.status === 'completed' || userProgress?.status === 'passed' ? (
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
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border p-6" style={{ borderColor: theme.border }}>
              <h4 className="font-bold mb-4" style={{ color: theme.text }}>إجراءات سريعة</h4>
              
              <div className="space-y-3">
                {content.type === 'pdf' && (
                  <a
                    href={content.content_url || '#'}
                    download
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-all"
                    style={{ borderColor: theme.border }}
                  >
                    <span>تحميل الملف</span>
                    <Download className="w-5 h-5" />
                  </a>
                )}
                
                <button
                  onClick={() => router.push(`/grades/${gradeSlug}/packages/${packageId}`)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-all"
                  style={{ borderColor: theme.border }}
                >
                  <span>العودة للباقة</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => router.push(`/grades/${gradeSlug}`)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-all"
                  style={{ borderColor: theme.border }}
                >
                  <span>جميع باقات الصف</span>
                  <BookOpen className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Package Info */}
            <div className="bg-white rounded-2xl border p-6" style={{ borderColor: theme.border }}>
              <h4 className="font-bold mb-4" style={{ color: theme.text }}>معلومات الباقة</h4>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: theme.primary + '20' }}>
                    <Award className="w-5 h-5" style={{ color: theme.primary }} />
                  </div>
                  <div>
                    <div className="font-medium">{packageData?.name}</div>
                    <div className="text-sm text-gray-600">{packageData?.type === 'weekly' ? 'أسبوعي' : 'شهري/ترم'}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: theme.success + '20' }}>
                    <Shield className="w-5 h-5" style={{ color: theme.success }} />
                  </div>
                  <div>
                    <div className="font-medium">حالة الاشتراك</div>
                    <div className="text-sm text-gray-600">
                      {userPackage?.expires_at 
                        ? `نشط حتى ${new Date(userPackage.expires_at).toLocaleDateString('ar-EG')}`
                        : 'غير متاح'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}