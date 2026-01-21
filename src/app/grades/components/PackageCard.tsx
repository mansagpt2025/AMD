import { Package } from '../types'
import './PackageCard.css'

interface PackageCardProps {
  package: Package
  type: 'purchased' | 'available' | 'offer'
  walletBalance: number
  onPurchaseClick?: (pkg: Package) => void
  onCodeClick?: (pkg: Package) => void
  onEnterClick?: (pkg: Package) => void
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
      case 'weekly': return 'package-card__badge--weekly'
      case 'monthly': return 'package-card__badge--monthly'
      case 'term': return 'package-card__badge--term'
      case 'offer': return 'package-card__badge--offer'
      default: return 'package-card__badge--default'
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
    <div className="package-card">
      {/* صورة الباقة */}
      <div className="package-card__image">
        {pkg.image_url ? (
          <img
            src={pkg.image_url}
            alt={pkg.name}
            className="package-card__image-content"
          />
        ) : (
          <div className="package-card__image-placeholder">
            <span className="package-card__image-letter">
              {pkg.name.charAt(0)}
            </span>
          </div>
        )}
        
        {/* شارة النوع */}
        <div className={`package-card__badge ${getBadgeClass()}`}>
          {getTypeArabic()}
        </div>
        
        {/* شارة مشترى */}
        {type === 'purchased' && (
          <div className="package-card__purchased-badge">
            مشتراة
          </div>
        )}
      </div>
      
      {/* محتوى البطاقة */}
      <div className="package-card__content">
        <h3 className="package-card__title">{pkg.name}</h3>
        
        <p className="package-card__description">
          {pkg.description}
        </p>
        
        {/* معلومات الباقة */}
        <div className="package-card__info">
          <div className="package-card__lectures">
            <svg className="package-card__icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="package-card__lectures-count">{pkg.lectures_count} محاضرة</span>
          </div>
          
          <div className="package-card__price">
            {formatPrice(pkg.price)}
          </div>
        </div>
        
        {/* الأزرار */}
        <div className="package-card__buttons">
          {type === 'purchased' ? (
            <button
              onClick={() => onEnterClick?.(pkg)}
              className="package-card__enter-button"
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
                className={`package-card__purchase-button ${
                  canPurchase 
                    ? 'package-card__purchase-button--enabled' 
                    : 'package-card__purchase-button--disabled'
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
                className="package-card__code-button"
              >
                تفعيل بكود
              </button>
            </>
          )}
        </div>
        
        {/* تنبيه الرصيد */}
        {type === 'available' && !canPurchase && (
          <div className="package-card__balance-alert">
            <div className="package-card__balance-content">
              <svg className="package-card__alert-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="package-card__alert-text">
                تحتاج {formatPrice(pkg.price - walletBalance)} زيادة
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}