export const gradeThemes = {
  first: {
    // الصف الأول الثانوي - أزرق
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    accent: '#F59E0B',
    secondary: '#10B981',
    success: '#10B981',
    text: '#1E293B',
    background: '#F8FAFC',
    backgroundLight: '#FFFFFF',
    header: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
    border: '#E2E8F0'
  },
  second: {
    // الصف الثاني الثانوي - أخضر
    primary: '#10B981',
    primaryDark: '#059669',
    accent: '#F59E0B',
    secondary: '#3B82F6',
    success: '#10B981',
    text: '#1E293B',
    background: '#F0FDF4',
    backgroundLight: '#FFFFFF',
    header: 'linear-gradient(135deg, #047857 0%, #10B981 100%)',
    border: '#D1FAE5'
  },
  third: {
    // الصف الثالث الثانوي - بنفسجي
    primary: '#8B5CF6',
    primaryDark: '#7C3AED',
    accent: '#F59E0B',
    secondary: '#3B82F6',
    success: '#10B981',
    text: '#1E293B',
    background: '#FAF5FF',
    backgroundLight: '#FFFFFF',
    header: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)',
    border: '#EDE9FE'
  }
}

export function getGradeTheme(gradeSlug: 'first' | 'second' | 'third') {
  return gradeThemes[gradeSlug] || gradeThemes.first
}