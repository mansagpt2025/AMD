import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GradeHero from '../components/GradeHero'
import Sections from '../components/Sections'

interface PageProps {
  params: { gradeId: string }
}

export default async function GradePage({ params }: PageProps) {
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
    .eq('id', parseInt(gradeId))
    .single()

  if (gradeError || !grade) {
    console.error('Error fetching grade:', gradeError)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">الصف غير موجود</h1>
          <p className="text-gray-600 mt-2">قد يكون الصف غير مضاف بعد</p>
          <a href="/dashboard" className="text-primary-600 hover:underline mt-4 inline-block">
            العودة للرئيسية
          </a>
        </div>
      </div>
    )
  }

  // جلب بيانات الطالب
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  // جلب الباقات الخاصة بهذا الصف
  const { data: packages } = await supabase
    .from('packages')
    .select('*')
    .eq('grade_id', parseInt(gradeId))
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // جلب الباقات التي اشتراها الطالب
  const { data: studentPurchases } = await supabase
    .from('student_purchases')
    .select('package_id')
    .eq('student_id', session.user.id)
    .eq('status', 'active')

  // جلب بيانات المحفظة
  const { data: wallet } = await supabase
    .from('student_wallet')
    .select('balance')
    .eq('student_id', session.user.id)
    .single()

  // فصل الباقات حسب النوع
  const purchasedPackages = packages?.filter(pkg => 
    studentPurchases?.some(purchase => purchase.package_id === pkg.id)
  ) || []

  const weeklyPackages = packages?.filter(pkg => 
    pkg.type === 'weekly' && 
    !studentPurchases?.some(purchase => purchase.package_id === pkg.id)
  ) || []

  const monthlyPackages = packages?.filter(pkg => 
    pkg.type === 'monthly' && 
    !studentPurchases?.some(purchase => purchase.package_id === pkg.id)
  ) || []

  const termPackages = packages?.filter(pkg => 
    pkg.type === 'term' && 
    !studentPurchases?.some(purchase => purchase.package_id === pkg.id)
  ) || []

  const offerPackages = packages?.filter(pkg => 
    pkg.type === 'offer' && 
    !studentPurchases?.some(purchase => purchase.package_id === pkg.id)
  ) || []

  // إضافة بيانات تجريبية إذا لم توجد بيانات حقيقية
  if (!packages || packages.length === 0) {
    const demoPackages = [
      {
        id: '1',
        name: 'باقة الفيزياء - الفصل الأول',
        description: 'شامل جميع محاضرات الفيزياء للفصل الأول',
        price: 300,
        image_url: '',
        type: 'term',
        lectures_count: 20,
        is_active: true
      },
      {
        id: '2',
        name: 'باقة الكيمياء - التفاعلات',
        description: 'شرح وافي لتفاعلات الكيمياء العضوية',
        price: 250,
        image_url: '',
        type: 'monthly',
        lectures_count: 15,
        is_active: true
      },
      {
        id: '3',
        name: 'باقة الأحياء - الوراثة',
        description: 'أساسيات علم الوراثة والأحياء الجزيئية',
        price: 200,
        image_url: '',
        type: 'weekly',
        lectures_count: 10,
        is_active: true
      }
    ]

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <GradeHero 
          gradeName={grade.name}
          teacherName="البارع محمود الديب"
          motivationalText="ابدأ رحلتك التعليمية نحو التفوق والتميز"
        />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-2xl">
            <h2 className="text-xl font-bold text-yellow-800 mb-2">⚠️ بيانات تجريبية</h2>
            <p className="text-yellow-700">
              لا توجد باقات حقيقية بعد. هذه باقات تجريبية لعرض التصميم.
            </p>
          </div>
          
          <Sections 
            purchasedPackages={[]}
            weeklyPackages={demoPackages.filter(p => p.type === 'weekly')}
            monthlyPackages={demoPackages.filter(p => p.type === 'monthly')}
            termPackages={demoPackages.filter(p => p.type === 'term')}
            offerPackages={[]}
            walletBalance={wallet?.balance || 0}
            studentId={session.user.id}
            gradeId={gradeId}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <GradeHero 
        gradeName={grade.name}
        teacherName="البارع محمود الديب"
        motivationalText="ابدأ رحلتك التعليمية نحو التفوق والتميز"
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