import './GradeHero.css'

interface GradeHeroProps {
  gradeName: string
  teacherName: string
  motivationalText: string
}

export default function GradeHero({ gradeName, teacherName, motivationalText }: GradeHeroProps) {
  // تحديد اللون بناءً على الصف
  const getColorScheme = () => {
    if (gradeName.includes('الأول')) return 'blue'
    if (gradeName.includes('الثاني')) return 'green'
    if (gradeName.includes('الثالث')) return 'purple'
    return 'blue'
  }

  const colorScheme = getColorScheme()

  return (
    <div className={`grade-hero grade-hero--${colorScheme}`}>
      <div className="grade-hero__overlay"></div>
      
      <div className="grade-hero__container">
        <div className="grade-hero__content">
          <h1 className="grade-hero__teacher-name">
            {teacherName}
          </h1>
          
          <div className="grade-hero__grade-badge">
            <span className="grade-hero__grade-text">
              {gradeName}
            </span>
          </div>
          
          <p className="grade-hero__motivational-text">
            {motivationalText}
          </p>
          
          <div className="grade-hero__status">
            <div className="grade-hero__status-indicator"></div>
            <span className="grade-hero__status-text">مباشر الآن</span>
          </div>
        </div>
      </div>
    </div>
  )
}