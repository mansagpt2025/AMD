'use client'

import { BookOpen, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import './GradesSection.css'

interface GradesSectionProps {
  grades: any[]
  studentGrade: string
}

export default function GradesSection({ grades, studentGrade }: GradesSectionProps) {
  const router = useRouter()

  const getGradeDescription = (gradeName: string) => {
    if (gradeName.includes('الأول')) return 'بداية رحلتك في الثانوية العامة'
    if (gradeName.includes('الثاني')) return 'استعداد لمرحلة التخصص'
    if (gradeName.includes('الثالث')) return 'التحضير للجامعة والمستقبل'
    return 'ابدأ رحلتك التعليمية الآن'
  }

  const getGradeColor = (gradeId: number) => {
    switch (gradeId) {
      case 1: return 'blue'
      case 2: return 'green'
      case 3: return 'purple'
      default: return 'blue'
    }
  }

  const getProgressPercentage = (gradeId: number) => {
    const baseProgress = gradeId === 1 ? 30 : gradeId === 2 ? 50 : 70
    return studentGrade.includes(gradeId.toString()) ? baseProgress + 20 : baseProgress
  }

  if (grades.length === 0) {
    return (
      <div className="grades-section">
        <div className="section-header">
          <h2 className="section-title">الصفوف الدراسية</h2>
          <button className="view-all-button">عرض الكل</button>
        </div>
        <div className="grades-empty">
          <BookOpen className="empty-icon" />
          <h3>لم يتم إضافة صفوف دراسية بعد</h3>
          <p>سيتم إضافة الصفوف الدراسية قريباً</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grades-section">
      <div className="section-header">
        <h2 className="section-title">الصفوف الدراسية</h2>
        <button className="view-all-button">عرض الكل</button>
      </div>
      
      <div className="grades-grid">
        {grades.map((grade) => {
          const progress = getProgressPercentage(grade.id)
          const color = getGradeColor(grade.id)
          
          return (
            <div 
              key={grade.id} 
              className={`grade-card grade-card-${color}`}
              onClick={() => router.push(`/grades/${grade.id}`)}
            >
              <div className="grade-header">
                <div className="grade-icon">
                  <BookOpen />
                </div>
                <h3 className="grade-title">{grade.name}</h3>
              </div>
              
              <p className="grade-description">{getGradeDescription(grade.name)}</p>
              
              <div className="grade-progress">
                <div className="progress-info">
                  <span className="progress-label">التقدم الدراسي</span>
                  <span className="progress-value">{progress}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              
              <button className="enter-grade-button">
                <span>الدخول إلى الصف</span>
                <ChevronRight />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}