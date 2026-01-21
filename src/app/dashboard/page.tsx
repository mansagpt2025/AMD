'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Clock, Home, Package, Video, Award, BookOpen, Wallet, LogOut } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [sidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* شريط التنقل العلوي */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">لوحة التحكم</h1>
              <p className="text-gray-600">مرحباً بك في منصة محمود الديب</p>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200">
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Clock className="w-4 h-4" />
                <span>الوقت</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* تبويبات */}
        <div className="flex space-x-4 space-x-reverse mb-8">
          <button
            className={`px-4 py-2 rounded-lg ${activeTab === 'overview' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setActiveTab('overview')}
          >
            <Home className="inline-block w-4 h-4 ml-1" />
            الملخص
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeTab === 'packages' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setActiveTab('packages')}
          >
            <Package className="inline-block w-4 h-4 ml-1" />
            الباقات
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeTab === 'wallet' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setActiveTab('wallet')}
          >
            <Wallet className="inline-block w-4 h-4 ml-1" />
            المحفظة
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* بطاقة الإحصائيات */}
            <div className="bg-white rounded-xl p-6 shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className="mr-3">
                  <p className="text-sm text-gray-600">الباقات المشتراة</p>
                  <p className="text-xl font-bold">8</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Video className="w-5 h-5 text-green-600" />
                </div>
                <div className="mr-3">
                  <p className="text-sm text-gray-600">المحاضرات المكتملة</p>
                  <p className="text-xl font-bold">42/80</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div className="mr-3">
                  <p className="text-sm text-gray-600">متوسط الدرجات</p>
                  <p className="text-xl font-bold">87%</p>
                </div>
              </div>
            </div>

            {/* الصفوف الدراسية */}
            <div className="col-span-full mt-8">
              <h2 className="text-xl font-bold mb-4">الصفوف الدراسية</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'].map((grade, index) => (
                  <div key={index} className="bg-white rounded-xl p-6 shadow">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="mr-3 font-bold">{grade}</h3>
                    </div>
                    <p className="text-gray-600 mb-4">الباقات المتاحة: {5 + index * 3}</p>
                    <button
                      onClick={() => router.push(`/grades/${index + 1}`)}
                      className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      الدخول إلى الصف
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">صفحة الباقات قيد التطوير</h3>
            <p className="text-gray-600">ستكون متاحة قريباً</p>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">صفحة المحفظة قيد التطوير</h3>
            <p className="text-gray-600">ستكون متاحة قريباً</p>
          </div>
        )}
      </div>
    </div>
  )
}