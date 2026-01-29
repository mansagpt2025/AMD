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
  ChevronLeft, TrendingUp, Award, BookMarked, Flame,
  Gem, ArrowUpRight, Play, Lock, Check
} from 'lucide-react'
import styles from './GradePage.module.css'

// ... (Interfacesremain the same)

const themes: Record<string, any> = {
  first: {
    primary: '#6366f1', // Indigo
    secondary: '#8b5cf6', // Violet
    accent: '#06b6d4', // Cyan
    light: '#eef2ff',
    gradient: 'from-indigo-500 via-purple-500 to-cyan-500'
  },
  second: {
    primary: '#ec4899', // Pink
    secondary: '#f43f5e', // Rose
    accent: '#f59e0b', // Amber
    light: '#fdf2f8',
    gradient: 'from-pink-500 via-rose-500 to-orange-400'
  },
  third: {
    primary: '#3b82f6', // Blue
    secondary: '#06b6d4', // Cyan
    accent: '#10b981', // Emerald
    light: '#eff6ff',
    gradient: 'from-blue-500 via-cyan-500 to-emerald-400'
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

  const { scrollY } = useScroll()
  const headerOpacity = useTransform(scrollY, [0, 100], [0, 1])
  const headerY = useTransform(scrollY, [0, 100], [-20, 0])
  
  const [packages, setPackages] = useState<any[]>([])
  const [userPackages, setUserPackages] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'subscribed' | 'offers'>('all')
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  // Simplified data fetching for demo
  useEffect(() => {
    setTimeout(() => {
      setPackages([
        { id: '1', name: 'الباقة الشهرية', description: 'وصول كامل لجميع المحاضرات لمدة شهر', price: 150, original_price: 200, type: 'monthly', lecture_count: 20, duration_days: 30, features: ['20 محاضرة تفاعلية', 'وصول 24/7', 'دعم مباشر'] },
        { id: '2', name: 'باقة الترم', description: 'أفضل قيمة للترم الدراسي بالكامل', price: 400, type: 'term', lecture_count: 60, duration_days: 90, features: ['60 محاضرة', 'ملخصات PDF', 'اختبارات تجريبية'] },
        { id: '3', name: 'عرض محدود', description: 'خصم خاص لفترة محدودة', price: 99, original_price: 250, type: 'offer', lecture_count: 15, duration_days: 14, features: ['15 محاضرة', 'خصم 60%', 'لمدة 14 يوم'] },
      ])
      setLoading(false)
    }, 1500)
  }, [])

  const filteredPackages = packages.filter(pkg => {
    if (activeTab === 'offers') return pkg.type === 'offer'
    return true
  })

  return (
    <div className={styles.container} style={{ ['--theme-color' as any]: theme.primary, ['--theme-light' as any]: theme.light }}>
      {/* Floating Header */}
      <motion.header 
        className={styles.floatingHeader}
        style={{ opacity: headerOpacity, y: headerY }}
      >
        <div className={styles.headerContent}>
          <span className={styles.headerTitle}>الصف {gradeSlug === 'first' ? 'الأول' : gradeSlug === 'second' ? 'الثاني' : 'الثالث'}</span>
          {user && (
            <div className={styles.headerWallet}>
              <Wallet size={18} />
              <span>{walletBalance} ج.م</span>
            </div>
          )}
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <motion.div 
            className={styles.heroBlob}
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ background: `linear-gradient(135deg, ${theme.primary}20, ${theme.secondary}20)` }}
          />
        </div>
        
        <div className={styles.heroContent}>
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className={styles.avatar}
          >
            <GraduationCap size={40} color={theme.primary} />
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            الصف {gradeSlug === 'first' ? 'الأول' : gradeSlug === 'second' ? 'الثاني' : 'الثالث'} الثانوي
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={styles.subtitle}
          >
            اختر باقتك المثالية وابدأ رحلة التفوق
          </motion.p>

          {user ? (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={styles.balanceChip}
              style={{ background: theme.light, color: theme.primary }}
            >
              <Wallet size={18} />
              <span>رصيدك: {walletBalance.toLocaleString()} ج.م</span>
              <button className={styles.addBalanceBtn}>+</button>
            </motion.div>
          ) : (
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={styles.loginBtn}
              style={{ background: theme.primary }}
              onClick={() => router.push('/login')}
            >
              تسجيل الدخول
            </motion.button>
          )}
        </div>
      </section>

      {/* Filter Tabs */}
      <div className={styles.filterSection}>
        <div className={styles.tabContainer}>
          <button 
            className={`${styles.filterTab} ${activeTab === 'all' ? styles.active : ''}`}
            onClick={() => setActiveTab('all')}
            style={{ ['--active-color' as any]: theme.primary }}
          >
            <BookOpen size={18} />
            <span>الكل</span>
          </button>
          <button 
            className={`${styles.filterTab} ${activeTab === 'subscribed' ? styles.active : ''}`}
            onClick={() => setActiveTab('subscribed')}
            style={{ ['--active-color' as any]: '#10b981' }}
          >
            <CheckCircle2 size={18} />
            <span>اشتراكاتي</span>
          </button>
          <button 
            className={`${styles.filterTab} ${activeTab === 'offers' ? styles.active : ''}`}
            onClick={() => setActiveTab('offers')}
            style={{ ['--active-color' as any]: '#f59e0b' }}
          >
            <Flame size={18} />
            <span>عروض</span>
          </button>
        </div>
      </div>

      {/* Packages Grid */}
      <main className={styles.mainContent}>
        {loading ? (
          <div className={styles.skeletonGrid}>
            {[1, 2, 3].map(i => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonImage} />
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLineShort} />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.grid}>
            <AnimatePresence mode="popLayout">
              {filteredPackages.map((pkg, idx) => (
                <PackageCard 
                  key={pkg.id}
                  pkg={pkg}
                  theme={theme}
                  index={idx}
                  onSelect={() => {
                    setSelectedPackage(pkg)
                    setShowModal(true)
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Bottom Sheet Modal */}
      <AnimatePresence>
        {showModal && selectedPackage && (
          <BottomSheet 
            pkg={selectedPackage} 
            theme={theme}
            onClose={() => setShowModal(false)}
            walletBalance={walletBalance}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function PackageCard({ pkg, theme, index, onSelect }: any) {
  const isOffer = pkg.type === 'offer'
  const discount = pkg.original_price ? Math.round((1 - pkg.price/pkg.original_price) * 100) : 0
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className={`${styles.card} ${isOffer ? styles.offerCard : ''}`}
      onClick={onSelect}
    >
      {isOffer && (
        <div className={styles.discountBadge}>-{discount}%</div>
      )}
      
      <div className={styles.cardImage} style={{ background: theme.light }}>
        {isOffer ? <Flame size={40} color={theme.primary} /> : <BookOpen size={40} color={theme.primary} />}
        <div className={styles.glassOverlay} />
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <h3>{pkg.name}</h3>
          {isOffer && <span className={styles.offerTag}>عرض محدود</span>}
        </div>
        
        <p className={styles.description}>{pkg.description}</p>
        
        <div className={styles.features}>
          {pkg.features?.slice(0, 2).map((f: string, i: number) => (
            <div key={i} className={styles.feature}>
              <Check size={14} style={{ color: theme.primary }} />
              <span>{f}</span>
            </div>
          ))}
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.priceBlock}>
            {pkg.original_price && (
              <span className={styles.oldPrice}>{pkg.original_price} ج.م</span>
            )}
            <span className={styles.price} style={{ color: theme.primary }}>
              {pkg.price} <small>ج.م</small>
            </span>
          </div>
          
          <motion.button 
            className={styles.actionBtn}
            style={{ 
              background: isOffer ? 'linear-gradient(135deg, #f59e0b, #d97706)' : theme.primary 
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isOffer ? 'احصل عليه' : 'اشترك'}
            <ArrowUpRight size={16} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

function BottomSheet({ pkg, theme, onClose, walletBalance }: any) {
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details')
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={styles.bottomSheet}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.sheetHandle} />
        
        {step === 'details' && (
          <>
            <div className={styles.sheetHeader}>
              <div className={styles.packageIconLarge} style={{ background: theme.light }}>
                <Gift size={32} color={theme.primary} />
              </div>
              <h2>{pkg.name}</h2>
              <p>{pkg.description}</p>
            </div>

            <div className={styles.detailsList}>
              <div className={styles.detailItem}>
                <PlayCircle size={20} color={theme.primary} />
                <span>{pkg.lecture_count} محاضرة تفاعلية</span>
              </div>
              <div className={styles.detailItem}>
                <Clock size={20} color={theme.primary} />
                <span>صالحة لمدة {pkg.duration_days} يوم</span>
              </div>
              <div className={styles.detailItem}>
                <Shield size={20} color={theme.primary} />
                <span>دعم فني على مدار الساعة</span>
              </div>
            </div>

            <div className={styles.sheetFooter}>
              <div className={styles.totalPrice}>
                <span>الإجمالي</span>
                <strong style={{ color: theme.primary }}>{pkg.price} ج.م</strong>
              </div>
              <motion.button 
                className={styles.primaryButton}
                style={{ background: theme.primary }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep('payment')}
              >
                متابعة الشراء
              </motion.button>
            </div>
          </>
        )}

        {step === 'payment' && (
          <div className={styles.paymentStep}>
            <button className={styles.backBtn} onClick={() => setStep('details')}>
              <ArrowRight size={20} /> رجوع
            </button>
            
            <div className={styles.paymentMethods}>
              <div className={styles.methodCard}>
                <div className={styles.methodIcon} style={{ background: theme.light }}>
                  <Wallet size={24} color={theme.primary} />
                </div>
                <div className={styles.methodInfo}>
                  <strong>الدفع من المحفظة</strong>
                  <span>رصيدك: {walletBalance} ج.م</span>
                </div>
                <div className={styles.radio} style={{ borderColor: theme.primary }} />
              </div>
              
              <div className={styles.methodCard}>
                <div className={styles.methodIcon} style={{ background: '#fef3c7' }}>
                  <Ticket size={24} color="#d97706" />
                </div>
                <div className={styles.methodInfo}>
                  <strong>كود خصم</strong>
                  <span>لديك كود تفعيل؟</span>
                </div>
                <div className={styles.radio} />
              </div>
            </div>

            <motion.button 
              className={styles.primaryButton}
              style={{ background: theme.primary, marginTop: 'auto' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep('success')}
            >
              تأكيد الدفع
            </motion.button>
          </div>
        )}

        {step === 'success' && (
          <div className={styles.successStep}>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={styles.successIcon}
              style={{ background: theme.light }}
            >
              <Check size={48} color={theme.primary} strokeWidth={3} />
            </motion.div>
            <h2>تم بنجاح!</h2>
            <p>تم تفعيل باقتك ويمكنك البدء الآن</p>
            <motion.button 
              className={styles.primaryButton}
              style={{ background: theme.primary }}
              onClick={onClose}
            >
              ابدأ التعلم
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  )
}