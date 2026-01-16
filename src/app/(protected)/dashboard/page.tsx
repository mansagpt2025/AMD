'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserSubscription } from '@/lib/subscription'
import LogoutButton from '@/components/layout/LogoutButton'

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSubscription = async () => {
      const subscription = await getUserSubscription()

      if (!subscription) {
        router.replace('/no-subscription')
        return
      }

      setLoading(false)
    }

    checkSubscription()
  }, [router])

  if (loading) {
    return <p className="p-8">Loading...</p>
  }

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Student Dashboard</h1>
      <LogoutButton />
    </main>
  )
}
