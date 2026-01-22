// components/dashboard/StatsCards.tsx
'use client'

interface StatsCardsProps {
  purchasedCount: number
  completionRate: number
  studyHours: number
}

export default function StatsCards({ purchasedCount, completionRate, studyHours }: StatsCardsProps) {
  const stats = [
    {
      title: 'الباقات المشتركة',
      value: purchasedCount,
      icon: '📚',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'نسبة الإتمام',
      value: `${completionRate}%`,
      icon: '✅',
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'ساعات الدراسة',
      value: studyHours,
      icon: '⏰',
      color: 'bg-purple-50 text-purple-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>
          <h3 className="text-3xl font-bold mb-2">{stat.value}</h3>
          <p className="text-gray-600">{stat.title}</p>
        </div>
      ))}
    </div>
  )
}