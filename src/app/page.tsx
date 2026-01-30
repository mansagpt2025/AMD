import { Suspense } from 'react';
import LoadingScreen from '@/components/LoadingScreen';
import HomePage from '@/components/HomePage';
import { ViewportOptimizer } from '@/components/ViewportOptimizer';
import { ScrollOptimizer } from '@/components/performance/ScrollOptimizer';
import { SectionWrapper } from '@/components/performance/SectionWrapper';
import '@/styles/performance.css'; // استيراد ملف الأداء

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ViewportOptimizer>
            <ScrollOptimizer>
      <HomePage />
          </ScrollOptimizer>
      </ViewportOptimizer>
    </Suspense>
  );
}