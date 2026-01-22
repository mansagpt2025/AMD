// app/dashboard/page.tsx - الملف المعدل


// app/dashboard/page.tsx - الملف المعدل
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/supabase-server'
import type { Metadata } from 'next'
import './dashboard.css'

// إضافة Viewport بشكل صحيح
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

// إضافة Metadata
export const metadata: Metadata = {
  title: 'لوحة التحكم | محمود الديب',
  description: 'لوحة تحكم الطالب',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // استخدام getUser بدلاً من getSession
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // جلب بيانات المستخدم
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // جلب رصيد المحفظة
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  // جلب الباقات المشتركة
  const { data: purchasedPackages } = await supabase
    .from('user_packages')
    .select(`
      *,
      packages (*)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (!profile) {
    redirect('/complete-profile')
  }

  // دالة مساعدة للحصول على نص الصف
  const getGradeText = (grade: string): string => {
    const grades: Record<string, string> = {
      first: 'الأول الثانوي',
      second: 'الثاني الثانوي',
      third: 'الثالث الثانوي'
    }
    return grades[grade] || grade
  }

  return (
<div className="dashboard-container">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">م</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">محمود الديب</h1>
                <p className="text-gray-600">التعليم التفاعلي للثانوية العامة</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <div className="text-right">
                  <p className="font-bold text-gray-800">{profile.full_name}</p>
                  <p className="text-sm text-gray-600">الصف {getGradeText(profile.grade)}</p>
                </div>
                <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {profile.full_name
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* باقي الملف بدون تغيير */}
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">

        {/* Welcome Card */}
<div className="welcome-card">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold mb-2">مرحباً بك، {profile.full_name}!</h2>
              <p className="text-blue-100">استعد لرحلة التفوق مع أفضل المدرسين</p>
              <div className="mt-4 flex items-center space-x-4">
                <div className="bg-blue-500 bg-opacity-30 px-4 py-2 rounded-lg">
                  <span className="font-bold">رصيد المحفظة: </span>
                  <span className="text-2xl font-bold">{wallet?.balance || 0} ج.م</span>
                </div>
                <Link 
                  href={`/grades/${profile.grade}`}
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors"
                >
                  عرض الباقات →
                </Link>
              </div>
            </div>
            <div className="mt-6 md:mt-0">
              <div className="text-6xl">🎓</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600">الباقات المشتراة</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                      {purchasedPackages?.length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <span className="text-2xl text-blue-600">📦</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600">المحاضرات المكتملة</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">0</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <span className="text-2xl text-green-600">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600">الساعات الدراسية</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">0</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <span className="text-2xl text-purple-600">⏱️</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchased Packages */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">اشتراكاتك النشطة</h3>
                <Link 
                  href={`/grades/${profile.grade}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  عرض الكل →
                </Link>
              </div>

              {purchasedPackages && purchasedPackages.length > 0 ? (
                <div className="space-y-4">
                  {purchasedPackages.slice(0, 3).map((up: any) => (
                    <div 
                      key={up.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold">ب</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">{up.packages.name}</h4>
                          <p className="text-sm text-gray-600">{up.packages.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">مفعلة</p>
                        <p className="text-sm text-gray-600">ينتهي في 30 يوم</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">📚</div>
                  <p className="text-gray-600 mb-4">لا توجد باقات مشتركة بعد</p>
                  <Link
                    href={`/grades/${profile.grade}`}
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                  >
                    ابدأ بالاشتراك الآن
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Grade Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4">صفك الدراسي</h3>
              <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <div className="text-5xl mb-4">🎯</div>
                <h4 className="text-2xl font-bold text-blue-800 mb-2">
                  {getGradeText(profile.grade)}
                </h4>
                <p className="text-gray-600">عام دراسي مميز بانتظارك</p>
                <Link
                  href={`/grades/${profile.grade}`}
                  className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  دخول الصف
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4">إجراءات سريعة</h3>
              <div className="space-y-3">
                <Link
                  href={`/grades/${profile.grade}`}
                  className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <span className="font-medium text-blue-700">شراء باقة جديدة</span>
                  <span className="text-blue-600">→</span>
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-gray-700">تعديل الملف الشخصي</span>
                  <span className="text-gray-600">→</span>
                </Link>
                <Link
                  href="/support"
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-gray-700">الدعم الفني</span>
                  <span className="text-gray-600">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}