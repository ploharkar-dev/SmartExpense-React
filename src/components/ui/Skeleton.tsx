/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { cn } from '../../lib/utils';

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl", className)} />
);

export const DashboardSkeleton = () => (
  <div className="safe-areas space-y-6 pb-32">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="w-24 h-3" />
          <Skeleton className="w-32 h-5" />
        </div>
      </div>
      <Skeleton className="w-10 h-10 rounded-full" />
    </div>
    <Skeleton className="w-full h-48 rounded-[32px]" />
    <Skeleton className="w-full h-14 rounded-2xl" />
    <div className="space-y-3">
      <Skeleton className="w-32 h-4 mx-1" />
      <Skeleton className="w-full h-80 rounded-3xl" />
    </div>
  </div>
);
