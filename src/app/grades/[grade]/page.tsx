// app/grades/[grade]/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/supabase-server'
import PackageCard from '@/components/grades/PackageCard'
import RedeemCodeButton from '@/components/grades/RedeemCodeButton'

export const dynamic = 'force-dynamic'

interface GradePageProps {
  params: { grade: string }
}

const gradeTextMap: Record<string, string> = {
  first: 'الأول الثانوي',
  second: 'الثاني الثانوي',
  third: 'الثالث الثانوي',
}

const gradeThemes: Record<string, { gradient: string; accent: string }> = {
  first: { gradient: 'from-blue-600 to-blue-800', accent: 'text-blue-600' },
  second: { gradient: 'from-emerald-600 to-emerald-800', accent: 'text-emerald-600' },
  third: { gradient: 'from-purple-600 to-purple-800', accent: 'text-purple-600' },
}

export default async function GradePage({ params }: GradePageProps) {
  const supabase = await createClient()

  // ========== Auth ==========
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ========== Profile ==========
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('grade, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.grade) {
    console.error('PROFILE ERROR:', profileError)
    redirect('/complete-profile')
  }

  // حماية الصف
  if (profile.grade !== params.grade) {
    redirect(`/grades/${profile.grade}`)
  }

  // ========== Packages ==========
  const { data: allPackages, error: packagesError } = await supabase
    .from('packages')
    .select('*')
    .eq('grade', params.grade)
    .eq('is_active', true)
    .order('price', { ascending: true })

  if (packagesError) {
    console.error('PACKAGES ERROR:', packagesError)
  }

  // ========== Purchased ==========
  const { data: purchasedPackages, error: purchasedError } = await supabase
    .from('user_packages')
    .select('package_id')
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (purchasedError) {
    console.error('PURCHASED ERROR:', purchasedError)
  }

  const purchasedIds = purchasedPackages?.map(p => p.package_id) || []

  const purchased = allPackages?.filter(p => purchasedIds.includes(p.id)) || []
  const regular = allPackages?.filter(p => p.type === 'weekly' && !purchasedIds.includes(p.id)) || []
  const offers = allPackages?.filter(p => p.type !== 'weekly' && !purchasedIds.includes(p.id)) || []

  // ========== Wallet ==========
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  if (walletError) {
    console.error('WALLET ERROR:', walletError)
  }

  const theme = gradeThemes[params.grade] || gradeThemes.first
  const gradeText = gradeTextMap[params.grade] || params.grade

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ===== Hero ===== */}
      <section className={`bg-gradient-to-r ${theme.gradient} text-white p-8`}>
        <div className="container mx-auto">
          <h1 className="text-4xl font-extrabold mb-2">
            باقات {gradeText}
          </h1>
          <p className="text-lg opacity-90">
            مع الأستاذ محمود الديب — طريقك للتفوق يبدأ من هنا 🚀
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">

        {/* ===== Wallet + Redeem Code ===== */}
        <div className="bg-white rounded-2xl shadow p-6 mb-10 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <p className="text-gray-500">رصيد محفظتك</p>
            <p className={`text-3xl font-bold ${theme.accent}`}>
              {wallet?.balance || 0} ج.م
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-3xl">💳</div>
            <RedeemCodeButton />
          </div>
        </div>

        {/* ===== Purchased ===== */}
        {purchased.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">اشتراكاتك</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {purchased.map(pkg => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isPurchased
                  walletBalance={wallet?.balance || 0}
                />
              ))}
            </div>
          </section>
        )}

        {/* ===== Weekly ===== */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">الباقات الأسبوعية</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {regular.map(pkg => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                isPurchased={false}
                walletBalance={wallet?.balance || 0}
              />
            ))}
          </div>
        </section>

        {/* ===== Offers ===== */}
        {offers.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">العروض</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {offers.map(pkg => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isPurchased={false}
                  walletBalance={wallet?.balance || 0}
                  isOffer
                />
              ))}
            </div>
          </section>
        )}

        <div className="mt-12">
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← العودة للرئيسية
          </Link>
        </div>
      </main>
    </div>
  )
}
