import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('courses').select('*')

  return (
    <ul>
      {data?.map(c => (
        <li key={c.id}>{c.title}</li>
      ))}
    </ul>
  )
}
