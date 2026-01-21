'use client'

interface PackageCardProps {
  package: any
  type: 'purchased' | 'available' | 'offer'
  walletBalance: number
  onPurchaseClick?: (pkg: any) => void
  onCodeClick?: (pkg: any) => void
  onEnterClick?: (pkg: any) => void
}

export default function PackageCard({
  package: pkg,
  type,
  walletBalance,
  onPurchaseClick,
  onCodeClick,
  onEnterClick
}: PackageCardProps) {
  const canPurchase = walletBalance >= pkg.price
  
  const getBadgeClass = () => {
    switch (pkg.type) {
      case 'weekly': return 'bg-blue-100 text-blue-800'
      case 'monthly': return 'bg-green-100 text-green-800'
      case 'term': return 'bg-purple-100 text-purple-800'
      case 'offer': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getTypeArabic = () => {
    switch (pkg.type) {
      case 'weekly': return 'أسبوعي'
      case 'monthly': return 'شهري'
      case 'term': return 'ترم'
      case 'offer': return 'عرض خاص'
      default: return pkg.type
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100">
      {/* صورة الباقة */}
      <div className="relative h-48 bg-gradient-to-r from-primary-400 to-primary-600">
        {pkg.image_url ? (
          <img
            src={pkg.image_url}
            alt={pkg.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-white text-4xl font-bold">
              {pkg.name.charAt(0)}
            </span>
          </div>
        )}
        
        {/* شارة النوع */}
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium ${getBadgeClass()}`}>
          {getTypeArabic()}
        </div>
        
        {/* شارة مشترى */}
        {type === 'purchased' && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            مشتراة
          </div>
        )}
      </div>
      
      {/* محتوى البطاقة */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{pkg.name}</h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {pkg.description}
        </p>
        
        {/* معلومات الباقة */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2 space-x-reverse">
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-600">{pkg.lectures_count} محاضرة</span>
          </div>
          
          <div className="text-lg font-bold text-primary-600">
            {formatPrice(pkg.price)}
          </div>
        </div>
        
        {/* الأزرار */}
        <div className="space-y-3">
          {type === 'purchased' ? (
            <button
              onClick={() => onEnterClick?.(pkg)}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all duration-300 flex items-center justify-center space-x-2 space-x-reverse"
            >
              <span>الدخول إلى الباقة</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          ) : (
            <>
              <button
                onClick={() => onPurchaseClick?.(pkg)}
                disabled={!canPurchase}
                className={`w-full py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 space-x-reverse ${
                  canPurchase
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {canPurchase ? (
                  <>
                    <span>شراء بالرصيد</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </>
                ) : (
                  <span>رصيد غير كافي</span>
                )}
              </button>
              
              <button
                onClick={() => onCodeClick?.(pkg)}
                className="w-full py-3 border-2 border-primary-500 text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-all duration-300"
              >
                تفعيل بكود
              </button>
            </>
          )}
        </div>
        
        {/* تنبيه الرصيد */}
        {type === 'available' && !canPurchase && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-yellow-700">
                تحتاج {formatPrice(pkg.price - walletBalance)} زيادة
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}