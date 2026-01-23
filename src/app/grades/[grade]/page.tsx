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

  // جلب الصف من قاعدة البيانات
  const { data: gradeData, error } = await supabase
    .from('grades')
    .select('*')
    .eq('slug', grade)
    .single()

  if (error || !gradeData) {
    console.error('Grade not found:', grade, error)
    notFound()
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50" dir="rtl">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {gradeData.name}
        </h1>

        <p className="text-gray-600 mb-6">
          مرحباً بك في صفحة {gradeData.name}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">الباقات</h2>
            <p className="text-gray-500">
              سيتم إضافة الباقات الخاصة بهذا الصف قريباً
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">المحاضرات</h2>
            <p className="text-gray-500">
              سيتم إضافة المحاضرات الخاصة بهذا الصف قريباً
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
