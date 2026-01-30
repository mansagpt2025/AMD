import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/supabase-server'
import type { Metadata } from 'next'
import { Bell, BookOpen, Clock, Package, TrendingUp, Award, PlayCircle, Sparkles, Zap } from 'lucide-react'
import './dashboard.css'
import Image from 'next/image';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'لوحة التحكم | محمود الديب',
  description: 'لوحة تحكم الطالب',
}

interface PackageData {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  lecture_count: number | null;
  duration_days: number | null;
  type: string;
  grade: string;
}

interface UserPackage {
  id: string;
  user_id: string;
  package_id: string;
  is_active: boolean;
  purchased_at: string;
  expires_at: string | null;
  source: string | null;
  packages: PackageData;
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

  // PROFILE
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

  // WALLET
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .maybeSingle()

  if (walletError) {
    console.error('Wallet error:', walletError)
  }

  // PURCHASED PACKAGES مع الصور
  let userPackages: UserPackage[] | null = null
  
  try {
    const { data: purchasedPackages, error: packagesError } = await supabase
      .from('user_packages')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (packagesError) {
      console.error('Packages error:', packagesError)
    }

    if (purchasedPackages && purchasedPackages.length > 0) {
      const packageIds = purchasedPackages.map(p => p.package_id)
      const { data: packagesData, error: packagesDataError } = await supabase
        .from('packages')
        .select('id, name, description, image_url, lecture_count, duration_days, type, grade')
        .in('id', packageIds)

      if (packagesDataError) {
        console.error('Packages data error:', packagesDataError)
      }

      userPackages = purchasedPackages.map(up => {
        const packageDetails = packagesData?.find(p => p.id === up.package_id)
        return {
          ...up,
          packages: packageDetails
        } as UserPackage
      })
    }
  } catch (error) {
    console.error('Error fetching packages:', error)
  }

  // STATISTICS
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

  // NOTIFICATIONS
  let userNotifications: Notification[] | null = null
  
