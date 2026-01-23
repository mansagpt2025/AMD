// app/api/redeem-code/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/supabase-server'

export async function POST(req: Request) {
  try {
    const { code, userId } = await req.json()

    if (!code || !userId) {
      return NextResponse.json(
        { error: 'بيانات غير كاملة' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: redeemCode, error } = await supabase
      .from('redeem_codes')
      .select('*')
      .eq('code', code)
      .eq('is_used', false)
      .single()

    if (error || !redeemCode) {
      return NextResponse.json(
        { error: 'الكود غير صحيح أو مستخدم من قبل' },
        { status: 400 }
      )
    }

    // تحديث الكود كمستخدم
    await supabase
      .from('redeem_codes')
      .update({
        is_used: true,
        used_by: userId,
        used_at: new Date().toISOString()
      })
      .eq('id', redeemCode.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'حدث خطأ في السيرفر' },
      { status: 500 }
    )
  }
}
