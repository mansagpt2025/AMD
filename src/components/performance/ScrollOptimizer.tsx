'use client';

import React, { useEffect, ReactNode } from 'react';

interface ScrollOptimizerProps {
  children: ReactNode;
}

export const ScrollOptimizer: React.FC<ScrollOptimizerProps> = ({ children }) => {
  useEffect(() => {
    // تفعيل التمرير السلس العام
    document.documentElement.style.scrollBehavior = 'smooth';
    document.documentElement.style.overscrollBehavior = 'contain';
    
    // تحسين الأداء على الهاتف
    if ('ontouchstart' in window) {
      const bodyStyle = document.body.style as any;
      bodyStyle.webkitOverflowScrolling = 'touch';
      document.body.style.overscrollBehavior = 'contain';
    }

    // إضافة كلاس للـ CSS
    document.documentElement.classList.add('optimized-scroll');
  }, []);

  return (
    <div 
      className="scroll-optimizer"
      style={{
        width: '100%',
        minHeight: '100vh',
        // تفعيل GPU على كل العناصر الفرعية
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
      }}
    >
      {children}
    </div>
  );
};
