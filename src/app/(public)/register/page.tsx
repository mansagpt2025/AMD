'use client'

import { supabase } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    grade: '',
  })

  const handleSubmit = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (error) return alert(error.message)

    await supabase.from('profiles').insert({
      id: data.user?.id,
      name: form.name,
      phone: form.phone,
      grade: form.grade,
    })

    router.push('/dashboard')
  }

  return (
    <main className="p-8 space-y-4">
      <h1 className="text-xl font-bold">إنشاء حساب</h1>
      {/* inputs */}
      <button onClick={handleSubmit}>تسجيل</button>
    </main>
  )
}
