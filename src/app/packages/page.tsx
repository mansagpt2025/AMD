import { createSupabaseServer } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function PackagesPage() {
  const supabase = createSupabaseServer()

  const { data: packages } = await supabase
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="grid grid-cols-3 gap-6">
      {packages?.map((pkg) => (
        <Link
          key={pkg.id}
          href={`/packages/${pkg.id}`}
          className="border p-4 rounded"
        >
          <h3 className="font-bold">{pkg.title}</h3>
          <p>{pkg.description}</p>
          <p className="text-green-600">{pkg.price} جنيه</p>
        </Link>
      ))}
    </div>
  )
}
