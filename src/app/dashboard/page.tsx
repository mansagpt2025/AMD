import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // جلب بيانات الطالب من جدول profiles
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  // جلد بيانات المحفظة
  const { data: wallet } = await supabase
    .from('student_wallet')
    .select('balance')
    .eq('student_id', session.user.id)
    .single()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* شريط التنقل */}
      <nav className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4 space-x-reverse">
              <h1 className="text-xl font-bold text-primary-600">منصة محمود الديب</h1>
              <span className="text-gray-600">|</span>
              <span className="text-gray-800">لوحة التحكم</span>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="text-right">
                <p className="font-medium text-gray-800">{profile?.name || 'مستخدم'}</p>
                <p className="text-sm text-gray-600">{profile?.grade || 'غير محدد'}</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  تسجيل الخروج
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-4 py-8">
        {/* بطاقة ترحيبية */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2">مرحباً بعودتك، {profile?.name || 'عزيزي الطالب'} 👋</h2>
              <p className="opacity-90">استمر في رحلتك التعليمية نحو النجاح والتفوق</p>
            </div>
            <div className="text-center bg-white/20 p-4 rounded-xl backdrop-blur-sm">
              <p className="text-sm opacity-90">رصيدك المتاح</p>
              <p className="text-3xl font-bold mt-1">
                {new Intl.NumberFormat('ar-EG', {
                  style: 'currency',
                  currency: 'EGP',
                  minimumFractionDigits: 0
                }).format(wallet?.balance || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">الباقات المشتركة</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">0</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">المحاضرات المكتملة</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">0</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">متوسط الدرجات</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">0%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* الصفوف الدراسية */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">الصفوف الدراسية</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="/grades/1" className="block group">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold">الصف الأول الثانوي</h4>
                  <svg className="w-6 h-6 opacity-80 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                <p className="text-sm opacity-90 mb-2">الباقات المتاحة: 5</p>
                <div className="flex items-center">
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full w-1/3"></div>
                  </div>
                  <span className="text-xs mr-2">33%</span>
                </div>
              </div>
            </a>

            <a href="/grades/2" className="block group">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white hover:from-green-600 hover:to-green-700 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold">الصف الثاني الثانوي</h4>
                  <svg className="w-6 h-6 opacity-80 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                <p className="text-sm opacity-90 mb-2">الباقات المتاحة: 8</p>
                <div className="flex items-center">
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full w-1/2"></div>
                  </div>
                  <span className="text-xs mr-2">50%</span>
                </div>
              </div>
            </a>

            <a href="/grades/3" className="block group">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold">الصف الثالث الثانوي</h4>
                  <svg className="w-6 h-6 opacity-80 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                <p className="text-sm opacity-90 mb-2">الباقات المتاحة: 12</p>
                <div className="flex items-center">
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full w-2/3"></div>
                  </div>
                  <span className="text-xs mr-2">67%</span>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}