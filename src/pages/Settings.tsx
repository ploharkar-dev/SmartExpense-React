/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiService } from '../services/apiService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LogOut, User as UserIcon, Bell, Shield, Wallet, ChevronRight, Moon, Sun, Globe, Plus, Github, Linkedin, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Settings() {
  const { user, logout, updateUserProperty, notifyUpdate } = useAuth();
  const { showToast } = useToast();
  const [budget, setBudget] = useState(user?.properties?.monthlyBudget || '10000');
  const [isUpdating, setIsUpdating] = useState(false);

  const currency = user?.properties?.currency || 'INR';

  const handleUpdateBudget = async () => {
    setIsUpdating(true);
    try {
      await apiService.user.updateProperty('monthlyBudget', budget);
      updateUserProperty('monthlyBudget', budget);
      showToast('Budget updated', 'success');
    } catch (err) {
      showToast('Failed to update budget', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateProperty = async (key: string, value: string) => {
    try {
      await apiService.user.updateProperty(key, value);
      updateUserProperty(key, value);
      notifyUpdate();
      showToast('Preference saved', 'success');
    } catch (err) {
      showToast('Failed to save preference', 'error');
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be under 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        await apiService.user.updateProperty('image', base64String);
        updateUserProperty('image', base64String);
        notifyUpdate();
        showToast('Profile picture updated', 'success');
      } catch (err) {
        showToast('Update failed. Try smaller image.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdatePhoto = () => {
    document.getElementById('profile-upload')?.click();
  }

  const handleToggleCurrency = async () => {
    const next = currency === 'USD' ? 'INR' : 'USD';
    try {
      await apiService.user.updateProperty('currency', next);
      updateUserProperty('currency', next);
      notifyUpdate();
      showToast(`Currency set to ${next}`, 'info');
    } catch (err) {
      showToast('Failed to update currency', 'error');
    }
  }

  const settingsItems = [
    { 
      icon: Bell, 
      label: 'Notifications', 
      color: 'bg-indigo-50 text-indigo-600', 
      value: user?.properties?.notifications || 'Enabled',
      onClick: () => handleUpdateProperty('notifications', user?.properties?.notifications === 'Enabled' ? 'Disabled' : 'Enabled')
    },
    { 
      icon: Moon, 
      label: 'Dark Mode', 
      color: 'bg-slate-100 text-slate-800', 
      value: user?.properties?.darkMode || 'Auto',
      onClick: () => handleUpdateProperty('darkMode', user?.properties?.darkMode === 'Dark' ? 'Light' : 'Dark')
    },
    { 
      icon: Globe, 
      label: 'Currency', 
      color: 'bg-emerald-50 text-emerald-600', 
      value: `${currency} (${currency === 'INR' ? '₹' : '$'})`,
      onClick: handleToggleCurrency
    },
    { 
      icon: Shield, 
      label: 'Privacy & Security', 
      color: 'bg-rose-50 text-rose-600',
      onClick: () => showToast('Data is encrypted & secure', 'info')
    },
  ];

  return (
    <div className="safe-areas space-y-6">
      <input 
        type="file" 
        id="profile-upload" 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileUpload} 
      />
      <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>

      {/* Profile Header */}
      <Card className="p-4 flex items-center gap-4 relative">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 overflow-hidden border-2 border-white shadow-sm relative">
          <img 
            src={user?.properties?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}&gender=${user?.properties?.gender === 'female' ? 'female' : 'male'}`}
            alt="avatar" 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}&gender=${user?.properties?.gender === 'female' ? 'female' : 'male'}`;
            }}
          />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.username}</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-tight">{user?.email || 'User Account'}</p>
          <button 
            id="edit-photo-btn"
            onClick={handleUpdatePhoto}
            className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mt-1 hover:underline"
          >
            Edit Photo
          </button>
        </div>
        <Button size="icon" variant="secondary" className="ml-auto rounded-xl" onClick={handleUpdatePhoto}>
          <Plus className="w-5 h-5 text-slate-400" />
        </Button>
      </Card>

      {/* Budget Control */}
      <div className="space-y-4">
        <h3 className="section-title text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest px-1">Financial Limits</h3>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl dark:bg-brand-500/10 dark:text-brand-400">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Monthly Budget</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest dark:text-slate-400">Set your spending limit</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Input 
              type="number" 
              value={budget} 
              onChange={(e) => setBudget(e.target.value)}
              className="flex-1 font-bold"
              placeholder="10000"
            />
            <Button 
              onClick={handleUpdateBudget} 
              isLoading={isUpdating}
              className="px-6"
            >
              Save
            </Button>
          </div>
        </Card>
      </div>

      {/* Preferences */}
      <div className="space-y-3">
        <h3 className="section-title text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest px-1">Preferences</h3>
        <div className="space-y-2">
          {settingsItems.map((item, idx) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={(e) => {
                e.preventDefault();
                item.onClick();
              }}
              className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 active:scale-[0.98] transition-all dark:bg-slate-900/40 dark:border-slate-800/50 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={cn("p-2 rounded-xl", item.color, "dark:bg-slate-800/80 dark:text-slate-200")}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.value && <span className="text-xs font-bold text-slate-400 dark:text-slate-300">{item.value}</span>}
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-500" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="space-y-3">
        <h3 className="section-title text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest px-1">Security</h3>
        <Card className="p-4 bg-slate-50 dark:bg-slate-800/30 border-none shadow-none">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-4 h-4 text-brand-600" />
            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Data & Privacy</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Your financial data is encrypted and securely hosted on <span className="text-slate-900 dark:text-slate-200 font-bold">Railway's global infrastructure</span>. 
            We maintain strict data isolation and privacy protocols to ensure your records are only accessible to you.
          </p>
        </Card>
      </div>

      {/* Aesthetic Footer Section */}
      <div className="pt-12 pb-16">
        <div className="flex flex-col items-center">
          <Button
            variant="secondary"
            className="w-full h-14 rounded-2xl gap-2 font-bold mb-10 active:scale-[0.98] transition-transform text-rose-500 bg-rose-50 border-rose-100 hover:bg-rose-100 dark:bg-rose-500/5 dark:border-rose-500/10 dark:hover:bg-rose-500/10"
            onClick={logout}
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </Button>

          <div className="relative w-full flex flex-col items-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />

            <div className="flex gap-8 mb-8 pt-8">
              <a
                href="https://github.com/ploharkar-dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none border border-slate-100 dark:border-slate-800"
              >
                <Github className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
              </a>
              <a
                href="https://in.linkedin.com/in/ploharkar"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-200/50 dark:hover:shadow-none border border-slate-100 dark:border-slate-800"
              >
                <Linkedin className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-[#0077b5] transition-colors" />
              </a>
            </div>

            <div className="text-center space-y-2">
              <p className="text-[11px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em] mb-1">
                Handcrafted by
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-display font-black text-slate-900 dark:text-white tracking-tight">OMKAR</span>
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest pt-1">
                © 2026 SmartExpense • All Rights Reserved
              </p>

              <div className="pt-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    v1.0.4 Release
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
