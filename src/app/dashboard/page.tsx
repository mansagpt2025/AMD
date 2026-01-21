'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, Calendar, BookOpen, Award, TrendingUp, 
  Clock, Download, BarChart, Wallet, Sparkles,
  ChevronRight, Package, Video, FileText, HelpCircle,
  Settings, LogOut, Home, Users, CreditCard, Shield
} from 'lucide-react'
import './dashboard-styles.css'

// بيانات تجريبية
const mockData = {
  student: {
    name: 'أحمد محمد',
    grade: 'الصف الثالث الثانوي',
    section: 'علمي علوم',
    avatar: 'AM'
  },
  wallet: {
    balance: 1250,
    pending: 150,
    totalSpent: 2850
  },
  stats: {
    totalPackages: 8,
    completedLectures: 42,
    totalLectures: 80,
    averageScore: 87,
    studyHours: 156
  },
  recentPackages: [
    {
      id: 1,
      name: 'الفيزياء - الفصل الأول',
      progress: 75,
      nextLecture: 'غداً 10:00 ص',
      color: 'blue'
    },
    {
      id: 2,
      name: 'الكيمياء - التفاعلات الكيميائية',
      progress: 60,
      nextLecture: 'بعد غد 2:00 م',
      color: 'green'
    },
    {
      id: 3,
      name: 'الأحياء - الوراثة',
      progress: 45,
      nextLecture: 'اليوم 6:00 م',
      color: 'purple'
    }
  ],
  notifications: [
    {
      id: 1,
      title: 'محاضرة جديدة',
      message: 'تم إضافة محاضرة جديدة في مادة الفيزياء',
      time: 'قبل 5 دقائق',
      read: false,
      type: 'lecture'
    },
    {
      id: 2,
      title: 'باقة جديدة',
      message: 'باقة الترم الثاني متاحة الآن للشراء',
      time: 'قبل ساعة',
      read: true,
      type: 'package'
    },
    {
      id: 3,
      title: 'تنبيه الامتحان',
      message: 'امتحان مادة الكيمياء غداً الساعة 10 صباحاً',
      time: 'قبل يوم',
      read: false,
      type: 'exam'
    }
  ],
  upcomingExams: [
    {
      id: 1,
      subject: 'الكيمياء',
      date: 'غداً',
      time: '10:00 ص',
      duration: 'ساعتين',
      chapters: 'الفصل 1-3'
    },
    {
      id: 2,
      subject: 'الفيزياء',
      date: 'بعد 3 أيام',
      time: '9:00 ص',
      duration: 'ساعة ونصف',
      chapters: 'الفصل 4-5'
    }
  ],
  quickActions: [
    { icon: Video, label: 'المحاضرات الجديدة', color: 'blue', count: 5 },
    { icon: FileText, label: 'الملفات المضافة', color: 'green', count: 12 },
    { icon: Package, label: 'الباقات المتاحة', color: 'purple', count: 3 },
    { icon: Award, label: 'الشهادات', color: 'orange', count: 2 }
  ]
}

