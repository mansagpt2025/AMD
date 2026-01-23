// app/grades/[grade]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

interface PageProps {
  params: {
    grade: string
  }
}

export default async function GradePage({ params }: PageProps) {
  const supabase = await createClient()

  const gradeSlug = params.grade

  console.log('GRADE SLUG:', gradeSlug)

  if (!gradeSlug) {
    console.error('Grade slug is missing')
    notFound()
  }

  const { data: grade, error } = await supabase
    .from('grades')
    .select('*')
    .eq('slug', gradeSlug)
    .maybeSingle()

  if (error) {
    console.error('Supabase error:', error)
  }

  if (!grade) {
    console.error('Grade not found:', gradeSlug)
    notFound()
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        {grade.name}
      </h1>

      <p className="text-gray-600">
        Grade Slug: {grade.slug}
      </p>
    </div>
  )
}
