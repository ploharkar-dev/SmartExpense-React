/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiService } from '../services/apiService';
import { Prediction } from '../types/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sparkles, TrendingUp, AlertCircle, Brain, RefreshCcw, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart as ReAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { Skeleton } from '../components/ui/Skeleton';

export default function Predictions() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [nextMonth, setNextMonth] = useState<{ predictedAmount: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currency = user?.properties?.currency || 'USD';
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  const loadPredictions = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const [preds, next, txns] = await Promise.all([
        apiService.predictions.getAll(user.userId).catch(() => [] as Prediction[]),
        apiService.predictions.getNextMonth(user.userId).catch(() => null),
        apiService.transactions.getAll(user.userId).catch(() => [] as Transaction[]),
      ]);

      const sortedPreds = Array.isArray(preds)
        ? [...preds].sort((a, b) => (a.forecastedMonth || '').localeCompare(b.forecastedMonth || ''))
        : [];

      setPredictions(sortedPreds);
      setNextMonth(next);
      setTransactions(Array.isArray(txns) ? txns : []);
    } catch (err) {
      console.error('Failed to load predictions', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    if (user?.userId) {
      loadPredictions();
    }
  }, [user?.userId, loadPredictions]);

  const handleRunForecast = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      await apiService.predictions.run(user.userId);
      await loadPredictions();
      showToast('AI insights updated', 'success');
    } catch (err) {
      showToast('AI analysis failed', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const insights = useMemo(() => {
    const budgetStr = user?.properties?.monthlyBudget || '10000';
    const budget = parseFloat(budgetStr);

    // Default fallback if no data
    if (!transactions.length && !predictions.length) return [];

    const res = [];

    // Calculate current month's actual spending from transactions
    const now = new Date();
    const currentMonthTxns = transactions.filter(t => {
      const d = new Date(t.txnDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const currentActualSpend = currentMonthTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Insight 1: Real-time Budget Status
    if (currentActualSpend > budget) {
      res.push({
        title: 'Budget Exceeded',
        desc: `You have already spent ${currencySymbol}${(currentActualSpend - budget).toFixed(0)} more than your monthly plan. We recommend pausing non-essential purchases.`,
        icon: AlertCircle,
        color: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-100 dark:bg-rose-500/10'
      });
    } else if (currentActualSpend > budget * 0.8) {
      res.push({
        title: 'Approaching Limit',
        desc: `You have used ${((currentActualSpend / budget) * 100).toFixed(0)}% of your budget. Only ${currencySymbol}${(budget - currentActualSpend).toFixed(0)} remains for the month.`,
        icon: TrendingUp,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-100 dark:bg-amber-500/10'
      });
    }

    // Insight 2: Category Analysis
    const categoryTotals: Record<string, number> = {};
    transactions.forEach(t => {
      const name = t.categoryName || 'Other';
      categoryTotals[name] = (categoryTotals[name] || 0) + Number(t.amount || 0);
    });

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
      res.push({
        title: 'Top Expenditure',
        desc: `Your highest spending is in "${topCategory[0]}" (${currencySymbol}${topCategory[1].toFixed(0)}). Target this area for potential savings.`,
        icon: Brain,
        color: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-100 dark:bg-indigo-500/10'
      });
    }

    // Insight 3: Forecast Trend
    const latestPred = predictions[predictions.length - 1];
    if (latestPred) {
      if (latestPred.forecastedAmount > budget) {
        res.push({
          title: 'Future Warning',
          desc: `AI predicts you will likely spend ${currencySymbol}${latestPred.forecastedAmount.toFixed(0)} next month, which is over your budget.`,
          icon: AlertCircle,
          color: 'text-rose-500',
          bg: 'bg-rose-50 dark:bg-rose-500/5'
        });
      } else {
        res.push({
          title: 'Stable Outlook',
          desc: `AI projection for next month is ${currencySymbol}${latestPred.forecastedAmount.toFixed(0)}, maintaining a healthy financial trend.`,
          icon: CheckCircle,
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-100 dark:bg-emerald-500/10'
        });
      }
    }

    return res;
  }, [predictions, transactions, currencySymbol, user?.properties?.monthlyBudget]);

  if (isLoading || !user) {
    return (
      <div className="safe-areas space-y-6 pb-32">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="w-full h-48 rounded-[32px]" />
        <Skeleton className="w-32 h-4" />
        <Skeleton className="w-full h-64 rounded-3xl" />
        <div className="space-y-3">
          <Skeleton className="w-full h-24 rounded-2xl" />
          <Skeleton className="w-full h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  const latestPrediction = predictions[predictions.length - 1];

  return (
    <div className="safe-areas space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">AI Insights</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRunForecast} 
          isLoading={isRefreshing}
          className="text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-full dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
        >
          <RefreshCcw className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Forecast Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-indigo-600 to-brand-600 border-none text-white p-6 overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest opacity-80">Next Month Projection</p>
            </div>
            
            <h2 className="text-4xl font-display font-bold mb-2">
              {nextMonth ? (
                <AnimatedNumber value={nextMonth.predictedAmount} precision={2} prefix={currencySymbol} />
              ) : (
                "Analyzing..."
              )}
            </h2>
            
            <div className="flex items-center gap-2 text-brand-100 text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>Based on your activity history</span>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 p-4">
            <div className="bg-white/10 rounded-full px-3 py-1 text-xs font-bold backdrop-blur-md border border-white/20">
              Confidence {latestPrediction ? (latestPrediction.confidenceScore > 1 ? latestPrediction.confidenceScore : latestPrediction.confidenceScore * 100).toFixed(0) : 0}%
            </div>
          </div>
          
          <div className="absolute -right-10 -bottom-10 opacity-20 transform -rotate-12">
            <Sparkles className="w-40 h-40" />
          </div>
        </Card>
      </motion.div>

      {/* Forecast Chart */}
      <div className="space-y-4">
        <h3 className="section-title text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest px-1">Forecast Trend</h3>
        <Card className="h-64 pt-6 -mx-1">
          {predictions && predictions.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ReAreaChart data={predictions.map(p => ({
                month: p?.forecastedMonth || 'Unknown',
                amount: Number(p?.forecastedAmount || 0)
              }))}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#0ea5e9" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorAmt)" 
                  animationDuration={2000}
                />
              </ReAreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm font-medium">Not enough data to generate trend.</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-brand-600 font-bold"
                onClick={handleRunForecast}
              >
                Run AI Analysis
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Insight Section */}
      <div className="space-y-4">
        <h3 className="section-title text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest px-1">AI Recommendation</h3>
        <div className="space-y-3">
          {insights.length > 0 ? insights.map((insight, idx) => (
            <Card key={idx} className="bg-slate-50 border-slate-100 p-5 dark:bg-slate-800/50 dark:border-slate-700">
              <div className="flex gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", insight.bg)}>
                  <insight.icon className={cn("w-5 h-5", insight.color)} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{insight.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {insight.desc}
                  </p>
                </div>
              </div>
            </Card>
          )) : (
            <div className="text-center py-6 text-slate-400 text-xs italic">
              Add more data to receive personalized insights.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
