/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/brand/Logo';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!acceptPrivacy) {
      showToast('Please accept the Privacy Policy', 'info');
      return;
    }

    setIsLoading(true);

    try {
      await apiService.auth.register(username, email, password, {
        gender,
        currency: 'INR',
        monthlyBudget: '10000',
        notifications: 'Enabled',
        darkMode: 'Light'
      });
      showToast('Registration successful!', 'success');
      navigate('/login');
    } catch (err: any) {
      const msg = err.message || 'Registration failed.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-6 pt-20 pb-12 dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-12"
      >
        <Logo size="lg" showText={false} className="mb-6" />
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Join SmartExpense</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Start managing your money today</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-5 flex-1">
        <Input
          label="Username"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <Input
          label="Email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="space-y-1.5 px-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Gender</label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setGender('male')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all active:scale-95",
                gender === 'male'
                  ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10"
                  : "border-slate-100 bg-white text-slate-400 dark:bg-slate-900 dark:border-slate-800"
              )}
            >
              Male
            </button>
            <button
              type="button"
              onClick={() => setGender('female')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all active:scale-95",
                gender === 'female'
                  ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10"
                  : "border-slate-100 bg-white text-slate-400 dark:bg-slate-900 dark:border-slate-800"
              )}
            >
              Female
            </button>
          </div>
        </div>

        <div className="flex items-start gap-3 px-1">
          <input 
            id="privacy-checkbox"
            type="checkbox" 
            className="mt-1 w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
            checked={acceptPrivacy}
            onChange={(e) => setAcceptPrivacy(e.target.checked)}
          />
          <label htmlFor="privacy-checkbox" className="text-xs text-slate-500 dark:text-slate-400 leading-normal cursor-pointer">
            I agree to the <span className="text-brand-600 font-bold">Privacy Policy</span> and acknowledge that my data will be securely stored on <span className="text-slate-900 dark:text-slate-200 font-bold">Railway Cloud Infrastructure</span>.
          </label>
        </div>

        {error && (
          <p className="text-sm text-rose-500 font-medium text-center">{error}</p>
        )}

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Create Account
        </Button>
      </form>

      <div className="mt-8 text-center text-sm">
        <span className="text-slate-500">Already have an account? </span>
        <Link to="/login" className="text-brand-600 font-semibold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
