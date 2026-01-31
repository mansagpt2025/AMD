'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Wallet, BookOpen, GraduationCap, Loader2, AlertCircle,
  Crown, Sparkles, Clock, Calendar, Medal, PlayCircle,
  CheckCircle2, ArrowRight, ShoppingCart, RefreshCw, 
  Ticket, CreditCard, X, Shield, Gift, Zap, Star,
  ChevronLeft, TrendingUp, Award, BookMarked, 
  Hexagon, Layers, Play, ArrowUpRight, Lock, Unlock
} from 'lucide-react'
import { 
  deductWalletBalance, 
  markCodeAsUsed, 
  createUserPackage, 
  validateCode,
  getWalletBalance 
} from './actions'
import './GradePage.module.css'

// الأنواع (تبقى كما هي)
interface Package {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  type: 'weekly' | 'monthly' | 'term' | 'offer'
  lecture_count: number
  grade: string
  duration_days: number
  is_active: boolean
  original_price?: number
  discount_percentage?: number
  features?: string[]
}

interface UserPackage {
  id: string
  package_id: string
  expires_at: string
  is_active: boolean
  packages: Package
}

interface ThemeType {
  primary: string
  secondary: string
  accent: string
  gradient: string
  light: string
}

const themes: Record<string, ThemeType> = {
  first: {
    primary: '#3b82f6',
    secondary: '#1d4ed8',
    accent: '#06b6d4',
    gradient: 'from-blue-500 via-indigo-500 to-cyan-500',
    light: '#eff6ff'
  },
  second: {
    primary: '#8b5cf6',
    secondary: '#6d28d9',
    accent: '#ec4899',
    gradient: 'from-violet-500 via-purple-600 to-pink-500',
    light: '#faf5ff'
  },
  third: {
    primary: '#f59e0b',
    secondary: '#d97706',
    accent: '#ef4444',
    gradient: 'from-amber-500 via-orange-600 to-red-500',
    light: '#fffbeb'
  }
}

