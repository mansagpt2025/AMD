'use client';

import Script from 'next/script';

export const PerformanceScripts = () => {
  return (
    <>
      <Script id="performance-optimizations" strategy="beforeInteractive">
        {`
          // تحسين الأداء قبل تحميل الصفحة
          (function() {
            // تفعيل التمرير السلس
            document.documentElement.style.scrollBehavior = 'smooth';
            
            // تحسين الأداء على الهاتف
            if ('ontouchstart' in window) {
              document.documentElement.classList.add('touch-device');
            }
            
            // تقليل الجودة على الهاتف للأداء الأفضل
            if (window.matchMedia('(pointer: coarse)').matches) {
              document.documentElement.classList.add('reduce-quality');
            }
            
            // تحميل الصور الكسول
            if ('loading' in HTMLImageElement.prototype) {
              document.documentElement.classList.add('native-lazy-loading');
            }
            
            // تحسين الأداء للمتصفحات الحديثة
            if (CSS.supports('content-visibility', 'auto')) {
              document.documentElement.classList.add('content-visibility-supported');
            }
          })();
        `}
      </Script>
      
      <Script id="intersection-observer-polyfill" strategy="lazyOnload">
        {`
          // Polyfill بسيط لـ Intersection Observer للمتصفحات القديمة
          if (!('IntersectionObserver' in window)) {
            window.IntersectionObserver = function(callback) {
              this.observe = function() {};
              this.unobserve = function() {};
              this.disconnect = function() {};
            };
          }
        `}
      </Script>
    </>
  );
};