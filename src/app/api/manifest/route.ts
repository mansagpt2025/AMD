// app/api/manifest/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const manifest = {
    name: 'محمود الديب - التعليم التفاعلي',
    short_name: 'محمود الديب',
    description: 'منصة التعليم التفاعلي للثانوية العامة مع الأستاذ محمود الديب',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  })
}