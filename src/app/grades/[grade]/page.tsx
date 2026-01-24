// app/grades/[grade]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import styles from './styles.module.css'

// تعريف الأنواع
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

export default function GradePage({ params }: { params: { grade: string } }) {
  const [grade, setGrade] = useState<Grade | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [userPackages, setUserPackages] = useState<UserPackage[]>([])
  const [user, setUser] = useState<any>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'code'>('wallet')
  const [codeInput, setCodeInput] = useState('')
  const [purchaseError, setPurchaseError] = useState('')
  const [purchaseSuccess, setPurchaseSuccess] = useState('')

  const router = useRouter()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  useEffect(() => {
    fetchData()
    checkUser()
  }, [params.grade])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // جلب بيانات الصف
      const { data: gradeData, error: gradeError } = await supabase
        .from('grades')
        .select('*')
        .eq('slug', params.grade)
        .single()

      if (gradeError) throw gradeError
      setGrade(gradeData)

      // جلب الباقات المتاحة للصف
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .eq('grade', params.grade)
        .eq('is_active', true)

      if (packagesError) throw packagesError
      setPackages(packagesData || [])

      // جلب رصيد المحفظة إذا كان المستخدم مسجل دخول
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .single()

        if (walletData) setWalletBalance(walletData.balance)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      
      // جلب الباقات المشتراة
      const { data: userPackagesData } = await supabase
        .from('user_packages')
        .select(`
          *,
          packages (*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (userPackagesData) {
        // تصفية الباقات للصف الحالي فقط
        const filtered = userPackagesData.filter(
          (up: any) => up.packages.grade === params.grade
        )
        setUserPackages(filtered)
      }
    }
  }

  const handlePurchaseClick = (pkg: Package) => {
    if (!user) {
      router.push('/login')
      return
    }
    setSelectedPackage(pkg)
    setShowPurchaseModal(true)
    setPurchaseError('')
    setPurchaseSuccess('')
    setCodeInput('')
    setPaymentMethod('wallet')
  }

  const handlePurchase = async () => {
    if (!selectedPackage || !user) return

    setPurchaseError('')
    setPurchaseSuccess('')

    try {
      if (paymentMethod === 'wallet') {
        // الشراء برصيد المحفظة
        if (walletBalance < selectedPackage.price) {
          setPurchaseError('رصيد المحفظة غير كافي')
          return
        }

        // خصم الرصيد
        const { error: walletError } = await supabase
          .from('wallets')
          .update({ balance: walletBalance - selectedPackage.price })
          .eq('user_id', user.id)

        if (walletError) throw walletError

        // إضافة الباقة للمستخدم
        const { error: purchaseError } = await supabase
          .from('user_packages')
          .insert({
            user_id: user.id,
            package_id: selectedPackage.id,
            expires_at: new Date(Date.now() + selectedPackage.duration_days * 24 * 60 * 60 * 1000).toISOString(),
            source: 'wallet'
          })

        if (purchaseError) throw purchaseError

        setPurchaseSuccess('تم الشراء بنجاح!')
        setTimeout(() => {
          setShowPurchaseModal(false)
          fetchData()
          checkUser()
        }, 2000)

      } else if (paymentMethod === 'code') {
        // الشراء باستخدام كود
        if (!codeInput.trim()) {
          setPurchaseError('يجب إدخال كود')
          return
        }

        // التحقق من الكود
        const { data: codeData, error: codeError } = await supabase
          .from('codes')
          .select('*')
          .eq('code', codeInput.trim())
          .eq('grade', selectedPackage.grade)
          .eq('is_used', false)
          .single()

        if (codeError || !codeData) {
          setPurchaseError('الكود غير صالح أو تم استخدامه')
          return
        }

        if (codeData.package_id !== selectedPackage.id) {
          setPurchaseError('هذا الكود ليس لهذه الباقة')
          return
        }

        // التحقق إذا كان المستخدم قد اشترى الباقة مسبقاً
        const { data: existingPurchase } = await supabase
          .from('user_packages')
          .select('*')
          .eq('user_id', user.id)
          .eq('package_id', selectedPackage.id)
          .eq('is_active', true)

        if (existingPurchase && existingPurchase.length > 0) {
          setPurchaseError('لقد قمت بشراء هذه الباقة مسبقاً')
          return
        }

        // تحديث حالة الكود
        const { error: updateCodeError } = await supabase
          .from('codes')
          .update({
            is_used: true,
            used_by: user.id,
            used_at: new Date().toISOString()
          })
          .eq('id', codeData.id)

        if (updateCodeError) throw updateCodeError

        // إضافة الباقة للمستخدم
        const { error: purchaseError } = await supabase
          .from('user_packages')
          .insert({
            user_id: user.id,
            package_id: selectedPackage.id,
            expires_at: new Date(Date.now() + selectedPackage.duration_days * 24 * 60 * 60 * 1000).toISOString(),
            source: 'code'
          })

        if (purchaseError) throw purchaseError

        setPurchaseSuccess('تم تفعيل الكود بنجاح!')
        setTimeout(() => {
          setShowPurchaseModal(false)
          fetchData()
          checkUser()
        }, 2000)
      }
    } catch (error) {
      console.error('Purchase error:', error)
      setPurchaseError('حدث خطأ أثناء عملية الشراء')
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
      </div>
    )
  }

  if (!grade) {
    return (
      <div className={styles.notFound}>
        <h1>الصف غير موجود</h1>
      </div>
    )
  }

  // تصنيف الباقات
  const weeklyPackages = packages.filter(p => p.type === 'weekly')
  const monthlyPackages = packages.filter(p => p.type === 'monthly')
  const termPackages = packages.filter(p => p.type === 'term')
  const offerPackages = packages.filter(p => p.type === 'offer')

  return (
    <div className={`${styles.container} ${styles[`grade-${grade.slug}`]}`}>
      {/* الهيدر */}
      <header className={styles.header}>
        <h1 className={styles.brandTitle}>بارع محمود الديب</h1>
        <p className={styles.encouragement}>
          {`اهلاً بكم في صف ${grade.name}، استعد لرحلة تعليمية استثنائية مع أفضل المدرسين!`}
        </p>
        {user && (
          <div className={styles.walletInfo}>
            <span className={styles.walletLabel}>رصيد المحفظة:</span>
            <span className={styles.walletBalance}>{walletBalance} جنيه</span>
          </div>
        )}
      </header>

      {/* القسم 1: اشتراكاتك */}
      {user && userPackages.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>اشتراكاتك</h2>
          <div className={styles.packagesGrid}>
            {userPackages.map((userPackage) => (
              <PackageCard
                key={userPackage.id}
                pkg={userPackage.packages}
                isPurchased={true}
                onEnter={() => router.push(`/packages/${userPackage.package_id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* القسم 2: الباقات المتاحة (أسبوعية) */}
      {weeklyPackages.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>الباقات المتاحة</h2>
          <div className={styles.packagesGrid}>
            {weeklyPackages.map((pkg) => {
              const isPurchased = userPackages.some(up => up.package_id === pkg.id)
              return (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isPurchased={isPurchased}
                  onPurchase={() => handlePurchaseClick(pkg)}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* القسم 3: العروض */}
      {(monthlyPackages.length > 0 || termPackages.length > 0 || offerPackages.length > 0) && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>العروض</h2>
          <div className={styles.packagesGrid}>
            {[...monthlyPackages, ...termPackages, ...offerPackages].map((pkg) => {
              const isPurchased = userPackages.some(up => up.package_id === pkg.id)
              return (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isPurchased={isPurchased}
                  onPurchase={() => handlePurchaseClick(pkg)}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* مودال الشراء */}
      {showPurchaseModal && selectedPackage && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>شراء باقة {selectedPackage.name}</h3>
            <p className={styles.modalPrice}>السعر: {selectedPackage.price} جنيه</p>
            
            <div className={styles.paymentMethods}>
              <label className={styles.paymentMethod}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'wallet'}
                  onChange={() => setPaymentMethod('wallet')}
                />
                <span>الدفع عن طريق رصيد المحفظة</span>
                {paymentMethod === 'wallet' && (
                  <div className={styles.walletInfoModal}>
                    <p>الرصيد المتوفر: {walletBalance} جنيه</p>
                    {walletBalance < selectedPackage.price && (
                      <p className={styles.insufficientBalance}>
                        الرصيد غير كافي، يرجى شحن المحفظة
                      </p>
                    )}
                  </div>
                )}
              </label>

              <label className={styles.paymentMethod}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'code'}
                  onChange={() => setPaymentMethod('code')}
                />
                <span>الدفع عن طريق كود</span>
                {paymentMethod === 'code' && (
                  <input
                    type="text"
                    className={styles.codeInput}
                    placeholder="أدخل الكود هنا"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                  />
                )}
              </label>
            </div>

            {purchaseError && (
              <div className={styles.errorMessage}>{purchaseError}</div>
            )}

            {purchaseSuccess && (
              <div className={styles.successMessage}>{purchaseSuccess}</div>
            )}

            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowPurchaseModal(false)}
              >
                إلغاء
              </button>
              <button
                className={styles.purchaseButton}
                onClick={handlePurchase}
                disabled={!!purchaseSuccess}
              >
                {purchaseSuccess ? 'تم الشراء' : 'تأكيد الشراء'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// مكون بطاقة الباقة
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
    <div className={styles.packageCard}>
      <div className={styles.packageImage}>
        <img 
          src={pkg.image_url || '/default-package.jpg'} 
          alt={pkg.name}
        />
      </div>
      <div className={styles.packageContent}>
        <h3 className={styles.packageName}>{pkg.name}</h3>
        <p className={styles.packageDescription}>{pkg.description}</p>
        <div className={styles.packageDetails}>
          <span className={styles.lectureCount}>
            📚 {pkg.lecture_count} محاضرة
          </span>
          <span className={styles.price}>💰 {pkg.price} جنيه</span>
        </div>
        <div className={styles.packageType}>
          <span className={`${styles.typeBadge} ${styles[pkg.type]}`}>
            {pkg.type === 'weekly' && 'أسبوعية'}
            {pkg.type === 'monthly' && 'شهرية'}
            {pkg.type === 'term' && 'ترم'}
            {pkg.type === 'offer' && 'عرض'}
          </span>
        </div>
        <button
          className={`${styles.actionButton} ${isPurchased ? styles.enterButton : styles.purchaseButton}`}
          onClick={isPurchased ? onEnter : onPurchase}
        >
          {isPurchased ? 'الدخول' : 'شراء'}
        </button>
      </div>
    </div>
  )
}