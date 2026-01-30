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
  ChevronLeft, TrendingUp, Award, BookMarked, ChevronRight
} from 'lucide-react'
import styles from './GradePage.module.css'

// Types
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

// Grade themes
const themes: Record<string, ThemeType> = {
  first: {
    primary: '#4f46e5',
    secondary: '#4338ca',
    accent: '#06b6d4',
    gradient: 'from-indigo-500 via-purple-500 to-cyan-500',
    light: '#eef2ff'
  },
  second: {
    primary: '#7c3aed',
    secondary: '#6d28d9',
    accent: '#ec4899',
    gradient: 'from-violet-500 via-purple-600 to-pink-500',
    light: '#f5f3ff'
  },
  third: {
    primary: '#059669',
    secondary: '#047857',
    accent: '#10b981',
    gradient: 'from-emerald-500 via-teal-600 to-green-500',
    light: '#ecfdf5'
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

  // Fetch data
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

      // Mock wallet balance - replace with actual API call
      // const walletResult = await getWalletBalance(currentUser.id)
      setWalletBalance(1500) // Temporary mock

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

  // Categorize packages
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
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className={styles.loadingIcon}
          >
            <GraduationCap size={56} color={theme.primary} />
          </motion.div>
          <div className={styles.loadingText}>
            <h3>جاري التحميل...</h3>
            <p>نحضر لك أفضل المحتوى</p>
          </div>
          <div className={styles.loadingBars}>
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={styles.loadingBar}
                animate={{ height: ["30%", "70%", "30%"] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
                style={{ height: 32 }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Progress Bar */}
      <motion.div 
        className={styles.progressBar}
        style={{ scaleX }}
      />

      {/* Background Effects */}
      <div className={styles.backgroundEffects}>
        <div className={styles.gradientOrb1} />
        <div className={styles.gradientOrb2} />
        <div className={styles.gridPattern} />
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {/* Brand */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={styles.brand}
          >
            <div className={styles.logoWrapper} style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
              <Crown size={24} color="white" />
            </div>
            <div className={styles.brandText}>
              <h1>البارع محمود الديب</h1>
              <span>منارة العلم والتميز</span>
            </div>
          </motion.div>

          {/* Wallet or Login */}
          {user ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={styles.walletCard}
              onClick={() => router.push('/wallet')}
            >
              <div className={styles.walletIcon} style={{ background: theme.light, color: theme.primary }}>
                <Wallet size={20} />
              </div>
              <div className={styles.walletDetails}>
                <span className={styles.walletLabel}>الرصيد</span>
                <span className={styles.walletAmount} style={{ color: theme.primary }}>
                  {walletBalance.toLocaleString()} ج.م
                </span>
              </div>
              <button 
                className={styles.refreshBtn}
                onClick={(e) => { e.stopPropagation(); handleRefresh(); }}
                disabled={isRefreshing}
              >
                <RefreshCw size={16} className={isRefreshing ? styles.spinning : ''} />
              </button>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={styles.loginBtn}
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
              onClick={() => router.push(`/login?returnUrl=/grades/${gradeSlug}`)}
            >
              <span>تسجيل الدخول</span>
              <ChevronLeft size={18} />
            </motion.button>
          )}
        </div>

        {/* Grade Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={styles.gradeHero}
        >
          <div className={styles.gradeBadge} style={{ color: theme.primary, background: theme.light }}>
            <GraduationCap size={32} />
          </div>
          <h2 style={{ color: theme.primary }}>{getGradeName()}</h2>
          <p>اختر باقتك وابدأ رحلة التميز</p>
        </motion.div>

        {/* Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={styles.tabsContainer}
        >
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <BookOpen size={18} />
              <span>الكل</span>
              <span className={styles.tabCount}>{purchased.length + available.length + offers.length}</span>
            </button>
            
            {purchased.length > 0 && (
              <button 
                className={`${styles.tab} ${activeTab === 'purchased' ? styles.active : ''}`}
                onClick={() => setActiveTab('purchased')}
              >
                <CheckCircle2 size={18} />
                <span>اشتراكاتي</span>
                <span className={styles.tabCount} style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#059669' }}>
                  {purchased.length}
                </span>
              </button>
            )}
            
            {offers.length > 0 && (
              <button 
                className={`${styles.tab} ${activeTab === 'offers' ? styles.active : ''}`}
                onClick={() => setActiveTab('offers')}
              >
                <Sparkles size={18} />
                <span>عروض</span>
                <span className={styles.tabCount} style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#d97706' }}>
                  {offers.length}
                </span>
              </button>
            )}
          </div>
        </motion.div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={styles.errorAlert}
            >
              <AlertCircle size={20} color="#ef4444" />
              <span>{error}</span>
              <button onClick={fetchData}>إعادة المحاولة</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        {user && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.statsGrid}
          >
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: theme.light, color: theme.primary }}>
                <BookMarked size={22} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{purchased.length}</span>
                <span className={styles.statLabel}>باقة نشطة</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: theme.light, color: theme.primary }}>
                <PlayCircle size={22} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{purchased.reduce((acc, p) => acc + (p.lecture_count || 0), 0)}</span>
                <span className={styles.statLabel}>محاضرة</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: theme.light, color: theme.primary }}>
                <Clock size={22} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>
                  {userPackages.length > 0 
                    ? Math.ceil((new Date(userPackages[0].expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : 0}
                </span>
                <span className={styles.statLabel}>يوم متبقي</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Packages Grid */}
        <motion.div layout className={styles.packagesGrid}>
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.emptyState}
          >
            <div className={styles.emptyIcon} style={{ color: theme.primary }}>
              <BookOpen size={40} />
            </div>
            <h3>لا توجد باقات</h3>
            <p>سيتم إضافة باقات جديدة قريباً</p>
          </motion.div>
        )}
      </main>

      {/* Purchase Modal */}
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

      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && <ConfettiEffect theme={theme} />}
      </AnimatePresence>
    </div>
  )
}

