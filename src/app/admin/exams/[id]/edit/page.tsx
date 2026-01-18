import { createSupabaseServerClient } from '@/lib/supabase/server'
import { updatePlan } from './action'

export default async function Page({ params }: any) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('plans').select('*').eq('id', params.id).single()

  return (
    <form action={updatePlan}>
      <input type="hidden" name="id" value={data.id} />
      <input name="name" defaultValue={data.name} />
      <input name="duration_days" defaultValue={data.duration_days} />
      <button>Update</button>
    </form>
  )
}
