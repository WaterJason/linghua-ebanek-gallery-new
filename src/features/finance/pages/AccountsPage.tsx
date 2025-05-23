"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ResponsiveContainer } from '@/src/components/ui/responsive-container';
import AccountList from '../components/mobile/AccountList';
import AccountTable from '../components/desktop/AccountTable';
import { useAccountData } from '../hooks/useAccountData';
import { PrismaFinancialAccount } from '@/types/prisma-models';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * 账户管理页面
 */
export default function AccountsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [state, actions] = useAccountData();
  const { accounts, isLoading, error } = state;

  // 对话框状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<PrismaFinancialAccount | null>(null);

  // 搜索状态
  const [searchTerm, setSearchTerm] = useState('');
  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.description && account.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 处理创建账户
  const handleCreateAccount = () => {
    setIsCreateDialogOpen(true);
  };

  // 处理编辑账户
  const handleEditAccount = (account: PrismaFinancialAccount) => {
    setSelectedAccount(account);
    setIsEditDialogOpen(true);
  };

  // 处理删除账户
  const handleDeleteAccount = (account: PrismaFinancialAccount) => {
    setSelectedAccount(account);
    setIsDeleteDialogOpen(true);
  };

  // 确认删除账户
  const confirmDeleteAccount = async () => {
    if (!selectedAccount) return;

    const success = await actions.deleteAccount(selectedAccount.id);
    if (success) {
      toast({
        title: "删除成功",
        description: `账户 ${selectedAccount.name} 已删除`,
      });
    }

    setIsDeleteDialogOpen(false);
    setSelectedAccount(null);
  };

  // 处理搜索
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // 共享属性
  const sharedProps = {
    accounts: filteredAccounts,
    isLoading,
    error,
    onCreateAccount: handleCreateAccount,
    onEditAccount: handleEditAccount,
    onDeleteAccount: handleDeleteAccount,
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">资金账户管理</h1>

      <ResponsiveContainer
        mobile={AccountList}
        desktop={AccountTable}
        breakpoint="md"
        props={{
          ...sharedProps,
          // 移动端特有属性
          onSearch: handleSearch,
          // 桌面端特有属性
        }}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除账户 "{selectedAccount?.name}" 吗？此操作无法撤销，账户相关的所有交易记录将保留。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAccount} className="bg-destructive text-destructive-foreground">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 创建/编辑对话框将在实际实现中添加 */}
      {/* 这里需要实现AccountDialog组件 */}
    </div>
  );
}
