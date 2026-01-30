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
  ChevronLeft, TrendingUp, Award, BookMarked
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
}

// الألوان الخاصة بكل صف
const themes: Record<string, ThemeType> = {
  first: {
    primary: '#3b82f6',
    secondary: '#1e40af',
    accent: '#06b6d4',
    gradient: 'from-blue-500 via-blue-600 to-cyan-500',
    light: '#eff6ff'
  },
  second: {
    primary: '#00ff04',
    secondary: '#007a16',
    accent: '#8cec48',
    gradient: 'from-violet-500 via-purple-600 to-pink-500',
    light: '#f5f3ff'
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
        .order('price', { ascending: true })

      if (packagesError) throw packagesError
      
      // إضافة بيانات تجريبية للمميزات إذا لم تكن موجودة
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
          >
            <GraduationCap size={64} color={theme.primary} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={styles.loadingText}
          >
            <h3>جاري تحميل البيانات...</h3>
            <p>نحضر لك أفضل المحتوى التعليمي</p>
          </motion.div>
          <div className={styles.loadingBars}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={styles.loadingBar}
                animate={{ 
                  height: ["20%", "80%", "20%"],
                  backgroundColor: [theme.primary, theme.accent, theme.primary]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
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
    <div className={styles.container} ref={containerRef}>
      {/* شريط التقدم العلوي */}
      <motion.div 
        className={styles.progressBar}
        style={{ 
          scaleX,
          background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`
        }}
      />

      {/* تأثيرات الخلفية */}
      <div className={styles.backgroundEffects}>
        <div className={styles.gradientOrb1} style={{ background: theme.primary }} />
        <div className={styles.gradientOrb2} style={{ background: theme.accent }} />
        <div className={styles.gridPattern} />
      </div>

      {/* الهيدر */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {/* الشعار */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={styles.brand}
          >
            <div className={styles.logoWrapper} style={{ background: theme.light }}>
              <Crown size={28} color={theme.primary} />
            </div>
            <div className={styles.brandText}>
              <h1>البارع محمود الديب</h1>
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
                borderColor: `${theme.primary}20`,
                boxShadow: `0 4px 20px ${theme.primary}20`
              }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={styles.walletIcon} style={{ background: theme.primary }}>
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
              style={{ background: theme.primary }}
              whileHover={{ scale: 1.05, boxShadow: `0 10px 30px ${theme.primary}40` }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/login?returnUrl=/grades/${gradeSlug}`)}
            >
              <span>تسجيل الدخول</span>
              <ArrowRight size={18} />
            </motion.button>
          )}
        </div>

        {/* بطاقة الصف الدراسي */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={styles.gradeHero}
        >
          <div className={styles.gradeBadge} style={{ background: theme.light }}>
            <GraduationCap size={40} color={theme.primary} />
          </div>
          <h2 style={{ color: theme.primary }}>{getGradeName()}</h2>
          <p>اختر باقتك وابدأ رحلة التميز</p>
        </motion.div>

        {/* التبويبات */}
        <motion.nav 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={styles.tabsContainer}
        >
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
              onClick={() => setActiveTab('all')}
              style={{ 
                '--active-color': theme.primary,
                '--active-bg': theme.light 
              } as any}
            >
              <BookOpen size={18} />
              <span>الكل</span>
              <span className={styles.tabCount}>{purchased.length + available.length + offers.length}</span>
            </button>
            
            {purchased.length > 0 && (
              <button 
                className={`${styles.tab} ${activeTab === 'purchased' ? styles.active : ''}`}
                onClick={() => setActiveTab('purchased')}
                style={{ 
                  '--active-color': '#059669',
                  '--active-bg': '#ecfdf5'
                } as any}
              >
                <CheckCircle2 size={18} />
                <span>اشتراكاتي</span>
                <span className={styles.tabCount} style={{ background: '#10b981', color: 'white' }}>
                  {purchased.length}
                </span>
              </button>
            )}
            
            {offers.length > 0 && (
              <button 
                className={`${styles.tab} ${activeTab === 'offers' ? styles.active : ''}`}
                onClick={() => setActiveTab('offers')}
                style={{ 
                  '--active-color': '#d97706',
                  '--active-bg': '#fffbeb'
                } as any}
              >
                <Sparkles size={18} />
                <span>عروض خاصة</span>
                <span className={styles.tabCount} style={{ background: '#f59e0b', color: 'white' }}>
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

        {/* قسم الإحصائيات السريعة */}
        {user && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={styles.statsGrid}
          >
            <div className={styles.statCard} style={{ borderColor: `${theme.primary}20` }}>
              <div className={styles.statIcon} style={{ background: theme.light, color: theme.primary }}>
                <BookMarked size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{purchased.length}</span>
                <span className={styles.statLabel}>باقة نشطة</span>
              </div>
            </div>
            <div className={styles.statCard} style={{ borderColor: `${theme.primary}20` }}>
              <div className={styles.statIcon} style={{ background: theme.light, color: theme.primary }}>
                <TrendingUp size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{purchased.reduce((acc, p) => acc + (p.lecture_count || 0), 0)}</span>
                <span className={styles.statLabel}>محاضرة متاحة</span>
              </div>
            </div>
            <div className={styles.statCard} style={{ borderColor: `${theme.primary}20` }}>
              <div className={styles.statIcon} style={{ background: theme.light, color: theme.primary }}>
                <Award size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{userPackages.filter(up => new Date(up.expires_at) > new Date()).length}</span>
                <span className={styles.statLabel}>يوم متبقي</span>
              </div>
            </div>
          </motion.div>
        )}

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
            <div className={styles.emptyIcon} style={{ background: theme.light }}>
              <BookOpen size={48} color={theme.primary} />
            </div>
            <h3>لا توجد باقات متاحة</h3>
            <p>سيتم إضافة باقات جديدة قريباً</p>
          </motion.div>
        )}
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
        {showConfetti && <ConfettiEffect />}
      </AnimatePresence>
    </div>
  )
}

