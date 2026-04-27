/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLocation } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Transaction } from '../types/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Search, Calendar, Filter, X, Trash2, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

const CATEGORIES = [
  { id: 1, name: 'Food', color: 'bg-orange-500' },
  { id: 2, name: 'Transport', color: 'bg-sky-500' },
  { id: 3, name: 'Entertainment', color: 'bg-purple-500' },
  { id: 4, name: 'Utilities', color: 'bg-amber-500' },
  { id: 5, name: 'Shopping', color: 'bg-pink-500' },
  { id: 6, name: 'Healthcare', color: 'bg-rose-500' },
  { id: 7, name: 'Education', color: 'bg-indigo-500' },
];

export default function Transactions() {
  const { user, notifyUpdate, updateTrigger } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const currency = user?.properties?.currency || 'INR';
  const currencySymbol = currency === 'INR' ? '₹' : '$';
  
  // Form State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [txnDate, setTxnDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (user?.userId && location.state?.openAdd) {
      setIsAddModalOpen(true);
    }
  }, [user?.userId, location.state]);

  const loadTransactions = React.useCallback(async () => {
    if (!user?.userId) return;
    try {
      setIsLoading(true);
      const data = await apiService.transactions.getAll(user.userId);
      setTransactions(data.sort((a, b) => new Date(b.txnDate).getTime() - new Date(a.txnDate).getTime()));
    } catch (err) {
      console.error('Failed to load transactions', err);
      showToast('Failed to load activity', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId, showToast]);

  useEffect(() => {
    if (user?.userId) {
      loadTransactions();
    }
  }, [user?.userId, updateTrigger, loadTransactions]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const cat = CATEGORIES.find(c => c.id === categoryId);
      const parsedAmount = parseFloat(amount);
      
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        showToast('Please enter a valid amount', 'error');
        setIsSubmitting(false);
        return;
      }

      const newTxn = await apiService.transactions.add({
        userId: user.userId,
        amount: parsedAmount,
        categoryId,
        categoryName: cat?.name || 'Other',
        description,
        txnDate: new Date(txnDate).toISOString(),
      });

      // Update local state instead of re-fetching everything
      setTransactions(prev => [newTxn, ...prev].sort((a, b) =>
        new Date(b.txnDate).getTime() - new Date(a.txnDate).getTime()
      ));

      setIsAddModalOpen(false);
      resetForm();
      notifyUpdate();
      showToast('Expense added successfully', 'success');
    } catch (err: any) {
      console.error('Add transaction error:', err);
      showToast('Failed to add expense', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? t.categoryId === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [transactions, searchQuery, selectedCategory]);

  const stats = React.useMemo(() => {
    const total = filteredTransactions.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const avg = filteredTransactions.length > 0 ? total / filteredTransactions.length : 0;
    return { total, avg };
  }, [filteredTransactions]);

  const handleDelete = async (id: number) => {
    if (deletingIds.has(id)) return;

    setDeletingIds(prev => new Set(prev).add(id));

    // Optimistic update
    const previousTransactions = [...transactions];
    setTransactions(prev => prev.filter(t => t.txnId !== id));

    try {
      await apiService.transactions.delete(id);
      notifyUpdate();
      showToast('Expense deleted', 'info');
    } catch (err) {
      setTransactions(previousTransactions);
      showToast('Failed to delete expense', 'error');
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategoryId(1);
    setTxnDate(format(new Date(), 'yyyy-MM-dd'));
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="safe-areas space-y-6 pb-32">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">History</h1>
        <Button size="icon" variant="secondary" onClick={() => setIsAddModalOpen(true)} className="rounded-full w-12 h-12 shadow-sm">
          <Plus className="w-6 h-6 text-brand-600" />
        </Button>
      </div>

      {/* Search Bar */}
      <div className="px-1">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-brand-500 focus:ring-0 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide no-scrollbar [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-track]:bg-transparent">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border-2",
            selectedCategory === null
              ? "bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20"
              : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400"
          )}
        >
          All Activity
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
            className={cn(
              "px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border-2",
              selectedCategory === cat.id
                ? "bg-slate-900 dark:bg-brand-500 border-slate-900 dark:border-brand-500 text-white shadow-lg shadow-slate-900/20"
                : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Stats Mini cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-slate-900 border-none text-white p-4 overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Items</p>
            <p className="text-xl font-display font-bold">{filteredTransactions.length}</p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 p-2">
            <Tag className="w-12 h-12" />
          </div>
        </Card>
        <Card className="bg-brand-500 border-none text-white p-4 overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-brand-100 text-[10px] uppercase font-bold tracking-widest mb-1">Total</p>
            <p className="text-xl font-display font-bold">
              {currencySymbol}{stats.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 p-2">
            <Calendar className="w-12 h-12" />
          </div>
        </Card>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTransactions.length > 0 ? filteredTransactions.map((txn, idx) => (
            <motion.div
              key={txn.txnId}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-3 flex items-center gap-3 active:scale-[0.98] transition-transform">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 flex-shrink-0 text-white shadow-inner",
                  CATEGORIES.find(c => c.name.toLowerCase() === (txn.categoryName || '').toLowerCase())?.color || 'bg-slate-400'
                )}>
                  <span className="font-display font-black text-lg">{(txn.categoryName || 'O').charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{txn.description || txn.categoryName || 'No description'}</h4>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">
                    {txn.categoryName || 'Other'} • {(() => {
                      try {
                        const d = new Date(txn.txnDate);
                        return isNaN(d.getTime()) ? 'Invalid Date' : format(d, 'MMM d, yyyy');
                      } catch {
                        return 'Invalid Date';
                      }
                    })()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{currencySymbol}{txn.amount.toFixed(2)}</p>
                  <button
                    onClick={() => handleDelete(txn.txnId)}
                    className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            </motion.div>
          )) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">No results found</p>
              <Button variant="ghost" className="mt-2 text-brand-500 font-bold" onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}>
                Clear filters
              </Button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[40px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">New Expense</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500 dark:text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-6 pb-4">
                <Input
                  label="Amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-2xl font-bold text-brand-600"
                  required
                />
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryId(cat.id)}
                        className={cn(
                          'p-2 text-xs rounded-xl border-2 transition-all font-bold aspect-square flex items-center justify-center text-center leading-tight',
                          categoryId === cat.id 
                            ? 'bg-brand-50 border-brand-500 text-brand-600 dark:bg-brand-500/10' 
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Description"
                  placeholder="What was this for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <Input
                  label="Date"
                  type="date"
                  value={txnDate}
                  onChange={(e) => setTxnDate(e.target.value)}
                  required
                />

                <Button type="submit" className="w-full h-14 text-lg" isLoading={isSubmitting}>
                  Submit Expense
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
