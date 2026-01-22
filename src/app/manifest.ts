// app/manifest.ts
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'محمود الديب - التعليم التفاعلي',
    short_name: 'محمود الديب',
    description: 'منصة التعليم التفاعلي للثانوية العامة مع الأستاذ محمود الديب',
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

    shortcuts: [
      {
        name: 'لوحة التحكم',
        url: '/dashboard',
        description: 'الذهاب إلى لوحة التحكم',
      },
      {
        name: 'الباقات',
        url: '/grades/first',
        description: 'عرض باقات الصف الأول',
      },
    ],
  }
}
