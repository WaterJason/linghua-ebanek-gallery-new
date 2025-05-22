"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResponsiveContainer } from '@/src/components/ui/responsive-container';
import TransactionList from '../components/mobile/TransactionList';
import TransactionTable from '../components/desktop/TransactionTable';
import { useTransactionData, Transaction, TransactionFilter, TransactionSort, TransactionPagination } from '../hooks/useTransactionData';
import { useToast } from '@/src/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";

/**
 * 交易记录管理页面
 */
export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [state, actions] = useTransactionData();
  const { transactions, total, isLoading, error, filter, sort, pagination } = state;

  // 对话框状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionType, setTransactionType] = useState<string>('expense');

  // 从URL参数中获取初始类型
  useEffect(() => {
    const type = searchParams.get('type');
    if (type && ['income', 'expense', 'transfer'].includes(type)) {
      setTransactionType(type);
    }
  }, [searchParams]);

  // 处理创建交易
  const handleCreateTransaction = () => {
    setIsCreateDialogOpen(true);
  };

  // 处理编辑交易
  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  // 处理删除交易
  const handleDeleteTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  // 确认删除交易
  const confirmDeleteTransaction = async () => {
    if (!selectedTransaction) return;

    const success = await actions.deleteTransaction(selectedTransaction.id);
    if (success) {
      toast({
        title: "删除成功",
        description: "交易记录已删除",
      });
    }

    setIsDeleteDialogOpen(false);
    setSelectedTransaction(null);
  };

  // 处理筛选
  const handleFilter = () => {
    setIsFilterDialogOpen(true);
  };

  // 处理搜索
  const handleSearch = (term: string) => {
    actions.setFilter({ ...filter, searchTerm: term });
  };

  // 处理排序
  const handleSort = (newSort: TransactionSort) => {
    actions.setSort(newSort);
  };

  // 处理分页
  const handlePagination = (newPagination: TransactionPagination) => {
    actions.setPagination(newPagination);
  };

  // 处理加载更多（移动端无限滚动）
  const handleLoadMore = () => {
    actions.loadMore();
  };

  // 处理行点击
  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  // 共享属性
  const sharedProps = {
    transactions,
    total,
    isLoading,
    error,
    onCreateTransaction: handleCreateTransaction,
    onEditTransaction: handleEditTransaction,
    onDeleteTransaction: handleDeleteTransaction,
    onFilter: handleFilter,
    onSearch: handleSearch,
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">财务交易记录</h1>

      <ResponsiveContainer
        mobile={TransactionList}
        desktop={TransactionTable}
        breakpoint="md"
        props={{
          ...sharedProps,
          // 移动端特有属性
          onLoadMore: handleLoadMore,
          // 桌面端特有属性
          sort,
          pagination,
          onSort: handleSort,
          onPagination: handlePagination,
          onRowClick: handleRowClick,
        }}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这条交易记录吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTransaction} className="bg-destructive text-destructive-foreground">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 创建/编辑/筛选对话框将在实际实现中添加 */}
      {/* 这里需要实现TransactionDialog和TransactionFilterDialog组件 */}
    </div>
  );
}