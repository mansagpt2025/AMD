'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  X, CreditCard, Ticket, Loader2, 
  CheckCircle2, Shield, Users, BookOpen,
  AlertCircle
} from 'lucide-react'

interface PurchaseModalProps {
  package: any
  user: any
  walletBalance: number
  gradeSlug: string
  onClose: () => void
  onSuccess: () => void
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
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'code'>('wallet')
  const [code, setCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [validationSuccess, setValidationSuccess] = useState('')
  const [validatedCode, setValidatedCode] = useState<any>(null)

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
      const response = await fetch('/api/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          packageId: pkg.id,
          userId: user.id,
          gradeSlug
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'كود غير صالح')
      }

      setValidationSuccess('الكود صالح ويمكن استخدامه!')
      setValidatedCode(data.code)
    } catch (err: any) {
      setValidationError(err.message)
      setValidatedCode(null)
    } finally {
      setIsValidating(false)
    }
  }

  // إتمام الشراء
  const handlePurchase = async () => {
    setIsPurchasing(true)

    try {
      if (paymentMethod === 'wallet') {
        // التحقق من الرصيد
        if (walletBalance < pkg.price) {
          throw new Error(`رصيد المحفظة غير كافٍ. الرصيد المطلوب: ${pkg.price} جنيه`)
        }

        const response = await fetch('/api/purchase-with-wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageId: pkg.id,
            userId: user.id,
            price: pkg.price,
            gradeSlug
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'فشل عملية الشراء')
        }

        onSuccess()
      } else {
        // الشراء بالكود
        if (!validatedCode) {
          throw new Error('يرجى التحقق من صحة الكود أولاً')
        }

        const response = await fetch('/api/purchase-with-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            packageId: pkg.id,
            userId: user.id,
            gradeSlug,
            codeId: validatedCode.id
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'فشل تفعيل الكود')
        }

        onSuccess()
      }
    } catch (err: any) {
      setValidationError(err.message)
    } finally {
      setIsPurchasing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold" style={{ color: theme.text }}>
              {pkg.name}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center mb-4">
            <div className="text-3xl font-bold mb-2" style={{ color: theme.primary }}>
              {pkg.price.toLocaleString()} <span className="text-lg">جنيه</span>
            </div>
            <p className="text-gray-600">باقة {pkg.type === 'weekly' ? 'أسبوعية' : pkg.type === 'monthly' ? 'شهرية' : 'ترم كامل'}</p>
          </div>
        </div>

        {/* Features */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" style={{ color: theme.primary }} />
              <span>{pkg.lecture_count} محاضرة</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: theme.primary }} />
              <span>ضمان استرجاع</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-6 border-b">
          <h4 className="font-bold mb-4" style={{ color: theme.text }}>طريقة الدفع</h4>
          
          <div className="space-y-3">
            <button
              onClick={() => setPaymentMethod('wallet')}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                paymentMethod === 'wallet' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                paymentMethod === 'wallet' ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}>
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="text-right flex-1">
                <div className="font-bold">الدفع من المحفظة</div>
                <div className="text-sm text-gray-600">رصيدك: {walletBalance.toLocaleString()} جنيه</div>
              </div>
              {paymentMethod === 'wallet' && (
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              )}
            </button>

            <button
              onClick={() => setPaymentMethod('code')}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                paymentMethod === 'code' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                paymentMethod === 'code' ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}>
                <Ticket className="w-5 h-5" />
              </div>
              <div className="text-right flex-1">
                <div className="font-bold">كود تفعيل</div>
                <div className="text-sm text-gray-600">أدخل كود الشراء</div>
              </div>
              {paymentMethod === 'code' && (
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              )}
            </button>
          </div>
        </div>

        {/* Code Input (إذا اختار كود) */}
        {paymentMethod === 'code' && (
          <div className="p-6 border-b">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                أدخل كود التفعيل
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 p-3 border rounded-xl text-center text-lg font-mono tracking-wider"
                  placeholder="XXXX-XXXX"
                  dir="ltr"
                />
                <button
                  onClick={validateCode}
                  disabled={isValidating || !code.trim()}
                  className="px-4 py-3 rounded-xl font-medium disabled:opacity-50"
                  style={{ 
                    background: theme.primary,
                    color: 'white'
                  }}
                >
                  {isValidating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'التحقق'
                  )}
                </button>
              </div>
            </div>

            {/* Validation Messages */}
            {validationError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {validationError}
              </div>
            )}

            {validationSuccess && (
              <div className="p-3 rounded-lg bg-green-50 text-green-700 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {validationSuccess}
              </div>
            )}

            {/* Code Info */}
            {validatedCode && (
              <div className="mt-4 p-3 rounded-lg bg-blue-50">
                <div className="font-bold mb-2">معلومات الكود:</div>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>الكود صالح للاستخدام مرة واحدة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>مخصص لمستخدم واحد فقط</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>مخصص لباقة: {pkg.name}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Purchase Button */}
        <div className="p-6">
          <button
            onClick={handlePurchase}
            disabled={isPurchasing || (paymentMethod === 'code' && !validatedCode)}
            className="w-full py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ 
              background: paymentMethod === 'code' && validatedCode ? theme.success : theme.primary,
              color: 'white'
            }}
          >
            {isPurchasing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري المعالجة...
              </>
            ) : paymentMethod === 'code' ? (
              'تفعيل الكود'
            ) : (
              'تأكيد الشراء من المحفظة'
            )}
          </button>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-4">
            بالشراء أنت توافق على شروط الاستخدام وسياسة الخصوصية
          </p>
        </div>
      </motion.div>
    </div>
  )
}