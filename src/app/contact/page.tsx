import { Phone, Mail, MessageCircle, Instagram, Facebook, Youtube, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* الهيدر */}
      <header className="bg-gradient-primary text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">تواصل معنا</h1>
            <p className="text-xl opacity-90">
              نحن هنا لمساعدتك في رحلتك التعليمية
            </p>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* معلومات التواصل */}
          <div className="space-y-8">
            {/* بطاقة المدرس */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="w-20 h-20 bg-gradient-secondary rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl font-bold text-white">م.د</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">محمود الديب</h2>
                  <p className="text-gray-600">مدرس الثانوية العامة - خبرة 15 عاماً</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <MessageCircle className="w-5 h-5 text-primary-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-700">رسالة من المدرس</p>
                    <p className="text-gray-600 mt-1">
                      أهلاً بكم في منصتنا التعليمية، حيث نسعى لتقديم أفضل الخدمات التعليمية 
                      لطلاب الثانوية العامة في جميع أنحاء مصر. نجاحكم هو هدفنا الأول.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* وسائل التواصل الاجتماعي */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">تابعنا على</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <a
                  href="https://wa.me/201012345678"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <MessageCircle className="w-6 h-6 mr-2" />
                  <span className="font-medium">واتساب</span>
                </a>
                
                <a
                  href="https://instagram.com/mahmoudeeldeeb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center p-4 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors"
                >
                  <Instagram className="w-6 h-6 mr-2" />
                  <span className="font-medium">انستجرام</span>
                </a>
                
                <a
                  href="https://facebook.com/mahmoudeeldeeb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Facebook className="w-6 h-6 mr-2" />
                  <span className="font-medium">فيسبوك</span>
                </a>
                
                <a
                  href="https://youtube.com/@mahmoudeeldeeb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center p-4 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Youtube className="w-6 h-6 mr-2" />
                  <span className="font-medium">يوتيوب</span>
                </a>
              </div>
            </div>
          </div>

          {/* معلومات الدعم */}
          <div className="space-y-8">
            {/* بطاقة الدعم الفني */}
            <div className="bg-gradient-to-br from-primary-50 to-white rounded-2xl shadow-lg p-8 border border-primary-100">
              <div className="flex items-start mb-6">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                  <Phone className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">الدعم الفني</h3>
                  <p className="text-gray-600">متاح 24/7 لحل المشاكل الفنية</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center">
                    <MessageCircle className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-700">واتساب فقط</p>
                      <p className="text-xl font-bold text-gray-800 mt-1">01012345678</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    يرجى التواصل عبر واتساب لحل أي مشكلة فنية تواجهك في المنصة
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-primary-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-700">البريد الإلكتروني</p>
                      <p className="text-lg text-gray-800 mt-1">support@mahmoudeeldeeb.com</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    للاستفسارات الفنية أو مشاكل في الدفع أو الحسابات
                  </p>
                </div>
              </div>
            </div>

            {/* بطاقة الدعم العلمي */}
            <div className="bg-gradient-to-br from-secondary-50 to-white rounded-2xl shadow-lg p-8 border border-secondary-100">
              <div className="flex items-start mb-6">
                <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mr-4">
                  <MessageCircle className="w-6 h-6 text-secondary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">الدعم العلمي</h3>
                  <p className="text-gray-600">للاستفسارات العلمية والمنهجية</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-secondary-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-700">هاتف الدعم العلمي</p>
                      <p className="text-xl font-bold text-gray-800 mt-1">01198765432</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    متاح من الساعة 9 صباحاً حتى 10 مساءً
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-secondary-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-700">البريد الإلكتروني</p>
                      <p className="text-lg text-gray-800 mt-1">academic@mahmoudeeldeeb.com</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    للأسئلة العلمية واستفسارات المنهج والتواصل مع المدرسين
                  </p>
                </div>
              </div>
            </div>

            {/* معلومات إضافية */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">معلومات إضافية</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-700">العنوان</p>
                    <p className="text-gray-600">القاهرة، مصر</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-700">أوقات العمل</p>
                    <p className="text-gray-600">الأحد - الخميس: 9 صباحاً - 10 مساءً</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* رسالة تحفيزية */}
        <div className="mt-12 bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">نحن هنا لمساعدتك!</h3>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            فريقنا يعمل على مدار الساعة لتقديم أفضل تجربة تعليمية لطلاب الثانوية العامة. 
            لا تتردد في التواصل معنا لأي استفسار أو مساعدة.
          </p>
        </div>
      </main>

      {/* الفوتر */}
      <footer className="bg-gray-800 text-white mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="mb-4">جميع الحقوق محفوظة © {new Date().getFullYear()} منصة محمود الديب التعليمية</p>
            <div className="flex justify-center space-x-6">
              <Link href="/" className="hover:text-primary-300 transition-colors">
                الرئيسية
              </Link>
              <Link href="/contact" className="hover:text-primary-300 transition-colors">
                تواصل معنا
              </Link>
              <Link href="/privacy" className="hover:text-primary-300 transition-colors">
                سياسة الخصوصية
              </Link>
              <Link href="/terms" className="hover:text-primary-300 transition-colors">
                الشروط والأحكام
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}