// components/grades/PackageCard.tsx - المكون الأساسي
interface PackageCardProps {
  pkg: {
    id: string
    name: string
    description: string
    price: number
    duration_days: number
    features: string[]
    type: string
  }
  isPurchased: boolean
  walletBalance: number
  isOffer?: boolean
}

export default function PackageCard({ pkg, isPurchased, walletBalance, isOffer = false }: PackageCardProps) {
  return (
    <div className={`dashboard-card bg-white rounded-xl shadow-sm border overflow-hidden ${
      isPurchased ? 'border-green-500' : isOffer ? 'border-yellow-500' : 'border-gray-200'
    }`}>
      {isOffer && (
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-center py-2">
          <span className="font-bold">عرض خاص! ✨</span>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-800">{pkg.name}</h3>
          {isPurchased && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              مشتراة ✓
            </span>
          )}
        </div>
        
        <p className="text-gray-600 mb-6">{pkg.description}</p>
        
        <div className="mb-6">
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {pkg.price} ج.م
          </div>
          <div className="text-gray-500 text-sm">
            لمدة {pkg.duration_days} يوم
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-bold text-gray-700 mb-3">المميزات:</h4>
          <ul className="space-y-2">
            {pkg.features?.map((feature, index) => (
              <li key={index} className="flex items-center text-gray-600">
                <span className="text-green-500 ml-2">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        
        <button className={`w-full py-3 rounded-lg font-bold transition-colors ${
          isPurchased 
            ? 'bg-green-100 text-green-700 cursor-default' 
            : walletBalance >= pkg.price
            ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-700 hover:to-blue-900'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}>
          {isPurchased ? 'الباقة مفعلة' : walletBalance >= pkg.price ? 'اشترك الآن' : 'رصيد غير كافي'}
        </button>
      </div>
    </div>
  )
}