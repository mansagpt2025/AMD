'use client'

import { useState } from 'react'
import { activateCode } from '@/lib/codes/actions'
import { useRouter } from 'next/navigation'

export default function ActivateCodePage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleActivate = async () => {
    setLoading(true)

    const res = await activateCode(code)

    if (res?.error) {
      alert(res.error)
      setLoading(false)
      return
    }

    router.replace('/dashboard')
  }

  return (
    <main className="p-8 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">تفعيل كود الاشتراك</h1>

      <input
        placeholder="ادخل الكود"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full p-2 rounded bg-gray-800"
      />

      <button
        onClick={handleActivate}
        disabled={loading}
        className="w-full bg-indigo-600 py-2 rounded-lg"
      >
        تفعيل
      </button>
    </main>
  )
}
