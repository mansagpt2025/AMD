'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Wallet, BookOpen, GraduationCap, Loader2, AlertCircle,
  Crown, Sparkles, Clock, Calendar, Medal, PlayCircle,
  CheckCircle2, ArrowRight, ShoppingCart, RefreshCw, 
  Ticket, CreditCard, X, Shield, Gift, Zap, Star,
  ChevronLeft, TrendingUp, Award, BookMarked, Hexagon,
  Diamond, Layers, Play, Pause, Sparkle, ArrowUpRight,
  Fingerprint, Lock, Unlock, Info, Check
} from 'lucide-react'
import styles from './GradePage.module.css'
import { 
  deductWalletBalance, 
  markCodeAsUsed, 
  createUserPackage, 
  validateCode,
  getWalletBalance 
} from './actions'

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
  surface: string
}

// الألوان الخاصة بكل صف - تصميم متناسق أنيق
const themes: Record<string, ThemeType> = {
  first: {
    primary: '#4f46e5',
    secondary: '#7c3aed',
    accent: '#06b6d4',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    light: '#eef2ff',
    dark: '#3730a3',
    surface: '#ffffff'
  },
  second: {
    primary: '#0891b2',
    secondary: '#0e7490',
    accent: '#22d3ee',
    gradient: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
    light: '#ecfeff',
    dark: '#155e75',
    surface: '#ffffff'
  },
  third: {
    primary: '#ea580c',
    secondary: '#dc2626',
    accent: '#fbbf24',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
    light: '#fff7ed',
    dark: '#9a3412',
    surface: '#ffffff'
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
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

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

  const getGradeIcon = () => {
    switch(gradeSlug) {
      case 'first': return <BookOpen size={32} />
      case 'second': return <Layers size={32} />
      case 'third': return <GraduationCap size={32} />
      default: return <BookOpen size={32} />
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer} style={{ background: theme.light }}>
        <div className={styles.loadingWrapper}>
          <motion.div 
            className={styles.loadingLogo}
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ color: theme.primary }}
          >
            <Hexagon size={80} strokeWidth={1.5} />
          </motion.div>
          <motion.div
            className={styles.loadingContent}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 style={{ color: theme.dark }}>جاري التحميل...</h2>
            <div className={styles.loadingProgress}>
              <motion.div 
                className={styles.progressBar}
                style={{ background: theme.gradient }}
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </div>
            <p>نحضر لك أفضل المحتوى التعليمي</p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} ref={containerRef}>
      {/* شريط التقدم العلوي */}
      <motion.div 
        className={styles.progressBarTop}
        style={{ 
          scaleX,
          background: theme.gradient
        }}
      />

      {/* تأثيرات الخلفية المتقدمة */}
      <div className={styles.backgroundEffects}>
        <div className={styles.gradientMesh}>
          <div className={styles.blob1} style={{ background: theme.primary }} />
          <div className={styles.blob2} style={{ background: theme.secondary }} />
          <div className={styles.blob3} style={{ background: theme.accent }} />
        </div>
        <div className={styles.noiseOverlay} />
        <div className={styles.gridPattern} />
      </div>

      {/* المحتوى الرئيسي */}
      <div className={styles.contentWrapper}>
        {/* الهيدر المتقدم */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={styles.brand}
            >
              <div 
                className={styles.logoContainer}
                style={{ 
                  background: theme.gradient,
                  boxShadow: `0 20px 40px -10px ${theme.primary}40`
                }}
              >
                <Crown size={28} color="white" />
              </div>
              <div className={styles.brandInfo}>
                <h1>البارع محمود الديب</h1>
                <span>منصة التميز الأكاديمي</span>
              </div>
            </motion.div>

            {user ? (
              <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={styles.walletContainer}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={styles.walletCard} style={{ borderColor: theme.primary + '20' }}>
                  <div className={styles.walletIcon} style={{ background: theme.light, color: theme.primary }}>
                    <Wallet size={22} />
                  </div>
                  <div className={styles.walletInfo}>
                    <span className={styles.walletLabel}>الرصيد المتاح</span>
                    <span className={styles.walletAmount} style={{ color: theme.dark }}>
                      {walletBalance.toLocaleString()} <small>ج.م</small>
                    </span>
                  </div>
                  <motion.button 
                    className={styles.refreshButton}
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    whileHover={{ rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    style={{ color: theme.primary }}
                  >
                    <RefreshCw size={18} className={isRefreshing ? styles.spinning : ''} />
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={styles.loginButton}
                style={{ background: theme.gradient }}
                whileHover={{ scale: 1.05, boxShadow: `0 20px 40px -10px ${theme.primary}50` }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(`/login?returnUrl=/grades/${gradeSlug}`)}
              >
                <span>تسجيل الدخول</span>
                <ArrowUpRight size={20} />
              </motion.button>
            )}
          </div>

          {/* بطاقة الصف الدراسي الرئيسية */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={styles.heroSection}
          >
            <div className={styles.heroContent}>
              <motion.div 
                className={styles.gradeIconWrapper}
                style={{ 
                  background: theme.gradient,
                  boxShadow: `0 30px 60px -15px ${theme.primary}40`
                }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                {getGradeIcon()}
              </motion.div>
              
              <div className={styles.heroText}>
                <h2 style={{ color: theme.dark }}>{getGradeName()}</h2>
                <p>اختر باقتك التعليمية وابدأ رحلة التميز معنا</p>
              </div>

              {user && (
                <motion.div 
                  className={styles.quickStats}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className={styles.statItem}>
                    <BookMarked size={18} style={{ color: theme.primary }} />
                    <span>{purchased.length} باقة نشطة</span>
                  </div>
                  <div className={styles.divider} />
                  <div className={styles.statItem}>
                    <PlayCircle size={18} style={{ color: theme.primary }} />
                    <span>{purchased.reduce((acc, p) => acc + (p.lecture_count || 0), 0)} محاضرة</span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* التبويبات المتقدمة */}
          <motion.nav 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={styles.tabsNav}
          >
            <div className={styles.tabsContainer}>
              <button 
                className={`${styles.tabButton} ${activeTab === 'all' ? styles.active : ''}`}
                onClick={() => setActiveTab('all')}
                style={{ 
                  '--active-color': theme.primary,
                  '--active-bg': theme.light 
                } as any}
              >
                <Layers size={18} />
                <span>جميع الباقات</span>
                <span className={styles.badge} style={{ background: theme.light, color: theme.primary }}>
                  {purchased.length + available.length + offers.length}
                </span>
              </button>
              
              {purchased.length > 0 && (
                <button 
                  className={`${styles.tabButton} ${activeTab === 'purchased' ? styles.active : ''}`}
                  onClick={() => setActiveTab('purchased')}
                  style={{ 
                    '--active-color': '#059669',
                    '--active-bg': '#ecfdf5'
                  } as any}
                >
                  <CheckCircle2 size={18} />
                  <span>اشتراكاتي</span>
                  <span className={styles.badge} style={{ background: '#10b981', color: 'white' }}>
                    {purchased.length}
                  </span>
                </button>
              )}
              
              {offers.length > 0 && (
                <button 
                  className={`${styles.tabButton} ${activeTab === 'offers' ? styles.active : ''}`}
                  onClick={() => setActiveTab('offers')}
                  style={{ 
                    '--active-color': '#ea580c',
                    '--active-bg': '#fff7ed'
                  } as any}
                >
                  <Sparkle size={18} />
                  <span>عروض خاصة</span>
                  <span className={styles.badge} style={{ background: '#f97316', color: 'white' }}>
                    {offers.length}
                  </span>
                </button>
              )}
            </div>
          </motion.nav>
        </header>

        {/* المحتوى الرئيسي */}
        <main className={styles.main}>
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={styles.errorAlert}
                style={{ borderRightColor: '#ef4444' }}
              >
                <AlertCircle size={24} color="#ef4444" />
                <div className={styles.errorContent}>
                  <h4>حدث خطأ</h4>
                  <p>{error}</p>
                </div>
                <button onClick={fetchData} className={styles.retryButton}>
                  <RefreshCw size={16} />
                  إعادة المحاولة
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* شبكة الباقات المتقدمة */}
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
                  isHovered={hoveredCard === pkg.id}
                  setHovered={(id: string | null) => setHoveredCard(id)}
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
              <div 
                className={styles.emptyIcon}
                style={{ 
                  background: theme.light,
                  color: theme.primary
                }}
              >
                <BookOpen size={48} />
              </div>
              <h3>لا توجد باقات متاحة</h3>
              <p>سيتم إضافة باقات جديدة قريباً. تابعنا للمزيد!</p>
            </motion.div>
          )}
        </main>
      </div>

      {/* مودال الشراء المتقدم */}
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

      {/* تأثير الاحتفال المتقدم */}
      <AnimatePresence>
        {showConfetti && <ConfettiEffect theme={theme} />}
      </AnimatePresence>
    </div>
  )
}

// مكون بطاقة الباقة المتقدم
function PackageCard({ 
  pkg, 
  isPurchased, 
  theme, 
  index, 
  onPurchase, 
  onEnter,
  isHovered,
  setHovered
}: any) {
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
      case 'offer': return 'عرض خاص'
      default: return 'عام'
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ 
        delay: index * 0.08, 
        type: "spring", 
        stiffness: 100,
        damping: 15
      }}
      className={`${styles.packageCard} ${isPurchased ? styles.purchased : ''} ${pkg.type === 'offer' ? styles.offer : ''}`}
      onMouseEnter={() => setHovered(pkg.id)}
      onMouseLeave={() => setHovered(null)}
      style={{
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
      }}
    >
      {/* تأثير الإضاءة المتحرك */}
      <div 
        className={styles.cardGlow}
        style={{
          background: `radial-gradient(circle at 50% -20%, ${theme.primary}20, transparent 70%)`,
          opacity: isHovered ? 1 : 0
        }}
      />

      {/* الشريط العلوي الملون */}
      <div 
        className={styles.cardTopBar}
        style={{ 
          background: isPurchased 
            ? 'linear-gradient(90deg, #10b981, #059669)' 
            : pkg.type === 'offer'
            ? 'linear-gradient(90deg, #f59e0b, #ea580c)'
            : theme.gradient
        }}
      />

      {/* شارة الحالة */}
      <div className={styles.cardBadges}>
        {(isPurchased || pkg.type === 'offer') && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={styles.statusBadge}
            style={{
              background: isPurchased 
                ? 'linear-gradient(135deg, #10b981, #059669)' 
                : 'linear-gradient(135deg, #f59e0b, #ea580c)'
            }}
          >
            {isPurchased ? (
              <>
                <Check size={14} />
                <span>مفعل</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>عرض محدود</span>
              </>
            )}
          </motion.div>
        )}

        {pkg.original_price && (
          <div className={styles.discountBadge}>
            <span>وفر {Math.round((1 - pkg.price/pkg.original_price) * 100)}%</span>
          </div>
        )}
      </div>

      {/* الجزء المرئي */}
      <div className={styles.cardVisual}>
        <div 
          className={styles.cardImage}
          style={{ background: theme.light }}
        >
          {pkg.image_url ? (
            <img src={pkg.image_url} alt={pkg.name} loading="lazy" />
          ) : (
            <div className={styles.placeholderImage} style={{ color: theme.primary }}>
              {getTypeIcon()}
            </div>
          )}
          <div className={styles.imageOverlay} />
        </div>

        {/* نوع الباقة */}
        <div 
          className={styles.typeChip}
          style={{ 
            background: theme.surface,
            color: theme.dark,
            borderColor: theme.primary + '20'
          }}
        >
          {getTypeIcon()}
          <span>{getTypeLabel()}</span>
        </div>
      </div>

      {/* المحتوى */}
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle} style={{ color: theme.dark }}>
          {pkg.name}
        </h3>
        <p className={styles.cardDescription}>{pkg.description}</p>

        {/* المميزات */}
        <ul className={styles.featuresList}>
          {pkg.features?.slice(0, 3).map((feature: string, i: number) => (
            <motion.li 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + (i * 0.05) }}
            >
              <div 
                className={styles.featureIcon}
                style={{ background: theme.light, color: theme.primary }}
              >
                <Check size={12} />
              </div>
              <span>{feature}</span>
            </motion.li>
          ))}
        </ul>

        {/* الإحصائيات السريعة */}
        <div className={styles.quickInfo}>
          <div className={styles.infoItem}>
            <PlayCircle size={16} style={{ color: theme.primary }} />
            <span>{pkg.lecture_count} محاضرة</span>
          </div>
          <div className={styles.infoDivider} />
          <div className={styles.infoItem}>
            <Clock size={16} style={{ color: theme.primary }} />
            <span>{pkg.duration_days} يوم</span>
          </div>
        </div>

        {/* تاريخ الانتهاء */}
        {pkg.expires_at && (
          <div className={styles.expiryBadge}>
            <Calendar size={14} />
            <span>ينتهي {new Date(pkg.expires_at).toLocaleDateString('ar-EG')}</span>
          </div>
        )}

        {/* السعر والزر */}
        <div className={styles.cardFooter}>
          <div className={styles.priceSection}>
            {pkg.original_price && (
              <span className={styles.oldPrice}>{pkg.original_price.toLocaleString()} ج.م</span>
            )}
            <div className={styles.currentPrice}>
              <span style={{ color: theme.dark }}>{pkg.price.toLocaleString()}</span>
              <small>جنية مصري</small>
            </div>
          </div>

          {isPurchased ? (
            <motion.button
              className={styles.enterBtn}
              style={{ background: '#10b981' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onEnter}
            >
              <span>دخول للباقة</span>
              <ChevronLeft size={18} />
            </motion.button>
          ) : (
            <motion.button
              className={styles.buyBtn}
              style={{ 
                background: theme.gradient,
                boxShadow: `0 10px 25px -5px ${theme.primary}40`
              }}
              whileHover={{ 
                scale: 1.05, 
                boxShadow: `0 20px 35px -10px ${theme.primary}60` 
              }}
              whileTap={{ scale: 0.95 }}
              onClick={onPurchase}
            >
              <span>اشتري الآن</span>
              <ShoppingCart size={18} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// مكون مودال الشراء المتقدم
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
  const [isValidating, setIsValidating] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  const handleValidateCode = async () => {
    if (!code.trim()) { setError('أدخل الكود أولاً'); return }
    setIsValidating(true); setError('')
    try {
      const result = await validateCode(code, gradeSlug, pkg.id)
      if (!result.success) throw new Error(result.message)
      setCodeValid(result.data)
    } catch (err: any) {
      setError(err.message); setCodeValid(null)
    } finally { setIsValidating(false) }
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
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        className={styles.modalContainer}
        onClick={e => e.stopPropagation()}
      >
        {showSuccess ? (
          <div className={styles.successState}>
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className={styles.successIcon}
              style={{ background: theme.gradient }}
            >
              <Check size={40} color="white" />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              تم الشراء بنجاح!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              يمكنك الآن الوصول إلى جميع محتويات الباقة
            </motion.p>
            <motion.div
              className={styles.successConfetti}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 0, x: 0, opacity: 1 }}
                  animate={{ 
                    y: -100 - Math.random() * 100,
                    x: (Math.random() - 0.5) * 200,
                    opacity: 0,
                    rotate: Math.random() * 360
                  }}
                  transition={{ duration: 1, delay: i * 0.05 }}
                  style={{
                    position: 'absolute',
                    width: 10,
                    height: 10,
                    background: theme.primary,
                    borderRadius: '50%',
                    left: '50%',
                    top: '50%'
                  }}
                />
              ))}
            </motion.div>
          </div>
        ) : (
          <>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={24} />
            </button>

            <div className={styles.modalHeader} style={{ background: theme.light }}>
              <div className={styles.packageIcon} style={{ background: theme.gradient }}>
                <Gift size={32} color="white" />
              </div>
              <h3>{pkg.name}</h3>
              <div className={styles.priceDisplay}>
                <span style={{ color: theme.dark }}>{pkg.price.toLocaleString()}</span>
                <small>جنية مصري</small>
              </div>
              {pkg.original_price && (
                <span className={styles.originalPriceDisplay}>
                  {pkg.original_price.toLocaleString()} ج.م
                </span>
              )}
            </div>

            <div className={styles.modalBody}>
              {/* طرق الدفع */}
              <div className={styles.paymentMethods}>
                <button 
                  className={`${styles.methodBtn} ${method === 'wallet' ? styles.active : ''}`}
                  onClick={() => setMethod('wallet')}
                  style={method === 'wallet' ? { borderColor: theme.primary } : {}}
                >
                  <div className={styles.methodIcon} style={{ background: theme.light, color: theme.primary }}>
                    <Wallet size={24} />
                  </div>
                  <div className={styles.methodDetails}>
                    <strong>الدفع من المحفظة</strong>
                    <span>رصيدك: {walletBalance.toLocaleString()} ج.م</span>
                  </div>
                  <div className={styles.methodCheck} style={{ 
                    background: walletBalance >= pkg.price ? '#10b981' : '#ef4444',
                    opacity: method === 'wallet' ? 1 : 0
                  }}>
                    {walletBalance >= pkg.price ? <Check size={16} color="white" /> : <AlertCircle size={16} color="white" />}
                  </div>
                </button>

                <button 
                  className={`${styles.methodBtn} ${method === 'code' ? styles.active : ''}`}
                  onClick={() => setMethod('code')}
                  style={method === 'code' ? { borderColor: theme.primary } : {}}
                >
                  <div className={styles.methodIcon} style={{ background: '#fff7ed', color: '#ea580c' }}>
                    <Ticket size={24} />
                  </div>
                  <div className={styles.methodDetails}>
                    <strong>كود تفعيل</strong>
                    <span>لديك كود خصم؟</span>
                  </div>
                  <div className={styles.methodCheck} style={{ 
                    background: theme.primary,
                    opacity: method === 'code' ? 1 : 0
                  }}>
                    <Check size={16} color="white" />
                  </div>
                </button>
              </div>

              {/* إدخال الكود */}
              <AnimatePresence>
                {method === 'code' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={styles.codeInputSection}
                  >
                    <div className={styles.codeInputWrapper}>
                      <input 
                        type="text" 
                        value={code} 
                        onChange={e => setCode(e.target.value.toUpperCase())} 
                        placeholder="أدخل الكود هنا"
                        disabled={!!codeValid}
                        maxLength={20}
                        style={{ borderColor: codeValid ? '#10b981' : error ? '#ef4444' : '#e5e7eb' }}
                      />
                      <button 
                        onClick={handleValidateCode}
                        disabled={isValidating || !code || !!codeValid}
                        style={{ 
                          background: codeValid ? '#10b981' : theme.gradient,
                          opacity: isValidating ? 0.7 : 1
                        }}
                      >
                        {isValidating ? <Loader2 className={styles.spinning} size={20} /> : 'تحقق'}
                      </button>
                    </div>
                    {codeValid && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={styles.codeSuccess}
                      >
                        <CheckCircle2 size={18} color="#10b981" />
                        <span>كود صالح! {codeValid.discount_percentage && `(خصم ${codeValid.discount_percentage}%)`}</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* رسالة عدم كفاية الرصيد */}
              <AnimatePresence>
                {method === 'wallet' && walletBalance < pkg.price && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={styles.insufficientFunds}
                  >
                    <AlertCircle size={24} color="#ef4444" />
                    <div>
                      <strong>رصيد غير كافٍ</strong>
                      <span>يرجى شحن محفظتك أولاً</span>
                    </div>
                    <button 
                      className={styles.chargeBtn}
                      style={{ background: theme.gradient }}
                    >
                      شحن الآن
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* رسالة الخطأ */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={styles.errorMessage}
                  >
                    <Info size={18} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* زر التأكيد */}
              <motion.button 
                className={styles.confirmBtn}
                style={{ 
                  background: theme.gradient,
                  opacity: (method === 'wallet' && walletBalance < pkg.price) || (method === 'code' && !codeValid) ? 0.5 : 1
                }}
                whileHover={{ 
                  scale: (method === 'wallet' && walletBalance < pkg.price) || (method === 'code' && !codeValid) ? 1 : 1.02 
                }}
                whileTap={{ 
                  scale: (method === 'wallet' && walletBalance < pkg.price) || (method === 'code' && !codeValid) ? 1 : 0.98 
                }}
                onClick={handlePurchase}
                disabled={loading || (method === 'wallet' && walletBalance < pkg.price) || (method === 'code' && !codeValid)}
              >
                {loading ? (
                  <>
                    <Loader2 className={styles.spinning} size={20} />
                    <span>جاري المعالجة...</span>
                  </>
                ) : (
                  <>
                    <span>تأكيد الشراء</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </motion.button>

              {/* شارة الأمان */}
              <div className={styles.securityBadge}>
                <Shield size={16} />
                <span>معاملة آمنة ومشفرة 100%</span>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

// تأثير الاحتفال المتقدم
function ConfettiEffect({ theme }: { theme: ThemeType }) {
  const colors = [theme.primary, theme.secondary, theme.accent, '#10b981', '#f59e0b']
  
  return (
    <div className={styles.confettiContainer}>
      {[...Array(50)].map((_, i) => {
        const randomColor = colors[Math.floor(Math.random() * colors.length)]
        const randomX = Math.random() * 100
        const randomDelay = Math.random() * 0.5
        const randomDuration = 2 + Math.random() * 2
        
        return (
          <motion.div
            key={i}
            initial={{ 
              top: -20, 
              left: `${randomX}%`,
              rotate: 0,
              scale: 0,
              opacity: 1
            }}
            animate={{ 
              top: '110%', 
              left: `${randomX + (Math.random() - 0.5) * 20}%`,
              rotate: Math.random() * 720,
              scale: Math.random() * 0.5 + 0.5,
              opacity: 0
            }}
            transition={{ 
              duration: randomDuration,
              delay: randomDelay,
              ease: "linear"
            }}
            style={{
              position: 'absolute',
              backgroundColor: randomColor,
              width: Math.random() * 12 + 6,
              height: Math.random() * 12 + 6,
              borderRadius: Math.random() > 0.5 ? '50%' : Math.random() > 0.5 ? '4px' : '0'
            }}
          />
        )
      })}
      
      {/* تأثيرات النص */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`text-${i}`}
          initial={{ opacity: 0, scale: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 1], y: -100 }}
          transition={{ delay: i * 0.2, duration: 1.5 }}
          className={styles.floatingText}
          style={{
            left: `${20 + i * 15}%`,
            top: '50%',
            color: theme.primary
          }}
        >
          ✨
        </motion.div>
      ))}
    </div>
  )
}
