'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UsePerformanceOptimizationOptions {
  enableIntersectionObserver?: boolean;
  enablePassiveListeners?: boolean;
  enableRAF?: boolean;
  enableTouchOptimization?: boolean;
}

export const usePerformanceOptimization = (options: UsePerformanceOptimizationOptions = {}) => {
  const {
    enableIntersectionObserver = true,
    enablePassiveListeners = true,
    enableRAF = true,
    enableTouchOptimization = true,
  } = options;

  const rafRef = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const touchStartY = useRef<number>(0);
  const isScrolling = useRef<boolean>(false);

  // تحسين التمرير باستخدام RequestAnimationFrame
  const smoothScrollTo = useCallback((target: number, duration: number = 500) => {
    if (!enableRAF) return;

    const start = window.scrollY;
    const distance = target - start;
    const startTime = performance.now();

    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeOutCubic(progress);

      window.scrollTo(0, start + distance * easeProgress);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(animate);
  }, [enableRAF]);

  // تحسين أداء اللمس على الهاتف
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isScrolling.current = true;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isScrolling.current) return;
    
    // السماح بالتمرير الطبيعي دون تدخل
    // لكن يمكن إضافة تأثيرات إضافية هنا إذا لزم الأمر
  }, []);

  const handleTouchEnd = useCallback(() => {
    isScrolling.current = false;
  }, []);

  useEffect(() => {
    // تفعيل التمرير السلس على مستوى CSS
    document.documentElement.style.scrollBehavior = 'smooth';
    document.documentElement.style.overscrollBehavior = 'contain';

    // تحسين أداء اللمس
    if (enableTouchOptimization && 'ontouchstart' in window) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    // تحسين مستمعي الأحداث بتمرير passive
    if (enablePassiveListeners) {
      const events = ['scroll', 'wheel', 'touchstart', 'touchmove'];
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      
      EventTarget.prototype.addEventListener = function(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
      ) {
        if (events.includes(type)) {
          const newOptions = typeof options === 'object' 
            ? { ...options, passive: true }
            : { passive: true };
          return originalAddEventListener.call(this, type, listener, newOptions);
        }
        return originalAddEventListener.call(this, type, listener, options);
      };
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      if (enableTouchOptimization && 'ontouchstart' in window) {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [enableTouchOptimization, enablePassiveListeners, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    smoothScrollTo,
    scrollContainerRef,
  };
};

// هوك للتحميل الكسول (Lazy Loading)
export const useLazyLoad = (threshold: number = 0.1) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Map<Element, (isIntersecting: boolean) => void>>(new Map());

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const callback = elementsRef.current.get(entry.target);
          if (callback) {
            callback(entry.isIntersecting);
          }
        });
      },
      {
        threshold,
        rootMargin: '50px 0px',
      }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold]);

  const observe = useCallback((element: Element, callback: (isIntersecting: boolean) => void) => {
    elementsRef.current.set(element, callback);
    observerRef.current?.observe(element);
  }, []);

  const unobserve = useCallback((element: Element) => {
    elementsRef.current.delete(element);
    observerRef.current?.unobserve(element);
  }, []);

  return { observe, unobserve };
};

// هوك للتحكم في FPS
export const useFPSControl = (targetFPS: number = 60) => {
  const frameInterval = useRef(1000 / targetFPS);
  const lastFrameTime = useRef(0);

  const shouldRender = useCallback(() => {
    const now = performance.now();
    const elapsed = now - lastFrameTime.current;

    if (elapsed > frameInterval.current) {
      lastFrameTime.current = now - (elapsed % frameInterval.current);
      return true;
    }
    return false;
  }, [targetFPS]);

  return { shouldRender };
};