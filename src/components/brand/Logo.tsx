/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const Logo = React.memo(({ className, size = 'md', showText = true }: LogoProps) => {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
    xl: 'w-40 h-40'
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
    xl: 'text-6xl'
  };

  return (
    <div className={cn("flex flex-col items-center select-none", className, showText && "gap-4")}>
      <motion.div 
        className={cn("relative flex items-center justify-center", sizes[size])}
        whileHover={{ scale: 1.1, rotate: 2 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          className="absolute inset-0 bg-orange-500 rounded-full blur-2xl opacity-10"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="relative w-full h-full bg-white/40 backdrop-blur-xl rounded-[1.5rem] overflow-hidden border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.05)] flex items-center justify-center group dark:bg-slate-900/60 dark:border-white/10 dark:shadow-none">
          <svg 
            viewBox="0 0 100 100" 
            className="w-4/5 h-4/5 relative z-10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="future-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>

            <motion.path
              d="M10 70 L50 30 L90 30"
              stroke="url(#future-grad)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: "circOut" }}
            />
            
            <motion.path
              d="M10 90 L50 50 L90 50"
              stroke="#0f172a"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: "circOut", delay: 0.2 }}
              className="dark:stroke-white"
            />
          </svg>
        </div>
      </motion.div>

      {showText && (
        <div className="flex flex-col items-center">
          <span className={cn("font-display font-black tracking-tight dark:text-white uppercase", textSizes[size])}>
            <span className="text-amber-500">Smart</span><span className="text-orange-600">Expense</span>
          </span>
          <div className="h-px w-12 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-2 opacity-50" />
        </div>
      )}
    </div>
  );
});

Logo.displayName = 'Logo';
