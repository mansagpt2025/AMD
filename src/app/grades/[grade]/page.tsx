'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue, type Transition } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Wallet, BookOpen, GraduationCap, Loader2, AlertCircle,
  Crown, Sparkles, Clock, Calendar, Medal, PlayCircle,
  CheckCircle2, ArrowRight, ArrowLeft, RefreshCw, 
  Ticket, CreditCard, X, Shield, Gift, Zap, Star,
  ChevronLeft, TrendingUp, Award, BookMarked, Flame,
  Gem, Rocket, Infinity, Play, Lock, Unlock, Timer,
  ChevronDown, Heart, Share2, MoreHorizontal, Filter,
  Search, Bell, User, Menu, XCircle, CheckCircle,
  ArrowUpRight, Percent, Tag, Crown as CrownIcon
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
  instructor?: string
  rating?: number
  students_count?: number
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
  glow: string
}

// الألوان الخاصة بكل صف - تصميم أكثر جاذبية
const themes: Record<string, ThemeType> = {
  first: {
    primary: '#6366f1',
    secondary: '#4f46e5',
    accent: '#06b6d4',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #06b6d4 100%)',
    light: '#eef2ff',
    dark: '#1e1b4b',
    glow: 'rgba(99, 102, 241, 0.4)'
  },
  second: {
    primary: '#10b981',
    secondary: '#059669',
    accent: '#84cc16',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #84cc16 100%)',
    light: '#ecfdf5',
    dark: '#064e3b',
    glow: 'rgba(16, 185, 129, 0.4)'
  },
  third: {
    primary: '#f59e0b',
    secondary: '#d97706',
    accent: '#ef4444',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #ef4444 100%)',
    light: '#fffbeb',
    dark: '#78350f',
    glow: 'rgba(245, 158, 11, 0.4)'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Mouse tracking for 3D effects
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

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
      
      // إضافة بيانات تجريبية للمميزات إذا لم تكن موجودة
      const enhancedPackages = packagesData?.map(pkg => ({
        ...pkg,
        features: pkg.features || [
          `${pkg.lecture_count} محاضرة تفاعلية`,
          'وصول كامل لمدة ' + pkg.duration_days + ' يوم',
          'دعم فني على مدار الساعة',
          'شهادة إتمام',
          'تحديثات مستمرة'
        ],
        original_price: pkg.type === 'offer' ? pkg.price * 1.4 : undefined,
        instructor: pkg.instructor || 'أستاذ محمود الديب',
        rating: pkg.rating || 4.9,
        students_count: pkg.students_count || Math.floor(Math.random() * 2000) + 500
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
    let result = []
    switch (activeTab) {
      case 'purchased': result = purchased; break
      case 'offers': result = offers; break
      default: result = [...purchased, ...available, ...offers]
    }
    
    if (searchQuery) {
      result = result.filter(pkg => 
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return result
  }, [purchased, available, offers, activeTab, searchQuery])

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

  const getGradeSubtitle = () => {
    switch(gradeSlug) {
      case 'first': return 'بداية رحلة النجاح'
      case 'second': return 'الإعداد للمرحلة النهائية'
      case 'third': return 'عام التفوق والتميز'
      default: return ''
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
            } as Transition}
            className={styles.loadingIcon}
            style={{ background: theme.gradient }}
          >
            <GraduationCap size={48} color="white" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={styles.loadingText}
          >
            <h3>جاري تحميل المحتوى...</h3>
            <p>نحضر لك تجربة تعليمية استثنائية</p>
          </motion.div>
          <div className={styles.loadingBars}>
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={styles.loadingBar}
                style={{ background: theme.primary }}
                animate={{ 
                  height: ["20%", "100%", "20%"],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} ref={containerRef} style={{ '--theme-primary': theme.primary, '--theme-secondary': theme.secondary, '--theme-accent': theme.accent, '--theme-glow': theme.glow } as any}>
      {/* شريط التقدم العلوي */}
      <motion.div 
        className={styles.progressBar}
        style={{ 
          scaleX,
          background: theme.gradient
        }}
      />

      {/* تأثيرات الخلفية المتقدمة */}
      <div className={styles.backgroundEffects}>
        <div className={styles.gradientMesh}>
          <div className={styles.blob1} style={{ background: theme.primary }} />
          <div className={styles.blob2} style={{ background: theme.accent }} />
          <div className={styles.blob3} style={{ background: theme.secondary }} />
        </div>
        <div className={styles.noiseOverlay} />
        <div className={styles.gridPattern} />
      </div>

      {/* الهيدر العائم */}
      <motion.header 
        className={styles.floatingHeader}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className={styles.headerContent}>
          {/* الشعار */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={styles.brand}
            whileHover={{ scale: 1.05 }}
          >
            <div className={styles.logoWrapper} style={{ background: theme.gradient }}>
              <Crown size={24} color="white" />
            </div>
            <div className={styles.brandText}>
              <h1>البارع</h1>
              <span>محمود الديب</span>
            </div>
          </motion.div>

          {/* البحث - Desktop */}
          <div className={styles.searchWrapper}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="ابحث عن كورس..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* الأزرار */}
          <div className={styles.headerActions}>
            <motion.button 
              className={styles.iconBtn}
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
            >
              <Bell size={20} />
              <span className={styles.badge}>3</span>
            </motion.button>

            {user ? (
              <motion.div 
                className={styles.walletPill}
                style={{ 
                  background: `linear-gradient(135deg, ${theme.light}, white)`,
                  borderColor: `${theme.primary}30`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
              >
                <div className={styles.walletIconSmall} style={{ background: theme.gradient }}>
                  <Wallet size={16} color="white" />
                </div>
                <span className={styles.walletAmountSmall} style={{ color: theme.dark }}>
                  {walletBalance.toLocaleString()} ج.م
                </span>
                <RefreshCw size={14} className={isRefreshing ? styles.spinning : ''} style={{ color: theme.primary }} />
              </motion.div>
            ) : (
              <motion.button
                className={styles.loginBtn}
                style={{ background: theme.gradient }}
                whileHover={{ scale: 1.05, boxShadow: `0 10px 30px ${theme.glow}` }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(`/login?returnUrl=/grades/${gradeSlug}`)}
              >
                <span>تسجيل الدخول</span>
                <ArrowRight size={18} />
              </motion.button>
            )}

            {/* Mobile Menu Toggle */}
            <motion.button 
              className={styles.menuToggle}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div 
              className={styles.mobileMenu}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className={styles.mobileSearch}>
                <Search size={18} />
                <input 
                  type="text" 
                  placeholder="ابحث عن كورس..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {user && (
                <div className={styles.mobileWallet}>
                  <Wallet size={20} style={{ color: theme.primary }} />
                  <span>رصيدك: {walletBalance.toLocaleString()} ج.م</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={styles.heroBadge}
            style={{ background: theme.light, color: theme.primary }}
          >
            <Sparkles size={16} />
            <span>منصة البارع التعليمية</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={styles.heroTitle}
          >
            {getGradeName()}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={styles.heroSubtitle}
          >
            {getGradeSubtitle()} - اختر باقتك وابدأ رحلة التميز مع أفضل الأساتذة
          </motion.p>

          {/* Stats Row */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={styles.heroStats}
          >
            <div className={styles.heroStat}>
              <div className={styles.heroStatIcon} style={{ background: theme.light }}>
                <BookOpen size={20} style={{ color: theme.primary }} />
              </div>
              <div>
                <span className={styles.heroStatValue}>{packages.length}+</span>
                <span className={styles.heroStatLabel}>كورس متاح</span>
              </div>
            </div>
            <div className={styles.heroStat}>
              <div className={styles.heroStatIcon} style={{ background: theme.light }}>
                <UsersIcon size={20} style={{ color: theme.primary }} />
              </div>
              <div>
                <span className={styles.heroStatValue}>15K+</span>
                <span className={styles.heroStatLabel}>طالب</span>
              </div>
            </div>
            <div className={styles.heroStat}>
              <div className={styles.heroStatIcon} style={{ background: theme.light }}>
                <Star size={20} style={{ color: theme.primary }} />
              </div>
              <div>
                <span className={styles.heroStatValue}>4.9</span>
                <span className={styles.heroStatLabel}>تقييم</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Floating Cards Effect */}
        <div className={styles.floatingCards}>
          <motion.div 
            className={styles.floatCard1}
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6,  ease: "easeInOut" }}
          >
            <div className={styles.floatCardInner} style={{ background: theme.gradient }}>
              <Play size={24} color="white" />
            </div>
          </motion.div>
          <motion.div 
            className={styles.floatCard2}
            animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 5,  ease: "easeInOut", delay: 1 }}
          >
            <div className={styles.floatCardInner} style={{ background: `linear-gradient(135deg, #f59e0b, #ef4444)` }}>
              <Crown size={24} color="white" />
            </div>
          </motion.div>
          <motion.div 
            className={styles.floatCard3}
            animate={{ y: [0, -15, 0], rotate: [0, 3, 0] }}
            transition={{ duration: 7,  ease: "easeInOut", delay: 0.5 }}
          >
            <div className={styles.floatCardInner} style={{ background: `linear-gradient(135deg, #10b981, #06b6d4)` }}>
              <Award size={24} color="white" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters & Tabs */}
      <section className={styles.filtersSection}>
        <div className={styles.tabsContainer}>
          <motion.div 
            className={styles.tabsWrapper}
            layout
          >
            <button 
              className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <LayoutGridIcon size={18} />
              <span>الكل</span>
              <span className={styles.tabCount}>{purchased.length + available.length + offers.length}</span>
              {activeTab === 'all' && (
                <motion.div 
                  className={styles.tabIndicator} 
                  style={{ background: theme.gradient }}
                  layoutId="tabIndicator"
                />
              )}
            </button>
            
            {purchased.length > 0 && (
              <button 
                className={`${styles.tab} ${activeTab === 'purchased' ? styles.active : ''}`}
                onClick={() => setActiveTab('purchased')}
              >
                <CheckCircle2 size={18} />
                <span>اشتراكاتي</span>
                <span className={styles.tabCount} style={{ background: '#10b981' }}>
                  {purchased.length}
                </span>
                {activeTab === 'purchased' && (
                  <motion.div 
                    className={styles.tabIndicator} 
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                    layoutId="tabIndicator"
                  />
                )}
              </button>
            )}
            
            {offers.length > 0 && (
              <button 
                className={`${styles.tab} ${activeTab === 'offers' ? styles.active : ''}`}
                onClick={() => setActiveTab('offers')}
              >
                <Flame size={18} />
                <span>عروض خاصة</span>
                <span className={styles.tabCount} style={{ background: '#ef4444' }}>
                  {offers.length}
                </span>
                {activeTab === 'offers' && (
                  <motion.div 
                    className={styles.tabIndicator} 
                    style={{ background: 'linear-gradient(135deg, #ef4444, #f59e0b)' }}
                    layoutId="tabIndicator"
                  />
                )}
              </button>
            )}
          </motion.div>

          {/* Filter Dropdown */}
          <motion.button 
            className={styles.filterBtn}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Filter size={18} />
            <span>تصفية</span>
          </motion.button>
        </div>
      </section>

      {/* المحتوى الرئيسي */}
      <main className={styles.main}>
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={styles.errorAlert}
            >
              <AlertCircle size={20} />
              <span>{error}</span>
              <button onClick={fetchData}>إعادة المحاولة</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Featured Section - For Offers */}
        {activeTab !== 'purchased' && offers.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.featuredSection}
          >
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <Flame size={24} color="#ef4444" />
                <h2>عروض محدودة</h2>
              </div>
              <div className={styles.countdown}>
                <Clock size={16} />
                <span>تنتهي قريباً</span>
              </div>
            </div>
            
            <div className={styles.featuredGrid}>
              {offers.slice(0, 2).map((pkg, index) => (
                <FeaturedCard 
                  key={pkg.id}
                  pkg={pkg}
                  theme={theme}
                  index={index}
                  onPurchase={() => handlePurchaseClick(pkg)}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Packages Grid */}
        <section className={styles.packagesSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <BookOpen size={24} style={{ color: theme.primary }} />
              <h2>
                {activeTab === 'purchased' ? 'باقاتي' : 
                 activeTab === 'offers' ? 'العروض المتاحة' : 'جميع الباقات'}
              </h2>
            </div>
            <span className={styles.resultsCount}>{filteredPackages.length} نتيجة</span>
          </div>

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
              <div className={styles.emptyIcon} style={{ background: theme.light }}>
                <Search size={48} color={theme.primary} />
              </div>
              <h3>لا توجد نتائج</h3>
              <p>جرب البحث بكلمات مختلفة أو تصفح جميع الباقات</p>
              <button 
                className={styles.resetBtn}
                style={{ background: theme.gradient }}
                onClick={() => {setSearchQuery(''); setActiveTab('all')}}
              >
                عرض جميع الباقات
              </button>
            </motion.div>
          )}
        </section>
      </main>

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
        {showConfetti && <ConfettiEffect theme={theme} />}
      </AnimatePresence>

      {/* Bottom Navigation - Mobile */}
      <nav className={styles.bottomNav}>
        <button className={styles.navItem}>
          <HomeIcon size={24} />
          <span>الرئيسية</span>
        </button>
        <button className={`${styles.navItem} ${styles.active}`}>
          <BookOpen size={24} />
          <span>الكورسات</span>
        </button>
        <button className={styles.navItem}>
          <Wallet size={24} />
          <span>المحفظة</span>
        </button>
        <button className={styles.navItem}>
          <User size={24} />
          <span>حسابي</span>
        </button>
      </nav>
    </div>
  )
}

// بطاقة مميزة للعروض
function FeaturedCard({ pkg, theme, index, onPurchase }: any) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={styles.featuredCard}
      whileHover={{ y: -5, scale: 1.02 }}
    >
      <div className={styles.featuredImage}>
        {pkg.image_url ? (
          <img src={pkg.image_url} alt={pkg.name} />
        ) : (
          <div className={styles.featuredPlaceholder} style={{ background: theme.gradient }}>
            <Crown size={48} color="white" />
          </div>
        )}
        <div className={styles.featuredOverlay} />
        <div className={styles.discountRibbon}>
          <span>خصم {Math.round((1 - pkg.price/(pkg.original_price || pkg.price*1.4)) * 100)}%</span>
        </div>
      </div>
      
      <div className={styles.featuredContent}>
        <div className={styles.featuredHeader}>
          <h3>{pkg.name}</h3>
          <div className={styles.featuredPrice}>
            <span className={styles.currentPrice}>{pkg.price.toLocaleString()} ج.م</span>
            <span className={styles.oldPrice}>{(pkg.original_price || pkg.price * 1.4).toLocaleString()} ج.م</span>
          </div>
        </div>
        
        <p className={styles.featuredDesc}>{pkg.description}</p>
        
        <div className={styles.featuredMeta}>
          <span><PlayCircle size={16} /> {pkg.lecture_count} محاضرة</span>
          <span><Clock size={16} /> {pkg.duration_days} يوم</span>
          <span><User size={16} /> {pkg.students_count}+ طالب</span>
        </div>

        <motion.button
          className={styles.featuredBtn}
          style={{ background: `linear-gradient(135deg, #ef4444, #f59e0b)` }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPurchase}
        >
          <Zap size={18} />
          <span>احصل على العرض الآن</span>
        </motion.button>
      </div>
    </motion.div>
  )
}

