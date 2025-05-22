"use client";

import React from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { PlusIcon, SearchIcon, FilterIcon, MoreVerticalIcon, ArrowUpIcon, ArrowDownIcon, RefreshCwIcon } from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { Skeleton } from '@/src/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { formatCurrency } from '@/src/lib/utils';
import { Transaction } from '../../hooks/useTransactionData';
import { VirtualList } from '@/src/components/ui/virtual-list';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  error?: string | null;
  onCreateTransaction?: () => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transaction: Transaction) => void;
  onItemClick?: (transaction: Transaction) => void;
  onSearch?: (term: string) => void;
  onFilter?: () => void;
  onLoadMore?: () => void;
}

/**
 * 交易卡片组件
 */
const TransactionCard = ({
  transaction,
  onClick,
  onEdit,
  onDelete
}: {
  transaction: Transaction;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) => {
  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';
  const isTransfer = transaction.type === 'transfer';

  const getTypeColor = () => {
    if (isIncome) return 'text-green-600';
    if (isExpense) return 'text-red-600';
    return 'text-blue-600';
  };

  const getTypeIcon = () => {
    if (isIncome) return <ArrowUpIcon className="h-4 w-4 text-green-600" />;
    if (isExpense) return <ArrowDownIcon className="h-4 w-4 text-red-600" />;
    return <RefreshCwIcon className="h-4 w-4 text-blue-600" />;
  };

  const getTypeLabel = () => {
    if (isIncome) return '收入';
    if (isExpense) return '支出';
    return '转账';
  };

  return (
    <Card className="mb-3" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              {getTypeIcon()}
              <h3 className="font-medium text-lg ml-2">
                {transaction.category?.name || getTypeLabel()}
              </h3>
            </div>
            <p className="text-muted-foreground text-sm">
              {transaction.account?.name || '未知账户'}
              {transaction.counterparty ? ` · ${transaction.counterparty}` : ''}
            </p>
          </div>
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()}>
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>编辑</DropdownMenuItem>}
                {onDelete && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  >
                    删除
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="mt-3 flex justify-between items-end">
          <span className="text-sm text-muted-foreground">
            {transaction.transactionDate
              ? format(new Date(transaction.transactionDate), 'yyyy年MM月dd日', { locale: zhCN })
              : '未知日期'
            }
          </span>
          <p className={`text-xl font-bold ${getTypeColor()}`}>
            {isExpense ? '-' : isIncome ? '+' : ''}
            {formatCurrency(transaction.amount)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * 交易列表骨架屏
 */
const TransactionListSkeleton = () => {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="mb-3">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="w-2/3">
                <div className="flex items-center">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-6 w-32 ml-2" />
                </div>
                <Skeleton className="h-4 w-40 mt-1" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="mt-3 flex justify-between items-end">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

/**
 * 移动端交易列表组件
 */
export default function TransactionList({
  transactions,
  isLoading,
  error = null,
  onCreateTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onItemClick,
  onSearch,
  onFilter,
  onLoadMore,
}: TransactionListProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) onSearch(value);
  };

  const renderTransaction = (transaction: Transaction) => (
    <TransactionCard
      key={transaction.id}
      transaction={transaction}
      onClick={onItemClick ? () => onItemClick(transaction) : undefined}
      onEdit={onEditTransaction ? () => onEditTransaction(transaction) : undefined}
      onDelete={onDeleteTransaction ? () => onDeleteTransaction(transaction) : undefined}
    />
  );

  return (
    <div className="space-y-4">
      {(onSearch || onFilter || onCreateTransaction) && (
        <div className="flex items-center space-x-2">
          {onSearch && (
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索交易..."
                className="pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          )}
          {onFilter && (
            <Button size="icon" variant="outline" onClick={onFilter}>
              <FilterIcon className="h-4 w-4" />
            </Button>
          )}
          {onCreateTransaction && (
            <Button size="icon" onClick={onCreateTransaction}>
              <PlusIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {isLoading && transactions.length === 0 ? (
        <TransactionListSkeleton />
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            重试
          </Button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">暂无交易记录</p>
          {onCreateTransaction && (
            <Button variant="outline" className="mt-4" onClick={onCreateTransaction}>
              添加交易
            </Button>
          )}
        </div>
      ) : (
        <VirtualList
          items={transactions}
          height="calc(100vh - 180px)"
          itemHeight={120}
          onEndReached={onLoadMore}
          renderItem={renderTransaction}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}