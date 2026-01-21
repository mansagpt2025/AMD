'use client'

import { useState } from 'react'
import PackageGrid from './PackageGrid'
import PurchaseModal from './PurchaseModal'
import CodeModal from './CodeModal'

export default function Sections({
  purchasedPackages,
  weeklyPackages,
  monthlyPackages,
  termPackages,
  offerPackages,
  walletBalance,
  studentId,
  gradeId
}: any) {
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [purchaseMethod, setPurchaseMethod] = useState<'wallet' | 'code'>('wallet')

  const handlePurchaseClick = (pkg: any, method: 'wallet' | 'code') => {
    setSelectedPackage(pkg)
    setPurchaseMethod(method)
    
    if (method === 'code') {
      setShowCodeModal(true)
    } else {
      setShowPurchaseModal(true)
    }
  }

  const handleEnterClick = (pkg: any) => {
    window.location.href = `/package/${pkg.id}`
  }

  return (
    <>
      {/* قسم الاشتراكات */}
      {purchasedPackages.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">اشتراكاتك</h2>
            <div className="text-sm text-gray-600">
              {purchasedPackages.length} باقة
            </div>
          </div>
          <PackageGrid 
            packages={purchasedPackages}
            type="purchased"
            onEnterClick={handleEnterClick}
          />
        </section>
      )}

      {/* الباقات الأسبوعية */}
      {weeklyPackages.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">الباقات الأسبوعية</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">جديدة كل أسبوع</span>
            </div>
          </div>
          <PackageGrid 
            packages={weeklyPackages}
            type="available"
            walletBalance={walletBalance}
            onPurchaseClick={(pkg: any) => handlePurchaseClick(pkg, 'wallet')}
            onCodeClick={(pkg: any) => handlePurchaseClick(pkg, 'code')}
          />
        </section>
      )}

      {/* الباقات الشهرية */}
      {monthlyPackages.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">الباقات الشهرية</h2>
            <div className="text-sm text-gray-600">
              وفر مع الباقات الشهرية
            </div>
          </div>
          <PackageGrid 
            packages={monthlyPackages}
            type="available"
            walletBalance={walletBalance}
            onPurchaseClick={(pkg: any) => handlePurchaseClick(pkg, 'wallet')}
            onCodeClick={(pkg: any) => handlePurchaseClick(pkg, 'code')}
          />
        </section>
      )}

      {/* باقات الترم */}
      {termPackages.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">باقات الترم</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                الأكثر طلباً
              </div>
            </div>
          </div>
          <PackageGrid 
            packages={termPackages}
            type="available"
            walletBalance={walletBalance}
            onPurchaseClick={(pkg: any) => handlePurchaseClick(pkg, 'wallet')}
            onCodeClick={(pkg: any) => handlePurchaseClick(pkg, 'code')}
          />
        </section>
      )}

      {/* العروض الخاصة */}
      {offerPackages.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">العروض الخاصة</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                لفترة محدودة
              </div>
            </div>
          </div>
          <PackageGrid 
            packages={offerPackages}
            type="offer"
            walletBalance={walletBalance}
            onPurchaseClick={(pkg: any) => handlePurchaseClick(pkg, 'wallet')}
            onCodeClick={(pkg: any) => handlePurchaseClick(pkg, 'code')}
          />
        </section>
      )}

      {/* مودال الشراء */}
      {showPurchaseModal && selectedPackage && (
        <PurchaseModal
          package={selectedPackage}
          walletBalance={walletBalance}
          studentId={studentId}
          gradeId={gradeId}
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={() => {
            setShowPurchaseModal(false)
            window.location.reload()
          }}
        />
      )}

      {/* مودال إدخال الكود */}
      {showCodeModal && selectedPackage && (
        <CodeModal
          package={selectedPackage}
          studentId={studentId}
          gradeId={gradeId}
          onClose={() => setShowCodeModal(false)}
          onSuccess={() => {
            setShowCodeModal(false)
            window.location.reload()
          }}
        />
      )}
    </>
  )
}