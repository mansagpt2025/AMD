// app/grades/[grade]/page.tsx - الملف المعدل
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/supabase-server'
import PackageCard from '@/components/grades/PackageCard'
import type { Metadata } from 'next'

interface GradePageProps {
  params: {
    grade: string
  }
}

// إضافة Viewport بشكل صحيح
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

// إضافة Metadata
export const metadata: Metadata = {
  title: 'باقات الصفوف | محمود الديب',
  description: 'اختر الباقة المناسبة لصفك الدراسي',
}

export default async function GradePage({ params }: GradePageProps) {
  const supabase = await createClient()
  
  // استخدام getUser بدلاً من getSession
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // التحقق من أن المستخدم في نفس الصف
  const { data: profile } = await supabase
    .from('profiles')
    .select('grade, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/complete-profile')
  }

  // إذا حاول الدخول لصف غير صفه، توجيهه لصفه
  if (profile.grade !== params.grade) {
    redirect(`/grades/${profile.grade}`)
  }

  // جلب جميع الباقات للصف
  const { data: allPackages } = await supabase
    .from('packages')
    .select('*')
    .eq('grade', params.grade)
    .eq('is_active', true)
    .order('price', { ascending: true })

  // جلب الباقات المشتركة
  const { data: purchasedPackages } = await supabase
    .from('user_packages')
    .select('package_id')
    .eq('user_id', user.id)
    .eq('is_active', true)

  const purchasedPackageIds = purchasedPackages?.map(p => p.package_id) || []

  // تصنيف الباقات
  const purchased = allPackages?.filter(p => purchasedPackageIds.includes(p.id)) || []
  const regular = allPackages?.filter(p => p.type === 'weekly' && !purchasedPackageIds.includes(p.id)) || []
  const offers = allPackages?.filter(p => p.type !== 'weekly' && !purchasedPackageIds.includes(p.id)) || []

  // جلب رصيد المحفظة
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  const getGradeText = (grade: string): string => {
    const grades: Record<string, string> = {
      'first': 'الأول الثانوي',
      'second': 'الثاني الثانوي',
      'third': 'الثالث الثانوي'
    }
    return grades[grade] || grade
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                باقات {getGradeText(params.grade)}
              </h1>
              <p className="text-gray-600 mt-2">اختر الباقة المناسبة لك وابدأ رحلة التفوق</p>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <span>←</span>
              <span>العودة للرئيسية</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl mb-6">
            <span className="text-4xl">🌟</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            الأستاذ/ محمود الديب
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            &quot;التفوق ليس صدفة، بل نتيجة التخطيط الجاد والعمل الدؤوب&quot;
          </p>
        </div>

        {/* Wallet Balance */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-800">رصيد محفظتك</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {wallet?.balance || 0} ج.م
              </p>
            </div>
            <div className="p-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        {/* Purchased Packages */}
        {purchased.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">اشتراكاتك النشطة</h2>
              <div className="h-1 flex-1 max-w-md mx-4 bg-gradient-to-r from-transparent via-green-300 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchased.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isPurchased={true}
                  walletBalance={wallet?.balance || 0}
                />
              ))}
            </div>
          </section>
        )}

        {/* Regular Packages */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">الباقات الأسبوعية</h2>
            <div className="h-1 flex-1 max-w-md mx-4 bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regular.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                isPurchased={false}
                walletBalance={wallet?.balance || 0}
              />
            ))}
          </div>
        </section>

        {/* Offers */}
        {offers.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">عروض خاصة</h2>
              <div className="h-1 flex-1 max-w-md mx-4 bg-gradient-to-r from-transparent via-yellow-300 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isPurchased={false}
                  walletBalance={wallet?.balance || 0}
                  isOffer={true}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}