'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PurchaseModal({
  package: pkg,
  walletBalance,
  studentId,
  gradeId,
  onClose,
  onSuccess
}: any) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handlePurchase = async () => {
    try {
      setLoading(true)
      setError('')

      // التحقق من الرصيد
      if (walletBalance < pkg.price) {
        setError('رصيدك غير كافي للشراء')
        return
      }

      // بدء معاملة
      const { data: purchase, error: purchaseError } = await supabase
        .from('student_purchases')
        .insert({
          student_id: studentId,
          package_id: pkg.id,
          purchase_method: 'wallet',
          amount_paid: pkg.price,
          status: 'active'
        })
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // خصم من المحفظة
      const newBalance = walletBalance - pkg.price
      const { error: walletError } = await supabase
        .from('student_wallet')
        .upsert({
          student_id: studentId,
          balance: newBalance,
          last_updated: new Date().toISOString()
        })

      if (walletError) throw walletError

      // إرسال إشعار
      await supabase
        .from('notifications')
        .insert({
          user_id: studentId,
          title: 'شراء ناجح',
          message: `تم شراء باقة ${pkg.name} بنجاح`,
          type: 'purchase'
        })

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الشراء')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">تأكيد الشراء</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <h4 className="font-medium text-gray-800 mb-2">{pkg.name}</h4>
              <p className="text-gray-600 text-sm">{pkg.description}</p>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-lg font-bold text-primary-600">
                  {formatPrice(pkg.price)}
                </span>
                <span className="text-sm text-gray-600">
                  {pkg.lectures_count} محاضرة
                </span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">رصيدك الحالي:</span>
                <span className="font-bold text-gray-800">
                  {formatPrice(walletBalance)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">الرصيد بعد الشراء:</span>
                <span className="font-bold text-gray-800">
                  {formatPrice(walletBalance - pkg.price)}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 space-x-reverse">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              إلغاء
            </button>
            <button
              onClick={handlePurchase}
              disabled={loading || walletBalance < pkg.price}
              className={`flex-1 py-3 rounded-lg font-medium text-white transition-colors ${
                walletBalance < pkg.price
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700'
              }`}
            >
              {loading ? 'جاري المعالجة...' : 'تأكيد الشراء'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}