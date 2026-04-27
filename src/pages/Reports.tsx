/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiService } from '../services/apiService';
import { ReportSummary } from '../types/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileDown, FileText, CheckCircle, AlertCircle, TrendingUp, BarChart as LucideBarChart } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { startOfMonth, subMonths, isWithinInterval, endOfMonth, format } from 'date-fns';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { Skeleton } from '../components/ui/Skeleton';

export default function Reports() {
  const { user, updateUserProperty, notifyUpdate } = useAuth();
  const { showToast } = useToast();
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currency = user?.properties?.currency || 'USD';
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  const loadReport = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const budget = user.properties?.monthlyBudget ? parseFloat(user.properties.monthlyBudget) : 10000;

      const [summary, txnsData] = await Promise.all([
        apiService.reports.getSummary(user.userId, budget).catch(() => null),
        apiService.transactions.getAll(user.userId).catch(() => [])
      ]);

      const txns = Array.isArray(txnsData) ? txnsData : [];
      setReport(summary);

      // Process Comparison Data (Last 3 Months)
      const now = new Date();
      const months = [
        subMonths(now, 2),
        subMonths(now, 1),
        now
      ];

      const chartData = months.map(monthDate => {
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);
        const total = txns
          .filter(t => {
            if (!t || !t.txnDate) return false;
            const d = new Date(t.txnDate);
            if (isNaN(d.getTime())) return false;
            return isWithinInterval(d, { start, end });
          })
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        return {
          name: format(monthDate, 'MMM'),
          amount: total,
          isCurrent: monthDate.getMonth() === now.getMonth()
        };
      });

      setComparisonData(chartData);

    } catch (err) {
      console.error('Failed to load report', err);
      showToast('Failed to load reports', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId, user?.properties?.monthlyBudget, showToast]);

  useEffect(() => {
    if (user?.userId) {
      loadReport();
    }
  }, [user?.userId, loadReport]);

  const downloadReport = async (formatType: 'excel' | 'pdf') => {
    if (!user) return;
    try {
      const endpoint = formatType === 'excel'
        ? apiService.reports.exportExcel(user.userId)
        : apiService.reports.exportPdf(user.userId);
      const filename = `report_${new Date().getTime()}.${formatType === 'excel' ? 'xlsx' : 'pdf'}`;
      await apiService.reports.downloadFile(endpoint, filename);
      showToast('Export successful', 'success');
    } catch (err) {
      showToast('Export failed', 'error');
    }
  };

  const [isResetting, setIsResetting] = useState(false);

  const resetMonth = async () => {
    if (!user || isResetting) return;
    
    const currentBudget = user.properties?.monthlyBudget || '10000';
    const nextBudgetStr = prompt('Enter budget for the next month:', currentBudget);
    if (nextBudgetStr === null) return;
    
    if (isNaN(parseFloat(nextBudgetStr))) {
      showToast('Invalid budget amount', 'error');
      return;
    }

    if (!window.confirm(`This will download a backup and DELETE all current transactions. Proceed?`)) return;

    setIsResetting(true);
    try {
      const endpoint = apiService.reports.exportPdf(user.userId);
      await Promise.all([
        apiService.reports.downloadFile(endpoint, `backup_${Date.now()}.pdf`).catch(e => console.warn('Backup failed', e)),
        apiService.transactions.deleteAllForUser(user.userId),
        apiService.predictions.deleteAllForUser(user.userId)
      ]);

      await Promise.all([
        apiService.user.updateProperty('monthlyBudget', nextBudgetStr),
        apiService.predictions.run(user.userId).catch(() => {})
      ]);

      updateUserProperty('monthlyBudget', nextBudgetStr);
      notifyUpdate();
      await loadReport();
      showToast('Month reset successful', 'success');
    } catch (err) {
      console.error('Reset failed', err);
      showToast('Partial reset occurred', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const isOverBudget = useMemo(() => !!(report && report.spendingPercentage > 100), [report]);

  if (isLoading || !user) {
    return (
      <div className="safe-areas space-y-6 pb-32">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="w-full h-64 rounded-3xl" />
        <Skeleton className="w-full h-48 rounded-3xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="w-full h-24 rounded-3xl" />
          <Skeleton className="w-full h-24 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="safe-areas space-y-6 pb-32">
      <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Reports</h1>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="section-title text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Monthly Growth</h3>
          <LucideBarChart className="w-4 h-4 text-slate-400" />
        </div>
        <Card className="h-64 pt-6 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'Spent']}
              />
              <Bar
                dataKey="amount"
                radius={[8, 8, 0, 0]}
                barSize={32}
                animationDuration={1500}
              >
                {comparisonData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isCurrent ? '#0ea5e9' : '#e2e8f0'}
                    className="dark:fill-slate-800"
                    fillOpacity={entry.isCurrent ? 1 : 0.5}
                  />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
              isOverBudget ? "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
            )}>
              {isOverBudget ? <AlertCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Budget Status</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none dark:text-slate-400">Monthly Plan</p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn(
              "text-2xl font-display font-bold",
              isOverBudget ? "text-rose-500" : "text-emerald-500"
            )}>
              <AnimatedNumber value={report?.spendingPercentage ?? 0} precision={1} />%
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-700 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(report?.spendingPercentage || 0, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                isOverBudget ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]" : "bg-brand-500 shadow-[0_0_12px_rgba(14,165,233,0.4)]"
              )}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-8 py-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Spent</p>
              <p className="text-lg font-display font-bold text-slate-800 dark:text-slate-100">
                <AnimatedNumber value={report?.totalSpending ?? 0} precision={0} prefix={currencySymbol} />
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remaining</p>
              <p className={cn(
                "text-lg font-display font-bold",
                isOverBudget ? "text-rose-500" : "text-slate-800 dark:text-slate-100"
              )}>
                <AnimatedNumber value={report?.remainingBudget ?? 0} precision={0} prefix={currencySymbol} />
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-amber-50 border-amber-100 p-4 dark:bg-amber-500/10 dark:border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3 h-3 text-amber-600" />
            <p className="text-amber-800 text-[10px] font-bold uppercase tracking-widest opacity-60 dark:text-amber-200">Avg Txn</p>
          </div>
          <p className="text-xl font-display font-bold text-amber-900 dark:text-amber-100">
            <AnimatedNumber value={report?.averageTransaction ?? 0} precision={0} prefix={currencySymbol} />
          </p>
        </Card>
        <Card className="bg-indigo-50 border-indigo-100 p-4 dark:bg-indigo-500/10 dark:border-indigo-500/20">
          <div className="flex items-center gap-2 mb-2">
            <LucideBarChart className="w-3 h-3 text-indigo-600" />
            <p className="text-indigo-800 text-[10px] font-bold uppercase tracking-widest opacity-60 dark:text-indigo-200">Total Count</p>
          </div>
          <p className="text-xl font-display font-bold text-indigo-900 dark:text-indigo-100">
            <AnimatedNumber value={report?.transactionCount ?? 0} precision={0} />
          </p>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="section-title text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest px-1">Export Data</h3>
        <div className="grid grid-cols-1 gap-3">
          <Button 
            onClick={() => downloadReport('excel')}
            variant="secondary" 
            className="w-full h-16 rounded-2xl justify-between px-6 bg-white border border-slate-100 group hover:border-brand-500 transition-colors dark:bg-slate-800 dark:border-slate-700"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors dark:bg-emerald-500/10 dark:text-emerald-400">
                <FileDown className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Microsoft Excel</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight dark:text-slate-400">Full transaction history</p>
              </div>
            </div>
            <p className="text-xs font-bold text-brand-600 uppercase tracking-widest">.xlsx</p>
          </Button>

          <Button 
            onClick={() => downloadReport('pdf')}
            variant="secondary" 
            className="w-full h-16 rounded-2xl justify-between px-6 bg-white border border-slate-100 group hover:border-brand-500 transition-colors dark:bg-slate-800 dark:border-slate-700"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-colors dark:bg-rose-500/10 dark:text-rose-400">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">PDF Document</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight dark:text-slate-400">Monthly overview</p>
              </div>
            </div>
            <p className="text-xs font-bold text-brand-600 uppercase tracking-widest">.pdf</p>
          </Button>

          <Button 
            onClick={resetMonth}
            variant="ghost"
            isLoading={isResetting}
            className="w-full h-14 rounded-2xl text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors mt-4"
          >
            Reset Month Data
          </Button>
        </div>
      </div>
    </div>
  );
}
