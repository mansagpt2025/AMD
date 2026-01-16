'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    grade: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    await supabase.from('profiles').insert({
      id: data.user?.id,
      name: form.name,
      phone: form.phone,
      grade: form.grade,
    })

    router.replace('/dashboard')
  }

  return (
    <main className="p-8 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">إنشاء حساب</h1>

      <input name="email" placeholder="البريد الإلكتروني" onChange={handleChange} />
      <input name="password" type="password" placeholder="كلمة المرور" onChange={handleChange} />
      <input name="name" placeholder="الاسم" onChange={handleChange} />
      <input name="phone" placeholder="رقم الموبايل" onChange={handleChange} />
      <input name="grade" placeholder="الصف الدراسي" onChange={handleChange} />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-indigo-600 py-2 rounded-lg"
      >
        تسجيل
      </button>
    </main>
  )
}
