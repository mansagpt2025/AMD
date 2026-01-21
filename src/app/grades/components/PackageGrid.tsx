import PackageCard from './PackageCard'

export default function PackageGrid({
  packages,
  type,
  walletBalance = 0,
  onPurchaseClick,
  onCodeClick,
  onEnterClick
}: any) {
  if (packages.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <div className="mx-auto mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-500 text-lg">
          لا توجد باقات متاحة حالياً
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {packages.map((pkg: any) => (
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