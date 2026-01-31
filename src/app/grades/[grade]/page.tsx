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
  ChevronLeft, TrendingUp, Award, BookMarked, 
  Users, Target, Brain, Rocket, ShieldCheck, Globe,
  BarChart3, Video, FileText, Headphones, BadgeCheck,
  Search, Filter, Clock3, BookCheck, UserCheck
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
  background: string
  surface: string
  text: string
}

// الألوان الخاصة بكل صف (تصميم فاتح)
const themes: Record<string, ThemeType> = {
  first: {
    primary: '#2563eb',
    secondary: '#1d4ed8',
    accent: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
    light: '#f0f9ff',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b'
  },
  second: {
    primary: '#7c3aed',
    secondary: '#6d28d9',
    accent: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
    light: '#faf5ff',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b'
  },
  third: {
    primary: '#059669',
    secondary: '#047857',
    accent: '#10b981',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    light: '#f0fdf4',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b'
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
  const [sortBy, setSortBy] = useState<'price' | 'lectures' | 'duration'>('price')

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
    let filtered = []
    switch (activeTab) {
      case 'purchased': filtered = purchased; break
      case 'offers': filtered = offers; break
      default: filtered = [...purchased, ...available, ...offers]
    }
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(pkg => 
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.type.includes(searchQuery.toLowerCase())
      )
    }
    
    // الترتيب
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price
        case 'lectures':
          return b.lecture_count - a.lecture_count
        case 'duration':
          return b.duration_days - a.duration_days
        default:
          return a.price - b.price
      }
    })
    
    return filtered
  }, [purchased, available, offers, activeTab, searchQuery, sortBy])

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
              scale: [1, 1.1, 1]
            }} 
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            }}
            className={styles.loadingIcon}
            style={{ background: theme.light }}
          >
            <Brain size={48} color={theme.primary} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={styles.loadingText}
          >
            <h3 style={{ color: theme.text }}>جاري تحميل الباقات التعليمية...</h3>
            <p style={{ color: '#64748b' }}>نحضر لك أفضل تجربة تعليمية</p>
          </motion.div>
          <div className={styles.loadingProgress}>
            <motion.div 
              className={styles.loadingBar}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              style={{ background: theme.gradient }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} ref={containerRef} style={{ backgroundColor: theme.background }}>
      {/* شريط التقدم العلوي */}
      <motion.div 
        className={styles.progressBar}
        style={{ 
          scaleX,
          background: theme.gradient
        }}
      />

      {/* تأثيرات الخلفية */}
      <div className={styles.backgroundEffects}>
        <div className={styles.gradientBlur} style={{ background: theme.gradient, opacity: 0.05 }} />
        <div className={styles.gridPattern} style={{ opacity: 0.02 }} />
      </div>

      {/* الهيدر */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {/* العودة */}
          <motion.button
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={styles.backButton}
            onClick={() => router.push('/grades')}
            whileHover={{ x: -5 }}
          >
            <ChevronLeft size={20} color={theme.text} />
            <span style={{ color: theme.text }}>العودة</span>
          </motion.button>

          {/* معلومات الصف */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={styles.gradeInfo}
          >
            <div className={styles.gradeIcon} style={{ background: theme.light }}>
              <GraduationCap size={24} color={theme.primary} />
            </div>
            <div>
              <h1 style={{ color: theme.text }}>{getGradeName()}</h1>
              <p style={{ color: '#64748b' }}>اختر الباقة المناسبة لرحلتك التعليمية</p>
            </div>
          </motion.div>

          {/* المحفظة أو تسجيل الدخول */}
          {user ? (
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={styles.userSection}
            >
              <div className={styles.walletCard}>
                <div className={styles.walletIcon} style={{ background: theme.light }}>
                  <Wallet size={20} color={theme.primary} />
                </div>
                <div className={styles.walletDetails}>
                  <span className={styles.walletLabel} style={{ color: '#64748b' }}>رصيد المحفظة</span>
                  <span className={styles.walletAmount} style={{ color: theme.text }}>
                    {walletBalance.toLocaleString()} <small style={{ color: '#94a3b8' }}>ج.م</small>
                  </span>
                </div>
                <motion.button 
                  className={styles.refreshBtn}
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  whileHover={{ rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ background: theme.light }}
                >
                  <RefreshCw size={16} className={isRefreshing ? styles.spinning : ''} color={theme.primary} />
                </motion.button>
              </div>
              
              <div className={styles.userMenu}>
                <div className={styles.userAvatar} style={{ background: theme.gradient }}>
                  <span>{user.email?.[0].toUpperCase()}</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={styles.loginButton}
              style={{ background: theme.gradient }}
              whileHover={{ scale: 1.02, boxShadow: `0 8px 25px ${theme.primary}30` }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/login?returnUrl=/grades/${gradeSlug}`)}
            >
              <span>تسجيل الدخول</span>
              <ArrowRight size={18} />
            </motion.button>
          )}
        </div>

        {/* شريط البحث والتصفية */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={styles.searchFilterContainer}
        >
          <div className={styles.searchBox}>
            <Search size={20} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="ابحث عن باقة معينة..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ color: theme.text }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className={styles.clearSearch}
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className={styles.filterGroup}>
            <div className={styles.filterSelect}>
              <Filter size={16} color="#64748b" />
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{ color: theme.text }}
              >
                <option value="price">الترتيب حسب السعر</option>
                <option value="lectures">الترتيب حسب عدد المحاضرات</option>
                <option value="duration">الترتيب حسب المدة</option>
              </select>
            </div>
            
            <div className={styles.resultCount}>
              <span style={{ color: '#64748b' }}>عرض </span>
              <strong style={{ color: theme.primary }}>{filteredPackages.length}</strong>
              <span style={{ color: '#64748b' }}> باقة</span>
            </div>
          </div>
        </motion.div>

        {/* التبويبات */}
        <motion.nav 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={styles.tabsContainer}
        >
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
              onClick={() => setActiveTab('all')}
              style={activeTab === 'all' ? { 
                background: theme.light,
                color: theme.primary,
                borderColor: theme.primary 
              } : {}}
            >
              <BookOpen size={18} />
              <span>جميع الباقات</span>
              <span className={styles.tabBadge}>{packages.length}</span>
            </button>
            
            {purchased.length > 0 && (
              <button 
                className={`${styles.tab} ${activeTab === 'purchased' ? styles.active : ''}`}
                onClick={() => setActiveTab('purchased')}
                style={activeTab === 'purchased' ? { 
                  background: '#ecfdf5',
                  color: '#059669',
                  borderColor: '#059669'
                } : {}}
              >
                <CheckCircle2 size={18} />
                <span>المشتراة</span>
                <span className={styles.tabBadge} style={{ background: '#10b981' }}>
                  {purchased.length}
                </span>
              </button>
            )}
            
            {offers.length > 0 && (
              <button 
                className={`${styles.tab} ${activeTab === 'offers' ? styles.active : ''}`}
                onClick={() => setActiveTab('offers')}
                style={activeTab === 'offers' ? { 
                  background: '#fffbeb',
                  color: '#d97706',
                  borderColor: '#d97706'
                } : {}}
              >
                <Sparkles size={18} />
                <span>العروض</span>
                <span className={styles.tabBadge} style={{ background: '#f59e0b' }}>
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
              style={{ background: '#fee2e2', borderColor: '#f87171' }}
            >
              <AlertCircle size={20} color="#dc2626" />
              <span style={{ color: '#7f1d1d' }}>{error}</span>
              <button 
                onClick={fetchData}
                style={{ color: theme.primary }}
              >
                إعادة المحاولة
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* شريط المعلومات */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={styles.infoBar}
          style={{ background: theme.light }}
        >
          <div className={styles.infoItem}>
            <ShieldCheck size={20} color={theme.primary} />
            <div>
              <span style={{ color: theme.text }}>ضمان استعادة الأموال</span>
              <small style={{ color: '#64748b' }}>خلال 14 يوم</small>
            </div>
          </div>
          <div className={styles.infoDivider} />
          <div className={styles.infoItem}>
            <Headphones size={20} color={theme.primary} />
            <div>
              <span style={{ color: theme.text }}>دعم فني 24/7</span>
              <small style={{ color: '#64748b' }}>عبر جميع القنوات</small>
            </div>
          </div>
          <div className={styles.infoDivider} />
          <div className={styles.infoItem}>
            <BadgeCheck size={20} color={theme.primary} />
            <div>
              <span style={{ color: theme.text }}>شهادات معتمدة</span>
              <small style={{ color: '#64748b' }}>معتمدة من الوزارة</small>
            </div>
          </div>
        </motion.div>

        {/* إحصائيات سريعة */}
        {user && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={styles.quickStats}
          >
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: theme.light }}>
                <BookMarked size={20} color={theme.primary} />
              </div>
              <div>
                <span className={styles.statValue} style={{ color: theme.text }}>
                  {purchased.length}
                </span>
                <span className={styles.statLabel} style={{ color: '#64748b' }}>باقة نشطة</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: theme.light }}>
                <Video size={20} color={theme.primary} />
              </div>
              <div>
                <span className={styles.statValue} style={{ color: theme.text }}>
                  {purchased.reduce((acc, p) => acc + (p.lecture_count || 0), 0)}
                </span>
                <span className={styles.statLabel} style={{ color: '#64748b' }}>محاضرة</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: theme.light }}>
                <Calendar size={20} color={theme.primary} />
              </div>
              <div>
                <span className={styles.statValue} style={{ color: theme.text }}>
                  {userPackages.reduce((acc, up) => {
                    const daysLeft = Math.ceil((new Date(up.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    return acc + Math.max(0, daysLeft)
                  }, 0)}
                </span>
                <span className={styles.statLabel} style={{ color: '#64748b' }}>يوم متبقي</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: theme.light }}>
                <Users size={20} color={theme.primary} />
              </div>
              <div>
                <span className={styles.statValue} style={{ color: theme.text }}>
                  {userPackages.length}
                </span>
                <span className={styles.statLabel} style={{ color: '#64748b' }}>اشتراك نشط</span>
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.emptyState}
          >
            <div className={styles.emptyIcon} style={{ background: theme.light }}>
              <Target size={48} color={theme.primary} />
            </div>
            <h3 style={{ color: theme.text }}>لا توجد باقات متاحة</h3>
            <p style={{ color: '#64748b' }}>
              {searchQuery ? 'لم يتم العثور على باقات مطابقة للبحث' : 'سيتم إضافة باقات جديدة قريباً'}
            </p>
            {searchQuery && (
              <button 
                className={styles.clearSearchButton}
                onClick={() => setSearchQuery('')}
                style={{ color: theme.primary }}
              >
                مسح البحث
              </button>
            )}
          </motion.div>
        )}

        {/* دليل المساعدة */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={styles.helpSection}
          style={{ background: theme.light }}
        >
          <div className={styles.helpHeader}>
            <BookCheck size={24} color={theme.primary} />
            <h3 style={{ color: theme.text }}>كيف تختار الباقة المناسبة؟</h3>
          </div>
          <div className={styles.helpTips}>
            <div className={styles.helpTip}>
              <div className={styles.tipIcon} style={{ background: theme.primary }}>
                <Clock3 size={16} color="white" />
              </div>
              <div>
                <span style={{ color: theme.text }}>المدة الزمنية</span>
                <small style={{ color: '#64748b' }}>اختر الباقة التي تناسب جدولك الدراسي</small>
              </div>
            </div>
            <div className={styles.helpTip}>
              <div className={styles.tipIcon} style={{ background: theme.primary }}>
                <Video size={16} color="white" />
              </div>
              <div>
                <span style={{ color: theme.text }}>عدد المحاضرات</span>
                <small style={{ color: '#64748b' }}>تحقق من عدد المحاضرات المضمنة</small>
              </div>
            </div>
            <div className={styles.helpTip}>
              <div className={styles.tipIcon} style={{ background: theme.primary }}>
                <UserCheck size={16} color="white" />
              </div>
              <div>
                <span style={{ color: theme.text }}>المميزات الإضافية</span>
                <small style={{ color: '#64748b' }}>راجع المميزات الخاصة بكل باقة</small>
              </div>
            </div>
          </div>
        </motion.div>
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

      {/* الفوتر */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo} style={{ background: theme.light }}>
              <Crown size={24} color={theme.primary} />
            </div>
            <div>
              <span style={{ color: theme.text, fontWeight: 600 }}>البارع محمود الديب</span>
              <small style={{ color: '#64748b' }}>منارة العلم والتميز</small>
            </div>
          </div>
          <div className={styles.footerLinks}>
            <a href="#" style={{ color: '#64748b' }}>الشروط والأحكام</a>
            <a href="#" style={{ color: '#64748b' }}>سياسة الخصوصية</a>
            <a href="#" style={{ color: '#64748b' }}>اتصل بنا</a>
          </div>
        </div>
      </footer>
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
      case 'weekly': return <Clock size={16} />
      case 'monthly': return <Calendar size={16} />
      case 'term': return <Medal size={16} />
      case 'offer': return <Crown size={16} />
      default: return <BookOpen size={16} />
    }
  }

  const getTypeColor = () => {
    switch (pkg.type) {
      case 'weekly': return '#3b82f6'
      case 'monthly': return '#8b5cf6'
      case 'term': return '#10b981'
      case 'offer': return '#f59e0b'
      default: return '#94a3b8'
    }
  }

  const getTypeName = () => {
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
      whileHover={{ 
        y: -4,
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)'
      }}
      className={`${styles.packageCard} ${isPurchased ? styles.purchased : ''}`}
      style={{ 
        background: theme.background,
        borderColor: '#e2e8f0'
      }}
    >
      {/* شارة الحالة */}
      {(isPurchased || pkg.type === 'offer') && (
        <div 
          className={styles.statusBadge}
          style={{ 
            background: isPurchased ? '#10b981' : '#f59e0b',
            color: 'white'
          }}
        >
          {isPurchased ? (
            <>
              <CheckCircle2 size={12} />
              <span>مشترك</span>
            </>
          ) : (
            <>
              <Zap size={12} />
              <span>عرض محدود</span>
            </>
          )}
        </div>
      )}

      {/* الخصم */}
      {pkg.original_price && (
        <div className={styles.discountTag} style={{ background: '#ef4444', color: 'white' }}>
          <span>وفر {Math.round((1 - pkg.price/pkg.original_price) * 100)}%</span>
        </div>
      )}

      {/* نوع الباقة */}
      <div className={styles.typeIndicator} style={{ background: getTypeColor() }} />

      {/* الهيدر */}
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon} style={{ background: theme.light }}>
          {getTypeIcon()}
        </div>
        <div className={styles.cardTitleSection}>
          <h3 className={styles.cardTitle} style={{ color: theme.text }}>{pkg.name}</h3>
          <div className={styles.cardSubtitle} style={{ color: getTypeColor() }}>
            {getTypeName()}
          </div>
        </div>
      </div>

      {/* الوصف */}
      <p className={styles.cardDescription} style={{ color: '#64748b' }}>
        {pkg.description}
      </p>

      {/* المميزات */}
      <div className={styles.featuresSection}>
        <h4 style={{ color: theme.text }}>المميزات</h4>
        <ul className={styles.featuresList}>
          {pkg.features?.slice(0, 3).map((feature: string, i: number) => (
            <li key={i}>
              <CheckCircle2 size={14} style={{ color: theme.primary, minWidth: '16px' }} />
              <span style={{ color: theme.text }}>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* الإحصائيات */}
      <div className={styles.cardStats}>
        <div className={styles.statItem} style={{ color: theme.text }}>
          <PlayCircle size={16} style={{ color: theme.primary }} />
          <span>{pkg.lecture_count} محاضرة</span>
        </div>
        <div className={styles.statItem} style={{ color: theme.text }}>
          <Clock size={16} style={{ color: theme.primary }} />
          <span>{pkg.duration_days} يوم</span>
        </div>
        <div className={styles.statItem} style={{ color: theme.text }}>
          <FileText size={16} style={{ color: theme.primary }} />
          <span>تمارين تفاعلية</span>
        </div>
      </div>

      {/* تاريخ الانتهاء */}
      {pkg.expires_at && (
        <div className={styles.expirySection} style={{ background: theme.light }}>
          <Calendar size={14} color={theme.primary} />
          <span style={{ color: theme.text }}>
            ينتهي في {new Date(pkg.expires_at).toLocaleDateString('ar-EG')}
          </span>
        </div>
      )}

      {/* الفوتر */}
      <div className={styles.cardFooter}>
        <div className={styles.priceSection}>
          {pkg.original_price && (
            <span className={styles.originalPrice} style={{ color: '#94a3b8' }}>
              {pkg.original_price.toLocaleString()} ج.م
            </span>
          )}
          <div className={styles.currentPrice} style={{ color: theme.primary }}>
            <span>{pkg.price.toLocaleString()}</span>
            <small style={{ color: '#94a3b8' }}>ج.م</small>
          </div>
        </div>

        {isPurchased ? (
          <motion.button
            className={styles.enterButton}
            style={{ background: '#10b981' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onEnter}
          >
            <span>الدخول للباقة</span>
            <ChevronLeft size={18} />
          </motion.button>
        ) : (
          <motion.button
            className={styles.buyButton}
            style={{ background: theme.gradient }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPurchase}
          >
            <span>اشترك الآن</span>
            <ShoppingCart size={18} />
          </motion.button>
        )}
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
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={styles.modal}
        onClick={e => e.stopPropagation()}
        style={{ background: theme.background }}
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
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ color: theme.text }}
            >
              تم الشراء بنجاح!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ color: '#64748b' }}
            >
              يمكنك الآن الوصول إلى جميع محتويات الباقة
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={styles.successButton}
              style={{ background: theme.gradient }}
              onClick={onClose}
            >
              رائع!
            </motion.button>
          </div>
        ) : (
          <>
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon} style={{ background: theme.light }}>
                <Gift size={32} color={theme.primary} />
              </div>
              <div>
                <h3 style={{ color: theme.text }}>{pkg.name}</h3>
                <p style={{ color: '#64748b' }}>اكمل عملية الشراء</p>
              </div>
              <button className={styles.closeButton} onClick={onClose}>
                <X size={24} color={theme.text} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* معلومات السعر */}
              <div className={styles.priceSummary} style={{ background: theme.light }}>
                <div>
                  <span style={{ color: '#64748b' }}>المبلغ الإجمالي</span>
                  <div className={styles.totalPrice}>
                    {pkg.original_price && (
                      <span className={styles.strikethrough} style={{ color: '#94a3b8' }}>
                        {pkg.original_price.toLocaleString()} ج.م
                      </span>
                    )}
                    <span style={{ color: theme.primary }}>
                      {pkg.price.toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
                {pkg.original_price && (
                  <div className={styles.savings} style={{ background: '#ef4444', color: 'white' }}>
                    <span>وفرت {Math.round((1 - pkg.price/pkg.original_price) * 100)}%</span>
                  </div>
                )}
              </div>

              {/* طرق الدفع */}
              <div className={styles.paymentMethods}>
                <h4 style={{ color: theme.text }}>اختر طريقة الدفع</h4>
                <div className={styles.methodsGrid}>
                  <button 
                    className={`${styles.methodCard} ${method === 'wallet' ? styles.active : ''}`}
                    onClick={() => setMethod('wallet')}
                    style={method === 'wallet' ? { 
                      borderColor: theme.primary,
                      background: theme.light 
                    } : {}}
                  >
                    <div className={styles.methodIcon} style={{ background: theme.primary }}>
                      <CreditCard size={24} color="white" />
                    </div>
                    <div className={styles.methodInfo}>
                      <strong style={{ color: theme.text }}>المحفظة</strong>
                      <span style={{ color: '#64748b' }}>رصيدك: {walletBalance.toLocaleString()} ج.م</span>
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
                    style={method === 'code' ? { 
                      borderColor: '#f59e0b',
                      background: '#fffbeb'
                    } : {}}
                  >
                    <div className={styles.methodIcon} style={{ background: '#f59e0b' }}>
                      <Ticket size={24} color="white" />
                    </div>
                    <div className={styles.methodInfo}>
                      <strong style={{ color: theme.text }}>كود الخصم</strong>
                      <span style={{ color: '#64748b' }}>لديك كود خصم؟</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* إدخال الكود */}
              {method === 'code' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={styles.codeSection}
                >
                  <div className={styles.codeInput}>
                    <input 
                      type="text" 
                      value={code} 
                      onChange={e => setCode(e.target.value.toUpperCase())} 
                      placeholder="أدخل الكود هنا"
                      disabled={!!codeValid}
                      maxLength={20}
                      style={{ color: theme.text, borderColor: '#e2e8f0' }}
                    />
                    <button 
                      onClick={handleValidateCode}
                      disabled={loading || !code || !!codeValid}
                      style={{ background: '#f59e0b' }}
                    >
                      {loading ? <Loader2 className={styles.spinning} size={20} /> : 'تحقق'}
                    </button>
                  </div>
                  {codeValid && (
                    <div className={styles.codeSuccess}>
                      <CheckCircle2 size={16} color="#10b981" />
                      <span style={{ color: '#059669' }}>
                        كود صالح! {codeValid.discount_percentage && `(خصم ${codeValid.discount_percentage}%)`}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* تحذير الرصيد */}
              {method === 'wallet' && walletBalance < pkg.price && (
                <div className={styles.balanceWarning} style={{ background: '#fee2e2', borderColor: '#f87171' }}>
                  <AlertCircle size={20} color="#dc2626" />
                  <div>
                    <strong style={{ color: '#7f1d1d' }}>رصيد غير كافٍ</strong>
                    <span style={{ color: '#7f1d1d' }}>يرجى شحن محفظتك أولاً</span>
                  </div>
                  <button style={{ color: theme.primary }}>شحن المحفظة</button>
                </div>
              )}

              {/* رسالة الخطأ */}
              {error && (
                <div className={styles.errorMessage} style={{ background: '#fee2e2', borderColor: '#f87171' }}>
                  <AlertCircle size={18} color="#dc2626" />
                  <span style={{ color: '#7f1d1d' }}>{error}</span>
                </div>
              )}

              {/* تفاصيل الشراء */}
              <div className={styles.purchaseDetails}>
                <div className={styles.detailItem}>
                  <span style={{ color: '#64748b' }}>عدد المحاضرات</span>
                  <span style={{ color: theme.text }}>{pkg.lecture_count} محاضرة</span>
                </div>
                <div className={styles.detailItem}>
                  <span style={{ color: '#64748b' }}>مدة الاشتراك</span>
                  <span style={{ color: theme.text }}>{pkg.duration_days} يوم</span>
                </div>
                <div className={styles.detailItem}>
                  <span style={{ color: '#64748b' }}>نوع الباقة</span>
                  <span style={{ color: theme.text }}>
                    {pkg.type === 'weekly' && 'أسبوعي'}
                    {pkg.type === 'monthly' && 'شهري'}
                    {pkg.type === 'term' && 'ترم كامل'}
                    {pkg.type === 'offer' && 'عرض خاص'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <div className={styles.securityBadge}>
                <Shield size={16} color={theme.primary} />
                <span style={{ color: '#64748b' }}>معاملة آمنة ومشفرة 100%</span>
              </div>
              
              <motion.button 
                className={styles.confirmButton}
                style={{ 
                  background: (method === 'wallet' && walletBalance < pkg.price) || (method === 'code' && !codeValid) 
                    ? '#cbd5e1' 
                    : theme.gradient 
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
      {[...Array(80)].map((_, i) => (
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
            backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 5)],
            width: Math.random() * 12 + 4,
            height: Math.random() * 12 + 4,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px'
          }}
        />
      ))}
    </div>
  )
}