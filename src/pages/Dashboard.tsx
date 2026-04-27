/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { Transaction, TransactionSummary } from '../types/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowUpRight, ArrowDownRight, MoreHorizontal, User as UserIcon } from 'lucide-react';
import { Logo } from '../components/brand/Logo';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';

const COLORS = ['#f59e0b', '#0ea5e9', '#a855f7', '#facc15', '#ec4899', '#f43f5e', '#6366f1'];

const CATEGORY_MAP: Record<number, string> = {
  1: 'Food',
  2: 'Transport',
  3: 'Entertainment',
  4: 'Utilities',
  5: 'Shopping',
  6: 'Healthcare',
  7: 'Education'
};

export default function Dashboard() {
  const { user, updateTrigger } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currency = user?.properties?.currency || 'USD';
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update every minute instead of every second to reduce re-renders
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadData = React.useCallback(async () => {
    if (!user?.userId) return;
    try {
      // Reverting to local calculation for 100% reliability as we fetch transactions anyway
      const data = await apiService.transactions.getAll(user.userId);
      const txnsRes = Array.isArray(data) ? data : [];

      setRecentTxns(txnsRes.slice(0, 5));

      const totalSpending = txnsRes.reduce((acc, curr) => acc + Number(curr?.amount || 0), 0);
      const categoryBreakdown: Record<string, number> = {};

      txnsRes.forEach(t => {
        if (!t) return;
        const amt = Number(t.amount || 0);
        // Map category ID to name if name is missing from API
        const rawName = t.categoryName || CATEGORY_MAP[t.categoryId] || 'Other';
        const name = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
        categoryBreakdown[name] = (categoryBreakdown[name] || 0) + amt;
      });

      setSummary({
        totalTransactions: txnsRes.length,
        totalSpending,
        categoryBreakdown,
        averageTransaction: totalSpending / (txnsRes.length || 1),
        highestTransaction: txnsRes.length > 0 ? Math.max(...txnsRes.map(t => Number(t.amount || 0))) : 0,
        lowestTransaction: txnsRes.length > 0 ? Math.min(...txnsRes.map(t => Number(t.amount || 0))) : 0,
      });
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId]);

  const monthlyBudget = React.useMemo(() => parseFloat(user?.properties?.monthlyBudget || '10000'), [user?.properties?.monthlyBudget]);
  const spendingPercentage = React.useMemo(() => (summary?.totalSpending || 0) / monthlyBudget * 100, [summary?.totalSpending, monthlyBudget]);
  const isOverBudget = React.useMemo(() => spendingPercentage > 100, [spendingPercentage]);

  useEffect(() => {
    if (user?.userId) {
      loadData();
    }
  }, [user?.userId, updateTrigger, loadData]);

  const chartData = React.useMemo(() => {
    if (!summary || !summary.categoryBreakdown) return [];
    return Object.entries(summary.categoryBreakdown).map(([name, value]) => ({
      name,
      value,
    }));
  }, [summary]);

  if (isLoading || !user) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="safe-areas space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="md" showText={false} className="mb-0" />
          <div className="flex flex-col">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5 leading-none">
              {format(currentTime, 'EEEE, MMM d')}
            </p>
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              Hello, {user?.username}
            </h1>
          </div>
        </div>
        <button 
          type="button"
          aria-label="Settings"
          className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden active:scale-90 transition-all cursor-pointer flex items-center justify-center p-0" 
          onClick={() => navigate('/settings')}
        >
          {user?.properties?.image ? (
            <img 
              src={user.properties.image} 
              alt="avatar" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement?.classList.add('bg-brand-50');
              }}
            />
          ) : (
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}&gender=${user?.properties?.gender === 'female' ? 'female' : 'male'}`}
              alt="avatar"
              className="w-full h-full object-cover bg-brand-50"
            />
          )}
        </button>
      </div>

      {/* Main Balance Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="bg-brand-500 border-none text-white overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-brand-100 text-sm font-medium mb-1 opacity-80 uppercase tracking-wider">Total Spending</p>
            <h2 className="text-4xl font-display font-bold mb-6">
              <AnimatedNumber value={summary?.totalSpending ?? 0} precision={2} prefix={currencySymbol} />
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-brand-100 text-xs font-medium mb-1">
                  <ArrowDownRight className={cn("w-3 h-3", isOverBudget ? "text-rose-300" : "text-emerald-300")} />
                  Budget Status
                </div>
                <div className="text-sm font-semibold">{isOverBudget ? 'Over Budget' : 'On Track'}</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-brand-100 text-xs font-medium mb-1">
                  <ArrowUpRight className="w-3 h-3 text-indigo-300" />
                  Txn Count
                </div>
                <div className="text-sm font-semibold">
                  <AnimatedNumber value={summary?.totalTransactions ?? 0} /> txns
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-indigo-500/30 rounded-full blur-2xl" />
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button 
          className="flex-1 rounded-2xl h-14 font-semibold" 
          variant="primary"
          onClick={() => navigate('/transactions', { state: { openAdd: true } })}
        >
          <Plus className="w-5 h-5 mr-1" /> Add Expense
        </Button>
      </div>

      {/* Charts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="section-title text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest px-1">Top Categories</h3>
        </div>
        <Card className="h-80 flex flex-col items-center justify-center py-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-400 text-sm italic">No category data yet</div>
          )}
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="section-title text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Recent Activity</h3>
          <button 
            type="button"
            className="text-brand-600 dark:text-brand-400 font-bold text-xs hover:underline py-1 px-2 -mr-2 cursor-pointer active:opacity-50 transition-all"
            onClick={() => {
              console.log('Navigating to transactions...');
              navigate('/transactions');
            }}
          >
            See All
          </button>
        </div>
        
        <div className="space-y-3">
          {recentTxns.length > 0 ? recentTxns.map((txn, idx) => (
            <motion.div
              key={txn.txnId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-700 flex-shrink-0">
                  <HistoryIcon category={txn.categoryName} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{txn.description || txn.categoryName}</h4>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">
                    {txn.categoryName} • {format(new Date(txn.txnDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{currencySymbol}{txn.amount.toFixed(2)}</p>
                </div>
              </Card>
            </motion.div>
          )) : (
            <div className="text-center py-8 text-slate-400 text-sm">No transactions found</div>
          )}
        </div>
      </div>
    </div>
  );
}

const HistoryIcon = ({ category }: { category?: string }) => {
  // Map categories to simple letters or icons if needed
  const normalized = (category || 'other').toLowerCase();
  
  if (normalized === 'education') return <span className="font-display font-bold text-indigo-500">E</span>;
  if (normalized === 'food') return <span className="font-display font-bold text-orange-500">F</span>;
  if (normalized === 'transport') return <span className="font-display font-bold text-sky-500">T</span>;
  if (normalized === 'healthcare') return <span className="font-display font-bold text-rose-500">H</span>;
  
  const first = (category || 'O').charAt(0).toUpperCase();
  return <span className="font-display font-bold text-brand-500">{first}</span>;
}
