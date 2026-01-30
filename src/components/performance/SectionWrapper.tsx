'use client';

import React, { ReactNode } from 'react';

interface SectionWrapperProps {
  children: ReactNode;
  id?: string;
  className?: string;
  minHeight?: string;
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({
  children,
  id,
  className = '',
  minHeight = 'auto',
}) => {
  return (
    <section
      id={id}
      className={`section-wrapper ${className}`}
      style={{
        minHeight,
        // GPU Acceleration للتمرير السلس
        transform: 'translateZ(0)',
        willChange: 'transform',
        // تحسين الرسم
        contain: 'layout style paint',
      }}
    >
      {children}
    </section>
  );
};