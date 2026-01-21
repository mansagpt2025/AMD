import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GradeHero from '../components/GradeHero'
import Sections from '../components/Sections'

interface GradePageProps {
  params: { gradeId: string }
}

export default async function GradePage({ params }: GradePageProps) {
  const { gradeId } = params
  const supabase = await createClient()
  
  // التحقق من تسجيل الدخول
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // جلب بيانات الصف
  const { data: grade, error: gradeError } = await supabase
    .from('grades')
    .select('*')
    .eq('id', gradeId)
    .single()

  if (gradeError || !grade) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">الصف غير موجود</h1>
          <a href="/dashboard" className="text-primary-600 hover:underline mt-4 inline-block">
            العودة للرئيسية
          </a>
        </div>
      </div>
    )
  }

  // جلب الباقات الخاصة بهذا الصف
  const { data: packages } = await supabase
    .from('packages')
    .select('*')
    .eq('grade_id', gradeId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // جلب الباقات التي اشتراها الطالب
  const { data: studentPurchases } = await supabase
    .from('student_purchases')
    .select('*')
    .eq('student_id', session.user.id)
    .eq('status', 'active')

  // جلد بيانات محفظة الطالب
  const { data: wallet } = await supabase
    .from('student_wallet')
    .select('*')
    .eq('student_id', session.user.id)
    .single()

  // فصل الباقات حسب النوع
  const purchasedPackages = packages?.filter((pkg: any) => 
    studentPurchases?.some((purchase: any) => purchase.package_id === pkg.id)
  ) || []

  const weeklyPackages = packages?.filter((pkg: any) => 
    pkg.type === 'weekly' && 
    !studentPurchases?.some((purchase: any) => purchase.package_id === pkg.id)
  ) || []

  const monthlyPackages = packages?.filter((pkg: any) => 
    pkg.type === 'monthly' && 
    !studentPurchases?.some((purchase: any) => purchase.package_id === pkg.id)
  ) || []

  const termPackages = packages?.filter((pkg: any) => 
    pkg.type === 'term' && 
    !studentPurchases?.some((purchase: any) => purchase.package_id === pkg.id)
  ) || []

  const offerPackages = packages?.filter((pkg: any) => 
    pkg.type === 'offer' && 
    !studentPurchases?.some((purchase: any) => purchase.package_id === pkg.id)
  ) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <GradeHero 
        gradeName={grade.name}
        teacherName="محمود الديب"
        motivationalText="معاك خطوة خطوة لتحقيق أحلامك في الثانوية العامة"
      />
      
      <div className="container mx-auto px-4 py-8">
        <Sections 
          purchasedPackages={purchasedPackages}
          weeklyPackages={weeklyPackages}
          monthlyPackages={monthlyPackages}
          termPackages={termPackages}
          offerPackages={offerPackages}
          walletBalance={wallet?.balance || 0}
          studentId={session.user.id}
          gradeId={gradeId}
        />
      </div>
    </div>
  )
}