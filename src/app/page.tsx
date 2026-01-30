import { Suspense } from 'react';
import LoadingScreen from '@/components/LoadingScreen';
import HomePage from '@/components/HomePage';
import { ViewportOptimizer } from '@/components/ViewportOptimizer';

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ViewportOptimizer>
      <HomePage />
      </ViewportOptimizer>
    </Suspense>
  );
}