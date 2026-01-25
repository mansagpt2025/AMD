// app/icon.tsx
import { ImageResponse } from 'next/og'
import Image from 'next/image';

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
 >
<Image
  src="/logo.svg"
  alt="Logo"
  width={80}
  height={80}
  priority
/>      </div>
    ),
    size
  )
}