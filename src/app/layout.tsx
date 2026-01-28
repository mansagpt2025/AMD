import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Arabic, Inter } from 'next/font/google'
import './globals.css'

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'البارع محمود الديب',
  description: 'منصة تعليمية متكاملة لكل صفوف المرحلة الثانوية تضمن التفوق و التميز في اللغة العربية.',
  openGraph: {
    title: 'البارع محمود الديب',
    description: 'منصة تعليمية متكاملة لكل صفوف المرحلة الثانوية تضمن التفوق و التميز في اللغة العربية.',
    images: ['/logo.svg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'البارع محمود الديب',
    description: 'منصة تعليمية متكاملة لكل صفوف المرحلة الثانوية تضمن التفوق و التميز في اللغة العربية.',
    images: ['/logo.svg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${notoSansArabic.variable} ${inter.variable}`}
    >
      <body className={`${notoSansArabic.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
