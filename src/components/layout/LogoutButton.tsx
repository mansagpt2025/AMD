'use client'

import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const logout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <button
      onClick={logout}
      className="bg-red-600 px-4 py-2 rounded-lg"
    >
      تسجيل الخروج
    </button>
  )
}
