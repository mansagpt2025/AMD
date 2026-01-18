import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('plans').select('*')

  return (
    <>
      <Link href="/admin/plans/new">➕ New Plan</Link>
      <ul>
        {data?.map(p => (
          <li key={p.id}>
            {p.name} ({p.duration_days} days)
            <Link href={`/admin/plans/${p.id}/edit`}> ✏️</Link>
          </li>
        ))}
      </ul>
    </>
  )
}
