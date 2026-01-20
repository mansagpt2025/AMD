'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [router])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }
      
      setUser(session.user)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>جاري التحميل...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>مرحباً بك في منصة البارع محمود الديب</h1>
          <p>منصة التعليم التفاعلي</p>
        </div>
        
        <div className="user-info">
          <span>{user?.email}</span>
          <button onClick={handleLogout} className="btn-logout">
            تسجيل الخروج
          </button>
        </div>
      </header>
      
      <main className="dashboard-content">
        <div className="welcome-card">
          <h2>🎉 تهانينا! التسجيل يعمل بنجاح</h2>
          <p>لقد سجلت دخولك بنجاح إلى منصتنا التعليمية</p>
          
          <div className="user-details">
            <h3>معلومات حسابك:</h3>
            <p><strong>البريد الإلكتروني:</strong> {user?.email}</p>
            <p><strong>معرف المستخدم:</strong> {user?.id}</p>
            <p><strong>تم الإنشاء في:</strong> {new Date(user?.created_at).toLocaleDateString('ar-EG')}</p>
          </div>
          
          <div className="dashboard-actions">
            <button className="btn btn-primary">
              استعراض الدروس
            </button>
            <button className="btn btn-secondary">
              تحديث الملف الشخصي
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}