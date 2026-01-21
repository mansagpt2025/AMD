import PackageCard from './PackageCard'
import { Package } from '../types'
import './PackageGrid.css'

interface PackageGridProps {
  packages: Package[]
  type: 'purchased' | 'available' | 'offer'
  walletBalance?: number
  onPurchaseClick?: (pkg: Package) => void
  onCodeClick?: (pkg: Package) => void
  onEnterClick?: (pkg: Package) => void
}

export default function PackageGrid({
  packages,
  type,
  walletBalance = 0,
  onPurchaseClick,
  onCodeClick,
  onEnterClick
}: PackageGridProps) {
  if (packages.length === 0) {
    return (
      <div className="package-grid__empty">
        <div className="package-grid__empty-icon">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="package-grid__empty-text">
          لا توجد باقات متاحة حالياً
        </p>
      </div>
    )
  }

  return (
    <div className="package-grid">
      {packages.map((pkg) => (
        <PackageCard
          key={pkg.id}
          package={pkg}
          type={type}
          walletBalance={walletBalance}
          onPurchaseClick={onPurchaseClick}
          onCodeClick={onCodeClick}
          onEnterClick={onEnterClick}
        />
      ))}
    </div>
  )
}