export default function DashboardPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [floatingElements, setFloatingElements] = useState<Array<{ x: number; y: number; size: number; delay: number }>>([])

  // إنشاء العناصر العائمة للخلفية
  useEffect(() => {
    const elements = Array.from({ length: 20 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 40 + 20,
      delay: Math.random() * 5
    }))
    setFloatingElements(elements)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleLogout = () => {
    // هنا سيكون منطق تسجيل الخروج
    router.push('/login')
  }

  return (
    <div className="dashboard-container">
      {/* العناصر العائمة للخلفية */}
      <div className="floating-background">
        {floatingElements.map((el, index) => (
          <div
            key={index}
            className="floating-bg-element"
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.size}px`,
              height: `${el.size}px`,
              animationDelay: `${el.delay}s`
            }}
          />
        ))}
      </div>

      {/* الشريط الجانبي */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Sparkles className="logo-sparkle" />
            <div className="logo-text">
              <span className="logo-primary">محمود</span>
              <span className="logo-secondary">الديب</span>
            </div>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <ChevronRight className={`toggle-icon ${sidebarOpen ? 'rotated' : ''}`} />
          </button>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">
            {mockData.student.avatar}
          </div>
          <div className="profile-info">
            <h3 className="profile-name">{mockData.student.name}</h3>
            <p className="profile-grade">{mockData.student.grade}</p>
            <span className="profile-badge">{mockData.student.section}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Home className="nav-icon" />
            <span className="nav-label">الملخص العام</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'packages' ? 'active' : ''}`}
            onClick={() => setActiveTab('packages')}
          >
            <Package className="nav-icon" />
            <span className="nav-label">الباقات</span>
            <span className="nav-badge">{mockData.stats.totalPackages}</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'lectures' ? 'active' : ''}`}
            onClick={() => setActiveTab('lectures')}
          >
            <Video className="nav-icon" />
            <span className="nav-label">المحاضرات</span>
            <span className="nav-badge">{mockData.stats.completedLectures}/{mockData.stats.totalLectures}</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'exams' ? 'active' : ''}`}
            onClick={() => setActiveTab('exams')}
          >
            <BookOpen className="nav-icon" />
            <span className="nav-label">الامتحانات</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'wallet' ? 'active' : ''}`}
            onClick={() => setActiveTab('wallet')}
          >
            <Wallet className="nav-icon" />
            <span className="nav-label">المحفظة</span>
            <span className="nav-badge">{formatCurrency(mockData.wallet.balance)}</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            <TrendingUp className="nav-icon" />
            <span className="nav-label">التقدم الدراسي</span>
          </button>

          <div className="nav-divider"></div>

          <button className="nav-item">
            <Settings className="nav-icon" />
            <span className="nav-label">الإعدادات</span>
          </button>

          <button className="nav-item">
            <HelpCircle className="nav-icon" />
            <span className="nav-label">المساعدة</span>
          </button>

          <button className="nav-item logout-item" onClick={handleLogout}>
            <LogOut className="nav-icon" />
            <span className="nav-label">تسجيل الخروج</span>
          </button>
        </nav>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="dashboard-main">
        {/* شريط التنقل العلوي */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="page-title">
              {activeTab === 'overview' && 'الملخص العام'}
              {activeTab === 'packages' && 'الباقات'}
              {activeTab === 'lectures' && 'المحاضرات'}
              {activeTab === 'exams' && 'الامتحانات'}
              {activeTab === 'wallet' && 'المحفظة'}
              {activeTab === 'progress' && 'التقدم الدراسي'}
            </h1>
            <p className="page-subtitle">
              {activeTab === 'overview' && 'مرحباً بعودتك، تابع تقدمك الدراسي'}
              {activeTab === 'packages' && 'ادارة باقاتك التعليمية'}
              {activeTab === 'lectures' && 'شاهد واستكمل محاضراتك'}
              {activeTab === 'exams' && 'استعد للامتحانات القادمة'}
              {activeTab === 'wallet' && 'ادارة رصيدك المالي'}
              {activeTab === 'progress' && 'تابع تقدمك الدراسي'}
            </p>
          </div>

          <div className="header-right">
            {/* محرك البحث */}
            <div className="search-container">
              <input 
                type="search" 
                placeholder="ابحث عن محاضرة، امتحان، أو مادة..." 
                className="search-input"
              />
              <div className="search-icon">🔍</div>
            </div>

            {/* إشعارات */}
            <div className="notifications-container">
              <button 
                className="notifications-button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell className="bell-icon" />
                {mockData.notifications.filter(n => !n.read).length > 0 && (
                  <span className="notification-badge">
                    {mockData.notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h3>الإشعارات</h3>
                    <span className="unread-count">
                      {mockData.notifications.filter(n => !n.read).length} جديد
                    </span>
                  </div>
                  <div className="notifications-list">
                    {mockData.notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                      >
                        <div className="notification-icon">
                          {notification.type === 'lecture' && <Video />}
                          {notification.type === 'package' && <Package />}
                          {notification.type === 'exam' && <BookOpen />}
                        </div>
                        <div className="notification-content">
                          <h4>{notification.title}</h4>
                          <p>{notification.message}</p>
                          <span className="notification-time">{notification.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="view-all-notifications">
                    مشاهدة جميع الإشعارات
                  </button>
                </div>
              )}
            </div>

            {/* ملصق الوقت */}
            <div className="time-widget">
              <Clock className="clock-icon" />
              <div>
                <div className="current-time">
                  {new Date().toLocaleTimeString('ar-EG', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="current-date">
                  {new Date().toLocaleDateString('ar-EG', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* محتوى التبويب النشط */}
        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <>
              {/* بطاقة الترحيب والرصيد */}
              <div className="welcome-card">
                <div className="welcome-content">
                  <div>
                    <h2 className="welcome-title">
                      مرحباً بعودتك، <span className="highlight">{mockData.student.name}</span>! 👋
                    </h2>
                    <p className="welcome-subtitle">
                      استمر في رحلتك التعليمية نحو التفوق والتميز
                    </p>
                  </div>
                  <div className="wallet-card">
                    <div className="wallet-icon">
                      <Wallet />
                    </div>
                    <div className="wallet-info">
                      <span className="wallet-label">رصيدك المتاح</span>
                      <span className="wallet-amount">{formatCurrency(mockData.wallet.balance)}</span>
                    </div>
                    <button className="add-funds-button">إضافة رصيد</button>
                  </div>
                </div>
              </div>

              {/* بطاقات الإحصائيات السريعة */}
              <div className="stats-grid">
                <div className="stat-card blue">
                  <div className="stat-icon">
                    <Package />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">الباقات المشتراة</span>
                    <span className="stat-value">{mockData.stats.totalPackages}</span>
                  </div>
                  <div className="stat-trend">
                    <TrendingUp />
                    <span>+2 هذا الشهر</span>
                  </div>
                </div>

                <div className="stat-card green">
                  <div className="stat-icon">
                    <Video />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">المحاضرات المكتملة</span>
                    <span className="stat-value">{mockData.stats.completedLectures}</span>
                    <span className="stat-progress">
                      {Math.round((mockData.stats.completedLectures / mockData.stats.totalLectures) * 100)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(mockData.stats.completedLectures / mockData.stats.totalLectures) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="stat-card purple">
                  <div className="stat-icon">
                    <Award />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">متوسط الدرجات</span>
                    <span className="stat-value">{mockData.stats.averageScore}%</span>
                  </div>
                  <div className="stat-trend">
                    <TrendingUp />
                    <span>+5% عن الشهر الماضي</span>
                  </div>
                </div>

                <div className="stat-card orange">
                  <div className="stat-icon">
                    <Clock />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">ساعات الدراسة</span>
                    <span className="stat-value">{mockData.stats.studyHours}</span>
                    <span className="stat-unit">ساعة</span>
                  </div>
                  <div className="stat-trend">
                    <TrendingUp />
                    <span>+12h هذا الأسبوع</span>
                  </div>
                </div>
              </div>

              {/* الصفوف الدراسية */}
              <div className="grades-section">
                <div className="section-header">
                  <h3 className="section-title">الصفوف الدراسية</h3>
                  <button className="view-all-button">عرض الكل</button>
                </div>
                <div className="grades-grid">
                  {['الصف الأول', 'الصف الثاني', 'الصف الثالث'].map((grade, index) => (
                    <div key={index} className="grade-card">
                      <div className="grade-icon">
                        <BookOpen />
                      </div>
                      <div className="grade-info">
                        <h4>{grade} الثانوي</h4>
                        <p>الباقات المتاحة: {5 + index * 3}</p>
                        <div className="grade-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${30 + index * 20}%` }}
                            ></div>
                          </div>
                          <span>{30 + index * 20}%</span>
                        </div>
                      </div>
                      <button className="enter-grade-button">
                        الدخول <ChevronRight />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* الباقات النشطة */}
              <div className="packages-section">
                <div className="section-header">
                  <h3 className="section-title">الباقات النشطة</h3>
                  <button className="view-all-button">عرض الكل</button>
                </div>
                <div className="packages-grid">
                  {mockData.recentPackages.map((pkg) => (
                    <div key={pkg.id} className="package-card">
                      <div className="package-header">
                        <div className="package-badge" data-color={pkg.color}>
                          {pkg.name.split(' - ')[0]}
                        </div>
                        <div className="package-progress">
                          <span>{pkg.progress}%</span>
                        </div>
                      </div>
                      <h4 className="package-name">{pkg.name}</h4>
                      <p className="package-info">
                        المحاضرة القادمة: {pkg.nextLecture}
                      </p>
                      <div className="package-actions">
                        <button className="continue-button">
                          استكمال المحاضرات
                        </button>
                        <button className="details-button">
                          التفاصيل
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* الإجراءات السريعة */}
              <div className="quick-actions-section">
                <div className="section-header">
                  <h3 className="section-title">إجراءات سريعة</h3>
                </div>
                <div className="actions-grid">
                  {mockData.quickActions.map((action, index) => {
                    const Icon = action.icon
                    return (
                      <button key={index} className="action-button" data-color={action.color}>
                        <div className="action-icon">
                          <Icon />
                        </div>
                        <span className="action-label">{action.label}</span>
                        {action.count > 0 && (
                          <span className="action-badge">{action.count}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}