import { createSupabaseServer } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function PackageLecturesPage({ params }: any) {
  const supabase = createSupabaseServer()

  const { data } = await supabase
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

  return (
    <div className="space-y-4">
      {data?.map((row) => (
        <Link
          key={row.lecture.id}
          href={`/lectures/${row.lecture.id}`}
          className="block border p-4 rounded"
        >
          <h3>{row.lecture.title}</h3>
          <p>{row.lecture.description}</p>
        </Link>
      ))}
    </div>
  )
}
