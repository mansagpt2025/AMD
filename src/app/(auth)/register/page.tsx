'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: any) => {
    e.preventDefault()
    setLoading(true)

    const form = e.target

    const email = form.email.value
    const password = form.password.value

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    const user = data.user
    if (!user) return

    // إنشاء profile
    await supabase.from('profiles').insert({
      id: user.id,
      full_name: form.full_name.value,
      grade: form.grade.value,
      section: form.section.value,
      student_phone: form.student_phone.value,
      parent_phone: form.parent_phone.value,
      governorate: form.governorate.value,
      city: form.city.value,
      school: form.school.value,
    })

    // إنشاء wallet
    await supabase.from('wallets').insert({
      user_id: user.id,
      balance: 0,
    })

    router.replace('/dashboard')
  }

  return (
    <form onSubmit={handleRegister}>
      {/* inputs */}
      <button disabled={loading}>إنشاء حساب</button>
    </form>
  )
}
