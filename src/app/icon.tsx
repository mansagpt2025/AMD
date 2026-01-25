// app/icon.tsx
import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

// مهم: تشغيله على edge
export const runtime = 'edge'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        {/* استخدم img عادي بدل next/image */}
        <img
          src="/logo.svg"
          alt="Logo"
          width={24}
          height={24}
          style={{
            width: 24,
            height: 24,
          }}
        />
      </div>
    ),
    size
  )
}
