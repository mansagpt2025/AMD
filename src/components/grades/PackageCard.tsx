// components/grades/PackageCard.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/supabase-browser'

interface PackageCardProps {
  pkg: {
    id: string
    name: string
    description: string
    price: number
    image_url: string | null
    lecture_count: number
    type: string
  }
  isPurchased: boolean
  walletBalance: number
  isOffer?: boolean
}

export default function PackageCard({ pkg, isPurchased, walletBalance, isOffer = false }: PackageCardProps) {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [purchaseMethod, setPurchaseMethod] = useState<'wallet' | 'code'>('wallet')
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handlePurchase = async () => {
    setIsLoading(true)
    setError('')

    try {
      if (purchaseMethod === 'wallet') {
        // الشراء عن طريق الرصيد
        if (walletBalance < pkg.price) {
          setError('رصيدك غير كافي')
          return
        }

        // 1. خصم المبلغ من المحفظة
        const { error: walletError } = await supabase
          .from('wallets')
          .update({ balance: walletBalance - pkg.price })
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

        if (walletError) throw walletError

        // 2. إضافة الباقة للمستخدم
        const { error: purchaseError } = await supabase
          .from('user_packages')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            package_id: pkg.id,
            is_active: true
          })

        if (purchaseError) throw purchaseError

        alert('تم الشراء بنجاح!')
        router.refresh()

      } else {
        // الشراء عن طريق الكود
        if (!code.trim()) {
          setError('يرجى إدخال الكود')
          return
        }

        // التحقق من الكود
        const { data: codeData, error: codeError } = await supabase
          .from('codes')
          .select('*')
          .eq('code', code.trim())
          .eq('package_id', pkg.id)
          .eq('is_used', false)
          .single()

        if (codeError || !codeData) {
          setError('الكود غير صالح أو تم استخدامه')
          return
        }

        // استخدام الكود
        const { error: useCodeError } = await supabase
          .from('codes')
          .update({
            is_used: true,
            used_by: (await supabase.auth.getUser()).data.user?.id,
            used_at: new Date().toISOString()
          })
          .eq('id', codeData.id)

        if (useCodeError) throw useCodeError

        // إضافة الباقة للمستخدم
        const { error: purchaseError } = await supabase
          .from('user_packages')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            package_id: pkg.id,
            is_active: true
          })

        if (purchaseError) throw purchaseError

        alert('تم تفعيل الباقة بنجاح!')
        router.refresh()
      }
    } catch (err) {
      setError('حدث خطأ أثناء عملية الشراء')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className={`border rounded-2xl overflow-hidden transition-all hover:shadow-xl ${
        isOffer ? 'border-yellow-300 shadow-lg' : 'border-gray-200'
      }`}>
        {/* Badge for offers */}
        {isOffer && (
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-center py-2">
            <span className="font-bold">🔥 عرض خاص</span>
          </div>
        )}

        {/* Package Image */}
        <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200">
          {pkg.image_url ? (
            <Image
              src={pkg.image_url}
              alt={pkg.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl text-gray-400">📘</span>
                <p className="text-gray-500 mt-2">صورة الباقة</p>
              </div>
            </div>
          )}
        </div>

        {/* Package Content */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-xl text-gray-800 mb-2">{pkg.name}</h3>
              <p className="text-gray-600 text-sm">{pkg.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{pkg.price} ج.م</div>
              <div className="text-sm text-gray-500">/ {pkg.type === 'term' ? 'ترم' : 'شهر'}</div>
            </div>
          </div>

          {/* Package Features */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-gray-600">
              <span className="ml-2">📖</span>
              <span>{pkg.lecture_count} محاضرة</span>
            </div>
            <div className="flex items-center text-gray-600">
              <span className="ml-2">🎯</span>
              <span>امتحانات بعد كل محاضرة</span>
            </div>
            <div className="flex items-center text-gray-600">
              <span className="ml-2">📄</span>
              <span>ملخصات PDF</span>
            </div>
          </div>

          {/* Action Button */}
          {isPurchased ? (
            <button
              onClick={() => router.push(`/packages/${pkg.id}`)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              🎓 الدخول إلى الباقة
            </button>
          ) : (
            <button
              onClick={() => setShowPurchaseModal(true)}
              disabled={isLoading}
              className={`w-full font-medium py-3 rounded-lg transition-colors ${
                isOffer 
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:opacity-90' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'جاري المعالجة...' : '🚀 اشترك الآن'}
            </button>
          )}
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-gray-800">شراء باقة {pkg.name}</h3>
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {/* Purchase Method Selection */}
              <div className="mb-6">
                <p className="font-medium text-gray-700 mb-3">طريقة الشراء:</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPurchaseMethod('wallet')}
                    className={`p-4 border rounded-xl text-center transition-all ${
                      purchaseMethod === 'wallet'
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">💰</div>
                    <div className="font-medium">رصيد المحفظة</div>
                    <div className="text-sm text-gray-600 mt-1">{walletBalance} ج.م</div>
                  </button>

                  <button
                    onClick={() => setPurchaseMethod('code')}
                    className={`p-4 border rounded-xl text-center transition-all ${
                      purchaseMethod === 'code'
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">🎫</div>
                    <div className="font-medium">كود التفعيل</div>
                    <div className="text-sm text-gray-600 mt-1">أدخل الكود</div>
                  </button>
                </div>
              </div>

              {/* Code Input (if code method selected) */}
              {purchaseMethod === 'code' && (
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">كود التفعيل</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="أدخل الكود هنا..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Price Summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">سعر الباقة</span>
                  <span className="font-bold">{pkg.price} ج.م</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">الرصيد بعد الشراء</span>
                  <span className="font-bold">
                    {purchaseMethod === 'wallet' ? walletBalance - pkg.price : walletBalance} ج.م
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800">المبلغ المطلوب</span>
                    <span className="text-xl font-bold text-blue-600">{pkg.price} ج.م</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={isLoading || (purchaseMethod === 'code' && !code.trim())}
                  className={`flex-1 bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'جاري الشراء...' : 'تأكيد الشراء'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}