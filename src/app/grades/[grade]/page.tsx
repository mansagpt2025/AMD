// src/app/grades/[grade]/page.tsx

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/sf-client'

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

// ✅ Helper صحيح للـ timeout
async function withTimeout<T>(fn: () => Promise<T>, ms = 10000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Supabase request timeout'))
    }, ms)

    fn()
      .then((res) => {
        clearTimeout(timer)
        resolve(res)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

export default async function GradePage({ params }: GradePageProps) {
  const supabase = createClient()

  console.log('Grade Slug:', params.grade)

  // ===============================
  // جلب بيانات الصف
  // ===============================
  const gradeRes = await withTimeout(() =>
    supabase
      .from('grades')
      .select('*')
      .eq('slug', params.grade)
      .maybeSingle()
  )

  if (gradeRes.error) {
    console.error('Grade error:', gradeRes.error)
    notFound()
  }

  if (!gradeRes.data) {
    console.error('Grade not found for slug:', params.grade)
    notFound()
  }

  const grade = gradeRes.data

  // ===============================
  // جلب الباقات
  // ===============================
  const packagesRes = await withTimeout(() =>
    supabase
      .from('packages')
      .select('*')
      .eq('grade', params.grade)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
  )

  if (packagesRes.error) {
    console.error('Packages error:', packagesRes.error)
    throw new Error('Failed to load packages')
  }

  const packages = packagesRes.data || []

  // ===============================
  // UI
  // ===============================
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        الصف: {grade.name}
      </h1>

      {packages.length === 0 ? (
        <p className="text-gray-500">
          لا توجد باقات متاحة لهذا الصف حالياً
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="border rounded-lg p-4 shadow"
            >
              <h2 className="font-bold text-lg mb-2">
                {pkg.name}
              </h2>

              <p className="text-sm text-gray-600 mb-2">
                {pkg.description}
              </p>

              <p className="font-semibold">
                السعر: {pkg.price} جنيه
              </p>

              <p className="text-xs text-gray-500 mt-1">
                النوع: {pkg.type}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
