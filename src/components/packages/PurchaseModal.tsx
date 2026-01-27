'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, CreditCard, Ticket, Loader2, 
  CheckCircle2, Shield, Users, BookOpen,
  AlertCircle, Lock, Sparkles, Gift,
  ShieldCheck, Clock, Zap, AlertTriangle,
  Info
} from 'lucide-react'
import { createClientBrowser } from '@/lib/supabase/sf2-client'
import { 
  deductWalletBalance, 
  markCodeAsUsed, 
  createUserPackage 
} from '@/app/grades/[grade]/actions'
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
  const [hasActivePackage, setHasActivePackage] = useState(false)
  const [activePackageInfo, setActivePackageInfo] = useState<any>(null)

  // التحقق مما إذا كان المستخدم لديه بالفعل باقة فعالة
  useEffect(() => {
    checkActivePackage()
  }, [])

  const checkActivePackage = async () => {
    try {
      const { data: activePackages, error } = await supabase
        .from('user_packages')
        .select(`
          *,
          package:packages(*)
        `)
        .eq('user_id', user.id)
        .eq('package_id', pkg.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())

      if (error) {
        console.error('Error checking active packages:', error)
        return
      }

      if (activePackages && activePackages.length > 0) {
        setHasActivePackage(true)
        setActivePackageInfo(activePackages[0])
      }
    } catch (err) {
      console.error('Error in checkActivePackage:', err)
    }
  }

  // التحقق الشامل من الكود
  const validateCode = async () => {
    if (!code.trim()) {
      setValidationError('يرجى إدخال الكود')
      return
    }

    setIsValidating(true)
    setValidationError('')
    setValidationSuccess('')
    setValidatedCode(null)

    try {
      // التحقق من تنسيق الكود
      const trimmedCode = code.trim().toUpperCase()
      if (!trimmedCode.match(/^[A-Z0-9]{8,16}$/)) {
        throw new Error('تنسيق الكود غير صالح. يجب أن يحتوي على 8-16 حرف/رقم')
      }

      // التحقق من أن المستخدم ليس لديه باقة فعالة بالفعل
      if (hasActivePackage) {
        throw new Error('لديك بالفعل باقة فعالة لهذه المادة')
      }

      // التحقق من الكود في جدول codes
      const { data: codeData, error } = await supabase
        .from('codes')
        .select('*')
        .eq('code', trimmedCode)
        .single()

      if (error || !codeData) {
        throw new Error('الكود غير موجود في النظام')
      }

      // التحقق 1: أن الكود لم يتم استخدامه من قبل
      if (codeData.is_used) {
        // التحقق إذا كان المستخدم الحالي هو من استخدمه
        if (codeData.used_by === user.id) {
          throw new Error('لقد استخدمت هذا الكود من قبل')
        } else {
          throw new Error('هذا الكود مستخدم بالفعل من قبل مستخدم آخر')
        }
      }

      // التحقق 2: أن الكود مخصص للصف الصحيح
      if (codeData.grade !== gradeSlug) {
        throw new Error(`هذا الكود مخصص للصف ${codeData.grade} وليس ${gradeSlug}`)
      }

      // التحقق 3: أن الكود مخصص للباقة الصحيحة (إذا كان محدداً)
      if (codeData.package_id && codeData.package_id !== pkg.id) {
        // جلب اسم الباقة المخصصة للكود لعرض رسالة واضحة
        const { data: targetPackage } = await supabase
          .from('packages')
          .select('name')
          .eq('id', codeData.package_id)
          .single()
        
        const targetPackageName = targetPackage?.name || 'باقة أخرى'
        throw new Error(`هذا الكود مخصص لـ "${targetPackageName}" وليس "${pkg.name}"`)
      }

      // التحقق 4: أن تاريخ الانتهاء لم يمر
      if (codeData.expires_at) {
        const expiryDate = new Date(codeData.expires_at)
        const now = new Date()
        if (expiryDate < now) {
          throw new Error('هذا الكود منتهي الصلاحية')
        }
      }

      // التحقق 5: أن المستخدم لم يشتر هذه الباقة من قبل باستخدام أي كود
      const { data: previousPurchases } = await supabase
        .from('user_packages')
        .select('*')
        .eq('user_id', user.id)
        .eq('package_id', pkg.id)
        .eq('source', 'code')

      if (previousPurchases && previousPurchases.length > 0) {
        throw new Error('لقد قمت بشراء هذه الباقة من قبل باستخدام كود')
      }

      // جميع التحققات ناجحة
      setValidationSuccess('✅ الكود صالح ويمكن استخدامه!')
      setValidatedCode(codeData)
    } catch (err: any) {
      setValidationError(`❌ ${err.message}`)
      setValidatedCode(null)
    } finally {
      setIsValidating(false)
    }
  }

  // إتمام الشراء
  const handlePurchase = async () => {
    if (hasActivePackage) {
      setValidationError('لديك بالفعل باقة فعالة لهذه المادة. لا يمكنك الشراء مرة أخرى.')
      return
    }

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

  // الشراء بالمحفظة
  const handleWalletPurchase = async () => {
    // التحقق 1: أن المستخدم ليس لديه باقة فعالة
    if (hasActivePackage) {
      throw new Error('لديك بالفعل باقة فعالة لهذه المادة')
    }

    // التحقق 2: أن الرصيد كافٍ
    if (walletBalance < pkg.price) {
      throw new Error(`رصيد المحفظة غير كافٍ. المطلوب: ${pkg.price} جنيه، رصيدك: ${walletBalance} جنيه`)
    }

    try {
      // 1. خصم المبلغ من المحفظة باستخدام Server Action
      const deductResult = await deductWalletBalance(user.id, pkg.price, pkg.id, 'wallet')
      
      if (!deductResult.success) {
        throw new Error(deductResult.message)
      }

      // 2. إضافة الباقة للمستخدم
      const packageResult = await createUserPackage(user.id, pkg.id, pkg.duration_days || 30, 'wallet')
      
      if (!packageResult.success) {
        throw new Error(packageResult.message)
      }

      // 3. إضافة إشعار للمستخدم
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + (pkg.duration_days || 30))

      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'شراء ناجح 🎉',
          message: `تم شراء باقة "${pkg.name}" بنجاح بمبلغ ${pkg.price} جنيه. ساري حتى ${expiresAt.toLocaleDateString('ar-EG')}`,
          type: 'success'
        })

      // نجاح الشراء
      setShowConfetti(true)
      setTimeout(() => {
        onSuccess(pkg.id)
      }, 2000)
    } catch (err: any) {
      throw new Error(err.message || 'فشل عملية الشراء من المحفظة')
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

    // التحقق الإضافي قبل الشراء
    try {
      // التحقق النهائي من حالة الكود
      const { data: finalCheck, error: checkError } = await supabase
        .from('codes')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .eq('is_used', false)
        .single()

      if (checkError || !finalCheck) {
        throw new Error('الكود غير متاح أو تم استخدامه بالفعل')
      }

      // 1. تحديث حالة الكود (استخدام Server Action)
      const codeResult = await markCodeAsUsed(validatedCode.id, user.id)
      
      if (!codeResult.success) {
        throw new Error(codeResult.message)
      }

      // 2. إضافة الباقة للمستخدم (Server Action)
      const packageResult = await createUserPackage(user.id, pkg.id, pkg.duration_days || 30, 'code')
      
      if (!packageResult.success) {
        // إذا فشل إضافة الباقة، نعيد الكود لحالته السابقة
        await supabase
          .from('codes')
          .update({
            is_used: false,
            used_by: null,
            used_at: null
          })
          .eq('id', validatedCode.id)
        
        throw new Error(packageResult.message)
      }

      // 3. إضافة إشعار للمستخدم
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + (pkg.duration_days || 30))

      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'تفعيل ناجح 🎉',
          message: `تم تفعيل باقة "${pkg.name}" بنجاح باستخدام الكود. ساري حتى ${expiresAt.toLocaleDateString('ar-EG')}`,
          type: 'success'
        })

      // نجاح الشراء
      setShowConfetti(true)
      setTimeout(() => {
        onSuccess(pkg.id)
      }, 2000)
    } catch (err: any) {
      throw new Error(err.message || 'فشل عملية التفعيل بالكود')
    }
  }

  const getPackageType = () => {
    switch (pkg.type) {
      case 'weekly': return 'أسبوعية'
      case 'monthly': return 'شهرية'
      case 'term': return 'ترم كامل'
      case 'offer': return 'عرض خاص'
      default: return 'خاص'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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

          {/* Warning if has active package */}
          <AnimatePresence>
            {hasActivePackage && activePackageInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={styles.warningSection}
              >
                <div className={styles.warningContent}>
                  <AlertTriangle className={styles.warningIcon} />
                  <div className={styles.warningText}>
                    <h4 className={styles.warningTitle}>لديك باقة فعالة بالفعل!</h4>
                    <p className={styles.warningDescription}>
                      تم شراء هذه الباقة بتاريخ {formatDate(activePackageInfo.purchased_at)} وتنتهي في {formatDate(activePackageInfo.expires_at)}
                    </p>
                  </div>
                </div>
                <div className={styles.activePackageInfo}>
                  <Info className={styles.infoIcon} />
                  <span>لا يمكنك شراء نفس الباقة مرة أخرى حتى تنتهي صلاحيتها</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                disabled={hasActivePackage}
                className={`${styles.paymentMethod} ${
                  paymentMethod === 'wallet' ? styles.selectedMethod : ''
                } ${hasActivePackage ? styles.disabledMethod : ''}`}
              >
                <div className={styles.methodIcon}>
                  <CreditCard className={styles.methodSvg} />
                </div>
                <div className={styles.methodInfo}>
                  <div className={styles.methodTitle}>الدفع من المحفظة</div>
                  <div className={styles.methodDescription}>
                    رصيدك: <span className={styles.balanceAmount}>{walletBalance.toLocaleString()}</span> جنيه
                  </div>
                  {walletBalance < pkg.price && paymentMethod === 'wallet' && (
                    <div className={styles.balanceWarning}>
                      <AlertCircle className={styles.warningIconSmall} />
                      <span>رصيد غير كافٍ</span>
                    </div>
                  )}
                </div>
                {paymentMethod === 'wallet' && (
                  <CheckCircle2 className={styles.checkIcon} style={{ color: theme.primary }} />
                )}
              </button>

              <button
                onClick={() => setPaymentMethod('code')}
                disabled={hasActivePackage}
                className={`${styles.paymentMethod} ${
                  paymentMethod === 'code' ? styles.selectedMethod : ''
                } ${hasActivePackage ? styles.disabledMethod : ''}`}
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
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className={styles.codeInput}
                  placeholder="أدخل كود التفعيل (8-16 حرف/رقم)"
                  dir="ltr"
                  disabled={hasActivePackage}
                />
                <button
                  onClick={validateCode}
                  disabled={isValidating || !code.trim() || hasActivePackage}
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
                      <span>الكود صالح للاستخدام مرة واحدة فقط</span>
                    </div>
                    <div className={styles.infoItem}>
                      <Users className={styles.itemIcon} />
                      <span>مخصص لمستخدم واحد فقط (أنت)</span>
                    </div>
                    <div className={styles.infoItem}>
                      <BookOpen className={styles.itemIcon} />
                      <span>مخصص للصف: {validatedCode.grade}</span>
                    </div>
                    {validatedCode.expires_at && (
                      <div className={styles.infoItem}>
                        <Clock className={styles.itemIcon} />
                        <span>ينتهي في: {formatDate(validatedCode.expires_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Purchase Button */}
          <div className={styles.actionSection}>
            <button
              onClick={handlePurchase}
              disabled={
                isPurchasing || 
                hasActivePackage ||
                (paymentMethod === 'wallet' && walletBalance < pkg.price) ||
                (paymentMethod === 'code' && !validatedCode)
              }
              className={`${styles.purchaseButton} ${
                hasActivePackage ? styles.disabledButton : ''
              }`}
              style={{ 
                background: paymentMethod === 'code' && validatedCode ? theme.success : theme.primary
              }}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className={`${styles.purchaseIcon} ${styles.spinning}`} />
                  جاري المعالجة...
                </>
              ) : hasActivePackage ? (
                'الباقة مفعلة بالفعل'
              ) : paymentMethod === 'code' ? (
                'تفعيل الكود'
              ) : (
                `تأكيد الشراء بمبلغ ${pkg.price.toLocaleString()} جنيه`
              )}
            </button>

            {/* Terms */}
            <p className={styles.terms}>
              بالشراء أنت توافق على <a href="/terms" className={styles.termsLink}>شروط الاستخدام</a> و <a href="/privacy" className={styles.termsLink}>سياسة الخصوصية</a>
            </p>

            {/* Security Badge */}
            <div className={styles.securityBadge}>
              <ShieldCheck className={styles.securityIcon} />
              <span>معاملة آمنة ومشفرة - كل كود لاستخدام واحد فقط</span>
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