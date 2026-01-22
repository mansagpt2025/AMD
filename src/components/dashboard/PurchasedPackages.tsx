// components/dashboard/PurchasedPackages.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'

interface Package {
  id: string
  package_id: string
  packages: {
    id: string
    name: string
    description: string
    image_url: string
    lecture_count: number
    type: string
  }
}

interface PurchasedPackagesProps {
  packages: Package[]
}

export default function PurchasedPackages({ packages }: PurchasedPackagesProps) {
  if (packages.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">لا توجد باقات نشطة</h3>
          <p className="text-gray-600 mb-6">اشترك في باقات الصف الدراسي للبدء في التعلم</p>
          <Link 
            href="/grades"
            className="inline-block bg-primary-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            تصفح الباقات
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">الباقات النشطة</h3>
        <Link 
          href="/grades"
          className="text-primary-600 hover:text-primary-800 font-medium"
        >
          عرض الكل →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {packages.map(pkg => (
          <div key={pkg.id} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
              {pkg.packages.image_url ? (
                <Image
                  src={pkg.packages.image_url}
                  alt={pkg.packages.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <span className="text-4xl text-gray-400">📘</span>
                </div>
              )}
              
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  pkg.packages.type === 'offer' ? 'bg-yellow-100 text-yellow-800' :
                  pkg.packages.type === 'monthly' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {pkg.packages.type === 'offer' ? 'عرض' :
                   pkg.packages.type === 'monthly' ? 'شهري' :
                   pkg.packages.type === 'term' ? 'ترم' : 'اسبوعي'}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <h4 className="font-bold text-lg text-gray-800 mb-2">{pkg.packages.name}</h4>
              <p className="text-gray-600 text-sm mb-4">{pkg.packages.description}</p>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-gray-500">
                  <span>📖</span>
                  <span className="text-sm">{pkg.packages.lecture_count} محاضرة</span>
                </div>
                
                <Link
                  href={`/packages/${pkg.package_id}`}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  الدخول إلى الباقة
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}