'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Wallet, BookOpen, GraduationCap, Loader2, AlertCircle,
  Crown, Sparkles, Clock, Calendar, Medal, PlayCircle,
  CheckCircle2, ArrowLeft, ShoppingCart, RefreshCw, 
  Ticket, CreditCard, X, Shield, Gift, Zap, Star,
  ChevronLeft, TrendingUp, ArrowRight, BookMarked, Play, Info
} from 'lucide-react'
import styles from './GradePage.module.css'
import { getWalletBalance } from './actions'
import Image from 'next/image';


// أنواع البيانات
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

// الألوان المُحسّنة - متناسقة مع الصور
const themes: Record<string, ThemeType> = {
  first: {
    primary: '#e11d1d',      // Red-600
    secondary: '#be1212',    // Red-700
    accent: '#fb7171',       // Rose-400
    gradient: 'from-rose-500 via-red-600 to-rose-700',
    light: '#ffe4e4',        // Rose-100
    dark: '#881313'          // Rose-900
  },
  second: {
    primary: '#403aed',      // Violet-600
    secondary: '#3a28d9',    // Violet-700
    accent: '#8b96fa',       // Violet-400
    gradient: 'from-violet-500 via-purple-600 to-indigo-600',
    light: '#ebe9fe',        // Violet-100
    dark: '#211d95'          // Violet-900
  },
  third: {
    primary: '#03ba00',      // Orange-600
    secondary: '#037a09',    // Orange-700
    accent: '#3cfb4c',       // Orange-400
    gradient: 'from-orange-500 via-amber-600 to-orange-700',
    light: '#d5ffdb',        // Orange-100
    dark: '#006202'          // Orange-900
  }
}

