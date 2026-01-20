import { createSupabaseServer } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function PackageLecturesPage({ params }: any) {
const supabase = await createSupabaseServer()

  const { data, error } = await supabase
    .from('package_lectures')
    .select(`
      order_index,
      lecture:lectures (
        id,
        title,
        description
      )
    `)
    .eq('package_id', params.packageId)
    .order('order_index')

  if (error) {
    console.error(error)
    return <div>حصل خطأ أثناء تحميل المحاضرات</div>
  }

  return (
    <div className="space-y-4">
      {data?.map((row: any) => {
        const lecture = row.lecture?.[0]
        if (!lecture) return null

        return (
          <Link
            key={lecture.id}
            href={`/lectures/${lecture.id}`}
            className="block border p-4 rounded hover:bg-gray-50 transition"
          >
            <h3 className="text-lg font-bold">{lecture.title}</h3>
            <p className="text-sm text-gray-600">{lecture.description}</p>
          </Link>
        )
      })}
    </div>
  )
}
