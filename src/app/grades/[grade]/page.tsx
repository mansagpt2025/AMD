// app/grades/[grade]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

// مهم علشان يمنع caching الغلط
export const dynamic = 'force-dynamic'

export default async function GradePage(props: {
  params: { grade?: string } | Promise<{ grade?: string }>
}) {
  const supabase = await createClient()

  // دعم الحالتين: params عادي أو Promise
  const resolvedParams =
    typeof (props.params as any)?.then === 'function'
      ? await props.params
      : props.params

  const gradeSlug = resolvedParams?.grade

  console.log('GRADE SLUG:', gradeSlug)

  if (!gradeSlug) {
    console.error('Grade slug is missing:', resolvedParams)
    notFound()
  }

  const { data: grade, error } = await supabase
    .from('grades')
    .select('id, name, slug')
    .eq('slug', gradeSlug)
    .maybeSingle()

  if (error) {
    console.error('Supabase error:', error)
  }

  if (!grade) {
    console.error('Grade not found:', gradeSlug, error)
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
