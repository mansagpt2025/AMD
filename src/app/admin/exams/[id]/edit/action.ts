'use server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePlan(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  await supabase
    .from('plans')
    .update({
      name: formData.get('name'),
      duration_days: Number(formData.get('duration_days')),
    })
    .eq('id', formData.get('id'))
  redirect('/admin/plans')
}
