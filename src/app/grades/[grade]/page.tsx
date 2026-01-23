// app/grades/[grade]/page.tsx

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/supabase-server'

interface GradePageProps {
  params: {
    grade: string
  }
}

export default async function GradePage({ params }: GradePageProps) {
  const supabase = await createClient()
  const { grade } = params

  const { data: gradeData, error } = await supabase
    .from('grades')
    .select('*')
    .eq('slug', grade)
    .maybeSingle()

  if (error) {
    console.error('Supabase error:', error)
  }

  if (!gradeData) {
    notFound()
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50" dir="rtl">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {gradeData.name}
          </h1>
          <p className="text-lg text-gray-600">
            الأستاذ محمود الديب — رحلة التفوق تبدأ من هنا 🚀
          </p>
        </div>

        {/* Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* اشتراكاتك */}
          <div className="border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-3 text-blue-600">
              اشتراكاتك
            </h2>
            <p className="text-gray-500">
              سيتم عرض الباقات التي تم شراؤها هنا
            </p>
          </div>

          {/* الباقات الأسبوعية */}
          <div className="border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-3 text-green-600">
              الباقات الأسبوعية
            </h2>
            <p className="text-gray-500">
              سيتم عرض الباقات الأسبوعية المتاحة هنا
            </p>
          </div>

          {/* العروض */}
          <div className="border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-3 text-yellow-600">
              العروض
            </h2>
            <p className="text-gray-500">
              سيتم عرض العروض الشهرية والترم هنا
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
