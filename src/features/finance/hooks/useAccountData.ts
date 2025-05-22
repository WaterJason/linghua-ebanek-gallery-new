"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/src/components/ui/use-toast";
import {
  getFinancialAccounts,
  createFinancialAccount,
  updateFinancialAccount,
  deleteFinancialAccount
} from "@/lib/actions/finance-actions";
import { PrismaFinancialAccount } from "@/types/prisma-models";

export interface AccountDataState {
  accounts: PrismaFinancialAccount[];
  isLoading: boolean;
  error: string | null;
}

export interface AccountDataActions {
  refresh: () => Promise<void>;
  createAccount: (data: any) => Promise<PrismaFinancialAccount | null>;
  updateAccount: (id: string, data: any) => Promise<PrismaFinancialAccount | null>;
  deleteAccount: (id: string) => Promise<boolean>;
}

/**
 * 资金账户数据管理钩子
 *
 * 提供资金账户数据的获取、创建、更新和删除功能
 */
export function useAccountData(useMockData = false): [AccountDataState, AccountDataActions] {
  const [state, setState] = useState<AccountDataState>({
    accounts: [],
    isLoading: true,
    error: null,
  });

  // 加载账户数据
  const loadAccounts = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const accounts = await getFinancialAccounts(useMockData);
      setState(prev => ({ ...prev, accounts, isLoading: false }));
      return accounts;
    } catch (error) {
      console.error("Error loading accounts:", error);
      const errorMessage = error instanceof Error ? error.message : "加载账户数据失败";
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({
        variant: "destructive",
        title: "加载失败",
        description: errorMessage,
      });
      return [];
    }
  }, [useMockData]);

  // 创建账户
  const createAccount = useCallback(async (data: any): Promise<PrismaFinancialAccount | null> => {
    try {
      const newAccount = await createFinancialAccount(data);
      setState(prev => ({
        ...prev,
        accounts: [...prev.accounts, newAccount],
      }));
      toast({
        title: "创建成功",
        description: `账户 ${newAccount.name} 已创建`,
      });
      return newAccount;
    } catch (error) {
      console.error("Error creating account:", error);
      const errorMessage = error instanceof Error ? error.message : "创建账户失败";
      toast({
        variant: "destructive",
        title: "创建失败",
        description: errorMessage,
      });
      return null;
    }
  }, []);

  // 更新账户
  const updateAccount = useCallback(async (id: string, data: any): Promise<PrismaFinancialAccount | null> => {
    try {
      const updatedAccount = await updateFinancialAccount(id, data);
      setState(prev => ({
        ...prev,
        accounts: prev.accounts.map(account =>
          account.id === id ? updatedAccount : account
        ),
      }));
      toast({
        title: "更新成功",
        description: `账户 ${updatedAccount.name} 已更新`,
      });
      return updatedAccount;
    } catch (error) {
      console.error("Error updating account:", error);
      const errorMessage = error instanceof Error ? error.message : "更新账户失败";
      toast({
        variant: "destructive",
        title: "更新失败",
        description: errorMessage,
      });
      return null;
    }
  }, []);

  // 删除账户
  const deleteAccount = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteFinancialAccount(id);
      setState(prev => ({
        ...prev,
        accounts: prev.accounts.filter(account => account.id !== id),
      }));
      toast({
        title: "删除成功",
        description: "账户已删除",
      });
      return true;
    } catch (error) {
      console.error("Error deleting account:", error);
      const errorMessage = error instanceof Error ? error.message : "删除账户失败";
      toast({
        variant: "destructive",
        title: "删除失败",
        description: errorMessage,
      });
      return false;
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const actions: AccountDataActions = {
    refresh: loadAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  };

  return [state, actions];
}
