// app/grades/[grade]/page.tsx

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/supabase-server'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'الصف الدراسي',
  description: 'محتوى الصف الدراسي',
}

interface GradePageProps {
  params: {
    grade: string
  }
}

export default async function GradePage({ params }: GradePageProps) {
  const supabase = await createClient()
  const { grade } = params

  let gradeData: any = null

  try {
    const { data, error } = await supabase
      .from('grades') // ⚠️ لازم الجدول ده يكون موجود
      .select('*')
      .eq('slug', grade)
      .single()

    if (error) {
      console.error('Supabase error fetching grade:', error)
    } else {
      gradeData = data
    }
  } catch (err) {
    console.error('Unexpected error fetching grade:', err)
  }

  // لو مفيش جدول أو مفيش صف → اعرض صفحة واضحة بدل بيضا
  if (!gradeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="bg-white p-8 rounded-xl shadow max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            الصف غير موجود
          </h1>
          <p className="text-gray-600 mb-4">
            لم يتم العثور على هذا الصف في قاعدة البيانات.
          </p>
          <p className="text-sm text-gray-400">
            تأكد من إنشاء جدول <code>grades</code> وإضافة البيانات الصحيحة.
          </p>
        </div>
      </div>
    )
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
