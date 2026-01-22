// app/dashboard/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/supabase-server'

// Temporary components - سنقوم بإنشائها لاحقاً
import DashboardWelcome from '@/components/dashboard/DashboardWelcome'
import StatsCards from '@/components/dashboard/StatsCards'
import NotificationsDropdown from '@/components/dashboard/NotificationsDropdown'
import GradeCard from '@/components/dashboard/GradeCard'
import PurchasedPackages from '@/components/dashboard/PurchasedPackages'

// تعريف الأنواع المؤقتة
type NotificationType = {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

type PackageType = {
  id: string
  name: string
  description: string
  image_url: string
  lecture_count: number
  type: string
}

type UserPackageType = {
  id: string
  package_id: string
  packages: PackageType
}

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // جلب بيانات المستخدم
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  // جلب رصيد المحفظة
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', session.user.id)
    .single()

  // جلب الإشعارات (مؤقت - بيانات وهمية)
  const notifications: NotificationType[] = [
    {
      id: '1',
      title: 'مرحباً بك!',
      message: 'نتمنى لك عاماً دراسياً موفقاً',
      type: 'info',
      is_read: false,
      created_at: new Date().toISOString()
    }
  ]

  // جلب الباقات المشتركة
  const { data: purchasedPackages } = await supabase
    .from('user_packages')
    .select(`
      *,
      packages (*)
    `)
    .eq('user_id', session.user.id)
    .eq('is_active', true)

  if (!profile) {
    redirect('/complete-profile')
  }

  // دالة مساعدة للحصول على نص الصف
  const getGradeText = (grade: string): string => {
    const grades: Record<string, string> = {
      'first': 'الأول الثانوي',
      'second': 'الثاني الثانوي',
      'third': 'الثالث الثانوي'
    }
    return grades[grade] || grade
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">م</span>
              </div>
              <h1 className="text-xl font-bold text-gray-800">محمود الديب</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationsDropdown notifications={notifications} />
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="font-medium text-gray-800">{profile.full_name}</p>
                  <p className="text-sm text-gray-600">الصف {getGradeText(profile.grade)}</p>
                </div>
                <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {profile.full_name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <DashboardWelcome 
              name={profile.full_name}
              grade={profile.grade}
              walletBalance={wallet?.balance || 0}
            />
            
            <StatsCards 
              purchasedCount={purchasedPackages?.length || 0}
              completionRate={0}
              studyHours={0}
            />

            <PurchasedPackages packages={purchasedPackages as UserPackageType[] || []} />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <GradeCard grade={profile.grade} />
            
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4">إحصائيات سريعة</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">المحاضرات المكتملة</span>
                  <span className="font-bold text-blue-600">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">الامتحانات المقدمة</span>
                  <span className="font-bold text-blue-600">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">الساعات الدراسية</span>
                  <span className="font-bold text-blue-600">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}