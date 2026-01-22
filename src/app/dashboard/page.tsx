'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, Calendar, BookOpen, Award, TrendingUp, 
  Clock, Download, BarChart, Wallet, Sparkles,
  ChevronRight, Package, Video, FileText, HelpCircle,
  Settings, LogOut, Home, Users, CreditCard, Shield
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DashboardData {
  student: {
    name: string
    grade: string
    section: string
    avatar: string
    email?: string
    phone?: string
  }
  wallet: {
    balance: number
    last_updated?: string
  }
  stats: {
    totalPackages: number
    completedLectures: number
    totalLectures: number
    averageScore: number
    studyHours: number
  }
  recentPackages?: Array<{
    id: string
    name: string
    progress: number
    nextLecture: string
    color: string
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [grades, setGrades] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
    fetchGrades()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // التحقق من تسجيل الدخول
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // جلب بيانات الطالب
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile) {
        console.error('Profile not found')
        return
      }

      // جلب بيانات المحفظة
      const { data: wallet } = await supabase
        .from('student_wallet')
        .select('*')
        .eq('student_id', user.id)
        .single()

      // جلب عدد الباقات المشتراة
      const { data: purchases } = await supabase
        .from('student_purchases')
        .select('id')
        .eq('student_id', user.id)
        .eq('status', 'active')

      // جلب عدد المحاضرات المكتملة (افتراضي 0 حتى نقوم بتنفيذ النظام)
      const completedLectures = 0
      const totalLectures = 0
      const averageScore = 0
      const studyHours = 0

      setDashboardData({
        student: {
          name: profile.name || 'طالب',
          grade: profile.grade || 'غير محدد',
          section: profile.section || 'عام',
          avatar: (profile.name || 'ط').charAt(0),
          email: profile.email,
          phone: profile.student_phone
        },
        wallet: {
          balance: wallet?.balance || 0,
          last_updated: wallet?.last_updated
        },
        stats: {
          totalPackages: purchases?.length || 0,
          completedLectures,
          totalLectures,
          averageScore,
          studyHours
        }
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGrades = async () => {
    try {
      const { data } = await supabase
        .from('grades')
        .select('*')
        .order('id', { ascending: true })

      setGrades(data || [])
    } catch (error) {
      console.error('Error fetching grades:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير محدد'
    return new Date(dateString).toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">❌ خطأ في تحميل البيانات</h2>
          <button 
            onClick={fetchDashboardData}
            className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* شريط التنقل العلوي */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">لوحة تحكم الطالب</h1>
              <p className="text-gray-600">مرحباً بك، {dashboardData.student.name}</p>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative">
                <button 
                  className="p-2 rounded-lg hover:bg-gray-100"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <Bell className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* بطاقة الترحيب */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">
                مرحباً بعودتك، {dashboardData.student.name}! 👋
              </h2>
              <p className="text-lg opacity-90">
                استمر في رحلتك التعليمية نحو التفوق والتميز
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  {dashboardData.student.grade}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  {dashboardData.student.section}
                </span>
                {dashboardData.student.email && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                    {dashboardData.student.email}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 min-w-[300px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Wallet className="w-8 h-8" />
                  <div>
                    <span className="block text-sm opacity-90">رصيدك المتاح</span>
                    <span className="block text-2xl font-bold">{formatCurrency(dashboardData.wallet.balance)}</span>
                  </div>
                </div>
              </div>
              <div className="text-sm opacity-90">
                آخر تحديث: {formatDate(dashboardData.wallet.last_updated)}
              </div>
              <button 
                onClick={() => router.push('/dashboard?tab=wallet')}
                className="w-full mt-4 py-3 bg-white text-primary-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                إدارة المحفظة
              </button>
            </div>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">الباقات المشتراة</p>
                <p className="text-2xl font-bold text-gray-800">{dashboardData.stats.totalPackages}</p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/dashboard?tab=packages')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              عرض الباقات →
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 shadow border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mr-4">
                <Video className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">المحاضرات المكتملة</p>
                <p className="text-2xl font-bold text-gray-800">{dashboardData.stats.completedLectures}</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              من أصل {dashboardData.stats.totalLectures} محاضرة
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mr-4">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">متوسط الدرجات</p>
                <p className="text-2xl font-bold text-gray-800">{dashboardData.stats.averageScore}%</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              آخر تحديث: هذا الأسبوع
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mr-4">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">ساعات الدراسة</p>
                <p className="text-2xl font-bold text-gray-800">{dashboardData.stats.studyHours}</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              هذا الشهر
            </div>
          </div>
        </div>

        {/* الصفوف الدراسية */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">الصفوف الدراسية</h3>
            <span className="text-sm text-gray-600">اختر صفك الدراسي</span>
          </div>
          
          {grades.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {grades.map((grade) => (
                <div 
                  key={grade.id} 
                  className={`rounded-xl p-6 text-white transition-transform hover:scale-[1.02] ${
                    grade.id === 1 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                    grade.id === 2 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                    'bg-gradient-to-r from-purple-500 to-purple-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold">{grade.name}</h4>
                    <BookOpen className="w-6 h-6 opacity-80" />
                  </div>
                  <p className="text-sm opacity-90 mb-6">
                    {grade.id === 1 && 'بداية رحلتك في الثانوية العامة'}
                    {grade.id === 2 && 'استعداد لمرحلة التخصص'}
                    {grade.id === 3 && 'التحضير للجامعة والمستقبل'}
                  </p>
                  <button
                    onClick={() => router.push(`/grades/${grade.id}`)}
                    className="w-full py-3 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center space-x-2 space-x-reverse"
                  >
                    <span>الدخول إلى الصف</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">لم يتم إضافة صفوف دراسية بعد</p>
            </div>
          )}
        </div>

        {/* الباقات النشطة */}
        {dashboardData.recentPackages && dashboardData.recentPackages.length > 0 ? (
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">آخر الباقات</h3>
              <button className="text-primary-600 hover:text-primary-700">
                عرض الكل →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dashboardData.recentPackages.map((pkg) => (
                <div key={pkg.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      pkg.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                      pkg.color === 'green' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {pkg.name.split(' - ')[0]}
                    </span>
                    <span className="text-sm text-gray-600">{pkg.progress}%</span>
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2">{pkg.name}</h4>
                  <p className="text-sm text-gray-600 mb-4">المحاضرة القادمة: {pkg.nextLecture}</p>
                  <button className="w-full py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100">
                    استكمال الدراسة
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">لا توجد باقات نشطة</h3>
              <p className="text-gray-600 mb-6">اشترك في باقة لتبدأ رحلتك التعليمية</p>
              <button 
                onClick={() => router.push(`/grades/${dashboardData.student.grade.includes('الأول') ? 1 : dashboardData.student.grade.includes('الثاني') ? 2 : 3}`)}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                تصفح الباقات
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}