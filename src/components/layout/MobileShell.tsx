/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, History, Sparkles, PieChart, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export const MobileShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/' },
    { icon: History, label: 'Activity', path: '/transactions' },
    { icon: Sparkles, label: 'Forecast', path: '/predictions' },
    { icon: PieChart, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const hideNav = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="mobile-container">
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {!hideNav && (
        <div className="fixed bottom-6 left-0 right-0 px-6 z-50 flex justify-center pointer-events-none">
          <nav className="glass-nav w-full max-w-[400px] h-[68px] px-4 flex items-center justify-between pointer-events-auto bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[28px] shadow-[0_12px_40px_rgba(0,0,0,0.1)]">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'relative flex flex-col items-center justify-center p-2 transition-all duration-300',
                      isActive ? 'text-brand-600 dark:text-brand-400 scale-110' : 'text-slate-400 hover:text-slate-600'
                    )
                  }
                >
                  <Icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                  <span className={cn(
                    "text-[9px] font-bold mt-1 uppercase tracking-wider transition-all",
                    isActive ? "opacity-100" : "opacity-0 h-0"
                  )}>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute -bottom-1 w-1 h-1 rounded-full bg-brand-600 dark:bg-brand-400"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
};
