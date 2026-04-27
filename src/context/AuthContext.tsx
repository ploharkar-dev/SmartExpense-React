/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types/api';
import { apiService } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
  updateUserProperty: (key: string, value: string) => void;
  notifyUpdate: () => void;
  updateTrigger: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const savedToken = localStorage.getItem('jwtToken');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (data: AuthResponse) => {
    const userData: User = {
      userId: data.userId,
      username: data.username,
      email: '', // Not returned in login but we could store it if needed
      properties: data.properties,
    };
    localStorage.setItem('jwtToken', data.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUserProperty = (key: string, value: string) => {
    if (!user) return;
    try {
      const newProperties = { ...user.properties, [key]: value };
      const newUser = { ...user, properties: newProperties };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
      // Even if localStorage fails, we update the state for the current session
      const newProperties = { ...user.properties, [key]: value };
      const newUser = { ...user, properties: newProperties };
      setUser(newUser);
    }
  };

  const notifyUpdate = () => {
    setUpdateTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const isDark = user?.properties?.darkMode === 'Dark';
    console.log('Applying dark mode:', isDark, user?.properties?.darkMode);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.properties?.darkMode]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUserProperty, notifyUpdate, updateTrigger }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
