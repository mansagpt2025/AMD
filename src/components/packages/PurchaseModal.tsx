'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, CreditCard, Ticket, Loader2, 
  CheckCircle2, Shield, BookOpen,
  AlertCircle, Sparkles, Gift,
  ShieldCheck, Clock, Zap, AlertTriangle,
  PlayCircle
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

  useEffect(() => {
    checkActivePackage()
  }, [])

  const checkActivePackage = async () => {
    try {
      const { data: activePackages } = await supabase
        .from('user_packages')
        .select('*')
        .eq('user_id', user.id)
        .eq('package_id', pkg.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())

      if (activePackages && activePackages.length > 0) {
        setHasActivePackage(true)
        setActivePackageInfo(activePackages[0])
      }
    } catch (err) {
      console.error('Error checking active packages:', err)
    }
  }

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
      const trimmedCode = code.trim().toUpperCase()
      
      if (!trimmedCode.match(/^[A-Z0-9]{8,16}$/)) {
        throw new Error('تنسيق الكود غير صحيح. يجب أن يحتوي على 8-16 حرف/رقم')
      }

      if (hasActivePackage) {
        throw new Error('لديك بالفعل اشتراك فعال لهذه الباقة')
      }

      // جلب الكود من قاعدة البيانات
      const { data: codeData, error: codeError } = await supabase
        .from('codes')
        .select('*')
        .eq('code', trimmedCode)
        .single()

      if (codeError || !codeData) {
        throw new Error('الكود غير موجود في النظام')
      }

      // التحقق 1: الكود لم يتم استخدامه
      if (codeData.is_used) {
        throw new Error('هذا الكود مستخدم بالفعل')
      }

      // التحقق 2: الكود مخصص للصف الصحيح
      if (codeData.grade !== gradeSlug) {
        throw new Error(`هذا الكود مخصص للصف ${codeData.grade}`)
      }

      // التحقق 3: الكود مخصص للباقة الصحيحة
      if (codeData.package_id && codeData.package_id !== pkg.id) {
        throw new Error('هذا الكود مخصص لباقة أخرى')
      }

      // التحقق 4: تاريخ الانتهاء
      if (codeData.expires_at) {
        const expiryDate = new Date(codeData.expires_at)
        if (expiryDate < new Date()) {
          throw new Error('هذا الكود منتهي الصلاحية')
        }
      }

      // التحقق 5: لم يشترِ المستخدم هذه الباقة من قبل بكود
      const { data: prevPurchases } = await supabase
        .from('user_packages')
        .select('*')
        .eq('user_id', user.id)
        .eq('package_id', pkg.id)

      if (prevPurchases && prevPurchases.length > 0) {
        throw new Error('لقد قمت بشراء هذه الباقة من قبل')
      }

      setValidationSuccess('✅ الكود صالح!')
      setValidatedCode(codeData)
    } catch (err: any) {
      setValidationError(err.message || 'حدث خطأ في التحقق')
      setValidatedCode(null)
    } finally {
      setIsValidating(false)
    }
  }

  const handlePurchase = async () => {
    if (hasActivePackage) {
      setValidationError('لديك بالفعل اشتراك فعال')
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
      setValidationError(err.message)
      setIsPurchasing(false)
    }
  }

  const handleWalletPurchase = async () => {
    if (walletBalance < pkg.price) {
      throw new Error(`رصيد غير كافٍ. المطلوب: ${pkg.price}`)
    }

    try {
      const deductResult = await deductWalletBalance(user.id, pkg.price, pkg.id, 'wallet')
      
      if (!deductResult.success) {
        throw new Error(deductResult.message)
      }

      const packageResult = await createUserPackage(user.id, pkg.id, pkg.duration_days || 30, 'wallet')
      
      if (!packageResult.success) {
        throw new Error(packageResult.message)
      }

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + (pkg.duration_days || 30))

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'شراء ناجح 🎉',
        message: `تم شراء ${pkg.name} بمبلغ ${pkg.price} جنيه`,
        type: 'success'
      })

      setShowConfetti(true)
      setTimeout(() => {
        onSuccess(pkg.id)
      }, 2000)
    } catch (err: any) {
      throw new Error(err.message)
    }
  }

  const handleCodePurchase = async () => {
    if (!code.trim() || !validatedCode) {
      throw new Error('يرجى التحقق من الكود أولاً')
    }

    try {
      // التحقق النهائي
      const { data: finalCheck } = await supabase
        .from('codes')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .eq('is_used', false)
        .single()

      if (!finalCheck) {
        throw new Error('الكود غير متاح')
      }

      // استخدام الكود
      const codeResult = await markCodeAsUsed(validatedCode.id, user.id)
      
      if (!codeResult.success) {
        throw new Error(codeResult.message)
      }

      // إضافة الباقة
      const packageResult = await createUserPackage(user.id, pkg.id, pkg.duration_days || 30, 'code')
      
      if (!packageResult.success) {
        // إرجاع الكود إذا فشل
        await supabase
          .from('codes')
          .update({ is_used: false, used_by: null, used_at: null })
          .eq('id', validatedCode.id)
        
        throw new Error(packageResult.message)
      }

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + (pkg.duration_days || 30))

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'تفعيل ناجح 🎉',
        message: `تم تفعيل ${pkg.name} بنجاح`,
        type: 'success'
      })

      setShowConfetti(true)
      setTimeout(() => {
        onSuccess(pkg.id)
      }, 2000)
    } catch (err: any) {
      throw new Error(err.message)
    }
  }

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={styles.modalContainer}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>

          {/* Modal Header */}
          <div className={styles.modalHeader}>
            <Gift className={styles.headerIcon} style={{ color: theme.primary }} />
            <div>
              <h3 className={styles.modalTitle}>{pkg.name}</h3>
              <p className={styles.modalSubtitle}>شراء آمن وسهل</p>
            </div>
          </div>

          {/* Warning Section */}
          <AnimatePresence>
            {hasActivePackage && activePackageInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={styles.warningBox}
              >
                <AlertTriangle className={styles.warningIcon} />
                <div>
                  <h4>لديك اشتراك فعال بالفعل!</h4>
                  <p>تم الشراء في {new Date(activePackageInfo.purchased_at).toLocaleDateString('ar-EG')}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Price Section */}
          <div className={styles.priceBox}>
            <span className={styles.label}>السعر:</span>
            <span className={styles.price}>{(pkg.price || 0).toLocaleString()} جنيه</span>
          </div>

          {/* Features */}
          <div className={styles.featuresList}>
            <div className={styles.feature}>
              <PlayCircle size={16} />
              <span>{pkg.lecture_count || 0} محاضرة</span>
            </div>
            <div className={styles.feature}>
              <Clock size={16} />
              <span>صلاحية {pkg.duration_days || 30} يوم</span>
            </div>
            <div className={styles.feature}>
              <CheckCircle2 size={16} />
              <span>ضمان الرضا</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className={styles.paymentSection}>
            <h4 className={styles.sectionTitle}>طريقة الدفع</h4>
            
            <div className={styles.methodsGrid}>
              <button
                onClick={() => setPaymentMethod('wallet')}
                disabled={hasActivePackage}
                className={`${styles.methodBtn} ${paymentMethod === 'wallet' ? styles.active : ''}`}
                style={paymentMethod === 'wallet' ? { borderColor: theme.primary, background: `${theme.primary}10` } : {}}
              >
                <CreditCard size={20} />
                <div>
                  <div className={styles.methodName}>المحفظة</div>
                  <div className={styles.methodDesc}>رصيد: {walletBalance.toLocaleString()}</div>
                </div>
                {paymentMethod === 'wallet' && <CheckCircle2 size={18} style={{ color: theme.primary }} />}
              </button>

              <button
                onClick={() => setPaymentMethod('code')}
                disabled={hasActivePackage}
                className={`${styles.methodBtn} ${paymentMethod === 'code' ? styles.active : ''}`}
                style={paymentMethod === 'code' ? { borderColor: theme.primary, background: `${theme.primary}10` } : {}}
              >
                <Ticket size={20} />
                <div>
                  <div className={styles.methodName}>كود تفعيل</div>
                  <div className={styles.methodDesc}>أدخل الكود</div>
                </div>
                {paymentMethod === 'code' && <CheckCircle2 size={18} style={{ color: theme.primary }} />}
              </button>
            </div>
          </div>

          {/* Code Input */}
          {paymentMethod === 'code' && !hasActivePackage && (
            <div className={styles.codeInputSection}>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className={styles.codeInput}
                  placeholder="أدخل الكود (8-16 حرف/رقم)"
                  dir="ltr"
                />
                <button
                  onClick={validateCode}
                  disabled={isValidating || !code.trim()}
                  className={styles.validateBtn}
                  style={{ background: theme.primary }}
                >
                  {isValidating ? <Loader2 className={styles.spinner} /> : 'تحقق'}
                </button>
              </div>

              <AnimatePresence>
                {validationError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.errorMsg}>
                    <AlertCircle size={16} />
                    <span>{validationError}</span>
                  </motion.div>
                )}

                {validationSuccess && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.successMsg}>
                    <CheckCircle2 size={16} />
                    <span>{validationSuccess}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {validatedCode && (
                <div className={styles.codeInfo}>
                  <Shield size={16} style={{ color: theme.success }} />
                  <span>الكود صالح للاستخدام لمرة واحدة</span>
                </div>
              )}
            </div>
          )}

          {/* Purchase Button */}
          <button
            onClick={handlePurchase}
            disabled={
              isPurchasing || 
              hasActivePackage ||
              (paymentMethod === 'wallet' && walletBalance < pkg.price) ||
              (paymentMethod === 'code' && !validatedCode)
            }
            className={styles.purchaseBtn}
            style={{ 
              background: hasActivePackage ? '#ccc' : theme.primary,
              opacity: isPurchasing ? 0.7 : 1
            }}
          >
            {isPurchasing ? (
              <>
                <Loader2 className={styles.spinner} />
                جاري المعالجة...
              </>
            ) : hasActivePackage ? (
              'الاشتراك موجود بالفعل'
            ) : (
              `تأكيد الشراء`
            )}
          </button>

          <p className={styles.terms}>
            بالشراء توافق على شروط الخدمة
          </p>

          <div className={styles.securityBadge}>
            <ShieldCheck size={16} />
            <span>معاملة آمنة ومشفرة</span>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showConfetti && (
          <div className={styles.confetti}>
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -50, opacity: 1 }}
                animate={{ y: 500, opacity: 0 }}
                transition={{ duration: 2, delay: Math.random() * 0.5 }}
                style={{
                  position: 'fixed',
                  width: 10,
                  height: 10,
                  background: ['#3b82f6', '#8b5cf6', '#10b981'][Math.floor(Math.random() * 3)],
                  left: Math.random() * window.innerWidth,
                  top: 0,
                  borderRadius: '50%',
                  zIndex: 9999
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </>
  )
}