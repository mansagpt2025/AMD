'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const handleLogin = async (e: any) => {
    e.preventDefault()

    const email = e.target.email.value
    const password = e.target.password.value

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }

    router.replace('/dashboard')
  }

  return (
    <form onSubmit={handleLogin}>
      <input name="email" />
      <input name="password" type="password" />
      <button>دخول</button>
    </form>
  )
}
