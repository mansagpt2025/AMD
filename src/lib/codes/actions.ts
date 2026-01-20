'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function activateCode(codeValue: string) {
const supabase = await createSupabaseServer()

  // 1️⃣ المستخدم
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'غير مسجل الدخول' }
  }

  // 2️⃣ جلب الكود
  const { data: code, error } = await supabase
    .from('codes')
    .select('*')
    .eq('code', codeValue)
    .eq('is_used', false)
    .single()

  if (error || !code) {
    return { error: 'الكود غير صالح أو مستخدم' }
  }

  // 3️⃣ جلب الباقة
  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('id', code.target_id)
    .single()

  if (!plan) {
    return { error: 'الباقة غير موجودة' }
  }

  // 4️⃣ إنشاء الاشتراك
  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + plan.duration_days)

  const { error: subError } = await supabase.from('subscriptions').insert({
    user_id: user.id,
    plan_id: plan.id,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    is_active: true,
  })

  if (subError) {
    return { error: 'فشل تفعيل الاشتراك' }
  }

  // 5️⃣ تحديث الكود
  await supabase
    .from('codes')
    .update({
      is_used: true,
      used_by: user.id,
      used_at: new Date().toISOString(),
    })
    .eq('id', code.id)

  revalidatePath('/dashboard')

  return { success: true }
}
