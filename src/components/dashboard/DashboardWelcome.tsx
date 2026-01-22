// components/dashboard/DashboardWelcome.tsx
'use client'

interface DashboardWelcomeProps {
  name: string
  grade: string
  walletBalance: number
}

export default function DashboardWelcome({ name, grade, walletBalance }: DashboardWelcomeProps) {
  const getGradeText = (grade: string) => {
    const grades: Record<string, string> = {
      'first': 'الأول الثانوي',
      'second': 'الثاني الثانوي',
      'third': 'الثالث الثانوي'
    }
    return grades[grade] || grade
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold mb-2">مرحباً، {name}! 👋</h2>
          <p className="text-blue-100 mb-6">أنت في الصف {getGradeText(grade)}، استمر في التعلم والتفوق</p>
          
          <div className="flex items-center space-x-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm opacity-90">رصيد المحفظة</p>
              <p className="text-2xl font-bold">{walletBalance} ج.م</p>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm opacity-90">الباقات النشطة</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
        
        <div className="hidden md:block">
          <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-4xl">🎯</span>
          </div>
        </div>
      </div>
    </div>
  )
}