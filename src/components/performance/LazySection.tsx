'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { useLazyLoad } from '@/hooks/usePerformanceOptimization';

interface LazySectionProps {
  children: ReactNode;
  className?: string;
  placeholder?: ReactNode;
  priority?: 'high' | 'low';
  unloadWhenHidden?: boolean;
}

export const LazySection: React.FC<LazySectionProps> = ({
  children,
  className = '',
  placeholder,
  priority = 'low',
  unloadWhenHidden = false,
}) => {
  const [isVisible, setIsVisible] = useState(priority === 'high');
  const [hasBeenVisible, setHasBeenVisible] = useState(priority === 'high');
  const sectionRef = useRef<HTMLDivElement>(null);
  const { observe, unobserve } = useLazyLoad(priority === 'high' ? 0 : 0.05);

  useEffect(() => {
    if (!sectionRef.current || priority === 'high') return;

    observe(sectionRef.current, (visible) => {
      setIsVisible(visible);
      if (visible) {
        setHasBeenVisible(true);
      } else if (unloadWhenHidden) {
        setIsVisible(false);
      }
    });

    return () => {
      if (sectionRef.current) {
        unobserve(sectionRef.current);
      }
    };
  }, [observe, unobserve, priority, unloadWhenHidden]);

  const shouldRender = priority === 'high' || isVisible || hasBeenVisible;

  return (
    <div
      ref={sectionRef}
      className={`lazy-section ${className}`}
      style={{
        minHeight: shouldRender ? 'auto' : '100vh',
        contain: 'layout style paint',
        contentVisibility: shouldRender ? 'visible' : 'auto',
      }}
    >
      {shouldRender ? (
        <div className="lazy-content">{children}</div>
      ) : (
        placeholder || <div className="lazy-placeholder" style={{ height: '100vh' }} />
      )}
    </div>
  );
};