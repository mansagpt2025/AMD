// components/dashboard/GradeCard.tsx
'use client'

import Link from 'next/link'

interface GradeCardProps {
  grade: string
}

export default function GradeCard({ grade }: GradeCardProps) {
  const getGradeInfo = (grade: string) => {
    const grades = {
      'first': {
        text: 'الأول الثانوي',
        color: 'bg-gradient-to-r from-blue-500 to-blue-600',
        description: 'بداية رحلة الثانوية العامة'
      },
      'second': {
        text: 'الثاني الثانوي',
        color: 'bg-gradient-to-r from-purple-500 to-purple-600',
        description: 'التحضير للعام الحاسم'
      },
      'third': {
        text: 'الثالث الثانوي',
        color: 'bg-gradient-to-r from-rose-500 to-rose-600',
        description: 'عام التخرج والتفوق'
      }
    }
    
    return grades[grade as keyof typeof grades] || grades.first
  }

  const gradeInfo = getGradeInfo(grade)

  return (
    <div className={`${gradeInfo.color} rounded-2xl p-6 text-white`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold mb-2">{gradeInfo.text}</h3>
          <p className="opacity-90">{gradeInfo.description}</p>
        </div>
        <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <span className="text-2xl">🎓</span>
        </div>
      </div>
      
      <Link 
        href={`/grades/${grade}`}
        className="block w-full bg-white text-gray-800 text-center font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors mt-6"
      >
        عرض باقات الصف
      </Link>
    </div>
  )
}