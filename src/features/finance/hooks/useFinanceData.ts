import { useState, useMemo, useCallback } from 'react';
import { useApi } from '../../../hooks/useApi';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  account: string;
  description: string;
  type: 'income' | 'expense' | 'transfer';
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: 'income' | 'expense' | 'transfer' | 'all';
  category?: string;
  account?: string;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface TransactionSort {
  field: keyof Transaction;
  direction: 'asc' | 'desc';
}

export interface TransactionPagination {
  page: number;
  limit: number;
  total: number;
}

/**
 * 财务交易数据Hook，处理数据获取、过滤、排序和分页
 */
export function useTransactionData(initialFilters?: TransactionFilters) {
  // 状态
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters || {});
  const [sort, setSort] = useState<TransactionSort>({ field: 'date', direction: 'desc' });
  const [pagination, setPagination] = useState<Omit<TransactionPagination, 'total'>>({
    page: 1,
    limit: 20,
  });
  
  // 构建API请求参数
  const params = useMemo(() => ({
    ...filters,
    sort: `${sort.field}:${sort.direction}`,
    page: pagination.page,
    limit: pagination.limit,
  }), [filters, sort, pagination]);
  
  // 获取数据
  const { data, error, isLoading, mutate } = useApi<{
    transactions: Transaction[];
    total: number;
  }>('finance/transactions', {
    fetchOptions: { params },
  });
  
  // 处理过滤器变更
  const updateFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // 重置分页
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);
  
  // 处理排序变更
  const updateSort = useCallback((field: keyof Transaction) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);
  
  // 处理分页变更
  const updatePagination = useCallback((newPagination: Partial<Omit<TransactionPagination, 'total'>>) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  }, []);
  
  // 计算摘要数据
  const summary = useMemo(() => {
    if (!data?.transactions) return { income: 0, expense: 0, balance: 0 };
    
    const income = data.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expense = data.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [data?.transactions]);
  
  return {
    transactions: data?.transactions || [],
    total: data?.total || 0,
    isLoading,
    error,
    filters,
    sort,
    pagination: {
      ...pagination,
      total: data?.total || 0,
    },
    summary,
    actions: {
      updateFilters,
      updateSort,
      updatePagination,
      refresh: mutate,
    },
  };
} 