interface GradeHeroProps {
  gradeName: string
  teacherName: string
  motivationalText: string
}

export default function GradeHero({ gradeName, teacherName, motivationalText }: GradeHeroProps) {
  // تحديد اللون بناءً على الصف
  const getColorScheme = () => {
    if (gradeName.includes('الأول')) return {
      bg: 'bg-gradient-to-r from-blue-500 to-blue-700',
      text: 'text-blue-100',
      badge: 'bg-black/20 text-blue-100'
    }
    if (gradeName.includes('الثاني')) return {
      bg: 'bg-gradient-to-r from-green-500 to-green-700',
      text: 'text-green-100',
      badge: 'bg-black/20 text-green-100'
    }
    if (gradeName.includes('الثالث')) return {
      bg: 'bg-gradient-to-r from-purple-500 to-purple-700',
      text: 'text-purple-100',
      badge: 'bg-black/20 text-purple-100'
    }
    return {
      bg: 'bg-gradient-to-r from-primary-600 to-primary-800',
      text: 'text-primary-100',
      badge: 'bg-black/20 text-primary-100'
    }
  }

  const colorScheme = getColorScheme()

  return (
    <div className={`relative overflow-hidden ${colorScheme.bg}`}>
      <div className="absolute inset-0 bg-black opacity-10"></div>
      
      <div className="relative container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${colorScheme.text}`}>
            {teacherName}
          </h1>
          
          <div className="mb-6">
            <span className={`inline-block px-6 py-2 rounded-full ${colorScheme.badge} backdrop-blur-sm`}>
              {gradeName}
            </span>
          </div>
          
          <p className={`text-xl md:text-2xl max-w-2xl mx-auto ${colorScheme.text} font-light`}>
            {motivationalText}
          </p>
          
          <div className="mt-8">
            <div className="inline-flex items-center space-x-2 space-x-reverse">
              <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
              <span className={`${colorScheme.text} text-sm`}>مباشر الآن</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}