// مكون بطاقة الباقة
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
      case 'weekly': return <Clock size={18} />
      case 'monthly': return <Calendar size={18} />
      case 'term': return <Medal size={18} />
      case 'offer': return <Crown size={18} />
      default: return <BookOpen size={18} />
    }
  }

  const getTypeColor = () => {
    switch (pkg.type) {
      case 'weekly': return 'bg-blue-100 text-blue-700'
      case 'monthly': return 'bg-purple-100 text-purple-700'
      case 'term': return 'bg-emerald-100 text-emerald-700'
      case 'offer': return 'bg-amber-100 text-amber-700'
      default: return 'bg-gray-100 text-gray-700'
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
      {/* شريط التميز */}
      <div 
        className={styles.cardAccent}
        style={{ 
          background: isPurchased 
            ? 'linear-gradient(90deg, #10b981, #059669)' 
            : pkg.type === 'offer'
            ? 'linear-gradient(90deg, #f59e0b, #d97706)'
            : `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`
        }}
      />

      {/* شارة الحالة */}
      {(isPurchased || pkg.type === 'offer') && (
        <div className={styles.badge}>
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

      {/* الخصم */}
      {pkg.original_price && (
        <div className={styles.discountBadge}>
          <span>خصم {Math.round((1 - pkg.price/pkg.original_price) * 100)}%</span>
        </div>
      )}

      {/* الصورة */}
      <div className={styles.cardImageWrapper}>
        {pkg.image_url ? (
          <img src={pkg.image_url} alt={pkg.name} loading="lazy" />
        ) : (
          <div className={styles.placeholderImage} style={{ background: theme.light }}>
            {getTypeIcon()}
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

      {/* المحتوى */}
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{pkg.name}</h3>
        <p className={styles.cardDescription}>{pkg.description}</p>

        {/* المميزات */}
        <ul className={styles.featuresList}>
          {pkg.features?.slice(0, 3).map((feature: string, i: number) => (
            <li key={i}>
              <CheckCircle2 size={14} style={{ color: theme.primary }} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* الإحصائيات */}
        <div className={styles.cardStats}>
          <div className={styles.stat}>
            <PlayCircle size={16} style={{ color: theme.primary }} />
            <span>{pkg.lecture_count} محاضرة</span>
          </div>
          <div className={styles.stat}>
            <Clock size={16} style={{ color: theme.primary }} />
            <span>{pkg.duration_days} يوم</span>
          </div>
        </div>

        {/* تاريخ الانتهاء */}
        {pkg.expires_at && (
          <div className={styles.expiryDate}>
            <Calendar size={14} />
            <span>ينتهي: {new Date(pkg.expires_at).toLocaleDateString('ar-EG')}</span>
          </div>
        )}

        {/* السعر والزر */}
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
            <motion.button
              className={styles.enterButton}
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
              className={styles.buyButton}
              style={{ 
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                boxShadow: `0 4px 15px ${theme.primary}40`
              }}
              whileHover={{ scale: 1.05, boxShadow: `0 6px 20px ${theme.primary}60` }}
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

// مكون مودال الشراء
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
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        className={styles.modal}
        onClick={e => e.stopPropagation()}
      >
        {showSuccess ? (
          <div className={styles.successState}>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={styles.successIcon}
              style={{ background: theme.light }}
            >
              <CheckCircle2 size={64} color={theme.primary} />
            </motion.div>
            <h3>تم الشراء بنجاح!</h3>
            <p>يمكنك الآن الوصول إلى جميع محتويات الباقة</p>
          </div>
        ) : (
          <>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={24} />
            </button>

            <div className={styles.modalHeader} style={{ background: theme.light }}>
              <div className={styles.modalIcon} style={{ background: theme.primary }}>
                <Gift size={32} color="white" />
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
                  style={method === 'wallet' ? { borderColor: theme.primary, background: theme.light } : {}}
                >
                  <div className={styles.methodIcon} style={{ background: theme.primary }}>
                    <CreditCard size={24} color="white" />
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
                  style={method === 'code' ? { borderColor: theme.primary, background: theme.light } : {}}
                >
                  <div className={styles.methodIcon} style={{ background: '#f59e0b' }}>
                    <Ticket size={24} color="white" />
                  </div>
                  <div className={styles.methodInfo}>
                    <strong>كود تفعيل</strong>
                    <span>لديك كود خصم؟</span>
                  </div>
                </button>
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
                      placeholder="أدخل الكود هنا"
                      disabled={!!codeValid}
                      maxLength={20}
                    />
                    <button 
                      onClick={handleValidateCode}
                      disabled={loading || !code || !!codeValid}
                      style={{ background: theme.primary }}
                    >
                      {loading ? <Loader2 className={styles.spinning} size={20} /> : 'تحقق'}
                    </button>
                  </div>
                  {codeValid && (
                    <div className={styles.codeSuccess}>
                      <Star size={16} fill="#f59e0b" color="#f59e0b" />
                      <span>كود صالح! {codeValid.discount_percentage && `(خصم ${codeValid.discount_percentage}%)`}</span>
                    </div>
                  )}
                </motion.div>
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

              <motion.button 
                className={styles.confirmButton}
                style={{ 
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  opacity: (method === 'wallet' && walletBalance < pkg.price) || (method === 'code' && !codeValid) ? 0.5 : 1
                }}
                whileHover={{ scale: (method === 'wallet' && walletBalance < pkg.price) || (method === 'code' && !codeValid) ? 1 : 1.02 }}
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

// تأثير الاحتفال
function ConfettiEffect() {
  return (
    <div className={styles.confettiContainer}>
      {[...Array(50)].map((_, i) => (
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
            rotate: Math.random() * 720,
            scale: Math.random() * 0.5 + 0.5
          }}
          transition={{ 
            duration: Math.random() * 3 + 2,
            ease: "linear"
          }}
          style={{
            backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'][Math.floor(Math.random() * 5)],
            width: Math.random() * 10 + 5,
            height: Math.random() * 10 + 5,
            borderRadius: Math.random() > 0.5 ? '50%' : '0'
          }}
        />
      ))}
    </div>
  )
}