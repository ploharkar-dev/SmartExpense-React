/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { cn } from '../../lib/utils';

export const Card = React.memo(({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={cn('bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all dark:bg-slate-900/40 dark:border-slate-800/50 dark:text-slate-100 backdrop-blur-sm', className)}
  >
    {children}
  </div>
));
