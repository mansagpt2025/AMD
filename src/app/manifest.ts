// app/manifest.ts
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'محمود الديب',
    short_name: 'محمود الديب',
    description: 'منصة تعليمية متكاملة لكل صفوف المرحلة الثانوية تضمن لك التفوق و التميز في اللغة العربية.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',

    icons: [
      // 192x192 - maskable
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      // 192x192 - any
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },

      // 512x512 - maskable
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      // 512x512 - any
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },

      // fallback icon
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],

    categories: ['education', 'productivity'],
    orientation: 'portrait-primary',
    scope: '/',
    id: '/',
    dir: 'rtl',
    lang: 'ar',
  }
}
