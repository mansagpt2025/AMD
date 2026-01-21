'use client'

import { useState } from 'react'
import PackageGrid from './PackageGrid'
import PurchaseModal from '../components/PurchaseModal'
import CodeModal from './CodeModal'
import { Package } from '../types'
import './Sections.css'

interface SectionsProps {
  purchasedPackages: Package[]
  weeklyPackages: Package[]
  monthlyPackages: Package[]
  termPackages: Package[]
  offerPackages: Package[]
  walletBalance: number
  studentId: string
  gradeId: string
}

export default function Sections({
  purchasedPackages,
  weeklyPackages,
  monthlyPackages,
  termPackages,
  offerPackages,
  walletBalance,
  studentId,
  gradeId
}: SectionsProps) {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [purchaseMethod, setPurchaseMethod] = useState<'wallet' | 'code'>('wallet')

  const handlePurchaseClick = (pkg: Package, method: 'wallet' | 'code') => {
    setSelectedPackage(pkg)
    setPurchaseMethod(method)
    
    if (method === 'code') {
      setShowCodeModal(true)
    } else {
      setShowPurchaseModal(true)
    }
  }

  const handleEnterClick = (pkg: Package) => {
    window.location.href = `/package/${pkg.id}`
  }

  return (
    <>
      {/* قسم الاشتراكات */}
      {purchasedPackages.length > 0 && (
        <section className="sections__section">
          <div className="sections__header">
            <h2 className="sections__title">اشتراكاتك</h2>
            <div className="sections__counter">
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
        <section className="sections__section">
          <div className="sections__header">
            <h2 className="sections__title">الباقات الأسبوعية</h2>
            <div className="sections__badge">
              <div className="sections__badge-dot sections__badge-dot--green"></div>
              <span className="sections__badge-text">جديدة كل أسبوع</span>
            </div>
          </div>
          <PackageGrid 
            packages={weeklyPackages}
            type="available"
            walletBalance={walletBalance}
            onPurchaseClick={(pkg) => handlePurchaseClick(pkg, 'wallet')}
            onCodeClick={(pkg) => handlePurchaseClick(pkg, 'code')}
          />
        </section>
      )}

      {/* الباقات الشهرية */}
      {monthlyPackages.length > 0 && (
        <section className="sections__section">
          <div className="sections__header">
            <h2 className="sections__title">الباقات الشهرية</h2>
            <div className="sections__description">
              وفر مع الباقات الشهرية
            </div>
          </div>
          <PackageGrid 
            packages={monthlyPackages}
            type="available"
            walletBalance={walletBalance}
            onPurchaseClick={(pkg) => handlePurchaseClick(pkg, 'wallet')}
            onCodeClick={(pkg) => handlePurchaseClick(pkg, 'code')}
          />
        </section>
      )}

      {/* باقات الترم */}
      {termPackages.length > 0 && (
        <section className="sections__section">
          <div className="sections__header">
            <h2 className="sections__title">باقات الترم</h2>
            <div className="sections__popular-badge">
              الأكثر طلباً
            </div>
          </div>
          <PackageGrid 
            packages={termPackages}
            type="available"
            walletBalance={walletBalance}
            onPurchaseClick={(pkg) => handlePurchaseClick(pkg, 'wallet')}
            onCodeClick={(pkg) => handlePurchaseClick(pkg, 'code')}
          />
        </section>
      )}

      {/* العروض الخاصة */}
      {offerPackages.length > 0 && (
        <section className="sections__section">
          <div className="sections__header">
            <h2 className="sections__title">العروض الخاصة</h2>
            <div className="sections__offer-badge">
              لفترة محدودة
            </div>
          </div>
          <PackageGrid 
            packages={offerPackages}
            type="offer"
            walletBalance={walletBalance}
            onPurchaseClick={(pkg) => handlePurchaseClick(pkg, 'wallet')}
            onCodeClick={(pkg) => handlePurchaseClick(pkg, 'code')}
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