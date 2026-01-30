'use client';

import React, { useEffect, useRef, ReactNode } from 'react';

interface MobileScrollOptimizerProps {
  children: ReactNode;
  className?: string;
  enableMomentumScroll?: boolean;
  enableSnapScroll?: boolean;
}

export const MobileScrollOptimizer: React.FC<MobileScrollOptimizerProps> = ({
  children,
  className = '',
  enableMomentumScroll = true,
  enableSnapScroll = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const scrollStartY = useRef(0);
  const isScrolling = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !('ontouchstart' in window)) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
      scrollStartY.current = window.scrollY;
      isScrolling.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isScrolling.current) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY.current - touchY;
      
      // السماح بالتمرير الطبيعي
      window.scrollTo(0, scrollStartY.current + deltaY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isScrolling.current) return;
      isScrolling.current = false;

      if (!enableMomentumScroll) return;

      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      
      const deltaY = touchStartY.current - touchEndY;
      const deltaTime = touchEndTime - touchStartTime.current;
      
      // حساب السرعة
      const velocity = deltaY / deltaTime;
      
      // تطبيق momentum scroll إذا كانت السرعة كافية
      if (Math.abs(velocity) > 0.5) {
        const momentum = velocity * 200; // مسافة إضافية بناءً على السرعة
        const targetScroll = window.scrollY + momentum;
        
        window.scrollTo({
          top: targetScroll,
          behavior: 'smooth',
        });
      }
    };

    // إضافة مستمعي الأحداث مع passive: true
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enableMomentumScroll]);

  return (
    <div
      ref={containerRef}
      className={`mobile-scroll-optimizer ${className}`}
      style={{
        width: '100%',
        minHeight: '100vh',
        touchAction: 'pan-y pinch-zoom',
        WebkitOverflowScrolling: 'touch',
        scrollSnapType: enableSnapScroll ? 'y mandatory' : 'none',
      }}
    >
      {children}
    </div>
  );
};