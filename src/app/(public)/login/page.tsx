'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) alert(error.message)
    else router.replace('/dashboard')
  }

  return (
    <main className="p-8 max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-bold">تسجيل الدخول</h1>

      <input
        placeholder="Email"
        onChange={e => setEmail(e.target.value)}
        className="w-full p-2 bg-gray-800 rounded"
      />

      <input
        type="password"
        placeholder="Password"
        onChange={e => setPassword(e.target.value)}
        className="w-full p-2 bg-gray-800 rounded"
      />

      <button onClick={login} className="bg-indigo-600 w-full py-2 rounded">
        دخول
      </button>
    </main>
  )
}
