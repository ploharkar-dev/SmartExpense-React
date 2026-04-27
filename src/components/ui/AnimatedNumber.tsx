/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

export const AnimatedNumber = ({ value = 0, precision = 0, prefix = '' }: { value?: number, precision?: number, prefix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = isNaN(value) ? 0 : value;
    const startValue = displayValue;
    const duration = 1000; // 1 second
    const startTime = performance.now();

    const animateValue = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      // Simple easeOutQuad
      const easedProgress = progress * (2 - progress);
      const current = startValue + (target - startValue) * easedProgress;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animateValue);
      }
    };

    requestAnimationFrame(animateValue);
  }, [value]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      })}
    </span>
  );
};
