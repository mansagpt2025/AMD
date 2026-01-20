import { createSupabaseServer } from '@/lib/supabase/server'
import Link from 'next/link'
import BuyPackageButton from './BuyPackageButton'

export default async function PackagePage({ params }: any) {
  const supabase = createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: pkg } = await supabase
    .from('packages')
    .select('*')
    .eq('id', params.packageId)
    .single()

  let isSubscribed = false

  if (user) {
    const { data } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('package_id', pkg.id)
      .single()

    isSubscribed = !!data
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{pkg.title}</h1>
      <p>{pkg.description}</p>

      {isSubscribed ? (
        <Link
          href={`/packages/${pkg.id}/lectures`}
          className="text-blue-600"
        >
          دخول المحاضرات →
        </Link>
      ) : (
        <BuyPackageButton pkg={pkg} />
      )}
    </div>
  )
}