// مكون الموجات المتحركة
const WaveSeparator = ({ color, flip = false }: { color: string, flip?: boolean }) => (
  <div className={`${styles.waveContainer} ${flip ? styles.waveFlip : ''}`}>
    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.waveSvg}>
      <path>
        <animate
          attributeName="d"
          dur="10s"
          repeatCount="indefinite"
          values="
            M0 64L48 58.7C96 53 192 43 288 48C384 53 480 75 576 80C672 85 768 75 864 64C960 53 1056 43 1152 48C1248 53 1344 75 1392 85.3L1440 96V0H1392C1344 0 1248 0 1152 0C1056 0 960 0 864 0C768 0 672 0 576 0C480 0 384 0 288 0C192 0 96 0 48 0H0V64Z;
            M0 96L48 85.3C96 75 192 53 288 48C384 43 480 53 576 64C672 75 768 85 864 80C960 75 1056 53 1152 48C1248 43 1344 53 1392 58.7L1440 64V0H1392C1344 0 1248 0 1152 0C1056 0 960 0 864 0C768 0 672 0 576 0C480 0 384 0 288 0C192 0 96 0 48 0H0V96Z;
            M0 64L48 58.7C96 53 192 43 288 48C384 53 480 75 576 80C672 85 768 75 864 64C960 53 1056 43 1152 48C1248 53 1344 75 1392 85.3L1440 96V0H1392C1344 0 1248 0 1152 0C1056 0 960 0 864 0C768 0 672 0 576 0C480 0 384 0 288 0C192 0 96 0 48 0H0V64Z
          "
        />
      </path>
    </svg>
  </div>
)

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
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

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

  // جلب البيانات
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
        .order('created_at', { ascending: false })

      if (packagesError) throw packagesError
      
      const enhancedPackages = packagesData?.map(pkg => ({
        ...pkg,
        features: pkg.features || [
          `${pkg.lecture_count} محاضرة تفاعلية`,
          'وصول كامل لمدة ' + pkg.duration_days + ' يوم',
          'دعم فني على مدار الساعة',
          'شهادة إتمام'
        ],
        original_price: pkg.type === 'offer' ? Math.round(pkg.price * 1.3) : undefined
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

  const getGradeIcon = () => {
    switch(gradeSlug) {
      case 'first': return '1st'
      case 'second': return '2nd'
      case 'third': return '3rd'
      default: return '1st'
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <motion.div 
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1]
            }} 
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            }}
            className={styles.loadingIcon}
            style={{ color: theme.primary }}
          >
            <GraduationCap size={80} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={styles.loadingText}
          >
            <h3 style={{ color: theme.primary }}>جاري تحميل البيانات...</h3>
            <p>نحضر لك أفضل محتوى تعليمي</p>
          </motion.div>
          <div className={styles.loadingBars}> {[0, 1, 2].map((i) => ( <motion.div key={i} className={styles.loadingBar} animate={{ height: ["20%", "80%", "20%"], backgroundColor: [theme.primary, theme.accent, theme.primary] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }} /> ))} </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} ref={containerRef} dir="rtl">
      {/* Progress Bar */}
      <motion.div 
        className={styles.progressBar}
        style={{ 
          scaleX,
          background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`
        }}
      />

      {/* Header Section with Waves */}
      <header className={styles.proHeader} style={{ 
        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` 
      }}>
        <div className={styles.headerPattern} />
        
        <div className={styles.proHeaderContent}>
          {/* Top Bar */}
          <motion.div 
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={styles.topBar}
          >
            <div className={styles.brandSection}>
              <div className={styles.brandLogo}>


            <div className={styles.logoCircle}>
              <Image
                src="/icon.png"
                alt="Logo"
                width={50}
                height={50}
                className={styles.logoImage}
                priority
              />
                              </div>

                </div>
              <div className={styles.brandText}>
                <h1>البارع محمود الديب</h1>
                <span>أستاذ اللغة العربية للمرحلة الثانوية</span>
              </div>
            </div>

            {user ? (
              <motion.div 
                className={styles.walletBadge}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={styles.walletIconBg}>
                  <Wallet size={20} color={theme.primary} />
                </div>
                <div className={styles.walletInfo}>
                  <span className={styles.walletLabel}>رصيدك</span>
                  <span className={styles.walletAmount}>{walletBalance.toLocaleString()} ج.م</span>
                </div>
                <button 
                  className={styles.refreshIconBtn}
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw size={14} className={isRefreshing ? styles.spinning : ''} />
                </button>
              </motion.div>
            ) : (
              <motion.button
                className={styles.loginBtnPro}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(`/login?returnUrl=/grades/${gradeSlug}`)}
              >
                تسجيل الدخول
                <ArrowLeft size={18} />
              </motion.button>
            )}
          </motion.div>

          {/* Grade Title Section */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={styles.gradeTitleSection}
          >
            <div className={styles.gradeBadgeLarge} style={{ background: 'rgba(255,255,255,0.2)' }}>
              <span className={styles.gradeIconText}>{getGradeIcon()}</span>
              <GraduationCap size={48} color="white" />
            </div>
            <h2 className={styles.gradeTitle}>{getGradeName()}</h2>
            <p className={styles.gradeSubtitle}>اختر باقتك وابدأ رحلة التميز مع أفضل المحتوى التعليمي</p>
          </motion.div>
        </div>

        {/* Animated Waves */}
        <div className={styles.waveWrapper}>
          <svg viewBox="0 0 1440 120" className={styles.waveSvg} preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={theme.primary} stopOpacity="0.4" />
                <stop offset="100%" stopColor={theme.accent} stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={theme.primary} stopOpacity="0.6" />
                <stop offset="100%" stopColor={theme.secondary} stopOpacity="0.2" />
              </linearGradient>
            </defs>
            
            <motion.path
              fill="url(#waveGradient1)"
              d="M0,60 C360,120 720,0 1080,60 C1260,90 1350,30 1440,60 L1440,120 L0,120 Z"
              animate={{
                d: [
                  "M0,60 C360,120 720,0 1080,60 C1260,90 1350,30 1440,60 L1440,120 L0,120 Z",
                  "M0,80 C360,40 720,100 1080,40 C1260,10 1350,70 1440,40 L1440,120 L0,120 Z",
                  "M0,60 C360,120 720,0 1080,60 C1260,90 1350,30 1440,60 L1440,120 L0,120 Z"
                ]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            
            <motion.path
              fill="rgba(255,255,255,0.9)"
              d="M0,80 C480,20 960,100 1440,60 L1440,120 L0,120 Z"
              animate={{
                d: [
                  "M0,80 C480,20 960,100 1440,60 L1440,120 L0,120 Z",
                  "M0,60 C480,100 960,20 1440,80 L1440,120 L0,120 Z",
                  "M0,80 C480,20 960,100 1440,60 L1440,120 L0,120 Z"
                ]
              }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
          </svg>
        </div>
      </header>

      {/* Tabs Section */}
      <div className={styles.tabsSection}>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={styles.tabsContainer}
        >
          <div className={styles.tabsWrapper}>
            <button 
              className={`${styles.proTab} ${activeTab === 'all' ? styles.active : ''}`}
              onClick={() => setActiveTab('all')}
              style={{ '--theme-color': theme.primary } as any}
            >
              <Sparkles size={18} />
              <span>جميع الباقات</span>
              <span className={styles.tabBadge}>{purchased.length + available.length + offers.length}</span>
            </button>
            
            <button 
              className={`${styles.proTab} ${activeTab === 'purchased' ? styles.active : ''}`}
              onClick={() => setActiveTab('purchased')}
              style={{ '--theme-color': '#10b981' } as any}
            >
              <CheckCircle2 size={18} />
              <span>اشتراكاتي</span>
              {purchased.length > 0 && (
                <span className={styles.tabBadge} style={{ background: '#10b981' }}>{purchased.length}</span>
              )}
            </button>
            
            <button 
              className={`${styles.proTab} ${activeTab === 'offers' ? styles.active : ''}`}
              onClick={() => setActiveTab('offers')}
              style={{ '--theme-color': '#f59e0b' } as any}
            >
              <Zap size={18} />
              <span>عروض خاصة</span>
              {offers.length > 0 && (
                <span className={styles.tabBadge} style={{ background: '#f59e0b' }}>{offers.length}</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Stats Overview */}
        {user && (
          <motion.section 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={styles.statsSection}
          >
            <div className={styles.statCardPro} style={{ '--theme-color': theme.primary } as any}>
              <div className={styles.statIconPro}>
                <BookMarked size={24} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statNumber}>{purchased.length}</span>
                <span className={styles.statLabel}>باقة نشطة</span>
              </div>
            </div>
            
            <div className={styles.statCardPro} style={{ '--theme-color': theme.accent } as any}>
              <div className={styles.statIconPro}>
                <PlayCircle size={24} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statNumber}>
                  {purchased.reduce((acc, p) => acc + (p.lecture_count || 0), 0)}
                </span>
                <span className={styles.statLabel}>محاضرة</span>
              </div>
            </div>
            
            <div className={styles.statCardPro} style={{ '--theme-color': theme.secondary } as any}>
              <div className={styles.statIconPro}>
                <Clock size={24} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statNumber}>
                  {Math.max(0, ...userPackages.map(up => 
                    Math.ceil((new Date(up.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  )) || 0}
                </span>
                <span className={styles.statLabel}>يوم متبقي</span>
              </div>
            </div>
          </motion.section>
        )}

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={styles.errorAlertPro}
            >
              <AlertCircle size={20} />
              <span>{error}</span>
              <button onClick={fetchData}>إعادة المحاولة</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section Title */}
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <span style={{ color: theme.primary }}>أحدث</span> الكورسات
          </h3>
          <div className={styles.sectionLine} style={{ background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)` }} />
        </div>

        {/* Packages Grid */}
        <motion.div layout className={styles.proGrid}>
          <AnimatePresence mode="popLayout">
            {filteredPackages.map((pkg: any, index) => (
              <PackageCardPro 
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
            className={styles.emptyStatePro}
          >
            <div className={styles.emptyIconPro} style={{ background: theme.light, color: theme.primary }}>
              <BookOpen size={64} />
            </div>
            <h3>لا توجد باقات متاحة حالياً</h3>
            <p>سيتم إضافة باقات جديدة قريباً...</p>
          </motion.div>
        )}
      </main>

      {/* Purchase Modal */}
      <AnimatePresence>
        {showPurchaseModal && selectedPackage && user && (
          <PurchaseModalPro 
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

      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && <ConfettiEffect />}
      </AnimatePresence>
    </div>
  )
}

// مكون بطاقة الباقة المحترفة
function PackageCardPro({ pkg, isPurchased, theme, index, onPurchase, onEnter }: any) {
  const getTypeIcon = () => {
    switch (pkg.type) {
      case 'weekly': return <Clock size={20} />
      case 'monthly': return <Calendar size={20} />
      case 'term': return <Medal size={20} />
      case 'offer': return <Crown size={20} />
      default: return <BookOpen size={20} />
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
      transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
      whileHover={{ y: -10, transition: { type: "spring", stiffness: 300 } }}
      className={`${styles.proCard} ${isPurchased ? styles.purchased : ''}`}
    >
      {/* Image Section */}
      <div className={styles.cardImageSection}>
        {pkg.image_url ? (
          <img src={pkg.image_url} alt={pkg.name} loading="lazy" />
        ) : (
          <div className={styles.cardImagePlaceholder} style={{ 
            background: `linear-gradient(135deg, ${theme.light}, white)` 
          }}>
            <Play size={48} style={{ color: theme.primary, opacity: 0.5 }} />
          </div>
        )}
        
        {/* Overlay Gradient */}
        <div className={styles.cardImageOverlay} />
        
        {/* Type Badge */}
        <div className={styles.typeBadge} style={{ 
          background: theme.primary,
          boxShadow: `0 4px 15px ${theme.primary}50`
        }}>
          {getTypeIcon()}
          <span>{getTypeLabel()}</span>
        </div>

        {/* Discount Badge */}
        {pkg.original_price && (
          <div className={styles.discountBadgePro}>
            خصم {Math.round((1 - pkg.price/pkg.original_price) * 100)}%
          </div>
        )}

        {/* Purchased Badge */}
        {isPurchased && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={styles.purchasedBadge}
          >
            <CheckCircle2 size={16} />
            <span>مشترك</span>
          </motion.div>
        )}
      </div>

      {/* Content Section */}
      <div className={styles.cardContentSection}>
        <h3 className={styles.cardTitlePro}>{pkg.name}</h3>
        <p className={styles.cardDescriptionPro}>{pkg.description}</p>

        {/* Features */}
        <div className={styles.featuresPro}>
          {pkg.features?.slice(0, 3).map((feature: string, i: number) => (
            <div key={i} className={styles.featureItem}>
              <CheckCircle2 size={14} style={{ color: theme.primary }} />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <PlayCircle size={16} style={{ color: theme.primary }} />
            <span>{pkg.lecture_count} محاضرة</span>
          </div>
          <div className={styles.statItem}>
            <Clock size={16} style={{ color: theme.primary }} />
            <span>{pkg.duration_days} يوم</span>
          </div>
        </div>

        {/* Expiry Warning */}
        {pkg.expires_at && (
          <div className={styles.expiryWarning}>
            <Calendar size={14} />
            <span>ينتهي: {new Date(pkg.expires_at).toLocaleDateString('ar-EG')}</span>
          </div>
        )}

        {/* Price & Action */}
        <div className={styles.cardFooterPro}>
          <div className={styles.priceBlock}>
            {pkg.original_price && (
              <span className={styles.oldPricePro}>{pkg.original_price.toLocaleString()} ج.م</span>
            )}
            <span className={styles.pricePro} style={{ color: theme.primary }}>
              {pkg.price.toLocaleString()}
              <small> جنيه</small>
            </span>
          </div>

          {isPurchased ? (
            <motion.button
              className={styles.enterBtnPro}
              style={{ background: '#10b981' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onEnter}
            >
              <span>دخول للكورس</span>
              <ChevronLeft size={18} />
            </motion.button>
          ) : (
            <motion.button
              className={styles.buyBtnPro}
              style={{ 
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                boxShadow: `0 4px 15px ${theme.primary}40`
              }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: `0 6px 20px ${theme.primary}60`
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

// مكون مودال الشراء المحترف
// في أعلى الملف، تأكد من وجود هذا الاستيراد
import { deductWalletBalance, markCodeAsUsed, createUserPackage, validateCode } from './actions'

// ============================================================================
// مكون مودال الشراء المعدل (PurchaseModalPro)
// ============================================================================
function PurchaseModalPro({ pkg, user, walletBalance, theme, onClose, onSuccess, gradeSlug }: any) {
  const [method, setMethod] = useState<'wallet' | 'code'>('wallet')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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

  // ============================================================================
  // دالة الشراء الحقيقية (المعدلة)
  // ============================================================================
  const handlePurchase = async () => {
    setLoading(true)
    setError('')

    try {
      // ------------------------------------------------------------------
      // 1. الشراء عبر المحفظة
      // ------------------------------------------------------------------
      if (method === 'wallet') {
        // التحقق من الرصيد أولاً (للـ UI سريع)
        if (walletBalance < pkg.price) {
          throw new Error('رصيد غير كافٍ في المحفظة')
        }

        // خصم المبلغ من المحفظة
        const deductResult = await deductWalletBalance(user.id, pkg.price, pkg.id)
        if (!deductResult.success) {
          throw new Error(deductResult.message || 'فشل خصم المبلغ من المحفظة')
        }

        // إنشاء اشتراك المستخدم
        const createResult = await createUserPackage(
          user.id, 
          pkg.id, 
          pkg.duration_days || 30, 
          'wallet'
        )
        
        if (!createResult.success) {
          // في حالة فشل إنشاء الاشتراك، النظام يحتاج لـ rollback (استرجاع المبلغ)
          // هذا يتم عادة في transaction، لكن هنا نكتفي بإظهار الخطأ
          throw new Error(createResult.message || 'فشل في تفعيل الباقة بعد الدفع')
        }

      // ------------------------------------------------------------------
      // 2. الشراء عبر الكود
      // ------------------------------------------------------------------
      } else if (method === 'code') {
        if (!code.trim()) {
          throw new Error('أدخل كود التفعيل أولاً')
        }

        // التحقق من صحة الكود مباشرة
        const validateResult = await validateCode(code, gradeSlug, pkg.id)
        if (!validateResult.success) {
          throw new Error(validateResult.message || 'كود غير صالح')
        }

        // تحديث حالة الكود إلى "مستخدم"
        const markResult = await markCodeAsUsed(validateResult.data.id, user.id)
        if (!markResult.success) {
          throw new Error(markResult.message || 'فشل في استخدام الكود')
        }

        // إنشاء الاشتراك
        const createResult = await createUserPackage(
          user.id, 
          pkg.id, 
          pkg.duration_days || 30, 
          'code'
        )
        
        if (!createResult.success) {
          throw new Error(createResult.message || 'فشل في تفعيل الباقة')
        }
      }

      // ------------------------------------------------------------------
      // 3. نجاح الشراء - إظهار رسالة النجاح والكونفيتي
      // ------------------------------------------------------------------
      setShowSuccess(true)
      
      // إضافة إشعار في قاعدة البيانات
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'تم الشراء بنجاح! 🎉',
        message: `تم تفعيل ${pkg.name}`,
        type: 'success'
      })

      // الانتظار قليلاً ثم إغلاق المودال وتحديث البيانات
      setTimeout(() => {
        onSuccess() // هذا يستدعي handleRefresh لتحديث الباقات والرصيد
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء عملية الشراء')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      className={styles.modalOverlayPro}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className={styles.modalPro}
        initial={{ scale: 0.9, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 50, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {showSuccess ? (
          <div className={styles.successStatePro}>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={styles.successIconPro}
              style={{ background: theme.light }}
            >
              <CheckCircle2 size={60} color={theme.primary} />
            </motion.div>
            <h3>تم الشراء بنجاح! 🎉</h3>
            <p>يمكنك الآن الوصول إلى جميع محتويات الباقة</p>
          </div>
        ) : (
          <>
            <button className={styles.closeBtnPro} onClick={onClose}>
              <X size={24} />
            </button>

            <div className={styles.modalHeaderPro} style={{ 
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` 
            }}>
              <div className={styles.modalIconPro}>
                <Gift size={40} color="white" />
              </div>
              <h3>{pkg.name}</h3>
              <div className={styles.modalPrice}>
                <span>{pkg.price.toLocaleString()}</span>
                <small>جنية مصري</small>
              </div>
              {pkg.original_price && (
                <span className={styles.modalOldPrice}>{pkg.original_price.toLocaleString()} ج.م</span>
              )}
            </div>

            <div className={styles.modalBodyPro}>
              {/* اختيار طريقة الدفع */}
              <div className={styles.methodsGrid}>
                <motion.button 
                  className={`${styles.methodCardPro} ${method === 'wallet' ? styles.active : ''}`}
                  onClick={() => {
                    setMethod('wallet')
                    setError('') // مسح الأخطاء عند التبديل
                  }}
                  whileHover={{ scale: 1.02 }}
                  style={method === 'wallet' ? { borderColor: theme.primary } : {}}
                >
                  <div className={styles.methodIconPro} style={{ background: theme.primary }}>
                    <CreditCard size={24} color="white" />
                  </div>
                  <div className={styles.methodInfoPro}>
                    <strong>الدفع من المحفظة</strong>
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
                  className={`${styles.methodCardPro} ${method === 'code' ? styles.active : ''}`}
                  onClick={() => {
                    setMethod('code')
                    setError('') // مسح الأخطاء عند التبديل
                  }}
                  whileHover={{ scale: 1.02 }}
                  style={method === 'code' ? { borderColor: '#f59e0b' } : {}}
                >
                  <div className={styles.methodIconPro} style={{ background: '#f59e0b' }}>
                    <Ticket size={24} color="white" />
                  </div>
                  <div className={styles.methodInfoPro}>
                    <strong>كود تفعيل</strong>
                    <span>لديك كود خصم؟</span>
                  </div>
                </motion.button>
              </div>

              {/* حقل إدخال الكود (يظهر فقط عند اختيار الكود) */}
              {method === 'code' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={styles.codeSection}
                >
                  <div className={styles.codeInputPro} style={{ flexDirection: 'column', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      value={code} 
                      onChange={e => setCode(e.target.value.toUpperCase())} 
                      placeholder="أدخل كود التفعيل هنا (مثال: SAVE20)"
                      maxLength={20}
                      style={{ textAlign: 'center', fontSize: '1.1rem' }}
                    />
                    <small style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                      سيتم التحقق من الكود عند الضغط على "تأكيد الشراء"
                    </small>
                  </div>
                </motion.div>
              )}

              {/* رسالة خطأ الرصيد غير الكافي */}
              {method === 'wallet' && walletBalance < pkg.price && (
                <div className={styles.insufficientPro}>
                  <AlertCircle size={24} color="#ef4444" />
                  <div>
                    <strong>رصيد غير كافٍ</strong>
                    <span>يرجى شحن محفظتك أولاً. الرصيد المطلوب: {pkg.price.toLocaleString()} ج.م</span>
                  </div>
                </div>
              )}

              {/* رسالة خطأ عامة */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.errorMessagePro}
                >
                  <Info size={18} />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* زر تأكيد الشراء */}
              <motion.button 
                className={styles.confirmBtnPro}
                style={{ 
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  opacity: (method === 'wallet' && walletBalance < pkg.price) ? 0.5 : 1
                }}
                whileHover={{ 
                  scale: (method === 'wallet' && walletBalance < pkg.price) ? 1 : 1.02 
                }}
                whileTap={{ 
                  scale: (method === 'wallet' && walletBalance < pkg.price) ? 1 : 0.98 
                }}
                onClick={handlePurchase}
                disabled={loading || (method === 'wallet' && walletBalance < pkg.price)}
              >
                {loading ? (
                  <><Loader2 className={styles.spinning} size={20} /> جاري معالجة الشراء...</>
                ) : (
                  <><span>تأكيد الشراء</span><ArrowRight size={20} /></>
                )}
              </motion.button>

              <div className={styles.secureBadgePro}>
                <Shield size={16} />
                <span>معاملة آمنة ومشفرة 100%</span>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// تأثير الكونفيتي
function ConfettiEffect() {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#e11d48', '#10b981']
  
  return (
    <div className={styles.confettiContainer}>
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            y: -20, 
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            rotate: 0,
            scale: 0
          }}
          animate={{ 
            y: typeof window !== 'undefined' ? window.innerHeight + 20 : 800,
            rotate: Math.random() * 720,
            scale: Math.random() * 0.8 + 0.2
          }}
          transition={{ 
            duration: Math.random() * 3 + 2,
            ease: "linear"
          }}
          style={{
            position: 'absolute',
            width: Math.random() * 12 + 8,
            height: Math.random() * 12 + 8,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            top: 0
          }}
        />
      ))}
    </div>
  )
}