// Package Card Component
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

  const getTypeColor = () => {
    switch (pkg.type) {
      case 'weekly': return styles['bg-blue-100']
      case 'monthly': return styles['bg-purple-100']
      case 'term': return styles['bg-emerald-100']
      case 'offer': return styles['bg-amber-100']
      default: return styles['bg-gray-100']
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className={`${styles.packageCard} ${isPurchased ? styles.purchased : ''} ${pkg.type === 'offer' ?              styles.offer : ''}`}
    >
      <div className={styles.cardAccent} style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})` }} />
      
      {(isPurchased || pkg.type === 'offer') && (
        <div className={styles.badge} style={{ 
          background: isPurchased ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)'
        }}>
          {isPurchased ? (
            <>
              <CheckCircle2 size={14} />
              <span>مشترك</span>
            </>
          ) : (
            <>
              <Zap size={14} />
              <span>عرض خاص</span>
            </>
          )}
        </div>
      )}

      {pkg.original_price && (
        <div className={styles.discountBadge}>
          خصم {Math.round((1 - pkg.price/pkg.original_price) * 100)}%
        </div>
      )}

      <div className={styles.cardImageWrapper}>
        {pkg.image_url ? (
          <img src={pkg.image_url} alt={pkg.name} loading="lazy" />
        ) : (
          <div className={styles.placeholderImage}>
            <GraduationCap size={48} />
          </div>
        )}
        <div className={`${styles.typeChip} ${getTypeColor()}`}>
          {getTypeIcon()}
          <span>
            {pkg.type === 'weekly' && 'أسبوعي'}
            {pkg.type === 'monthly' && 'شهري'}
            {pkg.type === 'term' && 'ترم كامل'}
            {pkg.type === 'offer' && 'عرض محدود'}
          </span>
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{pkg.name}</h3>
        <p className={styles.cardDescription}>{pkg.description}</p>

        <ul className={styles.featuresList}>
          {pkg.features?.slice(0, 3).map((feature: string, i: number) => (
            <li key={i}>
              <CheckCircle2 size={16} color={theme.primary} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className={styles.cardStats}>
          <div className={styles.stat}>
            <PlayCircle size={18} color={theme.primary} />
            <span>{pkg.lecture_count} محاضرة</span>
          </div>
          <div className={styles.stat}>
            <Clock size={18} color={theme.primary} />
            <span>{pkg.duration_days} يوم</span>
          </div>
        </div>

        {pkg.expires_at && (
          <div className={styles.expiryDate}>
            <Calendar size={16} />
            <span>ينتهي: {new Date(pkg.expires_at).toLocaleDateString('ar-EG')}</span>
          </div>
        )}

        <div className={styles.cardFooter}>
          <div className={styles.priceWrapper}>
            {pkg.original_price && (
              <span className={styles.oldPrice}>{pkg.original_price.toLocaleString()} ج.م</span>
            )}
            <span className={styles.price} style={{ color: theme.primary }}>
              {pkg.price.toLocaleString()}
              <small> ج.م</small>
            </span>
          </div>

          {isPurchased ? (
            <button
              className={styles.enterButton}
              onClick={onEnter}
            >
              <span>دخول</span>
              <ChevronLeft size={18} />
            </button>
          ) : (
            <button
              className={styles.buyButton}
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
              onClick={onPurchase}
            >
              <span>اشترك الآن</span>
              <ShoppingCart size={18} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Purchase Modal Component
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
    setLoading(true)
    setError('')
    try {
      // Mock validation - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000))
      setCodeValid({ id: '123', discount_percentage: 20 })
    } catch (err: any) {
      setError('كود غير صالح')
      setCodeValid(null)
    } finally { 
      setLoading(false) 
    }
  }

  const handlePurchase = async () => {
    setLoading(true)
    setError('')
    try {
      if (method === 'wallet') {
        if (walletBalance < pkg.price) throw new Error('رصيد غير كافٍ')
        // Mock purchase
        await new Promise(resolve => setTimeout(resolve, 1500))
      } else {
        if (!codeValid) throw new Error('تحقق من الكود أولاً')
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      setShowSuccess(true)
      
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally { 
      setLoading(false) 
    }
  }

  if (showSuccess) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={styles.modal}
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.successState}>
            <div className={styles.successIcon} style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
              <CheckCircle2 size={48} color="white" />
            </div>
            <h3>تم الشراء بنجاح!</h3>
            <p>يمكنك الآن الوصول إلى جميع المحتويات</p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={styles.modal}
        onClick={e => e.stopPropagation()}
      >
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        <div className={styles.modalHeader}>
          <div className={styles.modalIcon} style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
            <Gift size={28} color="white" />
          </div>
          <h3>{pkg.name}</h3>
          <div className={styles.priceTag}>
            <span style={{ color: theme.primary }}>{pkg.price.toLocaleString()}</span>
            <small>جنية مصري</small>
          </div>
          {pkg.original_price && (
            <span className={styles.originalPrice}>{pkg.original_price.toLocaleString()} ج.م</span>
          )}
        </div>

        <div className={styles.modalBody}>
          <div className={styles.methods}>
            <button 
              className={`${styles.methodCard} ${method === 'wallet' ? styles.active : ''}`}
              onClick={() => setMethod('wallet')}
            >
              <div className={styles.methodIcon} style={{ background: theme.light, color: theme.primary }}>
                <CreditCard size={24} />
              </div>
              <div className={styles.methodInfo}>
                <strong>الدفع من المحفظة</strong>
                <span>رصيدك: {walletBalance.toLocaleString()} ج.م</span>
              </div>
              {walletBalance >= pkg.price ? (
                <CheckCircle2 size={20} color="#10b981" />
              ) : (
                <AlertCircle size={20} color="#ef4444" />
              )}
            </button>

            <button 
              className={`${styles.methodCard} ${method === 'code' ? styles.active : ''}`}
              onClick={() => setMethod('code')}
            >
              <div className={styles.methodIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
                <Ticket size={24} />
              </div>
              <div className={styles.methodInfo}>
                <strong>كود تفعيل</strong>
                <span>لديك كود خصم؟</span>
              </div>
            </button>
          </div>

          {method === 'code' && (
            <div className={styles.codeInput}>
              <div className={styles.inputWrapper}>
                <input 
                  type="text" 
                  value={code} 
                  onChange={e => setCode(e.target.value.toUpperCase())} 
                  placeholder="أدخل الكود هنا"
                  disabled={!!codeValid}
                />
                <button 
                  onClick={handleValidateCode}
                  disabled={loading || !code || !!codeValid}
                  style={{ background: theme.primary }}
                >
                  {loading ? <Loader2 className={styles.spinning} size={18} /> : 'تحقق'}
                </button>
              </div>
              {codeValid && (
                <div className={styles.codeSuccess}>
                  <Star size={16} fill="#f59e0b" color="#f59e0b" />
                  <span>كود صالح! {codeValid.discount_percentage && `(خصم ${codeValid.discount_percentage}%)`}</span>
                </div>
              )}
            </div>
          )}

          {method === 'wallet' && walletBalance < pkg.price && (
            <div className={styles.insufficientFunds}>
              <AlertCircle size={20} color="#ef4444" />
              <div>
                <strong>رصيد غير كافٍ</strong>
                <span>يرجى شحن محفظتك أولاً</span>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <button 
            className={styles.confirmButton}
            style={{ 
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              opacity: (method === 'wallet' && walletBalance < pkg.price) || (method === 'code' && !codeValid) ? 0.6 : 1
            }}
            onClick={handlePurchase}
            disabled={loading || (method === 'wallet' && walletBalance < pkg.price) || (method === 'code' && !codeValid)}
          >
            {loading ? (
              <><Loader2 className={styles.spinning} size={20} /> جاري المعالجة...</>
            ) : (
              <><span>تأكيد الشراء</span><ArrowRight size={20} /></>
            )}
          </button>

          <div className={styles.secureBadge}>
            <Shield size={16} />
            <span>معاملة آمنة ومشفرة 100%</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Confetti Effect Component
function ConfettiEffect({ theme }: { theme: ThemeType }) {
  return (
    <div className={styles.confettiContainer}>
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className={styles.confetti}
          initial={{ 
            top: -10, 
            left: `${Math.random() * 100}%`,
            rotate: 0,
            scale: 0
          }}
          animate={{ 
            top: '110%', 
            rotate: Math.random() * 360,
            scale: 1
          }}
          transition={{ 
            duration: Math.random() * 2 + 2,
            ease: "linear",
            delay: Math.random() * 0.5
          }}
          style={{
            background: i % 2 === 0 ? theme.primary : theme.accent,
            width: Math.random() * 8 + 4,
            height: Math.random() * 8 + 4,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px'
          }}
        />
      ))}
    </div>
  )
}