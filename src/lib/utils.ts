// دالة لدمج كلاسات Tailwind
export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

// أدوات التحقق من الصحة
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export function isValidEgyptianPhone(phone: string): boolean {
  const regex = /^01[0-2,5]{1}[0-9]{8}$/
  return regex.test(phone)
}

// أدوات التنسيق
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date))
}

// تحويل الصفوف إلى عربية
export function getGradeArabic(grade: string): string {
  const grades: Record<string, string> = {
    first: 'الصف الأول الثانوي',
    second: 'الصف الثاني الثانوي',
    third: 'الصف الثالث الثانوي'
  }
  return grades[grade] || grade
}

// تحويل الشعبة إلى عربية
export function getSectionArabic(section: string): string {
  const sections: Record<string, string> = {
    general: 'عام',
    scientific: 'علمي',
    literary: 'أدبي',
    science_science: 'علمي علوم',
    science_math: 'علمي رياضة'
  }
  return sections[section] || section
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}