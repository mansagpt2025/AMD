import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">منصة محمود الديب التعليمية</h1>

      <div className="flex gap-4">
        <Link href="/login" className="bg-indigo-600 px-6 py-2 rounded">
          تسجيل دخول
        </Link>
        <Link href="/register" className="bg-gray-700 px-6 py-2 rounded">
          إنشاء حساب
        </Link>
      </div>
    </main>
  )
}
