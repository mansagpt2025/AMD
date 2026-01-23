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
  const grade = params.grade

  console.log('GRADE PARAM:', grade)

  if (!grade) {
    notFound()
  }

  const { data: gradeData, error } = await supabase
    .from('grades')
    .select('*')
    .eq('slug', grade)
    .maybeSingle() // ✅ مهم جداً

  if (error) {
    console.error('Supabase error:', error)
    notFound()
  }

  if (!gradeData) {
    console.error('Grade not found in DB:', grade)
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
      </div>
    </div>
  )
}
