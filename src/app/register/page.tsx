'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, User, School, MapPin, Building } from 'lucide-react'

const governorates = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة',
  'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية',
  'الوادي الجديد', 'السويس', 'اسوان', 'أسيوط', 'بني سويف', 'بورسعيد',
  'دمياط', 'سوهاج', 'جنوب سينا', 'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا',
  'شمال سينا', 'الشرقية', 'طنطا'
]

const grades = [
  { id: 'first', name: 'الصف الأول الثانوي' },
  { id: 'second', name: 'الصف الثاني الثانوي' },
  { id: 'third', name: 'الصف الثالث الثانوي' }
]

const sectionsData: Record<string, Array<{id: string, name: string}>> = {
  first: [{ id: 'general', name: 'عام' }],
  second: [
    { id: 'scientific', name: 'علمي' },
    { id: 'literary', name: 'أدبي' }
  ],
  third: [
    { id: 'science_science', name: 'علمي علوم' },
    { id: 'science_math', name: 'علمي رياضة' },
    { id: 'literary', name: 'أدبي' }
  ]
}

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    section: '',
    email: '',
    studentPhone: '',
    parentPhone: '',
    governorate: '',
    city: '',
    school: '',
    password: '',
    confirmPassword: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (name === 'grade') {
      setFormData(prev => ({
        ...prev,
        section: ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      return
    }
    
    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    
    setLoading(true)
    
    try {
      // استيراد الديناميكي فقط عند الحاجة
      const { createClient } = await import('@/lib/supabase/browser-client')
      const supabase = createClient()
      
      // إنشاء المستخدم في Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.studentPhone
          }
        }
      })
      
      if (authError) throw authError
      
      if (authData.user) {
        // تحضير بيانات الملف الشخصي للإدراج
        const profileData = {
          id: authData.user.id,
          name: formData.name,
          grade: formData.grade,
          section: formData.section,
          email: formData.email,
          student_phone: formData.studentPhone,
          parent_phone: formData.parentPhone,
          governorate: formData.governorate,
          city: formData.city,
          school: formData.school,
          wallet_balance: 0,
          role: 'student'
        }

        // إضافة معلومات المستخدم إلى جدول profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)
        
        if (profileError) {
          console.error('Profile creation error:', profileError)
          throw profileError
        }
        
        // إرسال بريد التحقق
        alert('تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني.')
        router.push('/login')
      }
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'حدث خطأ أثناء إنشاء الحساب')
    } finally {
      setLoading(false)
    }
  }

  const currentSections = formData.grade && sectionsData[formData.grade] 
    ? sectionsData[formData.grade] 
    : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="md:flex">
          {/* الجانب الأيسر - صورة وشعار */}
          <div className="md:w-2/5 bg-gradient-to-br from-blue-600 to-blue-800 p-8 flex flex-col justify-center items-center text-white">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">محمود الديب</h1>
              <p className="text-blue-100">منصة التعليم الإلكتروني للثانوية العامة</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">تعليم متميز</h3>
                  <p className="text-sm text-blue-100">أفضل المناهج التعليمية</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">مدرس متخصص</h3>
                  <p className="text-sm text-blue-100">خبرة 15 عاماً في التدريس</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <div className="w-6 h-6">📱</div>
                </div>
                <div>
                  <h3 className="font-semibold">دعم فني</h3>
                  <p className="text-sm text-blue-100">متاح على مدار الساعة</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* الجانب الأيمن - نموذج التسجيل */}
          <div className="md:w-3/5 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">إنشاء حساب جديد</h2>
              <p className="text-gray-600 mt-2">سجل الآن للوصول إلى جميع الدورات والمحاضرات</p>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* الصف والشعبة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الصف الدراسي *
                  </label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">اختر الصف</option>
                    {grades.map(grade => (
                      <option key={grade.id} value={grade.id}>
                        {grade.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الشعبة *
                  </label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    required
                    disabled={!formData.grade}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">اختر الشعبة</option>
                    {currentSections.map(section => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* الاسم والمدينة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الاسم الكامل *
                  </label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="أدخل الاسم الكامل"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المدينة *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="أدخل المدينة"
                    />
                  </div>
                </div>
              </div>
              
              {/* المدرسة والمحافظة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المدرسة *
                  </label>
                  <div className="relative">
                    <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      name="school"
                      value={formData.school}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="أدخل اسم المدرسة"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المحافظة *
                  </label>
                  <select
                    name="governorate"
                    value={formData.governorate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">اختر المحافظة</option>
                    {governorates.map(gov => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* البريد الإلكتروني */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني *
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="example@email.com"
                  />
                </div>
              </div>
              
              {/* أرقام الهواتف */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم هاتف الطالب *
                  </label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5">📱</div>
                    <input
                      type="tel"
                      name="studentPhone"
                      value={formData.studentPhone}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="01xxxxxxxxx"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم هاتف ولي الأمر *
                  </label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5">📱</div>
                    <input
                      type="tel"
                      name="parentPhone"
                      value={formData.parentPhone}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="01xxxxxxxxx"
                    />
                  </div>
                </div>
              </div>
              
              {/* كلمة المرور */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    كلمة المرور *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="6 أحرف على الأقل"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تأكيد كلمة المرور *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="أعد إدخال كلمة المرور"
                    />
                  </div>
                </div>
              </div>
              
              {/* زر التسجيل */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
              </button>
              
              {/* رابط تسجيل الدخول */}
              <div className="text-center pt-4">
                <p className="text-gray-600">
                  لديك حساب بالفعل؟{' '}
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                    سجل الدخول هنا
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}