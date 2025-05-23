"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, subDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  WalletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  RefreshCwIcon,
  PlusIcon,
  BarChart3Icon,
  CalendarIcon,
  ListIcon
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface FinanceDashboardProps {
  accountBalances: any[];
  recentTransactions?: any[];
  monthlySummary?: any[];
  isLoading?: boolean;
}

/**
 * 移动端财务仪表盘组件
 */
export default function FinanceDashboard({
  accountBalances,
  recentTransactions = [],
  monthlySummary = [],
  isLoading = false,
}: FinanceDashboardProps) {
  const router = useRouter();

  // 计算总余额
  const totalBalance = accountBalances.reduce((sum, account) => sum + account.currentBalance, 0);

  // 生成最近7天的日期标签
  const dateLabels = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return format(date, 'MM-dd', { locale: zhCN });
  });

  // 模拟收支数据
  const mockIncomeExpenseData = dateLabels.map((date, index) => {
    const income = Math.floor(Math.random() * 5000) + 1000;
    const expense = Math.floor(Math.random() * 3000) + 500;
    return {
      date,
      收入: income,
      支出: expense,
      净收入: income - expense,
    };
  });

  return (
    <div className="space-y-4">
      {/* 总余额卡片 */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm opacity-90">总资产</p>
              <h2 className="text-3xl font-bold mt-1">
                {isLoading ? (
                  <Skeleton className="h-8 w-32 bg-primary-foreground/20" />
                ) : (
                  formatCurrency(totalBalance)
                )}
              </h2>
            </div>
            <WalletIcon className="h-6 w-6" />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-start"
              onClick={() => router.push('/finance/transactions?type=income')}
            >
              <PlusIcon className="mr-1 h-4 w-4" />
              记录收入
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-start"
              onClick={() => router.push('/finance/transactions?type=expense')}
            >
              <ArrowDownIcon className="mr-1 h-4 w-4" />
              记录支出
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 账户列表 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">账户余额</CardTitle>
        </CardHeader>
        <CardContent className="px-2">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center p-2">
                  <div>
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : accountBalances.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">暂无账户数据</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => router.push('/finance/accounts')}
              >
                添加账户
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {accountBalances.map((account) => (
                <div key={account.id} className="flex justify-between items-center p-2">
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{account.type}</p>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(account.currentBalance)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => router.push('/finance/accounts')}
          >
            查看全部账户
          </Button>
        </CardFooter>
      </Card>

      {/* 收支图表 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">收支趋势</CardTitle>
          <CardDescription>最近7天收支情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockIncomeExpenseData}>
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} width={40} />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  labelFormatter={(label: any) => `${label}`}
                />
                <Bar dataKey="收入" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="支出" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => router.push('/finance/reports')}
          >
            <BarChart3Icon className="mr-2 h-4 w-4" />
            查看详细报表
          </Button>
        </CardFooter>
      </Card>

      {/* 快捷操作 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">快捷操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center justify-center"
              onClick={() => router.push('/finance/transactions')}
            >
              <ListIcon className="h-5 w-5 mb-1" />
              <span>交易记录</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center justify-center"
              onClick={() => router.push('/finance/accounts')}
            >
              <WalletIcon className="h-5 w-5 mb-1" />
              <span>账户管理</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center justify-center"
              onClick={() => router.push('/finance/categories')}
            >
              <ListIcon className="h-5 w-5 mb-1" />
              <span>分类管理</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center justify-center"
              onClick={() => router.push('/finance/reports')}
            >
              <BarChart3Icon className="h-5 w-5 mb-1" />
              <span>财务报表</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
