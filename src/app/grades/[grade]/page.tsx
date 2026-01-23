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

  // تشخيص: هات كل الصفوف
  const { data: allGrades, error: allError } = await supabase
    .from('grades')
    .select('*')

  // هات الصف المطلوب
  const { data: gradeData, error: gradeError } = await supabase
    .from('grades')
    .select('*')
    .eq('slug', grade)
    .maybeSingle()

  if (allError) {
    return (
      <pre dir="ltr" className="p-8">
        ERROR ALL GRADES:
        {JSON.stringify(allError, null, 2)}
      </pre>
    )
  }

  if (!gradeData) {
    return (
      <pre dir="ltr" className="p-8">
        PARAM: {grade}
        ALL GRADES:
        {JSON.stringify(allGrades, null, 2)}
        GRADE ERROR:
        {JSON.stringify(gradeError, null, 2)}
      </pre>
    )
  }

  // صفحة حقيقية
  return (
    <div className="min-h-screen p-8 bg-gray-50" dir="rtl">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {gradeData.name}
        </h1>

        <p className="text-gray-600 mb-6">
          مرحباً بك في صفحة {gradeData.name}
        </p>

        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Slug</h2>
          <p className="text-gray-500">{gradeData.slug}</p>
        </div>
      </div>
    </div>
  )
}
