'use client';

import React, { useEffect, useRef, ReactNode } from 'react';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';

interface SmoothScrollWrapperProps {
  children: ReactNode;
  className?: string;
}

export const SmoothScrollWrapper: React.FC<SmoothScrollWrapperProps> = ({
  children,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  usePerformanceOptimization({
    enableIntersectionObserver: true,
    enablePassiveListeners: true,
    enableRAF: true,
    enableTouchOptimization: true,
  });

  useEffect(() => {
    // تفعيل التمرير السلس على iOS
    const style = document.createElement('style');
    style.textContent = `
      html {
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
      }
      
      body {
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior-y: contain;
      }
      
      * {
        -webkit-tap-highlight-color: transparent;
      }
      
      .smooth-scroll-container {
        will-change: transform;
        transform: translateZ(0);
      }
      
      @media (pointer: coarse) {
        html {
          scroll-behavior: auto;
        }
        
        .smooth-scroll-container {
          scroll-snap-type: y proximity;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`smooth-scroll-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
      }}
    >
      {children}
    </div>
  );
};