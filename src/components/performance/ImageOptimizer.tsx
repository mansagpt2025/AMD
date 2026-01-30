'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useLazyLoad } from '@/hooks/usePerformanceOptimization';

interface ImageOptimizerProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export const ImageOptimizer: React.FC<ImageOptimizerProps> = ({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className = '',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imageRef = useRef<HTMLDivElement>(null);
  const { observe, unobserve } = useLazyLoad(0.1);

  useEffect(() => {
    if (priority || !imageRef.current) return;

    observe(imageRef.current, (visible) => {
      if (visible) {
        setIsInView(true);
      }
    });

    return () => {
      if (imageRef.current) {
        unobserve(imageRef.current);
      }
    };
  }, [observe, unobserve, priority]);

  return (
    <div
      ref={imageRef}
      className={`image-optimizer ${className}`}
      style={{
        position: 'relative',
        width: fill ? '100%' : width,
        height: fill ? '100%' : height,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        contain: 'layout style paint',
      }}
    >
      {(priority || isInView) && (
        <Image
          src={src}
          alt={alt}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          fill={fill}
          priority={priority}
          quality={quality}
          sizes={sizes}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          onLoad={() => setIsLoaded(true)}
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
            objectFit: 'cover',
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
        />
      )}
    </div>
  );
};