  try {
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${user.id},and(target_grade.eq.${profile.grade},user_id.is.null)`)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(5)

    if (notificationsError) {
      console.error('Notifications error:', notificationsError)
    }

    userNotifications = notifications as unknown as Notification[] | null
  } catch (error) {
    console.error('Error fetching notifications:', error)
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

  const calculateDaysRemaining = (expiryDate: string | null): string => {
    if (!expiryDate) return 'غير محدود'
    
    const now = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'منتهي'
    if (diffDays === 0) return 'ينتهي اليوم'
    if (diffDays === 1) return 'يوم واحد'
    if (diffDays <= 7) return `${diffDays} أيام`
    return `${diffDays} يوم`
  }

  return (
    <div className="dashboard-container">
      {/* Animated Background Waves */}
      <div className="animated-background">
        <div className="wave wave-1"></div>
        <div className="wave wave-2"></div>
        <div className="wave wave-3"></div>
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-container">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={40}
                height={40}
                priority
                className="logo-image"
              />
            </div>
            <div className="header-text">
              <h1 className="platform-name">محمود الديب</h1>
              <p className="platform-description">منصة التعليم التفاعلي</p>
            </div>
          </div>

          <div className="header-right">
            <Link 
              href="/notifications" 
              className="notification-link"
              aria-label="الإشعارات"
            >
              <Bell size={20} strokeWidth={2.5} />
              {userNotifications && userNotifications.length > 0 && (
                <span className="notification-badge">{userNotifications.length}</span>
              )}
            </Link>
            <div className="user-profile-card">
              <div className="user-info">
                <p className="user-name">{profile.full_name}</p>
                <p className="user-grade">الصف {getGradeText(profile.grade)}</p>
              </div>
              <div className="user-avatar">
                <span>{getInitials(profile.full_name)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Welcome Card - Light Design */}
        <div className="welcome-card">
          <div className="welcome-pattern"></div>
          <div className="welcome-content">
            <div className="welcome-text">
              <div className="welcome-badge">
                <Sparkles size={16} />
                <span>مرحباً بعودتك</span>
              </div>
              <h2 className="welcome-title">
                {profile.full_name} ! 👋
              </h2>
              <p className="welcome-subtitle">
                استمر في رحلتك التعليمية وحقق أهدافك مع باقاتنا المميزة
              </p>

              <div className="welcome-actions">
                <div className="wallet-balance">
                  <div className="wallet-icon">
                    <Zap size={20} />
                  </div>
                  <div className="wallet-info">
                    <span className="balance-label">رصيد المحفظة</span>
                    <span className="balance-amount">
                      {wallet?.balance ?? 0} ج.م
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="welcome-illustration">
              <div className="floating-card card-1">
                <PlayCircle size={24} />
                <span>مشاهدة المحاضرات</span>
              </div>
              <div className="floating-card card-2">
                <Award size={24} />
                <span>شهادات الإتمام</span>
              </div>
              <div className="main-illustration">
                <Image 
                  src="/dashboard-illustration.svg" 
                  alt="Learning" 
                  width={300} 
                  height={250}
                  className="illustration-image"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-section">
          <h3 className="section-title">
            <TrendingUp size={20} />
            إحصائياتك
          </h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper blue">
                <Package size={24} />
              </div>
              <div className="stat-content">
                <h4 className="stat-value">{activePackagesCount || 0}</h4>
                <p className="stat-label">الباقات النشطة</p>
              </div>
              <div className="stat-wave"></div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper cyan">
                <BookOpen size={24} />
              </div>
              <div className="stat-content">
                <h4 className="stat-value">{completedLecturesCount || 0}</h4>
                <p className="stat-label">محاضرات مكتملة</p>
              </div>
              <div className="stat-wave"></div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper purple">
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <h4 className="stat-value">{userPackages?.length || 0}</h4>
                <p className="stat-label">إجمالي المشتريات</p>
              </div>
              <div className="stat-wave"></div>
            </div>
          </div>
        </div>

        {/* Grade Section */}
        <div className="grade-section">
          <div className="grade-card">
            <div className="grade-content">
              <div className="grade-badge">الصف الدراسي</div>
              <div className="grade-info">
                <h4>{getGradeText(profile.grade)}</h4>
                <p>ابدأ رحلتك التعليمية مع باقات مميزة مصممة خصيصاً لك</p>
              </div>
              <Link 
                href={`/grades/${profile.grade}`}
                className="secondary-button"
              >
                استعراض الباقات المتاحة
                <span className="button-arrow">←</span>
              </Link>
            </div>
            <div className="grade-decoration">
              <div className="circle-decoration"></div>
              <div className="dots-pattern"></div>
            </div>
          </div>
        </div>

        {/* Purchased Packages with Images */}
        <div className="packages-section">
          <div className="section-header">
            <h3 className="section-title">
              <Package size={20} />
              الباقات المشتركة
            </h3>
            <Link href="/packages" className="view-all-link">
              عرض الكل
            </Link>
          </div>
          
          {userPackages && userPackages.length > 0 ? (
            <div className="packages-grid">
              {userPackages.map((userPackage, index) => (
                <div 
                  key={userPackage.id} 
                  className="package-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Package Image */}
                  <div className="package-image-wrapper">
                    <div className="package-image-container">
                      {userPackage.packages?.image_url ? (
                        <Image
                          src={userPackage.packages.image_url}
                          alt={userPackage.packages.name}
                          fill
                          className="package-image"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="package-image-placeholder">
                          <BookOpen size={40} />
                        </div>
                      )}
                    </div>
                    <div className="package-image-overlay"></div>
                    <div className="package-type-badge">
                      {getPackageTypeText(userPackage.packages?.type || '')}
                    </div>
                    <div className={`package-status-badge ${userPackage.is_active ? 'active' : 'inactive'}`}>
                      <span className="status-dot"></span>
                      {userPackage.is_active ? 'نشط' : 'غير نشط'}
                    </div>
                  </div>
                  
                  <div className="package-content">
                    <h4>{userPackage.packages?.name || 'باقة غير معروفة'}</h4>
                    <p className="package-description">
                      {userPackage.packages?.description || 'لا يوجد وصف'}
                    </p>
                    
                    <div className="package-meta">
                      <div className="meta-item">
                        <BookOpen size={16} />
                        <span>{userPackage.packages?.lecture_count || 0} محاضرة</span>
                      </div>
                      <div className="meta-item">
                        <Clock size={16} />
                        <span>{calculateDaysRemaining(userPackage.expires_at)}</span>
                      </div>
                    </div>
                    
                    <div className="package-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '60%' }}></div>
                      </div>
                      <span className="progress-text">تقدم التعلم</span>
                    </div>
                    
                    <Link
                      href={`/grades/${userPackage.packages?.grade || profile.grade}/packages/${userPackage.packages?.id}`}
                      className="access-button"
                    >
                      <PlayCircle size={18} />
                      <span>مشاهدة المحتوى</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <Package size={48} />
              </div>
              <h4>لا توجد باقات مشتركة</h4>
              <p>ابدأ رحلتك التعليمية بالاشتراك في إحدى باقاتنا المميزة</p>
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