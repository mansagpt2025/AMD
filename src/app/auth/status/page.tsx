// app/auth/status/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/supabase-client'
import { useRouter } from 'next/navigation'

export default function AuthStatusPage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setLoading(false)
      
      if (session) {
        console.log('✅ جلسة نشطة موجودة:', session.user.email)
        
        // الانتظار ثم التوجيه
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        console.log('❌ لا توجد جلسة نشطة')
      }
    }

    checkSession()

    // الاستماع لتغييرات المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 حدث تغيير في المصادقة:', event)
        setSession(session)
        
        if (event === 'SIGNED_IN' && session) {
          setTimeout(() => {
            router.push('/dashboard')
          }, 1000)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحقق من حالة المصادقة...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">حالة المصادقة</h2>
        
        {session ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600">✓</span>
                </div>
                <div>
                  <h3 className="font-bold text-green-800">مسجل دخول</h3>
                  <p className="text-green-600 text-sm">{session.user.email}</p>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-gray-600">سيتم توجيهك إلى الداشبورد خلال ثانيتين...</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                الذهاب إلى الداشبورد الآن
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-red-600">✗</span>
                </div>
                <div>
                  <h3 className="font-bold text-red-800">غير مسجل دخول</h3>
                  <p className="text-red-600 text-sm">لا توجد جلسة نشطة</p>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <button
                onClick={() => router.push('/login')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
    اذهب إلى تسجيل الدخول
  </button>
            </div>
          </div>
        )}
        
        <div className="mt-8 pt-6 border-t">
          <h4 className="font-bold text-gray-700 mb-3">تفاصيل الجلسة:</h4>
          <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}