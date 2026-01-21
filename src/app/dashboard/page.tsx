'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, Calendar, BookOpen, Award, TrendingUp, 
  Clock, Download, BarChart, Wallet, Sparkles,
  ChevronRight, Package, Video, FileText, HelpCircle,
  Settings, LogOut, Home, Users, CreditCard, Shield
} from 'lucide-react'

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
  ]
}

export default function DashboardPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleLogout = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-[Cairo]">
      {/* الشريط الجانبي */}
      <aside className={`fixed right-0 top-0 h-screen bg-white shadow-2xl transition-all duration-300 z-50 ${sidebarOpen ? 'w-80' : 'w-0'}`}>
        {sidebarOpen && (
          <>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Sparkles className="w-8 h-8 text-primary-500 animate-pulse" />
                <div className="text-xl font-bold">
                  <span className="text-primary-600">محمود</span>
                  <span className="text-secondary-500">الديب</span>
                </div>
              </div>
              <button 
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 border-b border-gray-100">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center text-xl font-bold mb-4">
                {mockData.student.avatar}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-800">{mockData.student.name}</h3>
                <p className="text-sm text-gray-600">{mockData.student.grade}</p>
                <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium mt-2">
                  {mockData.student.section}
                </span>
              </div>
            </div>

            <nav className="p-4 space-y-2">
              <button 
                className={`w-full flex items-center justify-between p-3 rounded-xl text-right transition-all duration-200 ${activeTab === 'overview' ? 'bg-gradient-to-l from-primary-500 to-primary-600 text-white shadow-lg' : 'hover:bg-gradient-to-l from-primary-50 to-transparent'}`}
                onClick={() => setActiveTab('overview')}
              >
                <Home className="w-5 h-5 text-gray-400" />
                <span className="flex-1 mr-3 text-sm font-medium">الملخص العام</span>
              </button>

              <button 
                className={`w-full flex items-center justify-between p-3 rounded-xl text-right transition-all duration-200 ${activeTab === 'packages' ? 'bg-gradient-to-l from-primary-500 to-primary-600 text-white shadow-lg' : 'hover:bg-gradient-to-l from-primary-50 to-transparent'}`}
                onClick={() => setActiveTab('packages')}
              >
                <Package className="w-5 h-5 text-gray-400" />
                <span className="flex-1 mr-3 text-sm font-medium">الباقات</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  {mockData.stats.totalPackages}
                </span>
              </button>

              <button 
                className={`w-full flex items-center justify-between p-3 rounded-xl text-right transition-all duration-200 ${activeTab === 'wallet' ? 'bg-gradient-to-l from-primary-500 to-primary-600 text-white shadow-lg' : 'hover:bg-gradient-to-l from-primary-50 to-transparent'}`}
                onClick={() => setActiveTab('wallet')}
              >
                <Wallet className="w-5 h-5 text-gray-400" />
                <span className="flex-1 mr-3 text-sm font-medium">المحفظة</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  {formatCurrency(mockData.wallet.balance)}
                </span>
              </button>

              <div className="my-4 border-t border-gray-100"></div>

              <button className="w-full flex items-center justify-between p-3 rounded-xl text-right hover:bg-red-50 text-red-500 mt-8">
                <LogOut className="w-5 h-5 text-red-400" />
                <span className="flex-1 mr-3 text-sm font-medium">تسجيل الخروج</span>
              </button>
            </nav>
          </>
        )}
        
        {!sidebarOpen && (
          <button 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center"
            onClick={() => setSidebarOpen(true)}
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
        )}
      </aside>

      {/* المحتوى الرئيسي */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'mr-80' : 'mr-0'}`}>
        {/* شريط التنقل العلوي */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-6 sticky top-0 z-40">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {activeTab === 'overview' && 'الملخص العام'}
              {activeTab === 'packages' && 'الباقات'}
              {activeTab === 'wallet' && 'المحفظة'}
            </h1>
            <p className="text-gray-600">
              {activeTab === 'overview' && 'مرحباً بعودتك، تابع تقدمك الدراسي'}
              {activeTab === 'packages' && 'ادارة باقاتك التعليمية'}
              {activeTab === 'wallet' && 'ادارة رصيدك المالي'}
            </p>
          </div>

          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="relative flex-1 max-w-md">
              <input 
                type="search" 
                placeholder="ابحث عن محاضرة، امتحان، أو مادة..." 
                className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-right"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">🔍</div>
            </div>

            <div className="relative">
              <button 
                className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors relative"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                  3
                </span>
              </button>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse bg-gradient-to-l from-primary-500 to-primary-600 text-white p-4 rounded-xl">
              <Clock className="w-6 h-6" />
              <div>
                <div className="text-xl font-bold">
                  {new Date().toLocaleTimeString('ar-EG', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="text-sm opacity-90">
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
        <div className="p-6">
          {activeTab === 'overview' && (
            <>
              {/* بطاقة الترحيب والرصيد */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      مرحباً بعودتك، <span className="bg-white/20 px-3 py-1 rounded-lg">{mockData.student.name}</span>! 👋
                    </h2>
                    <p className="text-lg opacity-90">
                      استمر في رحلتك التعليمية نحو التفوق والتميز
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 flex items-center space-x-4 space-x-reverse">
                    <div className="w-12 h-12 rounded-lg bg-white/30 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <span className="block text-sm opacity-90">رصيدك المتاح</span>
                      <span className="block text-2xl font-bold">{formatCurrency(mockData.wallet.balance)}</span>
                    </div>
                    <button className="px-6 py-3 bg-white text-primary-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                      إضافة رصيد
                    </button>
                  </div>
                </div>
              </div>

              {/* بطاقات الإحصائيات السريعة */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-blue-500"></div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="mb-4">
                    <span className="block text-sm text-gray-600 mb-1">الباقات المشتراة</span>
                    <span className="block text-2xl font-bold text-gray-800">{mockData.stats.totalPackages}</span>
                  </div>
                  <div className="flex items-center space-x-1 space-x-reverse text-sm text-blue-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>+2 هذا الشهر</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-green-500"></div>
                  <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-4">
                    <Video className="w-6 h-6" />
                  </div>
                  <div className="mb-4">
                    <span className="block text-sm text-gray-600 mb-1">المحاضرات المكتملة</span>
                    <span className="block text-2xl font-bold text-gray-800">{mockData.stats.completedLectures}</span>
                    <span className="inline-block ml-2 text-sm font-medium text-green-600">
                      {Math.round((mockData.stats.completedLectures / mockData.stats.totalLectures) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                    <div 
                      className="h-full rounded-full bg-green-500 transition-all duration-500" 
                      style={{ width: `${(mockData.stats.completedLectures / mockData.stats.totalLectures) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-purple-500"></div>
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="mb-4">
                    <span className="block text-sm text-gray-600 mb-1">متوسط الدرجات</span>
                    <span className="block text-2xl font-bold text-gray-800">{mockData.stats.averageScore}%</span>
                  </div>
                  <div className="flex items-center space-x-1 space-x-reverse text-sm text-purple-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>+5% عن الشهر الماضي</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-orange-500"></div>
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="mb-4">
                    <span className="block text-sm text-gray-600 mb-1">ساعات الدراسة</span>
                    <span className="block text-2xl font-bold text-gray-800">{mockData.stats.studyHours}</span>
                    <span className="text-sm text-gray-600">ساعة</span>
                  </div>
                  <div className="flex items-center space-x-1 space-x-reverse text-sm text-orange-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>+12h هذا الأسبوع</span>
                  </div>
                </div>
              </div>

              {/* الباقات النشطة */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">الباقات النشطة</h3>
                  <button className="px-4 py-2 text-primary-600 hover:text-primary-700 font-medium">
                    عرض الكل
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {mockData.recentPackages.map((pkg) => (
                    <div key={pkg.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                      <div className="flex justify-between items-center mb-4">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${pkg.color === 'blue' ? 'bg-blue-100 text-blue-800' : pkg.color === 'green' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                          {pkg.name.split(' - ')[0]}
                        </div>
                        <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                          {pkg.progress}%
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-gray-800 mb-2">{pkg.name}</h4>
                      <p className="text-gray-600 mb-4">
                        المحاضرة القادمة: {pkg.nextLecture}
                      </p>
                      <div className="flex space-x-2 space-x-reverse">
                        <button className="flex-1 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all">
                          استكمال المحاضرات
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                          التفاصيل
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* الصفوف الدراسية */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">الصفوف الدراسية</h3>
                  <button className="px-4 py-2 text-primary-600 hover:text-primary-700 font-medium">
                    عرض الكل
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['الصف الأول', 'الصف الثاني', 'الصف الثالث'].map((grade, index) => (
                    <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                      <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div className="mb-4">
                        <h4 className="text-lg font-bold text-gray-800 mb-2">{grade} الثانوي</h4>
                        <p className="text-gray-600 mb-3">الباقات المتاحة: {5 + index * 3}</p>
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-primary-500" 
                              style={{ width: `${30 + index * 20}%` }}
                            ></div>
                          </div>
                          <span className="mr-2 text-sm">{30 + index * 20}%</span>
                        </div>
                      </div>
                      <button className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all duration-300 flex items-center justify-center space-x-2 space-x-reverse">
                        <span>الدخول</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'packages' && (
            <div className="text-center py-12">
              <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">قريباً</h3>
              <p className="text-gray-600">صفحة الباقات قيد التطوير</p>
            </div>
          )}

          {activeTab === 'wallet' && (
            <div className="text-center py-12">
              <Wallet className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">قريباً</h3>
              <p className="text-gray-600">صفحة المحفظة قيد التطوير</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}