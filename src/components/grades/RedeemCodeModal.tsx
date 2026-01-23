'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface RedeemCodeModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function RedeemCodeModal({
  isOpen,
  onClose,
}: RedeemCodeModalProps) {
  const router = useRouter()

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!isOpen) return null

  const handleRedeem = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'فشل استخدام الكود')
        setLoading(false)
        return
      }

      setSuccess('تم تفعيل الباقة بنجاح 🎉')
      setCode('')

      // إعادة تحميل البيانات
      setTimeout(() => {
        onClose()
        router.refresh()
      }, 1200)

    } catch (err) {
      console.error(err)
      setError('حدث خطأ في الاتصال بالسيرفر')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

        <h2 className="text-2xl font-bold mb-2 text-center">
          إدخال كود التفعيل
        </h2>

        <p className="text-gray-600 text-center mb-6">
          أدخل كود الحصة أو الباقة لتفعيلها على حسابك
        </p>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="مثال: ABCD-1234"
          className="w-full border rounded-lg px-4 py-3 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {error && (
          <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 bg-green-50 text-green-700 p-3 rounded-lg text-sm text-center">
            {success}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 border border-gray-300 rounded-lg py-2 hover:bg-gray-50"
          >
            إلغاء
          </button>

          <button
            onClick={handleRedeem}
            disabled={loading || !code.trim()}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'جاري التحقق...' : 'تفعيل الكود'}
          </button>
        </div>
      </div>
    </div>
  )
}
