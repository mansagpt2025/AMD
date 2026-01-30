'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface Props {
  children?: React.ReactNode;
}

// استخدمت function عادية بدل arrow function مع React.memo
function ViewportOptimizerComponent({ children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // ✅ صلحت الخطأين هنا: حطيت initial value null وغيرت النوع
  const rafId = useRef<number | null>(null);
  const activeElements = useRef<Set<Element>>(new Set());

  const optimizeVisibleImages = useCallback(() => {
    if (!containerRef.current) return;
    
    const images = containerRef.current.querySelectorAll('img');
    const viewportHeight = window.innerHeight;
    
    images.forEach((img) => {
      const rect = img.getBoundingClientRect();
      const isNearViewport = rect.top < viewportHeight + 200 && rect.bottom > -200;
      
      if (isNearViewport) {
        if (!activeElements.current.has(img)) {
          const htmlImg = img as HTMLElement;
          htmlImg.style.transform = 'translate3d(0, 0, 0)';
          htmlImg.style.backfaceVisibility = 'hidden';
          htmlImg.style.willChange = 'transform';
          htmlImg.style.contain = 'strict';
          activeElements.current.add(img);
        }
      } else {
        if (activeElements.current.has(img)) {
          const htmlImg = img as HTMLElement;
          htmlImg.style.willChange = 'auto';
          htmlImg.style.transform = 'none';
          htmlImg.style.contain = 'none';
          activeElements.current.delete(img);
        }
      }
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // ✅ صلحت الشرط هنا
      if (rafId.current !== null) return;
      
      rafId.current = requestAnimationFrame(() => {
        optimizeVisibleImages();
        rafId.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    optimizeVisibleImages();
    
    const observer = new MutationObserver(() => {
      const newImages = containerRef.current?.querySelectorAll('img:not([data-optimized])');
      newImages?.forEach((img, index) => {
        img.setAttribute('data-optimized', 'true');
        img.setAttribute('decoding', 'async');
        if (!img.hasAttribute('loading')) {
          img.setAttribute('loading', index < 2 ? 'eager' : 'lazy');
        }
      });
      optimizeVisibleImages();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      // ✅ صلحت فحص null هنا
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [optimizeVisibleImages]);

  return (
    <div 
      ref={containerRef}
      style={{
        contain: 'layout style paint',
      }}
    >
      <style jsx global>{`
        img {
          content-visibility: auto;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
          -webkit-font-smoothing: antialiased;
          transform: translateZ(0);
          backface-visibility: hidden !important;
          perspective: 1000px;
          transition: none !important;
          filter: none !important;
        }
        
        img:hover {
          will-change: transform;
          transform: translateZ(0) scale(1);
        }
      `}</style>
      {children}
    </div>
  );
}

// ✅ شلت Generic Type من React.memo واستخدمت export منفصل
export const ViewportOptimizer = React.memo(ViewportOptimizerComponent);
ViewportOptimizer.displayName = 'ViewportOptimizer';

export default ViewportOptimizer;