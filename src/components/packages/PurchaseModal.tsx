'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, CreditCard, Ticket, Loader2, 
  CheckCircle2, Shield, Users, BookOpen,
  AlertCircle, Lock, Sparkles, Gift,
  ShieldCheck, Clock, Zap
} from 'lucide-react'
import { createClientBrowser } from '@/lib/supabase/sf2-client'
import styles from './PurchaseModal.module.css'

interface PurchaseModalProps {
  package: any
  user: any
  walletBalance: number
  gradeSlug: string
  onClose: () => void
  onSuccess: (purchasedPackageId: string) => void
  theme: any
}

export default function PurchaseModal({
  package: pkg,
  user,
  walletBalance,
  gradeSlug,
  onClose,
  onSuccess,
  theme
}: PurchaseModalProps) {
  const supabase = createClientBrowser()
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'code'>('wallet')
  const [code, setCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [validationSuccess, setValidationSuccess] = useState('')
  const [validatedCode, setValidatedCode] = useState<any>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  // التحقق من الكود
  const validateCode = async () => {
    if (!code.trim()) {
      setValidationError('يرجى إدخال الكود')
      return
    }

    setIsValidating(true)
    setValidationError('')
    setValidationSuccess('')

    try {
      // التحقق من الكود في جدول codes
      const { data: codeData, error } = await supabase
        .from('codes')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .eq('grade', gradeSlug)
        .eq('is_used', false)
        .single()

      if (error || !codeData) {
        throw new Error('كود غير صالح أو منتهي الصلاحية')
      }

      // التحقق من أن الكود مخصص لهذه الباقة أو يمكن استخدامه لأي باقة
      if (codeData.package_id && codeData.package_id !== pkg.id) {
        throw new Error('هذا الكود مخصص لباقة أخرى')
      }

      // التحقق من تاريخ الانتهاء
      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        throw new Error('الكود منتهي الصلاحية')
      }

      setValidationSuccess('الكود صالح ويمكن استخدامه!')
      setValidatedCode(codeData)
    } catch (err: any) {
      setValidationError(err.message || 'كود غير صالح')
      setValidatedCode(null)
    } finally {
      setIsValidating(false)
    }
  }

  // إتمام الشراء
  const handlePurchase = async () => {
    setIsPurchasing(true)
    setValidationError('')

    try {
      if (paymentMethod === 'wallet') {
        await handleWalletPurchase()
      } else {
        await handleCodePurchase()
      }
    } catch (err: any) {
      setValidationError(err.message || 'حدث خطأ أثناء عملية الشراء')
      setIsPurchasing(false)
    }
  }

  // دالة RPC مبسطة للشراء
  const purchasePackageRPC = async () => {
    try {
      // استخدام دالة RPC إذا كانت موجودة
      const { data, error } = await supabase.rpc('simple_purchase_package', {
        p_user_id: user.id,
        p_package_id: pkg.id,
        p_price: pkg.price
      })

      if (error) {
        console.error('RPC Error:', error)
        return { success: false, message: error.message }
      }

      return data
    } catch (error: any) {
      console.error('RPC Exception:', error)
      return { success: false, message: error.message }
    }
  }

  // الشراء بالمحفظة - محسنة
  const handleWalletPurchase = async () => {
    // التحقق من الرصيد
    if (walletBalance < pkg.price) {
      throw new Error(`رصيد المحفظة غير كافٍ. الرصيد المطلوب: ${pkg.price} جنيه`)
    }

    try {
      // المحاولة باستخدام RPC أولاً
      const result = await purchasePackageRPC()
      
      if (!result.success) {
        // إذا فشل RPC، استخدام الطريقة البديلة
        console.log('Falling back to manual purchase...')
        await handleManualWalletPurchase()
      } else {
        console.log('Purchase via RPC successful:', result.message)
      }

      // نجاح الشراء
      setShowConfetti(true)
      setTimeout(() => {
        onSuccess(pkg.id)
      }, 2000)
    } catch (err: any) {
      throw new Error(err.message || 'فشل عملية الشراء')
    }
  }

  // الطريقة البديلة للشراء
  const handleManualWalletPurchase = async () => {
    try {
      // 1. خصم المبلغ من المحفظة
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: walletBalance - pkg.price,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (walletError) throw new Error('فشل تحديث المحفظة: ' + walletError.message)

      // 2. إضافة الباقة للمستخدم
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + (pkg.duration_days || 30))

      const { error: packageError } = await supabase
        .from('user_packages')
        .insert({
          user_id: user.id,
          package_id: pkg.id,
          purchased_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true,
          source: 'wallet'
        })

      if (packageError) {
        // إذا فشل إضافة الباقة، نعيد المبلغ للمحفظة
        await supabase
          .from('wallets')
          .update({ 
            balance: walletBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
        
        throw new Error('فشل إضافة الباقة: ' + packageError.message)
      }
    } catch (err: any) {
      throw new Error(err.message || 'فشل عملية الشراء')
    }
  }

  // الشراء بالكود
  const handleCodePurchase = async () => {
    if (!code.trim()) {
      throw new Error('يرجى إدخال الكود أولاً')
    }

    if (!validatedCode) {
      throw new Error('يرجى التحقق من صحة الكود أولاً')
    }

    try {
      // 1. تحديث حالة الكود
      const { error: codeError } = await supabase
        .from('codes')
        .update({
          is_used: true,
          used_by: user.id,
          used_at: new Date().toISOString()
        })
        .eq('id', validatedCode.id)

      if (codeError) throw new Error('فشل تحديث حالة الكود: ' + codeError.message)

      // 2. إضافة الباقة للمستخدم
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + (pkg.duration_days || 30))

      const { error: packageError } = await supabase
        .from('user_packages')
        .insert({
          user_id: user.id,
          package_id: pkg.id,
          purchased_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true,
          source: 'code'
        })

      if (packageError) {
        // إذا فشل إضافة الباقة، نعيد الكود لحالته السابقة
        await supabase
          .from('codes')
          .update({
            is_used: false,
            used_by: null,
            used_at: null
          })
          .eq('id', validatedCode.id)
        
        throw new Error('فشل إضافة الباقة: ' + packageError.message)
      }

      // نجاح الشراء
      setShowConfetti(true)
      setTimeout(() => {
        onSuccess(pkg.id)
      }, 2000)
    } catch (err: any) {
      throw new Error(err.message || 'فشل تفعيل الكود')
    }
  }

  const getPackageType = () => {
    switch (pkg.type) {
      case 'weekly': return 'أسبوعية'
      case 'monthly': return 'شهرية'
      case 'term': return 'ترم كامل'
      default: return 'خاص'
    }
  }

  return (
    <>
      <div className={styles.modalOverlay}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={styles.modalContainer}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className={styles.closeButton}
          >
            <X className={styles.closeIcon} />
          </button>

          {/* Header */}
          <div className={styles.modalHeader}>
            <div className={styles.packageIcon} style={{ background: theme.primary }}>
              <Gift className={styles.headerIcon} />
            </div>
            <div className={styles.headerContent}>
              <h3 className={styles.modalTitle}>{pkg.name}</h3>
              <p className={styles.modalSubtitle}>باقة {getPackageType()}</p>
            </div>
          </div>

          {/* Price Section */}
          <div className={styles.priceSection}>
            <div className={styles.priceDisplay}>
              <span className={styles.priceCurrency}>جنيه</span>
              <span className={styles.priceAmount}>{(pkg.price || 0).toLocaleString()}</span>
            </div>
            <div className={styles.discountBadge}>
              <Sparkles className={styles.discountIcon} />
              <span>وفر حتى 30%</span>
            </div>
          </div>

          {/* Features */}
          <div className={styles.featuresSection}>
            <div className={styles.featuresGrid}>
              <div className={styles.featureItem}>
                <BookOpen className={styles.featureIcon} style={{ color: theme.primary }} />
                <div>
                  <div className={styles.featureValue}>{pkg.lecture_count || 0}</div>
                  <div className={styles.featureLabel}>محاضرة</div>
                </div>
              </div>
              <div className={styles.featureItem}>
                <Clock className={styles.featureIcon} style={{ color: theme.primary }} />
                <div>
                  <div className={styles.featureValue}>{pkg.duration_days || 30}</div>
                  <div className={styles.featureLabel}>يوم</div>
                </div>
              </div>
              <div className={styles.featureItem}>
                <ShieldCheck className={styles.featureIcon} style={{ color: theme.primary }} />
                <div>
                  <div className={styles.featureValue}>نعم</div>
                  <div className={styles.featureLabel}>ضمان</div>
                </div>
              </div>
              <div className={styles.featureItem}>
                <Zap className={styles.featureIcon} style={{ color: theme.primary }} />
                <div>
                  <div className={styles.featureValue}>24/7</div>
                  <div className={styles.featureLabel}>دعم</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className={styles.paymentSection}>
            <h4 className={styles.sectionTitle}>طريقة الدفع</h4>
            
            <div className={styles.paymentMethods}>
              <button
                onClick={() => setPaymentMethod('wallet')}
                className={`${styles.paymentMethod} ${
                  paymentMethod === 'wallet' ? styles.selectedMethod : ''
                }`}
              >
                <div className={styles.methodIcon}>
                  <CreditCard className={styles.methodSvg} />
                </div>
                <div className={styles.methodInfo}>
                  <div className={styles.methodTitle}>الدفع من المحفظة</div>
                  <div className={styles.methodDescription}>
                    رصيدك: <span className={styles.balanceAmount}>{walletBalance.toLocaleString()}</span> جنيه
                  </div>
                </div>
                {paymentMethod === 'wallet' && (
                  <CheckCircle2 className={styles.checkIcon} style={{ color: theme.primary }} />
                )}
              </button>

              <button
                onClick={() => setPaymentMethod('code')}
                className={`${styles.paymentMethod} ${
                  paymentMethod === 'code' ? styles.selectedMethod : ''
                }`}
              >
                <div className={styles.methodIcon}>
                  <Ticket className={styles.methodSvg} />
                </div>
                <div className={styles.methodInfo}>
                  <div className={styles.methodTitle}>كود تفعيل</div>
                  <div className={styles.methodDescription}>أدخل كود الشراء</div>
                </div>
                {paymentMethod === 'code' && (
                  <CheckCircle2 className={styles.checkIcon} style={{ color: theme.primary }} />
                )}
              </button>
            </div>
          </div>

          {/* Code Input */}
          {paymentMethod === 'code' && (
            <div className={styles.codeSection}>
              <div className={styles.codeInputGroup}>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={styles.codeInput}
                  placeholder="أدخل كود التفعيل"
                  dir="ltr"
                />
                <button
                  onClick={validateCode}
                  disabled={isValidating || !code.trim()}
                  className={styles.validateButton}
                  style={{ background: theme.primary }}
                >
                  {isValidating ? (
                    <Loader2 className={`${styles.buttonIcon} ${styles.spinning}`} />
                  ) : (
                    'التحقق'
                  )}
                </button>
              </div>

              {/* Validation Messages */}
              <AnimatePresence>
                {validationError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`${styles.message} ${styles.errorMessage}`}
                  >
                    <AlertCircle className={styles.messageIcon} />
                    <span>{validationError}</span>
                  </motion.div>
                )}

                {validationSuccess && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`${styles.message} ${styles.successMessage}`}
                  >
                    <CheckCircle2 className={styles.messageIcon} />
                    <span>{validationSuccess}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Code Info */}
              {validatedCode && (
                <div className={styles.codeInfo}>
                  <div className={styles.codeInfoHeader}>
                    <Shield className={styles.infoIcon} />
                    <h5 className={styles.infoTitle}>معلومات الكود</h5>
                  </div>
                  <div className={styles.codeInfoGrid}>
                    <div className={styles.infoItem}>
                      <Lock className={styles.itemIcon} />
                      <span>الكود صالح للاستخدام مرة واحدة</span>
                    </div>
                    <div className={styles.infoItem}>
                      <Users className={styles.itemIcon} />
                      <span>مخصص لمستخدم واحد فقط</span>
                    </div>
                    <div className={styles.infoItem}>
                      <BookOpen className={styles.itemIcon} />
                      <span>مخصص لباقة: {pkg.name}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Purchase Button */}
          <div className={styles.actionSection}>
            <button
              onClick={handlePurchase}
              disabled={isPurchasing || (paymentMethod === 'code' && !validatedCode)}
              className={styles.purchaseButton}
              style={{ 
                background: paymentMethod === 'code' && validatedCode ? theme.success : theme.primary
              }}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className={`${styles.purchaseIcon} ${styles.spinning}`} />
                  جاري المعالجة...
                </>
              ) : paymentMethod === 'code' ? (
                'تفعيل الكود'
              ) : (
                'تأكيد الشراء من المحفظة'
              )}
            </button>

            {/* Terms */}
            <p className={styles.terms}>
              بالشراء أنت توافق على <a href="/terms" className={styles.termsLink}>شروط الاستخدام</a> و <a href="/privacy" className={styles.termsLink}>سياسة الخصوصية</a>
            </p>

            {/* Security Badge */}
            <div className={styles.securityBadge}>
              <ShieldCheck className={styles.securityIcon} />
              <span>معاملة آمنة ومشفرة</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <div className={styles.confettiContainer}>
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className={styles.confetti}
                initial={{ 
                  y: -100,
                  x: Math.random() * 100 - 50,
                  opacity: 1,
                  rotate: 0
                }}
                animate={{
                  y: 1000,
                  x: Math.random() * 200 - 100,
                  opacity: 0,
                  rotate: 360
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 0.5,
                  ease: "easeOut"
                }}
                style={{
                  background: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 5)],
                  width: Math.random() * 10 + 5,
                  height: Math.random() * 10 + 5
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </>
  )
}