'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Wallet, BookOpen, GraduationCap, Loader2, AlertCircle,
  Crown, Sparkles, Clock, Calendar, Medal, PlayCircle,
  CheckCircle2, ArrowRight, ShoppingCart, RefreshCw, 
  Ticket, CreditCard, X, Shield, Gift, Zap, Star,
  ChevronLeft, TrendingUp, Award, BookMarked, Sparkle, Triangle
} from 'lucide-react'
import styles from './GradePage.module.css'

// أنواع البيانات (كما هي)
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
  dark: string
}

// الألوان المُحسّنة لكل صف (تصميم فاتح عصري)
const themes: Record<string, ThemeType> = {
  first: {
    primary: '#4f46e5',
    secondary: '#4338ca',
    accent: '#06b6d4',
    gradient: 'from-indigo-500 via-purple-500 to-cyan-500',
    light: '#eef2ff',
    dark: '#1e1b4b'
  },
  second: {
    primary: '#059669',
    secondary: '#047857',
    accent: '#84cc16',
    gradient: 'from-emerald-500 via-teal-500 to-lime-500',
    light: '#ecfdf5',
    dark: '#064e3b'
  },
  third: {
    primary: '#dc2626',
    secondary: '#b91c1c',
    accent: '#f59e0b',
    gradient: 'from-red-500 via-orange-500 to-amber-500',
    light: '#fef2f2',
    dark: '#7f1d1d'
  }
}

