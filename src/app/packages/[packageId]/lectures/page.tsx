import { createSupabaseServer } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function PackageLecturesPage({ params }: any) {
  const supabase = createSupabaseServer()

  const { data: lectures } = await supabase
    .from('package_lectures')
    .select(`
      order_index,
      lectures (
        id,
        title,
        description
      )
    `)
    .eq('package_id', params.packageId)
    .order('order_index')

  return (
    <div className="space-y-4">
      {lectures?.map((row) => (
        <Link
          key={row.lectures.id}
          href={`/lectures/${row.lectures.id}`}
          className="block border p-4 rounded"
        >
          <h3>{row.lectures.title}</h3>
          <p>{row.lectures.description}</p>
        </Link>
      ))}
    </div>
  )
}
