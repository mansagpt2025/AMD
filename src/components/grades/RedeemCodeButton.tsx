'use client'

import { useState } from 'react'
import RedeemCodeModal from './RedeemCodeModal'

export default function RedeemCodeButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-xl font-bold shadow hover:shadow-lg transition"
      >
        🎫 إدخال كود الحصة
      </button>

      <RedeemCodeModal
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
