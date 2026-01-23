// app/grades/[grade]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/supabase-server'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

interface GradePageProps {
  params: {
    grade: string
  }
}

export default async function GradePage({ params }: GradePageProps) {
  const supabase = await createClient()

  const gradeSlug = params.grade

  console.log('Grade slug from URL:', gradeSlug)

  // جلب الصف من قاعدة البيانات بدون single لتفادي PGRST116
  const { data, error } = await supabase
    .from('grades')
    .select('*')
    .eq('slug', gradeSlug)
    .limit(1)

  if (error) {
    console.error('Supabase error while fetching grade:', error)
    notFound()
  }

  const grade = data?.[0]

  if (!grade) {
    console.error('Grade not found in DB for slug:', gradeSlug)
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {grade.name}
        </h1>

        <p className="text-gray-600 mb-6">
          مرحباً بك في صفحة {grade.name}
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
