// app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/supabase-server'
import type { Metadata } from 'next'
import './dashboard.css'

// Viewport
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

// Metadata
export const metadata: Metadata = {
  title: 'لوحة التحكم | محمود الديب',
  description: 'لوحة تحكم الطالب',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // =========================
  // PROFILE (SAFE)
  // =========================
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('Profile error:', profileError)
  }

  if (!profile) {
    redirect('/complete-profile')
  }

  // =========================
  // WALLET (SAFE)
  // =========================
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .maybeSingle()

  if (walletError) {
    console.error('Wallet error:', walletError)
  }

  // =========================
  // PURCHASED PACKAGES (SAFE)
  // =========================
  const { data: purchasedPackages, error: packagesError } = await supabase
    .from('user_packages')
    .select(`
      id,
      is_active,
      packages (
        id,
        name,
        description
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (packagesError) {
    console.error('Packages error:', packagesError)
  }

  // Helpers
  const getGradeText = (grade: string): string => {
    const grades: Record<string, string> = {
      first: 'الأول الثانوي',
      second: 'الثاني الثانوي',
      third: 'الثالث الثانوي',
    }
    return grades[grade] || grade
  }

  const getInitials = (fullName: string): string => {
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-container">
              <span className="logo-text">م</span>
            </div>
            <div className="header-text">
              <h1 className="platform-name">محمود الديب</h1>
              <p className="platform-description">
                التعليم التفاعلي للثانوية العامة
              </p>
            </div>
          </div>

          <div className="user-profile-card">
            <div className="user-info">
              <p className="user-name">{profile.full_name}</p>
              <p className="user-grade">
                الصف {getGradeText(profile.grade)}
              </p>
            </div>
            <div className="user-avatar">
              <span>{getInitials(profile.full_name)}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="welcome-card">
          <div className="welcome-content">
            <div className="welcome-text">
              <h2 className="welcome-title">
                مرحباً بك، {profile.full_name}!
              </h2>

              <div className="welcome-actions">
                <div className="wallet-balance">
                  <span className="balance-label">رصيد المحفظة:</span>
                  <span className="balance-amount">
                    {wallet?.balance ?? 0} ج.م
                  </span>
                </div>

                <Link
                  href={`/grades/${profile.grade}`}
                  className="primary-button"
                >
                  عرض الباقات →
                </Link>
              </div>
            </div>

            <div className="welcome-emoji">🎓</div>
          </div>
        </div>
      </main>
    </div>
  )
}
