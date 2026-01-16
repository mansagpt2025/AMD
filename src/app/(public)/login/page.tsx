'use client'

import { supabase } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) return alert(error.message)

    router.push('/dashboard')
  }

  return (
    <main className="p-8 space-y-4">
      <h1 className="text-xl font-bold">تسجيل الدخول</h1>
      <button onClick={handleLogin}>دخول</button>
    </main>
  )
}