export default function GradePage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const gradeSlug = params?.grade as 'first' | 'second' | 'third'
  const theme = themes[gradeSlug] || themes.first

  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  // كل الـ states تبقى كما هي
  const [packages, setPackages] = useState<Package[]>([])
  const [userPackages, setUserPackages] = useState<UserPackage[]>([])
  const [user, setUser] = useState<any>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'purchased' | 'offers'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // تأثير الماوس المتحرك
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  // كل الدوال تبقى كما هي بدون أي تغيير
  const fetchData = useCallback(async () => {
    try {
      if (!isRefreshing) setLoading(true)
      setError(null)
      
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        setUser(null)
        setLoading(false)
        setIsRefreshing(false)
        return
      }
      
      setUser(currentUser)

      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .eq('grade', gradeSlug)
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (packagesError) throw packagesError
      
      const enhancedPackages = packagesData?.map(pkg => ({
        ...pkg,
        features: pkg.features || [
          `${pkg.lecture_count} محاضرة تفاعلية`,
          'وصول كامل لمدة ' + pkg.duration_days + ' يوم',
          'دعم فني على مدار الساعة',
          'شهادة إتمام'
        ],
        original_price: pkg.type === 'offer' ? pkg.price * 1.3 : undefined
      })) || []
      
      setPackages(enhancedPackages)

      const walletResult = await getWalletBalance(currentUser.id)
      if (walletResult.success && walletResult.data) {
        setWalletBalance(walletResult.data.balance || 0)
      }

      const { data: userPkgs, error: userPkgsError } = await supabase
        .from('user_packages')
        .select(`*, packages:package_id(*)`)
        .eq('user_id', currentUser.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())

      if (userPkgsError) throw userPkgsError
      setUserPackages(userPkgs as UserPackage[] || [])
      
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء جلب البيانات')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [gradeSlug, supabase, isRefreshing])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!user?.id) return
    
    const channel = supabase
      .channel(`wallet-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wallets',
        filter: `user_id=eq.${user.id}`
      }, (payload: any) => {
        setWalletBalance(payload.new?.balance || 0)
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, supabase])

  const { purchased, available, offers } = useMemo(() => {
    const purchasedIds = userPackages.map(up => up.package_id)
    
    const purchased = userPackages
      .filter(up => up.packages)
      .map(up => ({ 
        ...up.packages, 
        userPackageId: up.id, 
        expires_at: up.expires_at 
      }))
    
    const available = packages.filter(p => 
      !purchasedIds.includes(p.id) && p.type !== 'offer'
    )
    
    const offers = packages.filter(p => 
      !purchasedIds.includes(p.id) && p.type === 'offer'
    )
    
    return { purchased, available, offers }
  }, [packages, userPackages])

  const filteredPackages = useMemo(() => {
    switch (activeTab) {
      case 'purchased': return purchased
      case 'offers': return offers
      default: return [...purchased, ...available, ...offers]
    }
  }, [purchased, available, offers, activeTab])

  const handlePurchaseClick = (pkg: Package) => {
    if (!user) {
      router.push(`/login?returnUrl=/grades/${gradeSlug}`)
      return
    }
    setSelectedPackage(pkg)
    setShowPurchaseModal(true)
  }

  const handleEnterPackage = (pkgId: string) => {
    router.push(`/grades/${gradeSlug}/packages/${pkgId}`)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchData()
  }

  const getGradeName = () => {
    switch(gradeSlug) {
      case 'first': return 'الصف الأول الثانوي'
      case 'second': return 'الصف الثاني الثانوي'
      case 'third': return 'الصف الثالث الثانوي'
      default: return 'الصف الدراسي'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_50%)]" />
        <div className="relative z-10 flex flex-col items-center gap-8">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 blur-xl opacity-30" />
            <GraduationCap size={80} className="text-slate-800 relative z-10" />
          </motion.div>
          <div className="flex flex-col items-center gap-2">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-1 w-32 bg-gradient-to-r from-transparent via-slate-300 to-transparent rounded-full overflow-hidden"
            >
              <motion.div 
                animate={{ x: [-128, 128] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="h-full w-1/2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
              />
            </motion.div>
            <p className="text-slate-400 text-sm font-medium">جاري التحميل...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-white text-slate-800 relative overflow-x-hidden">
      {/* شريط التقدم العلوي */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 origin-left z-50"
        style={{ scaleX }}
      />

      {/* خلفية متقدمة */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-100/40 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-indigo-100/40 to-transparent rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,#e0f2fe,transparent)]" />
      </div>

      {/* المحتوى الرئيسي */}
      <div className="relative z-10">
        {/* الهيدر */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* الشعار */}
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="relative group cursor-pointer" onClick={() => router.push('/')}>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity" />
                  <div className="relative bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm">
                    <Hexagon className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    البارع محمود الديب
                  </h1>
                  <p className="text-xs text-slate-500">منارة العلم والتميز</p>
                </div>
              </motion.div>

              {/* المحفظة أو تسجيل الدخول */}
              {user ? (
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex items-center gap-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <RefreshCw size={20} className={`text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </motion.button>
                  
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
                    <div className="relative flex items-center gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-sm">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                        <Wallet size={18} className="text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">الرصيد</span>
                        <span className="text-sm font-bold text-slate-800 tabular-nums">
                          {walletBalance.toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/login?returnUrl=/grades/${gradeSlug}`)}
                  className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-slate-800 transition-colors"
                >
                  <span>تسجيل الدخول</span>
                  <ArrowRight size={18} />
                </motion.button>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
          {/* بطاقة الصف الدراسي */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} opacity-5 rounded-3xl`} />
            <div className="relative bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-4">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm"
                  >
                    <Sparkles size={16} className="text-amber-500" />
                    <span className="text-sm font-medium text-slate-600">أهلاً بك في رحلة التميز</span>
                  </motion.div>
                  <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
                    {getGradeName()}
                  </h2>
                  <p className="text-lg text-slate-500 max-w-xl">
                    اختر باقتك المناسبة وابدأ رحلتك نحو التفوق العلمي مع أفضل المحتوى التعليمي المتاح
                  </p>
                </div>
                <motion.div 
                  whileHover={{ rotate: 5, scale: 1.05 }}
                  className="relative"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-20 blur-2xl rounded-full`} />
                  <div className="relative bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
                    <GraduationCap size={64} style={{ color: theme.primary }} />
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* التبويبات */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-2xl w-fit"
          >
            {[
              { id: 'all', label: 'الكل', icon: Layers, count: purchased.length + available.length + offers.length },
              { id: 'purchased', label: 'اشتراكاتي', icon: CheckCircle2, count: purchased.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { id: 'offers', label: 'عروض خاصة', icon: Zap, count: offers.length, color: 'text-amber-600', bg: 'bg-amber-50' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-white text-slate-900 shadow-lg shadow-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <tab.icon size={18} className={activeTab === tab.id ? tab.color : ''} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`ml-2 text-xs px-2.5 py-1 rounded-full ${
                    activeTab === tab.id ? tab.bg || 'bg-slate-100' : 'bg-white/50'
                  } ${activeTab === tab.id ? tab.color || 'text-slate-600' : 'text-slate-500'}`}>
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 border-2 rounded-xl ${tab.id === 'purchased' ? 'border-emerald-200' : tab.id === 'offers' ? 'border-amber-200' : 'border-blue-200'}`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </motion.div>

          {/* الإحصائيات */}
          {user && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {[
                { 
                  icon: BookMarked, 
                  label: 'باقة نشطة', 
                  value: purchased.length,
                  gradient: 'from-blue-500 to-cyan-500'
                },
                { 
                  icon: Play, 
                  label: 'محاضرة متاحة', 
                  value: purchased.reduce((acc, p) => acc + (p.lecture_count || 0), 0),
                  gradient: 'from-violet-500 to-purple-500'
                },
                { 
                  icon: Calendar, 
                  label: 'يوم متبقي', 
                  value: userPackages.filter(up => new Date(up.expires_at) > new Date()).length,
                  gradient: 'from-amber-500 to-orange-500'
                }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -4 }}
                  className="relative group overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.gradient}`} />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-slate-500 text-sm">{stat.label}</p>
                      <p className="text-3xl font-bold text-slate-900 tabular-nums">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} opacity-10 group-hover:opacity-20 transition-opacity`}>
                      <stat.icon size={24} className="text-slate-900" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* شبكة الباقات */}
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredPackages.map((pkg: any, index) => (
                <PackageCard 
                  key={pkg.id}
                  pkg={pkg}
                  isPurchased={purchased.some(p => p.id === pkg.id)}
                  theme={theme}
                  index={index}
                  onPurchase={() => handlePurchaseClick(pkg)}
                  onEnter={() => handleEnterPackage(pkg.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredPackages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24"
            >
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="absolute inset-0 bg-slate-100 rounded-full animate-pulse" />
                <BookOpen size={48} className="relative text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">لا توجد باقات متاحة</h3>
              <p className="text-slate-500">سيتم إضافة باقات جديدة قريباً</p>
            </motion.div>
          )}
        </main>
      </div>

      {/* مودال الشراء */}
      <AnimatePresence>
        {showPurchaseModal && selectedPackage && user && (
          <PurchaseModal 
            pkg={selectedPackage}
            user={user}
            walletBalance={walletBalance}
            theme={theme}
            onClose={() => {
              setShowPurchaseModal(false)
              setSelectedPackage(null)
            }}
            onSuccess={() => {
              handleRefresh()
              setShowPurchaseModal(false)
              setShowConfetti(true)
              setTimeout(() => setShowConfetti(false), 5000)
            }}
            gradeSlug={gradeSlug}
          />
        )}
      </AnimatePresence>

      {/* تأثير الاحتفال */}
      <AnimatePresence>
        {showConfetti && <ConfettiEffect />}
      </AnimatePresence>
    </div>
  )
}

// مكون بطاقة الباقة بتصميم جديد
function PackageCard({ 
  pkg, 
  isPurchased, 
  theme, 
  index, 
  onPurchase, 
  onEnter 
}: any) {
  const getTypeIcon = () => {
    switch (pkg.type) {
      case 'weekly': return <Clock size={16} />
      case 'monthly': return <Calendar size={16} />
      case 'term': return <Medal size={16} />
      case 'offer': return <Crown size={16} />
      default: return <BookOpen size={16} />
    }
  }

  const getTypeLabel = () => {
    switch (pkg.type) {
      case 'weekly': return 'أسبوعي'
      case 'monthly': return 'شهري'
      case 'term': return 'ترم كامل'
      case 'offer': return 'عرض محدود'
      default: return 'عام'
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
      whileHover={{ y: -8 }}
      className={`group relative bg-white rounded-3xl overflow-hidden border transition-all duration-300 ${
        isPurchased 
          ? 'border-emerald-200 shadow-lg shadow-emerald-100/50' 
          : pkg.type === 'offer'
          ? 'border-amber-200 shadow-lg shadow-amber-100/50'
          : 'border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50'
      }`}
    >
      {/* شريط التميز العلوي */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${theme.gradient}`} />
      
      {/* شارة الحالة */}
      {(isPurchased || pkg.type === 'offer') && (
        <div className="absolute top-4 right-4 z-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              isPurchased 
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                : 'bg-amber-100 text-amber-700 border border-amber-200'
            }`}
          >
            {isPurchased ? <CheckCircle2 size={14} /> : <Zap size={14} />}
            <span>{isPurchased ? 'مفعل' : 'عرض خاص'}</span>
          </motion.div>
        </div>
      )}

      {/* خصم */}
      {pkg.original_price && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-red-500/30">
            خصم {Math.round((1 - pkg.price/pkg.original_price) * 100)}%
          </div>
        </div>
      )}

      {/* الصورة */}
      <div className="relative h-48 overflow-hidden bg-slate-50">
        {pkg.image_url ? (
          <img 
            src={pkg.image_url} 
            alt={pkg.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-10`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* نوع الباقة */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-slate-700">
            {getTypeIcon()}
            <span>{getTypeLabel()}</span>
          </div>
        </div>
      </div>

      {/* المحتوى */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{pkg.name}</h3>
          <p className="text-sm text-slate-500 line-clamp-2">{pkg.description}</p>
        </div>

        {/* المميزات */}
        <ul className="space-y-2">
          {pkg.features?.slice(0, 3).map((feature: string, i: number) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
              <div className={`p-1 rounded-full bg-gradient-to-r ${theme.gradient} bg-opacity-10`}>
                <CheckCircle2 size={12} style={{ color: theme.primary }} />
              </div>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* الإحصائيات */}
        <div className="flex items-center gap-4 py-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <PlayCircle size={16} className="text-slate-400" />
            <span>{pkg.lecture_count} محاضرة</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Clock size={16} className="text-slate-400" />
            <span>{pkg.duration_days} يوم</span>
          </div>
        </div>

        {/* تاريخ الانتهاء */}
        {pkg.expires_at && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
            <Calendar size={14} />
            <span>ينتهي: {new Date(pkg.expires_at).toLocaleDateString('ar-EG')}</span>
          </div>
        )}

        {/* السعر والزر */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-col">
            {pkg.original_price && (
              <span className="text-sm text-slate-400 line-through decoration-red-300">
                {pkg.original_price.toLocaleString()} ج.م
              </span>
            )}
            <span className="text-2xl font-bold text-slate-900">
              {pkg.price.toLocaleString()}
              <span className="text-sm font-normal text-slate-500 mr-1">ج.م</span>
            </span>
          </div>

          {isPurchased ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onEnter}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-500/25"
            >
              <span>دخول</span>
              <ArrowUpRight size={18} />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onPurchase}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-slate-900/25 group/btn"
            >
              <span>اشترك الآن</span>
              <ShoppingCart size={18} className="group-hover/btn:rotate-12 transition-transform" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// مكون مودال الشراء بتصميم جديد
function PurchaseModal({ 
  pkg, 
  user, 
  walletBalance, 
  theme, 
  onClose, 
  onSuccess, 
  gradeSlug 
}: any) {
  const [method, setMethod] = useState<'wallet' | 'code'>('wallet')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [codeValid, setCodeValid] = useState<any>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleValidateCode = async () => {
    if (!code.trim()) { setError('أدخل الكود'); return }
    setLoading(true); setError('')
    try {
      const result = await validateCode(code, gradeSlug, pkg.id)
      if (!result.success) throw new Error(result.message)
      setCodeValid(result.data)
    } catch (err: any) {
      setError(err.message); setCodeValid(null)
    } finally { setLoading(false) }
  }

  const handlePurchase = async () => {
    setLoading(true); setError('')
    try {
      if (method === 'wallet') {
        if (walletBalance < pkg.price) throw new Error('رصيد غير كافٍ')
        const result = await deductWalletBalance(user.id, pkg.price, pkg.id)
        if (!result.success) throw new Error(result.message)
        const pkgResult = await createUserPackage(user.id, pkg.id, pkg.duration_days || 30, 'wallet')
        if (!pkgResult.success) throw new Error(pkgResult.message)
      } else {
        if (!codeValid) throw new Error('تحقق من الكود أولاً')
        await markCodeAsUsed(codeValid.id, user.id)
        const pkgResult = await createUserPackage(user.id, pkg.id, pkg.duration_days || 30, 'code')
        if (!pkgResult.success) throw new Error(pkgResult.message)
      }

      setShowSuccess(true)
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'تم الشراء بنجاح! 🎉',
        message: `تم تفعيل ${pkg.name}`,
        type: 'success'
      })
      
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {showSuccess ? (
          <div className="p-12 text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 size={48} className="text-emerald-600" />
            </motion.div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">تم الشراء بنجاح!</h3>
            <p className="text-slate-500">يمكنك الآن الوصول إلى جميع محتويات الباقة</p>
          </div>
        ) : (
          <>
            {/* هيدر المودال */}
            <div className="relative p-6 border-b border-slate-100">
              <button 
                onClick={onClose}
                className="absolute top-6 left-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
              
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${theme.gradient} text-white`}>
                  <Gift size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{pkg.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-900">{pkg.price.toLocaleString()}</span>
                    <span className="text-slate-500">ج.م</span>
                    {pkg.original_price && (
                      <span className="text-sm text-slate-400 line-through ml-2">
                        {pkg.original_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* طرق الدفع */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMethod('wallet')}
                  className={`relative p-4 rounded-2xl border-2 transition-all text-right ${
                    method === 'wallet' 
                      ? 'border-blue-500 bg-blue-50/50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-xl ${method === 'wallet' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <CreditCard size={20} />
                    </div>
                    {walletBalance >= pkg.price ? (
                      <CheckCircle2 size={20} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={20} className="text-red-500" />
                    )}
                  </div>
                  <p className="font-semibold text-slate-900">المحفظة</p>
                  <p className="text-xs text-slate-500 mt-1">رصيد: {walletBalance.toLocaleString()} ج.م</p>
                </button>

                <button
                  onClick={() => setMethod('code')}
                  className={`relative p-4 rounded-2xl border-2 transition-all text-right ${
                    method === 'code' 
                      ? 'border-amber-500 bg-amber-50/50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-xl ${method === 'code' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Ticket size={20} />
                    </div>
                    {codeValid && <CheckCircle2 size={20} className="text-emerald-500" />}
                  </div>
                  <p className="font-semibold text-slate-900">كود تفعيل</p>
                  <p className="text-xs text-slate-500 mt-1">لديك كود خصم؟</p>
                </button>
              </div>

              {/* حقل الكود */}
              <AnimatePresence>
                {method === 'code' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="أدخل الكود هنا"
                        disabled={!!codeValid}
                        className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-left font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                      <button
                        onClick={handleValidateCode}
                        disabled={loading || !code || !!codeValid}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'تحقق'}
                      </button>
                    </div>
                    {codeValid && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 mt-3 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-xl"
                      >
                        <Star size={16} fill="currentColor" />
                        <span>كود صالح! {codeValid.discount_percentage && `(خصم ${codeValid.discount_percentage}%)`}</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* خطأ الرصيد */}
              {method === 'wallet' && walletBalance < pkg.price && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  <AlertCircle size={20} />
                  <div>
                    <p className="font-semibold">رصيد غير كافٍ</p>
                    <p className="text-red-500/80 text-xs">يرجى شحن محفظتك أولاً</p>
                  </div>
                </div>
              )}

              {/* خطأ عام */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {/* زر التأكيد */}
              <button
                onClick={handlePurchase}
                disabled={loading || (method === 'wallet' && walletBalance < pkg.price) || (method === 'code' && !codeValid)}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>جاري المعالجة...</span>
                  </>
                ) : (
                  <>
                    <span>تأكيد الشراء</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              {/* تأمين */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <Shield size={14} />
                <span>معاملة آمنة ومشفرة 100%</span>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

// تأثير الاحتفال المحسن
function ConfettiEffect() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            top: -20, 
            left: `${Math.random() * 100}%`,
            rotate: 0,
            scale: 0
          }}
          animate={{ 
            top: '110%', 
            rotate: Math.random() * 720,
            scale: Math.random() * 0.5 + 0.5,
            x: (Math.random() - 0.5) * 200
          }}
          transition={{ 
            duration: Math.random() * 3 + 2,
            ease: "linear",
            delay: Math.random() * 0.5
          }}
          className="absolute"
          style={{
            width: Math.random() * 10 + 5,
            height: Math.random() * 10 + 5,
            backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'][Math.floor(Math.random() * 5)],
            borderRadius: Math.random() > 0.5 ? '50%' : '2px'
          }}
        />
      ))}
    </div>
  )
}