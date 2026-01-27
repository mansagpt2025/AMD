// app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/supabase-server'
import type { Metadata } from 'next'
import { Bell, BookOpen, Clock, Package, TrendingUp, Award, AlertTriangle, CheckCircle } from 'lucide-react'
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

// Type Definitions
interface Package {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  lecture_count: number | null;
  duration_days: number | null;
  type: string;
}

interface UserPackage {
  id: string;
  is_active: boolean;
  purchased_at: string;
  expires_at: string | null;
  packages: Package;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  grade: string;
  section: string | null;
  email: string;
}

interface Wallet {
  id: string;
  balance: number;
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
      purchased_at,
      expires_at,
      packages (
        id,
        name,
        description,
        image_url,
        lecture_count,
        duration_days,
        type
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (packagesError) {
    console.error('Packages error:', packagesError)
  }

  // Cast the data to the correct type
  const userPackages = purchasedPackages as unknown as UserPackage[] | null

  // =========================
  // STATISTICS
  // =========================
  const { count: activePackagesCount } = await supabase
    .from('user_packages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_active', true)

  const { count: completedLecturesCount } = await supabase
    .from('user_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'completed')

  // =========================
  // NOTIFICATIONS
  // =========================
  const { data: notifications, error: notificationsError } = await supabase
    .from('notifications')
    .select('*')
    .or(`user_id.eq.${user.id},target_grade.eq.${profile.grade},target_grade.is.null`)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(5)

  if (notificationsError) {
    console.error('Notifications error:', notificationsError)
  }

  // Cast notifications
  const userNotifications = notifications as unknown as Notification[] | null

  // Helpers
  const getGradeText = (grade: string): string => {
    const grades: Record<string, string> = {
      first: 'الأول الثانوي',
      second: 'الثاني الثانوي',
      third: 'الثالث الثانوي',
    }
    return grades[grade] || grade
  }

  const getPackageTypeText = (type: string): string => {
    const types: Record<string, string> = {
      weekly: 'أسبوعي',
      monthly: 'شهري',
      term: 'ترم',
      offer: 'عرض خاص',
    }
    return types[type] || type
  }

  const getInitials = (fullName: string): string => {
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
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

          <div className="header-right">
            <div className="notifications-container">
              <button className="notification-button">
                <Bell size={24} />
                {userNotifications && userNotifications.length > 0 && (
                  <span className="notification-badge">{userNotifications.length}</span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              <div className="notifications-dropdown">
                <div className="notifications-header">
                  <h3>الإشعارات</h3>
                  <span className="unread-count">{userNotifications?.length || 0} غير مقروء</span>
                </div>
                <div className="notifications-list">
                  {userNotifications && userNotifications.length > 0 ? (
                    userNotifications.map((notification) => (
                      <div key={notification.id} className="notification-item">
                        <div className="notification-icon">
                          {notification.type === 'info' && <Info size={16} />}
                          {notification.type === 'warning' && <AlertTriangle size={16} />}
                          {notification.type === 'success' && <CheckCircle size={16} />}
                        </div>
                        <div className="notification-content">
                          <h4>{notification.title}</h4>
                          <p>{notification.message}</p>
                          <span className="notification-time">
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-notifications">
                      <Bell size={32} />
                      <p>لا توجد إشعارات جديدة</p>
                    </div>
                  )}
                </div>
                <Link href="/notifications" className="view-all-button">
                  عرض كل الإشعارات
                </Link>
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
        </div>
      </header>

      <main className="main-content">
        {/* Welcome Card */}
        <div className="welcome-card">
          <div className="welcome-content">
            <div className="welcome-text">
              <h2 className="welcome-title">
                مرحباً بك، {profile.full_name}!
              </h2>
              <p className="welcome-subtitle">
                استمر في رحلتك التعليمية وحقق أهدافك
              </p>

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
                  استكشاف الباقات →
                </Link>
              </div>
            </div>

            <div className="welcome-emoji">
              <Award size={64} />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-section">
          <h3 className="section-title">إحصائياتك</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper bg-primary-50 text-primary-600">
                <Package size={24} />
              </div>
              <div className="stat-content">
                <h4 className="stat-value">{activePackagesCount || 0}</h4>
                <p className="stat-label">الباقات النشطة</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper bg-secondary-50 text-secondary-600">
                <BookOpen size={24} />
              </div>
              <div className="stat-content">
                <h4 className="stat-value">{completedLecturesCount || 0}</h4>
                <p className="stat-label">محاضرات مكتملة</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper bg-success-500/10 text-success-500">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <h4 className="stat-value">
                  {userPackages?.length || 0}
                </h4>
                <p className="stat-label">إجمالي المشتريات</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper bg-warning-500/10 text-warning-500">
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <h4 className="stat-value">
                  {userPackages?.[0]?.expires_at 
                    ? `يوم ${new Date(userPackages[0].expires_at).getDate()}`
                    : 'لا يوجد'
                  }
                </h4>
                <p className="stat-label">ينتهي أقرب باقة</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grade Section */}
        <div className="grade-section">
          <div className="section-header">
            <h3 className="section-title">الصف الدراسي</h3>
            <Link href={`/grades/${profile.grade}`} className="view-all-link">
              عرض جميع المواد →
            </Link>
          </div>
          <div className="grade-card">
            <div className="grade-content">
              <div className="grade-info">
                <h4>الصف {getGradeText(profile.grade)}</h4>
                <p>ابدأ رحلتك التعليمية مع باقات الصف {getGradeText(profile.grade)}</p>
              </div>
              <Link 
                href={`/grades/${profile.grade}`}
                className="secondary-button"
              >
                استعراض الباقات
              </Link>
            </div>
            <div className="grade-illustration">
              <div className="books-stack">
                <div className="book book-1"></div>
                <div className="book book-2"></div>
                <div className="book book-3"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchased Packages */}
        <div className="packages-section">
          <div className="section-header">
            <h3 className="section-title">الباقات المشتركة</h3>
            {userPackages && userPackages.length > 0 && (
              <Link href="/my-packages" className="view-all-link">
                عرض الكل →
              </Link>
            )}
          </div>
          
          {userPackages && userPackages.length > 0 ? (
            <div className="packages-grid">
              {userPackages.map((userPackage) => (
                <div key={userPackage.id} className="package-card">
                  <div className="package-header">
                    <div className="package-badge">
                      {getPackageTypeText(userPackage.packages.type)}
                    </div>
                    <div className="package-status">
                      <span className={`status-indicator ${userPackage.is_active ? 'active' : 'inactive'}`}></span>
                      {userPackage.is_active ? 'نشط' : 'غير نشط'}
                    </div>
                  </div>
                  
                  <div className="package-content">
                    <h4>{userPackage.packages.name}</h4>
                    <p className="package-description">
                      {userPackage.packages.description}
                    </p>
                    
                    <div className="package-details">
                      <div className="detail-item">
                        <BookOpen size={16} />
                        <span>{userPackage.packages.lecture_count || 0} محاضرة</span>
                      </div>
                      <div className="detail-item">
                        <Clock size={16} />
                        <span>{userPackage.packages.duration_days || 0} يوم</span>
                      </div>
                    </div>
                    
                    <div className="package-footer">
                      <span className="purchase-date">
                        مشترك منذ {formatDate(userPackage.purchased_at)}
                      </span>
                      <Link
                        href={`/grades/${profile.grade}/packages/${userPackage.packages.id}`}
                        className="access-button"
                      >
                        دخول الباقة
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Package size={48} />
              <h4>لا توجد باقات مشتركة</h4>
              <p>ابدأ رحلتك التعليمية بالاشتراك في إحدى باقاتنا</p>
              <Link href={`/grades/${profile.grade}`} className="primary-button">
                استعراض الباقات
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// Helper components for icons
const Info = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
  </svg>
)