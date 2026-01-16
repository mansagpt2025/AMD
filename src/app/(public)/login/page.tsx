'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    router.replace('/dashboard')
  }

  return (
    <main className="p-8 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">تسجيل الدخول</h1>

      <input
        placeholder="البريد الإلكتروني"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="كلمة المرور"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full bg-indigo-600 py-2 rounded-lg"
      >
        دخول
      </button>
    </main>
  )
}
