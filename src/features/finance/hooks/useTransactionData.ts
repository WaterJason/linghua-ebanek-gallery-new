"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import {
  getFinancialTransactions,
  createFinancialTransaction,
  updateFinancialTransaction,
  deleteFinancialTransaction
} from "@/lib/actions/finance-actions";
import { PrismaFinancialTransaction } from "@/types/prisma-models";

export interface Transaction extends PrismaFinancialTransaction {}

export interface TransactionFilter {
  type?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  accountId?: string;
  categoryId?: string;
  searchTerm?: string;
}

export interface TransactionSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface TransactionPagination {
  page: number;
  pageSize: number;
}

export interface TransactionDataState {
  transactions: Transaction[];
  total: number;
  isLoading: boolean;
  error: string | null;
  filter: TransactionFilter;
  sort: TransactionSort;
  pagination: TransactionPagination;
}

export interface TransactionDataActions {
  refresh: () => Promise<void>;
  createTransaction: (data: any) => Promise<Transaction | null>;
  updateTransaction: (id: string, data: any) => Promise<Transaction | null>;
  deleteTransaction: (id: string) => Promise<boolean>;
  setFilter: (filter: TransactionFilter) => void;
  setSort: (sort: TransactionSort) => void;
  setPagination: (pagination: TransactionPagination) => void;
  loadMore: () => Promise<void>;
}

/**
 * 财务交易数据管理钩子
 *
 * 提供财务交易数据的获取、创建、更新和删除功能，
 * 以及筛选、排序和分页功能
 */
export function useTransactionData(useMockData = false): [TransactionDataState, TransactionDataActions] {
  const [state, setState] = useState<TransactionDataState>({
    transactions: [],
    total: 0,
    isLoading: true,
    error: null,
    filter: {},
    sort: { field: 'transactionDate', direction: 'desc' },
    pagination: { page: 1, pageSize: 20 },
  });

  // 加载交易数据
  const loadTransactions = useCallback(async (
    filter = state.filter,
    sort = state.sort,
    pagination = state.pagination,
    append = false
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data, total } = await getFinancialTransactions(
        filter.type,
        filter.startDate,
        filter.endDate,
        filter.accountId,
        filter.categoryId,
        pagination.pageSize,
        (pagination.page - 1) * pagination.pageSize,
        sort.field,
        sort.direction,
        filter.searchTerm,
        useMockData
      );

      setState(prev => ({
        ...prev,
        transactions: append ? [...prev.transactions, ...data] : data,
        total,
        isLoading: false,
        filter,
        sort,
        pagination,
      }));

      return { data, total };
    } catch (error) {
      console.error("Error loading transactions:", error);
      const errorMessage = error instanceof Error ? error.message : "加载交易数据失败";
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({
        variant: "destructive",
        title: "加载失败",
        description: errorMessage,
      });
      return { data: [], total: 0 };
    }
  }, [state.filter, state.sort, state.pagination, useMockData]);

  // 创建交易
  const createTransaction = useCallback(async (data: any): Promise<Transaction | null> => {
    try {
      const newTransaction = await createFinancialTransaction(data);
      setState(prev => ({
        ...prev,
        transactions: [newTransaction, ...prev.transactions],
        total: prev.total + 1,
      }));
      toast({
        title: "创建成功",
        description: `交易记录已创建`,
      });
      return newTransaction;
    } catch (error) {
      console.error("Error creating transaction:", error);
      const errorMessage = error instanceof Error ? error.message : "创建交易记录失败";
      toast({
        variant: "destructive",
        title: "创建失败",
        description: errorMessage,
      });
      return null;
    }
  }, []);

  // 更新交易
  const updateTransaction = useCallback(async (id: string, data: any): Promise<Transaction | null> => {
    try {
      const updatedTransaction = await updateFinancialTransaction(id, data);
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.map(transaction =>
          transaction.id === id ? updatedTransaction : transaction
        ),
      }));
      toast({
        title: "更新成功",
        description: `交易记录已更新`,
      });
      return updatedTransaction;
    } catch (error) {
      console.error("Error updating transaction:", error);
      const errorMessage = error instanceof Error ? error.message : "更新交易记录失败";
      toast({
        variant: "destructive",
        title: "更新失败",
        description: errorMessage,
      });
      return null;
    }
  }, []);

  // 删除交易
  const deleteTransaction = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteFinancialTransaction(id);
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.filter(transaction => transaction.id !== id),
        total: prev.total - 1,
      }));
      toast({
        title: "删除成功",
        description: "交易记录已删除",
      });
      return true;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      const errorMessage = error instanceof Error ? error.message : "删除交易记录失败";
      toast({
        variant: "destructive",
        title: "删除失败",
        description: errorMessage,
      });
      return false;
    }
  }, []);

  // 设置筛选条件
  const setFilter = useCallback((filter: TransactionFilter) => {
    const newPagination = { ...state.pagination, page: 1 }; // 重置到第一页
    loadTransactions(filter, state.sort, newPagination);
  }, [state.pagination, state.sort, loadTransactions]);

  // 设置排序
  const setSort = useCallback((sort: TransactionSort) => {
    loadTransactions(state.filter, sort, state.pagination);
  }, [state.filter, state.pagination, loadTransactions]);

  // 设置分页
  const setPagination = useCallback((pagination: TransactionPagination) => {
    loadTransactions(state.filter, state.sort, pagination);
  }, [state.filter, state.sort, loadTransactions]);

  // 加载更多（用于移动端无限滚动）
  const loadMore = useCallback(async () => {
    if (state.isLoading || state.transactions.length >= state.total) return;

    const nextPage = state.pagination.page + 1;
    const newPagination = { ...state.pagination, page: nextPage };

    await loadTransactions(state.filter, state.sort, newPagination, true);
  }, [state.isLoading, state.transactions.length, state.total, state.pagination, state.filter, state.sort, loadTransactions]);

  // 初始加载
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const actions: TransactionDataActions = {
    refresh: () => loadTransactions(),
    createTransaction,
    updateTransaction,
    deleteTransaction,
    setFilter,
    setSort,
    setPagination,
    loadMore,
  };

  return [state, actions];
}
