'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientBrowser } from '@/lib/supabase/sf-client'
import { 
  Wallet, BookOpen, GraduationCap, Loader2, AlertCircle,
  Crown, Sparkles, Clock, Calendar, Medal, PlayCircle,
  CheckCircle2, ArrowRight, ShoppingCart, RefreshCw, Zap,
  Target, Ticket, CreditCard, X, Shield, Gift
} from 'lucide-react'
import styles from './GradePage.module.css'
import { deductWalletBalance, markCodeAsUsed, createUserPackage } from './actions'

// ================ Types ================
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
}

interface UserPackage {
  id: string
  package_id: string
  expires_at: string
  is_active: boolean
  packages: Package
}

interface WalletData {
  balance: number
  id: string
}

interface ThemeType {
  primary: string
  secondary: string
  accent: string
  bg: string
  wave: string
}

// ================ Main Page ================
export default function GradePage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClientBrowser()
  const gradeSlug = params?.grade as 'first' | 'second' | 'third'

  const themes: Record<string, ThemeType> = {
    first: {
      primary: '#3b82f6',
      secondary: '#1d4ed8',
      accent: '#06b6d4',
      bg: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
      wave: '#dbeafe'
    },
    second: {
      primary: '#8b5cf6',
      secondary: '#6d28d9',
      accent: '#ec4899',
      bg: 'linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)',
      wave: '#ede9fe'
    },
    third: {
      primary: '#f59e0b',
      secondary: '#d97706',
      accent: '#ef4444',
      bg: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
      wave: '#fef3c7'
    }
  }

  const theme = themes[gradeSlug] || themes.first

  const [packages, setPackages] = useState<Package[]>([])
  const [userPackages, setUserPackages] = useState<UserPackage[]>([])
  const [user, setUser] = useState<any>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      const { data: packagesData } = await supabase
        .from('packages')
        .select('*')
        .eq('grade', gradeSlug)
        .eq('is_active', true)
        .order('price', { ascending: true })

      setPackages(packagesData || [])

      if (currentUser) {
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance, id')
          .eq('user_id', currentUser.id)
          .single() as { data: WalletData | null }

        setWalletBalance(walletData?.balance || 0)

        const { data: userPkgs } = await supabase
          .from('user_packages')
          .select(`*, packages:package_id(*)`)
          .eq('user_id', currentUser.id)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())

        setUserPackages(userPkgs as UserPackage[] || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [gradeSlug, supabase])

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
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, supabase])

  const { purchased, available, offers } = useMemo(() => {
    const purchasedIds = userPackages.map(up => up.package_id)
    
    const purchased = userPackages
      .filter(up => up.packages)
      .map(up => ({ ...up.packages, userPackageId: up.id, expires_at: up.expires_at }))
    
    const available = packages.filter(p => !purchasedIds.includes(p.id) && p.type !== 'offer')
    const offers = packages.filter(p => !purchasedIds.includes(p.id) && p.type === 'offer')
    
    return { purchased, available, offers }
  }, [packages, userPackages])

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

  if (loading) {
    return (
      <div className={styles.loading} style={{ background: theme.bg }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Loader2 size={64} color="white" />
        </motion.div>
        <p>جاري تحميل البيانات...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.error}>
        <AlertCircle size={64} color={theme.primary} />
        <h3>حدث خطأ</h3>
        <p>{error}</p>
        <button onClick={fetchData}>إعادة المحاولة</button>
      </div>
    )
  }

  return (
    <div className={styles.container} style={{ '--primary': theme.primary, '--secondary': theme.secondary, '--accent': theme.accent } as any}>
      <div className={styles.waveContainer}>
        <svg className={styles.waves} viewBox="0 24 150 28" preserveAspectRatio="none">
          <defs>
            <path id="wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
          </defs>
          <g className={styles.parallax}>
            <use href="#wave" x="48" y="0" fill={theme.wave} fillOpacity="0.7" />
            <use href="#wave" x="48" y="3" fill={theme.wave} fillOpacity="0.5" />
            <use href="#wave" x="48" y="5" fill={theme.wave} fillOpacity="0.3" />
            <use href="#wave" x="48" y="7" fill={theme.wave} fillOpacity="0.1" />
          </g>
        </svg>
      </div>

      <header className={styles.header} style={{ background: theme.bg }}>
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={styles.headerContent}>
          <div className={styles.logoSection}>
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}>
              <Crown size={48} color="white" />
            </motion.div>
            <div>
              <h1>البارع محمود الديب</h1>
              <p>منارة العلم والتميز</p>
            </div>
          </div>

          {user && (
            <motion.div className={styles.walletCard} whileHover={{ scale: 1.05 }}>
              <div className={styles.walletIcon}><Wallet size={24} /></div>
              <div className={styles.walletInfo}>
                <span className={styles.walletLabel}>رصيدك</span>
                <span className={styles.walletAmount}>{walletBalance.toLocaleString()} جنيه</span>
              </div>
              <button className={styles.refreshBtn} onClick={fetchData}><RefreshCw size={16} /></button>
            </motion.div>
          )}
        </motion.div>

        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={styles.gradeBadge}>
          <GraduationCap size={32} />
          <h2>
            {gradeSlug === 'first' && 'الصف الأول الثانوي'}
            {gradeSlug === 'second' && 'الصف الثاني الثانوي'}
            {gradeSlug === 'third' && 'الصف الثالث الثانوي'}
          </h2>
        </motion.div>
      </header>

      <main className={styles.main}>
        {purchased.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <CheckCircle2 size={32} color="#10b981" />
              <div><h2>اشتراكاتك الحالية</h2><p>الباقات التي قمت بشرائها</p></div>
              <span className={styles.countBadge}>{purchased.length}</span>
            </div>
            <div className={styles.grid}>
              {purchased.map((pkg: any, idx: number) => (
                <PackageCard key={pkg.id} pkg={pkg} isPurchased={true} theme={theme} index={idx} onEnter={() => handleEnterPackage(pkg.id)} expiresAt={pkg.expires_at} />
              ))}
            </div>
          </section>
        )}

        {offers.length > 0 && (
          <section className={`${styles.section} ${styles.offerSection}`}>
            <div className={styles.sectionHeader}>
              <Sparkles size={32} color="#f59e0b" />
              <div><h2>عروض VIP حصرية</h2><p>خصومات لفترة محدودة</p></div>
            </div>
            <div className={styles.grid}>
              {offers.map((pkg, idx) => (
                <PackageCard key={pkg.id} pkg={pkg} isPurchased={false} theme={theme} index={idx} isOffer={true} onPurchase={() => handlePurchaseClick(pkg)} />
              ))}
            </div>
          </section>
        )}

        {available.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <BookOpen size={32} color={theme.primary} />
              <div><h2>الباقات المتاحة</h2><p>اختر الباقة المناسبة لك</p></div>
            </div>
            <div className={styles.grid}>
              {available.map((pkg, idx) => (
                <PackageCard key={pkg.id} pkg={pkg} isPurchased={false} theme={theme} index={idx} onPurchase={() => handlePurchaseClick(pkg)} />
              ))}
            </div>
          </section>
        )}

        {purchased.length === 0 && available.length === 0 && offers.length === 0 && (
          <div className={styles.empty}>
            <BookOpen size={64} color="#cbd5e1" />
            <h3>لا توجد باقات متاحة حالياً</h3>
            <p>سيتم إضافة باقات جديدة قريباً</p>
          </div>
        )}
      </main>

      <AnimatePresence>
        {showPurchaseModal && selectedPackage && (
          <PurchaseModal pkg={selectedPackage} user={user} walletBalance={walletBalance} theme={theme} onClose={() => setShowPurchaseModal(false)} onSuccess={() => { fetchData(); setShowPurchaseModal(false); }} gradeSlug={gradeSlug} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ================ Package Card Component ================
function PackageCard({ pkg, isPurchased, theme, index, onPurchase, onEnter, isOffer, expiresAt }: any) {
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
      default: return 'عادي'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      className={`${styles.card} ${isOffer ? styles.offerCard : ''} ${isPurchased ? styles.purchasedCard : ''}`}
    >
      {isOffer && <div className={styles.offerBadge}><Sparkles size={16} /><span>عرض حصري</span></div>}
      {isPurchased && <div className={styles.purchasedBadge}><CheckCircle2 size={16} /><span>مشترك</span></div>}

      <div className={styles.cardImage}>
        {pkg.image_url ? <img src={pkg.image_url} alt={pkg.name} /> : <div className={styles.placeholder} style={{ background: theme.bg }}>{getTypeIcon()}</div>}
        <div className={styles.typeTag} style={{ background: theme.primary }}>{getTypeIcon()}<span>{getTypeLabel()}</span></div>
      </div>

      <div className={styles.cardContent}>
        <h3>{pkg.name}</h3>
        <p>{pkg.description || `باقة ${getTypeLabel()} متكاملة`}</p>
        
        <div className={styles.stats}>
          <div className={styles.stat}><PlayCircle size={16} /><span>{pkg.lecture_count || 0} محاضرة</span></div>
          <div className={styles.stat}><Clock size={16} /><span>{pkg.duration_days || 30} يوم</span></div>
        </div>

        {expiresAt && <div className={styles.expiry}><span>ينتهي: {new Date(expiresAt).toLocaleDateString('ar-EG')}</span></div>}

        <div className={styles.priceRow}>
          <div className={styles.price}><span>{(pkg.price || 0).toLocaleString()}</span><small>جنيه</small></div>
          {isPurchased ? (
            <button className={styles.enterBtn} onClick={onEnter} style={{ background: '#10b981' }}>دخول<ArrowRight size={18} /></button>
          ) : (
            <button className={styles.buyBtn} onClick={onPurchase} style={{ background: theme.primary }}>شراء<ShoppingCart size={18} /></button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ================ Purchase Modal Component ================
interface CodeData {
  id: string
  is_used: boolean
  grade: string
  package_id: string | null
  expires_at: string | null
  discount_percentage?: number
}

function PurchaseModal({ pkg, user, walletBalance, theme, onClose, onSuccess, gradeSlug }: any) {
  const supabase = createClientBrowser()
  const [method, setMethod] = useState<'wallet' | 'code'>('wallet')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [codeValid, setCodeValid] = useState<CodeData | null>(null)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const validateCode = async () => {
    if (!code.trim()) { setError('أدخل الكود'); return }
    setLoading(true); setError('')

    try {
      const cleanCode = code.trim().toUpperCase()
      if (!/^[A-Z0-9]{8,16}$/.test(cleanCode)) throw new Error('صيغة الكود غير صحيحة')

      const { data: codeData, error: codeErr } = await supabase
        .from('codes')
        .select('*')
        .eq('code', cleanCode)
        .single() as { data: CodeData | null, error: any }

      if (codeErr || !codeData) throw new Error('الكود غير موجود')
      if (codeData.is_used) throw new Error('الكود مستخدم بالفعل')
      if (codeData.grade !== gradeSlug) throw new Error('الكود ليس لهذا الصف')
      if (codeData.package_id && codeData.package_id !== pkg.id) throw new Error('الكود لباقة أخرى')
      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) throw new Error('الكود منتهي')

      setCodeValid(codeData)
    } catch (err: any) {
      setError(err.message)
      setCodeValid(null)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    setLoading(true); setError('')

    try {
      if (method === 'wallet') {
        if (walletBalance < pkg.price) throw new Error(`رصيد غير كافٍ`)
        const result = await deductWalletBalance(user.id, pkg.price, pkg.id)
        if (!result.success) throw new Error(result.message)
        await createUserPackage(user.id, pkg.id, pkg.duration_days || 30, 'wallet')
      } else {
        if (!codeValid) throw new Error('تحقق من الكود')
        const markResult = await markCodeAsUsed(codeValid.id, user.id)
        if (!markResult.success) throw new Error(markResult.message)
        const pkgResult = await createUserPackage(user.id, pkg.id, pkg.duration_days || 30, 'code')
        if (!pkgResult.success) {
          await supabase.from('codes').update({ is_used: false, used_by: null }).eq('id', codeValid.id)
          throw new Error(pkgResult.message)
        }
      }

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'تم الشراء بنجاح! 🎉',
        message: `تم تفعيل ${pkg.name}`,
        type: 'success'
      })

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}><X size={24} /></button>
        <div className={styles.modalHeader}>
          <Gift size={48} color={theme.primary} />
          <h3>{pkg.name}</h3>
          <p className={styles.modalPrice}>{pkg.price.toLocaleString()} جنيه</p>
        </div>

        <div className={styles.paymentMethods}>
          <button className={`${styles.methodBtn} ${method === 'wallet' ? styles.active : ''}`} onClick={() => setMethod('wallet')}>
            <CreditCard size={24} />
            <div><strong>المحفظة</strong><span>رصيد: {walletBalance.toLocaleString()} جنيه</span></div>
          </button>
          <button className={`${styles.methodBtn} ${method === 'code' ? styles.active : ''}`} onClick={() => setMethod('code')}>
            <Ticket size={24} />
            <div><strong>كود تفعيل</strong><span>ادخل كود الخصم</span></div>
          </button>
        </div>

        {method === 'code' && (
          <div className={styles.codeSection}>
            <div className={styles.codeInput}>
              <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="XXXX-XXXX" disabled={!!codeValid} />
              <button onClick={validateCode} disabled={loading || !code || !!codeValid} style={{ background: theme.primary }}>
                {loading ? <Loader2 className={styles.spinner} size={20} /> : 'تحقق'}
              </button>
            </div>
            {codeValid && <div className={styles.codeSuccess}><CheckCircle2 size={16} /> كود صالح!</div>}
          </div>
        )}

        {error && <div className={styles.errorMsg}><AlertCircle size={16} />{error}</div>}

        <button className={styles.confirmBtn} onClick={handlePurchase} disabled={loading || (method === 'code' && !codeValid) || (method === 'wallet' && walletBalance < pkg.price)} style={{ background: theme.primary }}>
          {loading ? <><Loader2 className={styles.spinner} size={20} /> جاري...</> : <>تأكيد الشراء <ArrowRight size={20} /></>}
        </button>

        <div className={styles.secureNote}><Shield size={16} />معاملة آمنة</div>
      </motion.div>
    </div>
  )
}