"use client";

import React from 'react';
import { PlusIcon, SearchIcon, FilterIcon, MoreVerticalIcon } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/src/components/ui/card';
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
import { PrismaFinancialAccount } from '@/types/prisma-models';

interface AccountListProps {
  accounts: PrismaFinancialAccount[];
  isLoading: boolean;
  error: string | null;
  onCreateAccount: () => void;
  onEditAccount: (account: PrismaFinancialAccount) => void;
  onDeleteAccount: (account: PrismaFinancialAccount) => void;
  onSearch: (term: string) => void;
}

/**
 * 账户卡片组件
 */
const AccountCard = ({
  account,
  onEdit,
  onDelete
}: {
  account: PrismaFinancialAccount;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-lg">{account.name}</h3>
            <p className="text-muted-foreground text-sm">{account.accountNumber || account.description || account.type}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>编辑</DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={onDelete}
              >
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">当前余额</span>
            <Badge variant={account.currentBalance >= 0 ? "default" : "destructive"}>
              {account.type}
            </Badge>
          </div>
          <p className="text-2xl font-bold mt-1">
            {formatCurrency(account.currentBalance)}
          </p>
        </div>
      </CardContent>
      <CardFooter className="px-4 py-3 bg-muted/30 flex justify-between">
        <span className="text-xs text-muted-foreground">
          {account.isActive ? "活跃" : "非活跃"}
        </span>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          查看详情
        </Button>
      </CardFooter>
    </Card>
  );
};

/**
 * 账户列表骨架屏
 */
const AccountListSkeleton = () => {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="mb-3">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="w-2/3">
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-8 w-32 mt-1" />
            </div>
          </CardContent>
          <CardFooter className="px-4 py-3 bg-muted/30 flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-24" />
          </CardFooter>
        </Card>
      ))}
    </>
  );
};

/**
 * 移动端账户列表组件
 */
export default function AccountList({
  accounts,
  isLoading,
  error,
  onCreateAccount,
  onEditAccount,
  onDeleteAccount,
  onSearch,
}: AccountListProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索账户..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <Button size="icon" onClick={onCreateAccount}>
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <AccountListSkeleton />
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            重试
          </Button>
        </div>
      ) : accounts.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">暂无账户数据</p>
          <Button variant="outline" className="mt-4" onClick={onCreateAccount}>
            添加账户
          </Button>
        </div>
      ) : (
        <div>
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={() => onEditAccount(account)}
              onDelete={() => onDeleteAccount(account)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
