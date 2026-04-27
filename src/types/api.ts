/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  userId: number;
  username: string;
  email: string;
  token?: string;
  properties?: Record<string, string>;
}

export interface Transaction {
  txnId: number;
  userId: number;
  categoryId: number;
  categoryName: string;
  amount: number;
  description?: string;
  txnDate: string;
  suggestedCategory?: string;
}

export interface TransactionCreate {
  userId: number;
  categoryId: number;
  categoryName: string;
  amount: number;
  description?: string;
  txnDate: string;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalSpending: number;
  averageTransaction: number;
  highestTransaction: number;
  lowestTransaction: number;
  categoryBreakdown: Record<string, number>;
}

export interface Prediction {
  predictionId: number;
  userId: number;
  forecastedAmount: number;
  forecastedMonth: string;
  confidenceScore: number;
}

export interface ReportSummary {
  userId: number;
  username: string;
  totalSpending: number;
  averageTransaction: number;
  transactionCount: number;
  monthlyBudget: number;
  remainingBudget: number;
  spendingPercentage: number;
}

export interface AuthResponse {
  token: string;
  username: string;
  userId: number;
  message: string;
  properties?: Record<string, string>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
