'use client'

import { supabase } from '@/lib/supabase/client'

export default function BuyPackageButton({ pkg }: any) {
  const buy = async () => {
    const { error } = await supabase.rpc(
      'buy_package_with_wallet',
      { p_package_id: pkg.id }
    )

    if (error) {
      alert(error.message)
      return
    }

    location.reload()
  }

  return (
    <button
      onClick={buy}
      className="bg-black text-white px-4 py-2 rounded"
    >
      اشترك الآن
    </button>
  )
}