// مكون بطاقة الباقة المحسن
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
      whileHover={{ y: -8, transition: { type: "spring", stiffness: 400 } }}
      className={`${styles.packageCard} ${isPurchased ? styles.purchased : ''} ${pkg.type === 'offer' ? styles.offer : ''}`}
    >
      {/* Glow Effect */}
      <div 
        className={styles.cardGlow} 
        style={{ 
          background: isPurchased 
            ? 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.3), transparent 70%)'
            : pkg.type === 'offer'
            ? 'radial-gradient(circle at 50% 0%, rgba(239, 68, 68, 0.3), transparent 70%)'
            : `radial-gradient(circle at 50% 0%, ${theme.glow}, transparent 70%)`
        }}
      />

      {/* Image Section */}
      <div className={styles.cardImageSection}>
        {pkg.image_url ? (
          <img src={pkg.image_url} alt={pkg.name} loading="lazy" />
        ) : (
          <div className={styles.cardImagePlaceholder} style={{ background: theme.gradient }}>
            <GraduationCap size={40} color="white" />
          </div>
        )}
        
        {/* Overlay Gradient */}
        <div className={styles.imageOverlay} />
        
        {/* Badges */}
        <div className={styles.cardBadges}>
          <span className={`${styles.typeBadge} ${styles[pkg.type]}`}>
            {getTypeIcon()}
            {getTypeLabel()}
          </span>
          
          {isPurchased && (
            <span className={styles.purchasedBadge}>
              <CheckCircle2 size={14} />
              مشترك
            </span>
          )}
          
          {pkg.original_price && !isPurchased && (
            <span className={styles.discountBadge}>
              <Percent size={12} />
              {Math.round((1 - pkg.price/pkg.original_price) * 100)}%
            </span>
          )}
        </div>

        {/* Lock Icon for non-purchased */}
        {!isPurchased && (
          <div className={styles.lockOverlay}>
            <Lock size={32} color="white" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{pkg.name}</h3>
          <div className={styles.cardRating}>
            <Star size={14} fill="#fbbf24" color="#fbbf24" />
            <span>{pkg.rating}</span>
          </div>
        </div>

        <p className={styles.cardDescription}>{pkg.description}</p>

        {/* Instructor */}
        <div className={styles.instructorRow}>
          <div className={styles.instructorAvatar}>
            <User size={16} />
          </div>
          <span>{pkg.instructor}</span>
        </div>

        {/* Features Preview */}
        <ul className={styles.featuresPreview}>
          {pkg.features?.slice(0, 2).map((feature: string, i: number) => (
            <li key={i}>
              <CheckCircle2 size={14} style={{ color: theme.primary }} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Stats Row */}
        <div className={styles.cardStatsRow}>
          <div className={styles.statItem}>
            <PlayCircle size={16} style={{ color: theme.primary }} />
            <span>{pkg.lecture_count}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <Clock size={16} style={{ color: theme.primary }} />
            <span>{pkg.duration_days} يوم</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <User size={16} style={{ color: theme.primary }} />
            <span>{pkg.students_count}</span>
          </div>
        </div>

        {/* Price & Action */}
        <div className={styles.cardFooter}>
          <div className={styles.priceBlock}>
            {pkg.original_price && !isPurchased && (
              <span className={styles.oldPriceLarge}>
                {pkg.original_price.toLocaleString()} ج.م
              </span>
            )}
            <span className={styles.priceLarge} style={{ color: isPurchased ? '#10b981' : theme.primary }}>
              {isPurchased ? 'مفعل' : `${pkg.price.toLocaleString()} ج.م`}
            </span>
          </div>

          {isPurchased ? (
            <motion.button
              className={styles.enterBtn}
              style={{ background: '#10b981' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onEnter}
            >
              <span>دخول</span>
              <ChevronLeft size={18} />
            </motion.button>
          ) : (
            <motion.button
              className={styles.buyBtn}
              style={{ 
                background: theme.gradient,
                boxShadow: `0 4px 15px ${theme.glow}`
              }}
              whileHover={{ scale: 1.05, boxShadow: `0 6px 25px ${theme.glow}` }}
              whileTap={{ scale: 0.95 }}
              onClick={onPurchase}
            >
              <span>اشترك الآن</span>
              <ArrowLeft size={18} />
            </motion.button>
          )}
        </div>

        {/* Expiry Warning */}
        {pkg.expires_at && (
          <div className={styles.expiryWarning}>
            <Timer size={14} />
            <span>ينتهي: {new Date(pkg.expires_at).toLocaleDateString('ar-EG')}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// مكون مودال الشراء المحسن
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
  const [step, setStep] = useState(1)

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
      setStep(2)
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

  const canPurchase = method === 'wallet' ? walletBalance >= pkg.price : !!codeValid

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
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className={styles.successIcon}
              style={{ background: `linear-gradient(135deg, #10b981, #059669)` }}
            >
              <CheckCircle2 size={64} color="white" />
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={styles.successSparkles}
            >
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.5, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    delay: i * 0.2
                  }}
                >
                  <Sparkles size={20} color={theme.primary} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className={styles.modalHeader} style={{ background: theme.gradient }}>
              <button className={styles.closeBtn} onClick={onClose}>
                <X size={24} color="white" />
              </button>
              <div className={styles.modalHeaderContent}>
                <motion.div 
                  className={styles.modalIcon}
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Gift size={40} color="white" />
                </motion.div>
                <h3>{pkg.name}</h3>
                <div className={styles.modalPriceTag}>
                  <span>{pkg.price.toLocaleString()}</span>
                  <small>جنية مصري</small>
                </div>
                {pkg.original_price && (
                  <span className={styles.modalOldPrice}>{pkg.original_price.toLocaleString()} ج.م</span>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              {/* Progress Steps */}
              <div className={styles.stepsIndicator}>
                <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>
                  <div className={styles.stepNumber} style={step >= 1 ? { background: theme.gradient } : {}}>1</div>
                  <span>اختر الطريقة</span>
                </div>
                <div className={styles.stepLine} style={step >= 2 ? { background: theme.gradient } : {}} />
                <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>
                  <div className={styles.stepNumber} style={step >= 2 ? { background: theme.gradient } : {}}>2</div>
                  <span>تأكيد</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className={styles.methodsGrid}>
                <motion.button 
                  className={`${styles.methodCard} ${method === 'wallet' ? styles.active : ''}`}
                  onClick={() => {setMethod('wallet'); setStep(1)}}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={styles.methodIconLarge} style={{ background: theme.gradient }}>
                    <Wallet size={28} color="white" />
                  </div>
                  <div className={styles.methodInfo}>
                    <strong>الدفع من المحفظة</strong>
                    <span>رصيدك: <b style={{ color: walletBalance >= pkg.price ? '#10b981' : '#ef4444' }}>{walletBalance.toLocaleString()} ج.م</b></span>
                  </div>
                  {walletBalance >= pkg.price ? (
                    <CheckCircle2 size={24} color="#10b981" />
                  ) : (
                    <AlertCircle size={24} color="#ef4444" />
                  )}
                </motion.button>

                <motion.button 
                  className={`${styles.methodCard} ${method === 'code' ? styles.active : ''}`}
                  onClick={() => {setMethod('code'); setStep(1)}}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={styles.methodIconLarge} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                    <Ticket size={28} color="white" />
                  </div>
                  <div className={styles.methodInfo}>
                    <strong>كود تفعيل</strong>
                    <span>لديك كود خصم؟</span>
                  </div>
                  {codeValid && <CheckCircle2 size={24} color="#10b981" />}
                </motion.button>
              </div>

              {/* Code Input Section */}
              <AnimatePresence>
                {method === 'code' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={styles.codeSection}
                  >
                    <div className={styles.codeInputWrapper}>
                      <input 
                        type="text" 
                        value={code} 
                        onChange={e => setCode(e.target.value.toUpperCase())} 
                        placeholder="أدخل الكود هنا (مثال: BAR3G2024)"
                        disabled={!!codeValid}
                        maxLength={20}
                      />
                      <button 
                        onClick={handleValidateCode}
                        disabled={loading || !code || !!codeValid}
                        style={{ background: codeValid ? '#10b981' : theme.gradient }}
                      >
                        {loading ? <Loader2 className={styles.spinning} size={20} /> : 
                         codeValid ? <CheckCircle2 size={20} /> : 'تحقق'}
                      </button>
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
              </AnimatePresence>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={styles.errorMessage}
                  >
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Package Summary */}
              <div className={styles.summaryBox}>
                <h4>ملخص الطلب</h4>
                <div className={styles.summaryRow}>
                  <span>الباقة</span>
                  <span>{pkg.name}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>المدة</span>
                  <span>{pkg.duration_days} يوم</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>المحاضرات</span>
                  <span>{pkg.lecture_count} محاضرة</span>
                </div>
                <div className={styles.summaryDivider} />
                <div className={styles.summaryRowTotal}>
                  <span>الإجمالي</span>
                  <span style={{ color: theme.primary }}>{pkg.price.toLocaleString()} ج.م</span>
                </div>
              </div>

              {/* Confirm Button */}
              <motion.button 
                className={styles.confirmBtn}
                style={{ 
                  background: canPurchase ? theme.gradient : '#9ca3af',
                  boxShadow: canPurchase ? `0 4px 20px ${theme.glow}` : 'none'
                }}
                whileHover={canPurchase ? { scale: 1.02, boxShadow: `0 6px 30px ${theme.glow}` } : {}}
                whileTap={canPurchase ? { scale: 0.98 } : {}}
                onClick={handlePurchase}
                disabled={loading || !canPurchase}
              >
                {loading ? (
                  <><Loader2 className={styles.spinning} size={20} /> جاري المعالجة...</>
                ) : !canPurchase ? (
                  <><AlertCircle size={20} /> {method === 'wallet' ? 'رصيد غير كافٍ' : 'أدخل كود صالح'}</>
                ) : (
                  <><span>تأكيد الشراء</span><ArrowLeft size={20} /></>
                )}
              </motion.button>

              {/* Security Badge */}
              <div className={styles.secureBadge}>
                <Shield size={16} />
                <span>معاملة آمنة ومشفرة 100% - SSL Secure</span>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

// تأثير الاحتفال المحسن
function ConfettiEffect({ theme }: { theme: ThemeType }) {
  const colors = [theme.primary, theme.accent, theme.secondary, '#fbbf24', '#ef4444', '#10b981']
  
  return (
    <div className={styles.confettiContainer}>
      {[...Array(60)].map((_, i) => (
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
            scale: Math.random() * 0.8 + 0.2
          }}
          transition={{ 
            duration: Math.random() * 3 + 2,
            ease: "linear"
          }}
          style={{
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            width: Math.random() * 12 + 4,
            height: Math.random() * 12 + 4,
            borderRadius: Math.random() > 0.5 ? '50%' : Math.random() > 0.5 ? '4px' : '0'
          }}
        />
      ))}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className={styles.floatingStar}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            y: [0, -100]
          }}
          transition={{ 
            duration: 2,
            delay: i * 0.1,
            ease: "easeOut"
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: '50%'
          }}
        >
          <Star size={Math.random() * 20 + 10} fill={colors[i % colors.length]} color={colors[i % colors.length]} />
        </motion.div>
      ))}
    </div>
  )
}

// Icon Components
function UsersIcon({ size, style }: { size?: number, style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function LayoutGridIcon({ size }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  )
}

function HomeIcon({ size }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}