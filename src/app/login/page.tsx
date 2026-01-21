'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      // استيراد الديناميكي فقط عند الحاجة
      const { createClient } = await import('@/lib/supabase/browser-client')
      const supabase = createClient()
      
      let email = formData.identifier
      
      // التحقق إذا كان المدخل رقم هاتف
      if (formData.identifier.match(/^01\d{9}$/)) {
        // البحث عن المستخدم برقم الهاتف
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('email')
          .eq('student_phone', formData.identifier)
          .single()
        
        if (userError || !userData) {
          throw new Error('لا يوجد حساب مرتبط بهذا الرقم')
        }
        
        email = (userData as any).email
      }
      
      // محاولة تسجيل الدخول
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: formData.password
      })
      
      if (authError) {
        throw authError
      }
      
      if (data?.user) {
        // إعادة التوجيه إلى الداشبورد
        router.push('/dashboard')
        router.refresh()
      }
      
    } catch (err: any) {
      console.error('Login error:', err)
      setError('البريد الإلكتروني أو رقم الهاتف أو كلمة المرور غير صحيحة')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!formData.identifier) {
      setError('يرجى إدخال البريد الإلكتروني أو رقم الهاتف')
      return
    }
    
    try {
      const { createClient } = await import('@/lib/supabase/browser-client')
      const supabase = createClient()
      
      let email = formData.identifier
      
      // إذا كان المدخل رقم هاتف، احصل على البريد الإلكتروني المرتبط
      if (formData.identifier.match(/^01\d{9}$/)) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('email')
          .eq('student_phone', formData.identifier)
          .single()
        
        if (!userData) {
          setError('لا يوجد حساب مرتبط بهذا الرقم')
          return
        }
        email = (userData as any).email
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) throw error
      
      alert('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني')
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إرسال رابط إعادة التعيين')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* الشعار */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700 mb-2">محمود الديب</h1>
          <p className="text-gray-600">منصة التعليم الإلكتروني للثانوية العامة</p>
        </div>
        
        {/* بطاقة تسجيل الدخول */}
        <div className="bg-white rounded-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">تسجيل الدخول</h2>
          <p className="text-gray-600 mb-6">سجل دخولك للوصول إلى حسابك</p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* حقل الإيميل/الهاتف */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني أو رقم الهاتف *
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="email@example.com أو 01xxxxxxxxx"
                />
              </div>
            </div>
            
            {/* حقل كلمة المرور */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">
                  كلمة المرور *
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="أدخل كلمة المرور"
                />
              </div>
            </div>
            
            {/* زر تسجيل الدخول */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
            
            {/* رابط إنشاء حساب */}
            <div className="text-center pt-4">
              <p className="text-gray-600">
                ليس لديك حساب؟{' '}
                <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                  أنشئ حساب الآن
                </Link>
              </p>
            </div>
          </form>
          
          {/* معلومات إضافية */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-5 h-5 text-blue-600 mr-3">📱</div>
                <div>
                  <p className="text-sm font-medium text-gray-700">الدعم الفني</p>
                  <p className="text-sm text-gray-600">01012345678 (واتساب فقط)</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-5 h-5 text-blue-600 mr-3">📚</div>
                <div>
                  <p className="text-sm font-medium text-gray-700">الدعم العلمي</p>
                  <p className="text-sm text-gray-600">01198765432</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}