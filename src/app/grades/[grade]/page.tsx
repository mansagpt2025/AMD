'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase/sf-client'
import styles from './styles.module.css'

// ================== Types ==================
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
  purchased_at: string
  expires_at: string
  is_active: boolean
  packages: Package
}

interface Grade {
  id: string
  name: string
  slug: string
}

// ================== Page ==================
export default function GradePage({ params }: { params: { grade: string } }) {
  const router = useRouter()
  
  // State
  const [grade, setGrade] = useState<Grade | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [userPackages, setUserPackages] = useState<UserPackage[]>([])
  const [user, setUser] = useState<any>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal State
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'code'>('wallet')
  const [codeInput, setCodeInput] = useState('')
  const [purchaseError, setPurchaseError] = useState('')
  const [purchaseSuccess, setPurchaseSuccess] = useState('')
  const [isPurchasing, setIsPurchasing] = useState(false)

  // Initialize Supabase Client
  const [supabase] = useState(() => createClientBrowser())

  useEffect(() => {
    console.log('🚀 Page mounted, grade:', params?.grade)
    
    if (!params?.grade) {
      setError('معرف الصف غير موجود')
      setLoading(false)
      return
    }

    fetchData()
    checkUser()
  }, [params?.grade])

  // ================== Data Fetching ==================
  const fetchData = async () => {
    console.log('📡 Starting fetchData...')
    setLoading(true)
    setError(null)

    try {
      // Fetch Grade
      const { data: gradeData, error: gradeError } = await supabase
        .from('grades')
        .select('*')
        .eq('slug', params.grade)
        .maybeSingle()

      if (gradeError) {
        console.error('❌ Grade error:', gradeError)
        throw new Error('خطأ في تحميل بيانات الصف')
      }

      if (!gradeData) {
        console.log('⚠️ Grade not found')
        setGrade(null)
      } else {
        console.log('✅ Grade loaded:', gradeData.name)
        setGrade(gradeData)
      }

      // Fetch Packages
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .eq('grade', params.grade)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (packagesError) {
        console.error('❌ Packages error:', packagesError)
        throw new Error('خطأ في تحميل الباقات')
      }

      console.log('✅ Packages loaded:', packagesData?.length || 0)
      setPackages(packagesData || [])

    } catch (err: any) {
      console.error('💥 fetchData error:', err)
      setError(err.message || 'حدث خطأ غير متوقع')
    } finally {
      console.log('🏁 fetchData completed')
      setLoading(false)
    }
  }

  const checkUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        console.log('👤 No user logged in')
        return
      }

      console.log('👤 User found:', currentUser.id)
      setUser(currentUser)

      // Fetch Wallet
      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', currentUser.id)
        .maybeSingle()

      if (walletData) {
        setWalletBalance(walletData.balance)
      }

      // Fetch User Packages
      const { data: userPackagesData } = await supabase
        .from('user_packages')
        .select(`
          *,
          packages (*)
        `)
        .eq('user_id', currentUser.id)
        .eq('is_active', true)

      if (userPackagesData) {
        const filtered = userPackagesData.filter(
          (up: any) => up.packages?.grade === params.grade
        )
        setUserPackages(filtered)
      }
    } catch (err) {
      console.error('💥 checkUser error:', err)
    }
  }

  // ================== Purchase Handlers ==================
  const handlePurchaseClick = (pkg: Package) => {
    if (!user) {
      router.push('/login')
      return
    }
    setSelectedPackage(pkg)
    setPaymentMethod('wallet')
    setCodeInput('')
    setPurchaseError('')
    setPurchaseSuccess('')
    setShowPurchaseModal(true)
  }

  const handlePurchase = async () => {
    if (!selectedPackage || !user) return
    
    setIsPurchasing(true)
    setPurchaseError('')
    setPurchaseSuccess('')

    try {
      if (paymentMethod === 'wallet') {
        if (walletBalance < selectedPackage.price) {
          throw new Error('رصيد المحفظة غير كافٍ')
        }

        // Call purchase API
        const response = await fetch('/api/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageId: selectedPackage.id,
            userId: user.id,
            paymentMethod: 'wallet'
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'فشل الشراء')
        }

        setPurchaseSuccess('تم الشراء بنجاح!')
        setWalletBalance(prev => prev - selectedPackage.price)
        
        // Refresh user packages
        await checkUser()
        
        setTimeout(() => {
          setShowPurchaseModal(false)
        }, 2000)

      } else {
        // Code validation
        if (!codeInput.trim()) {
          throw new Error('يرجى إدخال الكود')
        }

        const response = await fetch('/api/validate-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: codeInput,
            packageId: selectedPackage.id,
            userId: user.id
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'كود غير صالح')
        }

        setPurchaseSuccess('تم تفعيل الباقة بنجاح!')
        await checkUser()
        
        setTimeout(() => {
          setShowPurchaseModal(false)
        }, 2000)
      }
    } catch (err: any) {
      setPurchaseError(err.message)
    } finally {
      setIsPurchasing(false)
    }
  }

  const isPackagePurchased = (packageId: string) => {
    return userPackages.some(up => up.package_id === packageId)
  }

  // ================== Render Helpers ==================
  const renderPackageSection = (title: string, pkgs: Package[]) => {
    if (pkgs.length === 0) return null

    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <div className={styles.packagesGrid}>
          {pkgs.map(pkg => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              isPurchased={isPackagePurchased(pkg.id)}
              onPurchase={() => handlePurchaseClick(pkg)}
              onEnter={() => router.push(`/grades/${params.grade}/packages/${pkg.id}`)}
            />
          ))}
        </div>
      </section>
    )
  }

  // ================== Loading State ==================
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>جاري تحميل بيانات الصف...</p>
        <p className={styles.debugText}>
          إذا استمر التحميل أكثر من 10 ثواني، افتح Console (F12)
        </p>
      </div>
    )
  }

  // ================== Error State ==================
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>❌ حدث خطأ</h2>
        <p>{error}</p>
        <button 
          onClick={() => fetchData()}
          className={styles.retryButton}
        >
          إعادة المحاولة
        </button>
        <button 
          onClick={() => router.push('/')}
          className={styles.backButton}
        >
          العودة للرئيسية
        </button>
      </div>
    )
  }

  // ================== Not Found State ==================
  if (!grade) {
    return (
      <div className={styles.notFound}>
        <h1>الصف غير موجود</h1>
        <p>الصف {params.grade} غير موجود في قاعدة البيانات</p>
        <button 
          onClick={() => router.push('/')}
          className={styles.backButton}
        >
          العودة للرئيسية
        </button>
      </div>
    )
  }

  // ================== Main Content ==================
  const weeklyPackages = packages.filter(p => p.type === 'weekly')
  const monthlyPackages = packages.filter(p => p.type === 'monthly')
  const termPackages = packages.filter(p => p.type === 'term')
  const offerPackages = packages.filter(p => p.type === 'offer')

  return (
    <div className={`${styles.container} ${styles[`grade-${grade.slug}`]}`}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>{grade.name}</h1>
        {user && (
          <div className={styles.walletBadge}>
            <span>💰</span>
            <span>{walletBalance} جنيه</span>
          </div>
        )}
      </header>

      {/* Content */}
      <main className={styles.main}>
        {renderPackageSection('📚 الباقات الأسبوعية', weeklyPackages)}
        {renderPackageSection('📅 الباقات الشهرية', monthlyPackages)}
        {renderPackageSection('🎓 باقات الترم', termPackages)}
        {renderPackageSection('🔥 العروض الخاصة', offerPackages)}

        {packages.length === 0 && (
          <div className={styles.emptyState}>
            <p>لا توجد باقات متاحة لهذا الصف حالياً</p>
          </div>
        )}
      </main>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedPackage && (
        <div className={styles.modalOverlay} onClick={() => setShowPurchaseModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>شراء {selectedPackage.name}</h3>
            <p className={styles.price}>السعر: {selectedPackage.price} جنيه</p>
            
            {purchaseSuccess ? (
              <div className={styles.successMessage}>
                ✅ {purchaseSuccess}
              </div>
            ) : (
              <>
                <div className={styles.paymentMethods}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      value="wallet"
                      checked={paymentMethod === 'wallet'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                    />
                    <span>محفظتي (متاح: {walletBalance} جنيه)</span>
                  </label>
                  
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      value="code"
                      checked={paymentMethod === 'code'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                    />
                    <span>كود تفعيل</span>
                  </label>
                </div>

                {paymentMethod === 'code' && (
                  <input
                    type="text"
                    placeholder="أدخل كود التفعيل"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    className={styles.codeInput}
                  />
                )}

                {purchaseError && (
                  <div className={styles.errorMessage}>❌ {purchaseError}</div>
                )}

                <div className={styles.modalButtons}>
                  <button
                    onClick={handlePurchase}
                    disabled={isPurchasing}
                    className={styles.confirmButton}
                  >
                    {isPurchasing ? 'جاري المعالجة...' : 'تأكيد الشراء'}
                  </button>
                  <button
                    onClick={() => setShowPurchaseModal(false)}
                    className={styles.cancelButton}
                    disabled={isPurchasing}
                  >
                    إلغاء
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ================== Package Card Component ==================
function PackageCard({ 
  pkg, 
  isPurchased, 
  onPurchase, 
  onEnter 
}: { 
  pkg: Package
  isPurchased: boolean
  onPurchase?: () => void
  onEnter?: () => void
}) {
  return (
    <div className={`${styles.packageCard} ${isPurchased ? styles.purchased : ''}`}>
      {pkg.image_url && (
        <div className={styles.imageWrapper}>
          <img src={pkg.image_url} alt={pkg.name} />
          {isPurchased && <div className={styles.purchasedBadge}>✓ تم الشراء</div>}
        </div>
      )}
      
      <div className={styles.cardContent}>
        <h3>{pkg.name}</h3>
        <p className={styles.description}>{pkg.description}</p>
        
        <div className={styles.details}>
          <span>💰 {pkg.price} جنيه</span>
          <span>📖 {pkg.lecture_count} محاضرة</span>
          <span>⏱️ {pkg.duration_days} يوم</span>
        </div>

        <button
          onClick={isPurchased ? onEnter : onPurchase}
          className={`${styles.actionButton} ${isPurchased ? styles.enterButton : styles.buyButton}`}
        >
          {isPurchased ? 'دخول للباقة' : 'شراء الآن'}
        </button>
      </div>
    </div>
  )
}