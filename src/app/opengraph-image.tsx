// app/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const alt = 'محمود الديب - التعليم التفاعلي'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
          color: 'white',
          textAlign: 'center',
          padding: '40px',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 'bold', marginBottom: 20 }}>
          محمود الديب
        </div>
        <div style={{ fontSize: 36, opacity: 0.9 }}>
          التعليم التفاعلي للثانوية العامة
        </div>
        <div style={{ fontSize: 24, opacity: 0.7, marginTop: 20 }}>
          رحلة التفوق تبدأ من هنا
        </div>
      </div>
    ),
    size
  )
}