// بيانات تجريبية للـ actions (يجب استبدالها بالـ imports الفعلية)
const deductWalletBalance = async (userId: string, amount: number, pkgId: string) => ({ success: true, data: null })
const markCodeAsUsed = async (codeId: string, userId: string) => ({ success: true })
const createUserPackage = async (userId: string, pkgId: string, duration: number, method: string) => ({ success: true })
const validateCode = async (code: string, grade: string, pkgId: string) => ({ 
  success: true, 
  data: { id: '1', discount_percentage: 20 } 
})
const getWalletBalance = async (userId: string) => ({ success: true, data: { balance: 1500 } })

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
  const { scrollYProgress } = useScroll({ container: containerRef })
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })
  
  // Mouse position for spotlight effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }, [mouseX, mouseY])

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

  // جلب البيانات (نفس المنطق الأصلي)
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

  // Real-time updates
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

  // تصنيف الباقات
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
      <div className={styles.loadingScreen} style={{ ['--theme-color' as string]: theme.primary }}>
        <div className={styles.loadingContent}>
          <motion.div 
            className={styles.spinnerRing}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className={styles.spinnerInner} style={{ borderColor: theme.primary }} />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ color: theme.dark }}
          >
            جاري تحميل البيانات
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            نحضر لك أفضل المحتوى التعليمي...
          </motion.p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={styles.container} 
      ref={containerRef}
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight Effect */}
      <motion.div
        className={styles.spotlight}
        style={{
          background: useMotionTemplate`radial-gradient(600px circle at ${mouseX}px ${mouseY}px, ${theme.primary}15, transparent 40%)`
        }}
      />

      {/* شريط التقدم العلوي */}
      <motion.div 
        className={styles.progressBar}
        style={{ 
          scaleX,
          background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`
        }}
      />

      {/* خلفية الجزيئات المتحركة */}
      <div className={styles.particles}>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className={styles.particle}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0, 0.5, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: theme.primary
            }}
          />
        ))}
      </div>

      {/* الهيدر الرئيسي */}
      <header className={styles.header}>
        <div className={styles.headerGlass}>
          <div className={styles.headerContent}>
            {/* الشعار */}
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={styles.brand}
            >
              <div className={styles.logoGlow} style={{ ['--glow-color' as string]: theme.primary }}>
                <div className={styles.logoWrapper}>
                  <Crown size={28} color={theme.primary} />
                </div>
              </div>
              <div className={styles.brandText}>
                <h1 style={{ color: theme.dark }}>البارع محمود الديب</h1>
                <span>منارة العلم والتميز</span>
              </div>
            </motion.div>

            {/* المحفظة أو تسجيل الدخول */}
            {user ? (
              <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={styles.walletCard}
                style={{ 
                  ['--card-border' as string]: `${theme.primary}20`,
                  ['--card-shadow' as string]: `${theme.primary}10`
                }}
                whileHover={{ y: -4, boxShadow: `0 20px 40px ${theme.primary}20` }}
              >
                <div className={styles.walletGlow} style={{ background: theme.primary }} />
                <div className={styles.walletIcon} style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
                  <Wallet size={20} color="white" />
                </div>
                <div className={styles.walletDetails}>
                  <span className={styles.walletLabel}>رصيدك الحالي</span>
                  <span className={styles.walletAmount} style={{ color: theme.primary }}>
                    {walletBalance.toLocaleString()} ج.م
                  </span>
                </div>
                <motion.button 
                  className={styles.refreshBtn}
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  whileHover={{ rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <RefreshCw size={16} className={isRefreshing ? styles.spinning : ''} />
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={styles.loginBtn}
                style={{ 
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  boxShadow: `0 10px 30px ${theme.primary}40`
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(`/login?returnUrl=/grades/${gradeSlug}`)}
              >
                <span>تسجيل الدخول</span>
                <ArrowRight size={18} />
              </motion.button>
            )}
          </div>
        </div>

        {/* Hero Section */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={styles.hero}
        >
          <div className={styles.heroBackground}>
            <div className={styles.heroGradient} style={{ background: `linear-gradient(135deg, ${theme.light} 0%, transparent 100%)` }} />
            <div className={styles.heroPattern} />
          </div>
          
          <div className={styles.heroContent}>
            <motion.div 
              className={styles.gradeBadge}
              style={{ 
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                boxShadow: `0 20px 40px ${theme.primary}40`
              }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <GraduationCap size={48} color="white" />
            </motion.div>
            
            <motion.h2 
              className={styles.heroTitle}
              style={{ 
                background: `linear-gradient(135deg, ${theme.dark}, ${theme.primary})`,
                WebkitBackgroundClip: 'text'
              }}
            >
              {getGradeName()}
            </motion.h2>
            
            <p className={styles.heroSubtitle}>اختر باقتك المثالية وانطلق في رحلة التميز الأكاديمي</p>
            
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.statNumber} style={{ color: theme.primary }}>{packages.length}+</span>
                <span className={styles.statLabel}>باقة متاحة</span>
              </div>
              <div className={styles.divider} />
              <div className={styles.heroStat}>
                <span className={styles.statNumber} style={{ color: theme.primary }}>{purchased.length}</span>
                <span className={styles.statLabel}>باقة نشطة</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* التبويبات المتقدمة */}
        <motion.nav 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={styles.tabsContainer}
        >
          <div className={styles.tabsGlass}>
            <div className={styles.tabs}>
              {[
                { id: 'all', label: 'الكل', icon: BookOpen, count: purchased.length + available.length + offers.length, color: theme.primary },
                { id: 'purchased', label: 'اشتراكاتي', icon: CheckCircle2, count: purchased.length, color: '#10b981', show: purchased.length > 0 },
                { id: 'offers', label: 'عروض خاصة', icon: Sparkles, count: offers.length, color: '#f59e0b', show: offers.length > 0 }
              ].map((tab) => (
                tab.show !== false && (
                  <motion.button 
                    key={tab.id}
                    className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                    onClick={() => setActiveTab(tab.id as any)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ 
                      ['--active-color' as string]: tab.color,
                      ['--active-bg' as string]: `${tab.color}15`
                    } as any}
                  >
                    <tab.icon size={18} />
                    <span>{tab.label}</span>
                    <motion.span 
                      className={styles.tabCount}
                      style={{ 
                        background: activeTab === tab.id ? tab.color : `${tab.color}20`,
                        color: activeTab === tab.id ? 'white' : tab.color
                      }}
                      initial={false}
                      animate={{ scale: activeTab === tab.id ? 1.1 : 1 }}
                    >
                      {tab.count}
                    </motion.span>
                    {activeTab === tab.id && (
                      <motion.div 
                        className={styles.tabIndicator}
                        style={{ background: tab.color }}
                        layoutId="tabIndicator"
                      />
                    )}
                  </motion.button>
                )
              ))}
            </div>
          </div>
        </motion.nav>
      </header>

      {/* المحتوى الرئيسي */}
      <main className={styles.main}>
        {/* الإحصائيات السريعة */}
        {user && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={styles.statsGrid}
          >
            {[
              { icon: BookMarked, label: 'باقة نشطة', value: purchased.length, color: theme.primary },
              { icon: PlayCircle, label: 'محاضرة متاحة', value: purchased.reduce((acc, p) => acc + (p.lecture_count || 0), 0), color: theme.secondary },
              { icon: Clock, label: 'يوم متبقي', value: Math.max(0, Math.ceil(userPackages.reduce((acc, up) => acc + (new Date(up.expires_at).getTime() - Date.now()), 0) / (1000 * 60 * 60 * 24))), color: theme.accent }
            ].map((stat, idx) => (
              <motion.div 
                key={idx}
                className={styles.statCard}
                style={{ ['--card-accent' as string]: stat.color }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -4, boxShadow: `0 20px 40px ${stat.color}15` }}
              >
                <div className={styles.statIcon} style={{ background: `${stat.color}15`, color: stat.color }}>
                  <stat.icon size={24} />
                </div>
                <div className={styles.statInfo}>
                  <motion.span 
                    className={styles.statValue}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={stat.value}
                  >
                    {stat.value}
                  </motion.span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </div>
                <div className={styles.statGlow} style={{ background: stat.color }} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* خطأ */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className={styles.errorAlert}
              style={{ background: `${theme.primary}10`, borderColor: `${theme.primary}30`, color: theme.dark }}
            >
              <AlertCircle size={20} color={theme.primary} />
              <span>{error}</span>
              <button onClick={fetchData} style={{ color: theme.primary }}>إعادة المحاولة</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* شبكة الباقات */}
        <motion.div 
          layout
          className={styles.packagesGrid}
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
            className={styles.emptyState}
          >
            <div className={styles.emptyGlow} style={{ ['--glow-color' as string]: theme.primary }} />
            <motion.div 
              className={styles.emptyIcon}
              style={{ background: theme.light, color: theme.primary }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <BookOpen size={48} />
            </motion.div>
            <h3>لا توجد باقات متاحة</h3>
            <p>سيتم إضافة باقات جديدة قريباً</p>
          </motion.div>
        )}
      </main>

      {/* مودال الشراء المتطور */}
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

      {/* تأثير الاحتفال المحسّن */}
      <AnimatePresence>
        {showConfetti && <ConfettiEffect theme={theme} />}
      </AnimatePresence>
    </div>
  )
}

// مكون بطاقة الباقة المتطور
function PackageCard({ 
  pkg, 
  isPurchased, 
  theme, 
  index, 
  onPurchase, 
  onEnter 
}: any) {
  const cardRef = useRef<HTMLDivElement>(null)
  
  const getTypeIcon = () => {
    switch (pkg.type) {
      case 'weekly': return <Clock size={18} />
      case 'monthly': return <Calendar size={18} />
      case 'term': return <Medal size={18} />
      case 'offer': return <Crown size={18} />
      default: return <BookOpen size={18} />
    }
  }

  const getTypeColor = () => {
    switch (pkg.type) {
      case 'weekly': return { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' }
      case 'monthly': return { bg: '#f3e8ff', text: '#6b21a8', border: '#a855f7' }
      case 'term': return { bg: '#d1fae5', text: '#065f46', border: '#10b981' }
      case 'offer': return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' }
      default: return { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' }
    }
  }

  const typeStyle = getTypeColor()

  return (
    <motion.div
      layout
      ref={cardRef}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 100, damping: 15 }}
      whileHover={{ y: -12, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      className={`${styles.packageCard} ${isPurchased ? styles.purchased : ''} ${pkg.type === 'offer' ? styles.offer : ''}`}
      style={{ ['--card-theme' as string]: theme.primary }}
    >
      {/* Border Gradient Effect */}
      <div className={styles.cardBorder} style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }} />
      
      {/* Glow Effect */}
      <div 
        className={styles.cardGlow} 
        style={{ 
          background: isPurchased 
            ? 'linear-gradient(135deg, #10b98120, #05966920)' 
            : pkg.type === 'offer'
            ? 'linear-gradient(135deg, #f59e0b20, #d9770620)'
            : `linear-gradient(135deg, ${theme.primary}15, ${theme.accent}15)`
        }} 
      />

      {/* شارة الحالة */}
      {(isPurchased || pkg.type === 'offer') && (
        <motion.div 
          className={styles.badge}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
          style={{ 
            background: isPurchased ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
            boxShadow: isPurchased ? '0 10px 20px #10b98140' : '0 10px 20px #f59e0b40'
          }}
        >
          {isPurchased ? <CheckCircle2 size={14} /> : <Zap size={14} />}
          <span>{isPurchased ? 'مفعل' : 'عرض خاص'}</span>
        </motion.div>
      )}

      {/* الخصم */}
      {pkg.original_price && (
        <motion.div 
          className={styles.discountBadge}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
        >
          <Sparkles size={12} />
          <span>خصم {Math.round((1 - pkg.price/pkg.original_price) * 100)}%</span>
        </motion.div>
      )}

      {/* الصورة والأيقونة */}
      <div className={styles.cardImageWrapper}>
        <div className={styles.imageBackground} style={{ background: `linear-gradient(135deg, ${theme.light}, white)` }} />
        {pkg.image_url ? (
          <img src={pkg.image_url} alt={pkg.name} loading="lazy" className={styles.cardImage} />
        ) : (
          <div className={styles.placeholderImage} style={{ color: theme.primary }}>
            {getTypeIcon()}
          </div>
        )}
        
        <motion.div 
          className={styles.typeChip}
          style={{ 
            background: typeStyle.bg, 
            color: typeStyle.text,
            border: `1px solid ${typeStyle.border}30`
          }}
          whileHover={{ scale: 1.05 }}
        >
          {getTypeIcon()}
          <span>
            {pkg.type === 'weekly' && 'أسبوعي'}
            {pkg.type === 'monthly' && 'شهري'}
            {pkg.type === 'term' && 'ترم كامل'}
            {pkg.type === 'offer' && 'عرض محدود'}
          </span>
        </motion.div>
      </div>

      {/* المحتوى */}
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle} style={{ color: theme.dark }}>{pkg.name}</h3>
        <p className={styles.cardDescription}>{pkg.description}</p>

        {/* المميزات */}
        <ul className={styles.featuresList}>
          {pkg.features?.slice(0, 3).map((feature: string, i: number) => (
            <motion.li 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <div className={styles.featureIcon} style={{ background: `${theme.primary}15`, color: theme.primary }}>
                <CheckCircle2 size={14} />
              </div>
              <span>{feature}</span>
            </motion.li>
          ))}
        </ul>

        {/* الإحصائيات */}
        <div className={styles.cardStats}>
          <div className={styles.stat} style={{ background: `${theme.primary}08` }}>
            <PlayCircle size={16} style={{ color: theme.primary }} />
            <span>{pkg.lecture_count} محاضرة</span>
          </div>
          <div className={styles.stat} style={{ background: `${theme.accent}08` }}>
            <Clock size={16} style={{ color: theme.accent }} />
            <span>{pkg.duration_days} يوم</span>
          </div>
        </div>

        {/* تاريخ الانتهاء */}
        {pkg.expires_at && (
          <div className={styles.expiryDate}>
            <Calendar size={14} color={theme.primary} />
            <span>ينتهي: {new Date(pkg.expires_at).toLocaleDateString('ar-EG')}</span>
          </div>
        )}

        {/* السعر والزر */}
        <div className={styles.cardFooter}>
          <div className={styles.priceWrapper}>
            {pkg.original_price && (
              <span className={styles.oldPrice}>{pkg.original_price.toLocaleString()} ج.م</span>
            )}
            <motion.span 
              className={styles.price}
              style={{ color: theme.primary }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              key={pkg.price}
            >
              {pkg.price.toLocaleString()}
              <small> ج.م</small>
            </motion.span>
          </div>

          {isPurchased ? (
            <motion.button
              className={styles.enterButton}
              style={{ 
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 10px 20px #10b98140'
              }}
              whileHover={{ scale: 1.05, boxShadow: '0 15px 30px #10b98150' }}
              whileTap={{ scale: 0.95 }}
              onClick={onEnter}
            >
              <span>دخول</span>
              <ChevronLeft size={18} />
            </motion.button>
          ) : (
            <motion.button
              className={styles.buyButton}
              style={{ 
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                boxShadow: `0 10px 20px ${theme.primary}40`
              }}
              whileHover={{ 
                scale: 1.05, 
                boxShadow: `0 15px 30px ${theme.primary}50`,
                background: `linear-gradient(135deg, ${theme.secondary}, ${theme.primary})`
              }}
              whileTap={{ scale: 0.95 }}
              onClick={onPurchase}
            >
              <span>اشترك الآن</span>
              <ShoppingCart size={18} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// مكون مودال الشراء المتطور
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
      if (!result.success) throw new Error("حدث خطأ ما")
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
        if (!result.success) throw new Error("حدث خطأ ما")
        const pkgResult = await createUserPackage(user.id, pkg.id, pkg.duration_days || 30, 'wallet')
        if (!pkgResult.success) throw new Error("حدث خطأ ما")
      } else {
        if (!codeValid) throw new Error('تحقق من الكود أولاً')
        await markCodeAsUsed(codeValid.id, user.id)
        const pkgResult = await createUserPackage(user.id, pkg.id, pkg.duration_days || 30, 'code')
        if (!pkgResult.success) throw new Error("حدث خطأ ما")
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
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        className={styles.modal}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Glow */}
        <div className={styles.modalGlow} style={{ background: `radial-gradient(circle at 50% 0%, ${theme.primary}30, transparent 70%)` }} />

        {showSuccess ? (
          <motion.div 
            className={styles.successState}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div 
              className={styles.successIcon}
              style={{ 
                background: `linear-gradient(135deg, ${theme.light}, white)`,
                border: `2px solid ${theme.primary}20`
              }}
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 0.5 }}
            >
              <CheckCircle2 size={64} color={theme.primary} />
            </motion.div>
            <motion.h3 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ color: theme.dark }}
            >
              تم الشراء بنجاح!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              يمكنك الآن الوصول إلى جميع محتويات الباقة
            </motion.p>
          </motion.div>
        ) : (
          <>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={24} />
            </button>

            <div className={styles.modalHeader} style={{ background: `linear-gradient(135deg, ${theme.light}50, transparent)` }}>
              <motion.div 
                className={styles.modalIcon}
                style={{ 
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  boxShadow: `0 20px 40px ${theme.primary}40`
                }}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Gift size={32} color="white" />
              </motion.div>
              <h3 style={{ color: theme.dark }}>{pkg.name}</h3>
              <div className={styles.priceTag}>
                <motion.span 
                  style={{ color: theme.primary }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {pkg.price.toLocaleString()}
                </motion.span>
                <small>جنية مصري</small>
              </div>
              {pkg.original_price && (
                <span className={styles.originalPrice}>{pkg.original_price.toLocaleString()} ج.م</span>
              )}
            </div>

            <div className={styles.modalBody}>
              <div className={styles.methods}>
                <motion.button 
                  className={`${styles.methodCard} ${method === 'wallet' ? styles.active : ''}`}
                  onClick={() => setMethod('wallet')}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  style={method === 'wallet' ? { 
                    borderColor: theme.primary, 
                    background: `${theme.primary}08`,
                    boxShadow: `0 10px 30px ${theme.primary}20`
                  } : {}}
                >
                  <div className={styles.methodIcon} style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
                    <CreditCard size={24} color="white" />
                  </div>
                  <div className={styles.methodInfo}>
                    <strong style={{ color: theme.dark }}>الدفع من المحفظة</strong>
                    <span>رصيدك: {walletBalance.toLocaleString()} ج.م</span>
                  </div>
                  <div className={styles.methodStatus}>
                    {walletBalance >= pkg.price ? (
                      <CheckCircle2 size={20} color="#10b981" />
                    ) : (
                      <AlertCircle size={20} color="#ef4444" />
                    )}
                  </div>
                </motion.button>

                <motion.button 
                  className={`${styles.methodCard} ${method === 'code' ? styles.active : ''}`}
                  onClick={() => setMethod('code')}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  style={method === 'code' ? { 
                    borderColor: '#f59e0b', 
                    background: '#fffbeb',
                    boxShadow: '0 10px 30px #f59e0b20'
                  } : {}}
                >
                  <div className={styles.methodIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                    <Ticket size={24} color="white" />
                  </div>
                  <div className={styles.methodInfo}>
                    <strong style={{ color: theme.dark }}>كود تفعيل</strong>
                    <span>لديك كود خصم؟</span>
                  </div>
                </motion.button>
              </div>

              {method === 'code' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={styles.codeInput}
                >
                  <div className={styles.inputWrapper}>
                    <input 
                      type="text" 
                      value={code} 
                      onChange={e => setCode(e.target.value.toUpperCase())} 
                      placeholder="أدخل الكود هنا (مثال: OFF2024)"
                      disabled={!!codeValid}
                      maxLength={20}
                      style={{ borderColor: codeValid ? '#10b981' : error ? '#ef4444' : `${theme.primary}30` }}
                    />
                    <motion.button 
                      onClick={handleValidateCode}
                      disabled={loading || !code || !!codeValid}
                      style={{ 
                        background: codeValid ? '#10b981' : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                        opacity: loading || !code || !!codeValid ? 0.7 : 1
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? <Loader2 className={styles.spinning} size={20} /> : codeValid ? 'تم' : 'تحقق'}
                    </motion.button>
                  </div>
                  {codeValid && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={styles.codeSuccess}
                    >
                      <Star size={16} fill="#f59e0b" color="#f59e0b" />
                      <span>كود صالح! {codeValid.discount_percentage && `(خصم ${codeValid.discount_percentage}%)`}</span>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {method === 'wallet' && walletBalance < pkg.price && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={styles.insufficientFunds}
                >
                  <AlertCircle size={20} color="#ef4444" />
                  <div>
                    <strong>رصيد غير كافٍ</strong>
                    <span>يرجى شحن محفظتك أولاً</span>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.errorMessage}
                >
                  <AlertCircle size={18} color="#ef4444" />
                  <span>{error}</span>
                </motion.div>
              )}

              <motion.button 
                className={styles.confirmButton}
                style={{ 
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  boxShadow: `0 10px 30px ${theme.primary}40`,
                  opacity: (method === 'wallet' && walletBalance < pkg.price) || (method === 'code' && !codeValid) ? 0.5 : 1
                }}
                whileHover={{ 
                  scale: (method === 'wallet' && walletBalance < pkg.price) || (method === 'code' && !codeValid) ? 1 : 1.02,
                  boxShadow: `0 15px 40px ${theme.primary}50`
                }}
                whileTap={{ scale: (method === 'wallet' && walletBalance < pkg.price) || (method === 'code' && !codeValid) ? 1 : 0.98 }}
                onClick={handlePurchase}
                disabled={loading || (method === 'wallet' && walletBalance < pkg.price) || (method === 'code' && !codeValid)}
              >
                {loading ? (
                  <><Loader2 className={styles.spinning} size={20} /> جاري المعالجة...</>
                ) : (
                  <><span>تأكيد الشراء</span><ArrowRight size={20} /></>
                )}
              </motion.button>

              <div className={styles.secureBadge}>
                <Shield size={16} color={theme.primary} />
                <span>معاملة آمنة ومشفرة 100%</span>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

// تأثير الاحتفال المحسّن
function ConfettiEffect({ theme }: { theme: ThemeType }) {
  return (
    <div className={styles.confettiContainer}>
      {[...Array(50)].map((_, i) => {
        const colors = [theme.primary, theme.accent, theme.secondary, '#f59e0b', '#10b981', '#ec4899']
        const color = colors[Math.floor(Math.random() * colors.length)]
        
        return (
          <motion.div
            key={i}
            className={styles.confetti}
            initial={{ 
              top: -10, 
              left: Math.random() * 100 + '%',
              rotate: 0,
              scale: 0
            }}
            animate={{ 
              top: '110%', 
              left: `${Math.random() * 100}%`,
              rotate: Math.random() * 720,
              scale: Math.random() * 0.5 + 0.5
            }}
            transition={{ 
              duration: Math.random() * 3 + 2,
              ease: "linear"
            }}
            style={{
              backgroundColor: color,
              width: Math.random() * 12 + 6,
              height: Math.random() * 12 + 6,
              borderRadius: Math.random() > 0.5 ? '50%' : Math.random() > 0.5 ? '4px' : '0'
            }}
          />
        )
      })}
    </div>
  )
}