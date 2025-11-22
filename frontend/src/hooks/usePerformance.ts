/**
 * usePerformance Hook
 * Monitors component render performance
 */

import { useEffect, useRef } from 'react';

export const usePerformance = (componentName: string, enabled = false) => {
  const renderCount = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    renderCount.current += 1;

    if (typeof window !== 'undefined' && window.performance) {
      console.log(
        `📊 [${componentName}] Render #${renderCount.current}`
      );
    }
  });

  return {
    renderCount: renderCount.current,
  };
};

