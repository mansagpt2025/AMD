import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Arabic, Inter } from 'next/font/google'
import './globals.css'

// تحميل الخط العربي
const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  weight: ['300', '400', '500', '600', '700', '800'],
})

// تحميل الخط الإنجليزي للعناصر التي قد تحتاجه
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

// تصدير viewport بشكل منفصل (مطلوب في Next.js 14+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'البارع محمود الديب',
  description: 'منصة تعليمية متكاملة لكل صفوف المرحلة الثانوية تضمن التفوق و التميز في اللغة العربية.',
  keywords: ['اللغة العربية', 'الثانوية العامة', 'محمود الديب', 'البارع', 'تعليم'],
  authors: [{ name: 'محمود الديب' }],
  openGraph: {
    type: 'website',
    locale: 'ar_AR',
    url: 'https://mahmoud-eldeeb.com/',
    title: 'البارع محمود الديب',
    description: 'منصة تعليمية متكاملة لكل صفوف المرحلة الثانوية تضمن التفوق و التميز في اللغة العربية.',
    siteName: 'البارع محمود الديب',
    images: [
      {
        url: '/logo.svg',
        width: 1200,
        height: 1200,
        alt: 'البارع محمود الديب',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'البارع محمود الديب',
    description: 'منصة تعليمية متكاملة لكل صفوف المرحلة الثانوية تضمن التفوق و التميز في اللغة العربية.',
    images: ['/logo.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={`${notoSansArabic.variable} ${inter.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2e4a7a" />
        
        {/* ربط CSS للخطوط */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* Facebook Meta Tags */}
        <meta property="og:url" content="https://mahmoud-eldeeb.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="البارع محمود الديب" />
        <meta property="og:description" content="منصة تعليمية متكاملة لكل صفوف المرحلة الثانوية تضمن التفوق و التميز في اللغة العربية." />
        <meta property="og:image" content="https://mahmoud-eldeeb.com/logo.svg" />
        
        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="mahmoud-eldeeb.com" />
        <meta property="twitter:url" content="https://mahmoud-eldeeb.com/" />
        <meta name="twitter:title" content="البارع محمود الديب" />
        <meta name="twitter:description" content="منصة تعليمية متكاملة لكل صفوف المرحلة الثانوية تضمن التفوق و التميز في اللغة العربية." />
        <meta name="twitter:image" content="https://mahmoud-eldeeb.com/logo.svg" />
      </head>
      <body className={`${notoSansArabic.className} antialiased`}>
        <div id="root">
          {children}
        </div>
        
        {/* Scripts متحركة خفيفة */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // تهيئة سمة التصميم من localStorage
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  
                  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  console.log('Error loading theme:', e);
                }
                
                // إضافة فئة للجسم عند التمرير
                let scrollTimeout;
                window.addEventListener('scroll', function() {
                  document.body.classList.add('scrolling');
                  clearTimeout(scrollTimeout);
                  scrollTimeout = setTimeout(function() {
                    document.body.classList.remove('scrolling');
                  }, 100);
                });
                
                // إصلاح ارتفاع الشاشة على الهواتف
                function setVH() {
                  let vh = window.innerHeight * 0.01;
                  document.documentElement.style.setProperty('--vh', vh + 'px');
                }
                
                setVH();
                window.addEventListener('resize', setVH);
                window.addEventListener('orientationchange', setVH);
                
                // تحسين أداء الصور
                if ('loading' in HTMLImageElement.prototype) {
                  const images = document.querySelectorAll('img[loading="lazy"]');
                  images.forEach(img => {
                    if (img.dataset.src) {
                      img.src = img.dataset.src;
                    }
                  });
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  )
}