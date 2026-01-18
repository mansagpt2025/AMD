import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('profiles').select('*')

  return (
    <ul>
      {data?.map(u => (
        <li key={u.id}>{u.id} | Admin: {String(u.is_admin)}</li>
      ))}
    </ul>
  )
}
