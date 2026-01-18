'use server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createPlan(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  await supabase.from('plans').insert({
    name: formData.get('name'),
    duration_days: Number(formData.get('duration_days')),
  })
  redirect('/admin/plans')
}
