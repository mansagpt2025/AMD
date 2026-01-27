'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientBrowser } from '@/lib/supabase/sf-client'
import { 
  Wallet, BookOpen, Clock, Calendar, Loader2, GraduationCap,
  Users, Zap, TrendingUp, Award, Crown, Package,
  AlertCircle, CheckCircle2, PlayCircle, ArrowRight,
  ShoppingCart, X, CreditCard, Ticket, RefreshCw, Sparkles,
  ChevronRight, Lightning, Target, Medal
} from 'lucide-react'
import styles from './GradePage.module.css'
import PurchaseModal from '@/components/packages/PurchaseModal'

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
  created_at: string
  updated_at: string
}

interface UserPackage {
  id: string
  user_id: string
  package_id: string
  purchased_at: string
  expires_at: string
  is_active: boolean
  source: string
  packages: Package
}

const PackageCard = ({ 
  pkg, 
  isPurchased,
  onEnter,
  onPurchase,
  theme,
  index
}: { 
  pkg: Package, 
  isPurchased: boolean,
  onEnter?: () => void,
  onPurchase?: () => void,
  theme?: any,
  index?: number
}) => {
  const getTypeLabel = () => {
    switch (pkg.type) {
      case 'weekly': return 'أسبوعي'
      case 'monthly': return 'شهري'
      case 'term': return 'ترم كامل'
      case 'offer': return 'عرض خاص'
      default: return 'خاص'
    }
  }

  const getTypeColor = () => {
    switch (pkg.type) {
      case 'weekly': return '#3b82f6'
      case 'monthly': return '#8b5cf6'
      case 'term': return '#10b981'
      case 'offer': return '#f59e0b'
      default: return '#6366f1'
    }
  }

  const getTypeIcon = () => {
    switch (pkg.type) {
      case 'weekly': return <Clock size={20} />
      case 'monthly': return <Calendar size={20} />
      case 'term': return <Medal size={20} />
      case 'offer': return <Sparkles size={20} />
      default: return <BookOpen size={20} />
    }
  }

  const isExpired = pkg.is_active === false

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: (index || 0) * 0.1, type: 'spring', stiffness: 100 }}
      whileHover={{ y: -12, transition: { duration: 0.2 } }}
      className={`${styles.packageCard} ${isPurchased ? styles.purchasedCard : ''} ${isExpired ? styles.expiredCard : ''}`}
    >
      {/* Premium Badge */}
      {pkg.type === 'offer' && !isPurchased && (
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className={styles.premiumBadge}
          style={{
            background: `linear-gradient(135deg, ${theme.warning}, #d97706)`,
            boxShadow: `0 20px 40px ${theme.warning}60`
          }}
        >
          <Crown size={18} />
          <span>حصري</span>
        </motion.div>
      )}

      {/* Purchased Badge */}
      {isPurchased && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={styles.purchasedCheckmark}
          style={{ background: `linear-gradient(135deg, ${theme.success}, #059669)` }}
        >
          <CheckCircle2 size={20} />
        </motion.div>
      )}

      {/* Main Card Container */}
      <div className={styles.cardWrapper}>
        {/* Image Section */}
        <div className={styles.imageSection}>
          <div className={styles.imageContainer}>
            {pkg.image_url ? (
              <motion.img
                src={pkg.image_url}
                alt={pkg.name}
                className={styles.packageImage}
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.3 }}
              />
            ) : (
              <motion.div
                className={styles.imagePlaceholder}
                style={{
                  background: `linear-gradient(135deg, ${getTypeColor()}30, ${getTypeColor()}10)`,
                  backdropFilter: 'blur(10px)'
                }}
                whileHover={{ backgroundColor: `${getTypeColor()}40` }}
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {getTypeIcon()}
                </motion.div>
              </motion.div>
            )}

            {/* Overlay Gradient */}
            <div
              className={styles.imageOverlay}
              style={{
                background: `linear-gradient(135deg, transparent, ${getTypeColor()}20)`
              }}
            />

            {/* Type Badge */}
            <motion.div
              className={styles.typeBadge}
              style={{
                background: `linear-gradient(135deg, ${getTypeColor()}, ${getTypeColor()}CC)`,
                boxShadow: `0 10px 30px ${getTypeColor()}50`
              }}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {getTypeIcon()}
              <span>{getTypeLabel()}</span>
            </motion.div>
          </div>
        </div>

        {/* Content Section */}
        <div className={styles.contentSection}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className={styles.headerContent}
          >
            <h3 className={styles.packageName}>{pkg.name}</h3>
            <p className={styles.packageDescription}>
              {pkg.description || `برنامج تعليمي شامل مع ${pkg.lecture_count} محاضرة متخصصة`}
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            className={styles.statsGrid}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className={styles.statItem}>
              <div className={styles.statIconBg} style={{ background: `${theme.primary}20` }}>
                <PlayCircle size={18} style={{ color: theme.primary }} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{pkg.lecture_count || 0}</span>
                <span className={styles.statLabel}>محاضرة</span>
              </div>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statIconBg} style={{ background: `${theme.accent}20` }}>
                <Clock size={18} style={{ color: theme.accent }} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{pkg.duration_days || 30}</span>
                <span className={styles.statLabel}>يوم</span>
              </div>
            </div>
          </motion.div>

          {/* Price Section */}
          <motion.div
            className={styles.priceSection}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <div className={styles.priceWrapper}>
              <span className={styles.priceAmount}>{(pkg.price || 0).toLocaleString()}</span>
              <span className={styles.priceCurrency}>جنيه</span>
            </div>

            {pkg.type === 'offer' && pkg.price && (
              <motion.span
                className={styles.discountLabel}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                توفير 30%
              </motion.span>
            )}
          </motion.div>

          {/* Action Button */}
          <motion.button
            onClick={isPurchased ? onEnter : onPurchase}
            disabled={!pkg.is_active}
            className={`${styles.actionButton} ${isPurchased ? styles.enterBtn : styles.purchaseBtn}`}
            style={isPurchased ? { background: theme.success } : { background: getTypeColor() }}
            whileHover={{ scale: 1.02, boxShadow: `0 15px 40px ${getTypeColor()}40` }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className={styles.buttonText}>
              {isPurchased ? 'دخول للباقة' : !pkg.is_active ? 'غير متاحة' : 'اشترك الآن'}
            </span>
            {isPurchased ? (
              <ArrowRight size={18} />
            ) : (
              <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <ShoppingCart size={18} />
              </motion.div>
            )}
          </motion.button>

          {/* Features List */}
          <motion.div
            className={styles.featuresList}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <div className={styles.featureItem}>
              <Lightning size={14} style={{ color: theme.primary }} />
              <span>محتوى حي</span>
            </div>
            <div className={styles.featureItem}>
              <Target size={14} style={{ color: theme.primary }} />
              <span>موجه للنجاح</span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default function GradePage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClientBrowser()

  const gradeSlug = params?.grade as 'first' | 'second' | 'third'

  const [grade, setGrade] = useState<any>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [userPackages, setUserPackages] = useState<UserPackage[]>([])
  const [user, setUser] = useState<any>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshingWallet, setIsRefreshingWallet] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)

  const theme = useMemo(() => ({
    primary: '#3b82f6',
    accent: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    text: '#1f2937',
    light: '#f3f4f6'
  }), [])

  const stats = useMemo(() => ({
    totalStudents: 1250,
    successRate: 94,
    activeCourses: 42,
    expertTeachers: 25
  }), [])

  useEffect(() => {
    if (gradeSlug) {
      fetchData()
    }
  }, [gradeSlug])

  const fetchWalletBalance = useCallback(async (userId: string) => {
    try {
      const { data: walletData, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching wallet balance:', error)
        return 0
      }

      const balance = walletData?.balance || 0
      setWalletBalance(balance)
      return balance
    } catch (err) {
      console.error('Error in fetchWalletBalance:', err)
      return 0
    }
  }, [supabase])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // جلب بيانات الصف
      const { data: gradeData } = await supabase
        .from('grades')
        .select('*')
        .eq('slug', gradeSlug)
        .single()

      setGrade(gradeData || { 
        name: gradeSlug === 'first' ? 'الصف الأول الثانوي' : 
              gradeSlug === 'second' ? 'الصف الثاني الثانوي' : 
              'الصف الثالث الثانوي',
        slug: gradeSlug
      })

      // جلب الباقات المتاحة
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .eq('grade', gradeSlug)
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (packagesError) throw packagesError
      setPackages(packagesData || [])

      // التحقق من المستخدم
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (currentUser) {
        setUser(currentUser)
        
        // جلب رصيد المحفظة من قاعدة البيانات
        await fetchWalletBalance(currentUser.id)

        // جلب باقات المستخدم المشتراة
        const { data: userPackagesData, error: userPackagesError } = await supabase
          .from('user_packages')
          .select(`
            *,
            packages:package_id (*)
          `)
          .eq('user_id', currentUser.id)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())

        if (userPackagesError) throw userPackagesError
        
        const validUserPackages = (userPackagesData || []).filter((up: any) => up.packages !== null)
        setUserPackages(validUserPackages as UserPackage[])
      }

    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.message || 'حدث خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }, [gradeSlug, supabase, fetchWalletBalance])

  const refreshWalletBalance = useCallback(async () => {
    if (!user?.id) return
    setIsRefreshingWallet(true)
    try {
      await fetchWalletBalance(user.id)
    } catch (err) {
      console.error('Error refreshing wallet balance:', err)
    } finally {
      setIsRefreshingWallet(false)
    }
  }, [user, fetchWalletBalance])

  const isPackagePurchased = useCallback((packageId: string) => {
    return userPackages.some(up => up.package_id === packageId)
  }, [userPackages])

  const purchasedPackages = useMemo(() => {
    return userPackages
      .filter(up => up.is_active && up.packages)
      .map(up => up.packages)
      .filter((pkg): pkg is Package => pkg !== null)
  }, [userPackages])

  const availablePackages = useMemo(() => {
    return packages.filter(pkg =>
      !userPackages.some(up => up.package_id === pkg.id)
    )
  }, [packages, userPackages])

  const packagesByType = useMemo(() => ({
    weekly: availablePackages.filter(p => p.type === 'weekly'),
    monthly: availablePackages.filter(p => p.type === 'monthly'),
    term: availablePackages.filter(p => p.type === 'term'),
    offer: availablePackages.filter(p => p.type === 'offer')
  }), [availablePackages])

  const handlePurchaseClick = useCallback((pkg: Package) => {
    if (!user) {
      router.push(`/login?returnUrl=/grades/${gradeSlug}`)
      return
    }

    if (isPackagePurchased(pkg.id)) {
      handleEnterPackage(pkg.id)
      return
    }

    setSelectedPackage(pkg)
    setShowPurchaseModal(true)
  }, [user, gradeSlug, isPackagePurchased, router])

  const handleEnterPackage = useCallback((pkgId: string) => {
    router.push(`/grades/${gradeSlug}/packages/${pkgId}`)
  }, [gradeSlug, router])

  const handlePurchaseSuccess = useCallback(async (packageId: string) => {
    if (user?.id) {
      await fetchWalletBalance(user.id)
    }
    await fetchData()
    setTimeout(() => {
      router.push(`/grades/${gradeSlug}/packages/${packageId}`)
    }, 1000)
  }, [user, gradeSlug, fetchData, fetchWalletBalance, router])

  const handleRetry = useCallback(() => {
    fetchData()
  }, [fetchData])

  // Loading State
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className={styles.loadingSpinner} />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={styles.loadingText}
        >
          جاري تحميل البيانات...
        </motion.p>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={styles.errorCard}
        >
          <AlertCircle className={styles.errorIcon} />
          <h3 className={styles.errorTitle}>حدث خطأ</h3>
          <p className={styles.errorMessage}>{error}</p>
          <motion.button
            onClick={handleRetry}
            className={styles.retryButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            إعادة المحاولة
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {/* Platform Branding */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.platformInfo}
          >
            <motion.h1
              className={styles.platformTitle}
              animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{
                backgroundSize: '200% 200%',
                backgroundImage: `linear-gradient(90deg, ${theme.primary}, ${theme.accent}, ${theme.primary})`
              }}
            >
              الأبــارع محمود الـديــب
            </motion.h1>
            <p className={styles.platformSubtitle}>منارة العلم والتميز</p>
            <motion.p
              className={styles.encouragement}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              🌟 رحلتك نحو التميز تبدأ من هنا
            </motion.p>
          </motion.div>

          {/* Wallet Card */}
          {user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={styles.walletCard}
              style={{
                background: `linear-gradient(135deg, ${theme.primary}15, ${theme.accent}15)`,
                border: `2px solid ${theme.primary}30`,
                backdropFilter: 'blur(10px)'
              }}
            >
              <motion.div
                className={styles.walletIconWrapper}
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Wallet className={styles.walletIcon} style={{ color: theme.primary }} />
              </motion.div>

              <div>
                <p className={styles.walletLabel}>رصيد المحفظة</p>
                <motion.p
                  className={styles.walletBalance}
                  key={walletBalance}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.3 }}
                >
                  <span style={{ color: theme.primary, fontWeight: 'bold' }}>
                    {walletBalance.toLocaleString()}
                  </span>
                  <span style={{ color: theme.text }}>جنيه</span>
                </motion.p>
              </div>

              <div className={styles.walletActions}>
                <motion.button
                  className={styles.refreshBtn}
                  onClick={refreshWalletBalance}
                  disabled={isRefreshingWallet}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="تحديث الرصيد"
                >
                  <motion.div
                    animate={isRefreshingWallet ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 1, repeat: isRefreshingWallet ? Infinity : 0 }}
                  >
                    <RefreshCw size={18} />
                  </motion.div>
                </motion.button>

                {walletBalance < 100 && (
                  <motion.button
                    className={styles.addBalanceBtn}
                    onClick={() => router.push('/wallet')}
                    style={{ background: theme.warning }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    إضافة رصيد
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Grade Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.gradeCard}
          style={{
            background: `linear-gradient(135deg, ${theme.accent}20, ${theme.primary}20)`,
            border: `2px solid ${theme.primary}30`
          }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <GraduationCap className={styles.gradeIcon} style={{ color: theme.primary }} />
          </motion.div>
          <div>
            <h2 className={styles.gradeName}>
              {grade?.name || (gradeSlug === 'first' ? 'الصف الأول الثانوي' :
                              gradeSlug === 'second' ? 'الصف الثاني الثانوي' :
                              'الصف الثالث الثانوي')}
            </h2>
            <p className={styles.gradeDesc}>رحلة نحو التميز الأكاديمي</p>
          </div>
        </motion.div>
      </header>

      {/* Stats Container */}
      <div className={styles.statsContainer}>
        <div className={styles.statsGrid}>
          {{
            icon: Users, label: 'طالب متفوق', value: stats.totalStudents, suffix: '+', color: theme.primary },
            { icon: TrendingUp, label: 'نسبة النجاح', value: stats.successRate, suffix: '%', color: theme.success },
            { icon: Zap, label: 'دورة نشطة', value: stats.activeCourses, suffix: '+', color: theme.warning },
            { icon: Award, label: 'خبير تعليمي', value: stats.expertTeachers, suffix: '+', color: theme.accent },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={styles.statCard}
              style={{
                background: `linear-gradient(135deg, ${stat.color}15, ${stat.color}05)`,
                border: `1px solid ${stat.color}30`,
                backdropFilter: 'blur(10px)'
              }}
              whileHover={{
                transform: 'translateY(-8px)',
                boxShadow: `0 20px 40px ${stat.color}20`
              }}
            >
              <div
                className={styles.statIconContainer}
                style={{ background: `${stat.color}20` }}
              >
                <stat.icon className={styles.statIcon} style={{ color: stat.color }} />
              </div>
              <div>
                <motion.p
                  className={styles.statValue}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ color: stat.color }}
                >
                  {stat.value}{stat.suffix}
                </motion.p>
                <p className={styles.statLabel}>{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Purchased Packages Section */}
        {purchasedPackages.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={styles.section}
          >
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className={styles.sectionHeader}
            >
              <div className={styles.sectionIconContainer} style={{ background: `${theme.success}20` }}>
                <Package className={styles.sectionIcon} style={{ color: theme.success }} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>اشتراكاتك</h2>
                <p className={styles.sectionSubtitle}>الباقات التي قمت بشرائها</p>
              </div>
              <motion.span
                className={styles.badge}
                style={{ background: theme.success }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {purchasedPackages.length}
              </motion.span>
            </motion.div>

            <div className={styles.packagesGrid}>
              {purchasedPackages.map((pkg, idx) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isPurchased={true}
                  onEnter={() => handleEnterPackage(pkg.id)}
                  theme={theme}
                  index={idx}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Offer Packages Section */}
        {packagesByType.offer.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`${styles.section} ${styles.offerSection}`}
          >
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className={styles.sectionHeader}
            >
              <div className={styles.sectionIconContainer} style={{ background: `${theme.warning}20` }}>
                <Crown className={styles.sectionIcon} style={{ color: theme.warning }} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>عروض VIP حصرية</h2>
                <p className={styles.sectionSubtitle}>فرص ذهبية بخصومات استثنائية</p>
              </div>
              <motion.span
                className={styles.badge}
                style={{ background: theme.warning }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                محدودة
              </motion.span>
            </motion.div>

            <div className={styles.packagesGrid}>
              {packagesByType.offer.map((pkg, idx) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isPurchased={false}
                  onPurchase={() => handlePurchaseClick(pkg)}
                  theme={theme}
                  index={idx}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Premium Packages Section */}
        {(packagesByType.monthly.length > 0 || packagesByType.term.length > 0) && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`${styles.section} ${styles.premiumSection}`}
          >
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className={styles.sectionHeader}
            >
              <div className={styles.sectionIconContainer} style={{ background: `${theme.accent}20` }}>
                <Medal className={styles.sectionIcon} style={{ color: theme.accent }} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>باقات التميز</h2>
                <p className={styles.sectionSubtitle}>برامج تعليمية متكاملة</p>
              </div>
            </motion.div>

            <div className={styles.packagesGrid}>
              {[...packagesByType.monthly, ...packagesByType.term].map((pkg, idx) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isPurchased={false}
                  onPurchase={() => handlePurchaseClick(pkg)}
                  theme={theme}
                  index={idx}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Starter Packages Section */}
        {packagesByType.weekly.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`${styles.section} ${styles.starterSection}`}
          >
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className={styles.sectionHeader}
            >
              <div className={styles.sectionIconContainer} style={{ background: `${theme.primary}20` }}>
                <Sparkles className={styles.sectionIcon} style={{ color: theme.primary }} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>باقات البداية</h2>
                <p className={styles.sectionSubtitle}>ابدأ رحلتك من اليوم</p>
              </div>
            </motion.div>

            <div className={styles.packagesGrid}>
              {packagesByType.weekly.map((pkg, idx) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isPurchased={false}
                  onPurchase={() => handlePurchaseClick(pkg)}
                  theme={theme}
                  index={idx}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Empty State */}
        {packages.length === 0 && purchasedPackages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.emptyState}
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <BookOpen className={styles.emptyIcon} />
            </motion.div>
            <h3 className={styles.emptyTitle}>لا توجد باقات متاحة</h3>
            <p className={styles.emptyText}>سيتم إضافة باقات جديدة قريباً</p>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className={styles.footerBrand}
          >
            <Crown className={styles.footerIcon} style={{ color: theme.primary }} />
            <span>الابارع محمود الديب</span>
          </motion.div>
          <p className={styles.footerCopyright}>منارة العلم والتميز منذ 2010</p>
          <div className={styles.footerStats}>
            <span>+{stats.totalStudents} طالب متفوق</span>
            <span className={styles.separator}>•</span>
            <span>{stats.successRate}% نسبة نجاح</span>
            <span className={styles.separator}>•</span>
            <span>{stats.expertTeachers} خبير تعليمي</span>
          </div>
        </div>
      </footer>

      {/* Purchase Modal */}
      <AnimatePresence>
        {showPurchaseModal && selectedPackage && (
          <PurchaseModal
            package={selectedPackage}
            user={user}
            walletBalance={walletBalance}
            gradeSlug={gradeSlug}
            onClose={() => setShowPurchaseModal(false)}
            onSuccess={handlePurchaseSuccess}
            theme={theme}
          />
        )}
      </AnimatePresence>
    </div>
  )
}