'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface Props {
  children?: React.ReactNode;  // اختياري علشان ما يطلعش خطأ لوستخدمته فاضي
}

export const ViewportOptimizer = React.memo<Props>(function ViewportOptimizer({ 
  children 
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        
        if (Math.abs(currentScrollY - lastScrollY.current) > 5) {
          lastScrollY.current = currentScrollY;
        }
        
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Lazy loading للصور
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach((img) => {
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return (
    <div 
      ref={containerRef}
      style={{
        contain: 'layout style paint',
      }}
    >
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        img {
          content-visibility: auto;
        }
        
        .will-change-transform {
          will-change: transform;
          transform: translateZ(0);
        }
      `}</style>
      {children}
    </div>
  );
});

ViewportOptimizer.displayName = 'ViewportOptimizer';

export default ViewportOptimizer;