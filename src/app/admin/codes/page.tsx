import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('codes').select('*')

  return (
    <ul>
      {data?.map(c => (
        <li key={c.id}>{c.code} - {c.used ? 'USED' : 'NEW'}</li>
      ))}
    </ul>
  )
}
