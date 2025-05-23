"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
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
  ListIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

interface FinanceDashboardProps {
  accountBalances: any[];
  recentTransactions?: any[];
  monthlySummary?: any[];
  isLoading?: boolean;
}

/**
 * 桌面端财务仪表盘组件
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

  // 生成最近6个月的月份标签
  const monthLabels = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    return format(date, 'yyyy年MM月', { locale: zhCN });
  });

  // 模拟月度收支数据
  const mockMonthlySummary = monthLabels.map((month, index) => {
    const income = Math.floor(Math.random() * 50000) + 10000;
    const expense = Math.floor(Math.random() * 30000) + 5000;
    return {
      month,
      收入: income,
      支出: expense,
      净收入: income - expense,
    };
  });

  // 模拟收入分类数据
  const mockIncomeCategories = [
    { name: '销售收入', value: 45000 },
    { name: '服务收入', value: 25000 },
    { name: '投资收益', value: 10000 },
    { name: '其他收入', value: 5000 },
  ];

  // 模拟支出分类数据
  const mockExpenseCategories = [
    { name: '原材料', value: 20000 },
    { name: '人工成本', value: 15000 },
    { name: '租金', value: 8000 },
    { name: '水电费', value: 3000 },
    { name: '市场营销', value: 5000 },
    { name: '其他支出', value: 4000 },
  ];

  // 图表颜色
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="space-y-6">
      {/* 顶部卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              资金账户总余额
            </CardTitle>
            <WalletIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                formatCurrency(totalBalance)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              所有账户余额总和
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              本月收入
            </CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                formatCurrency(mockMonthlySummary[5].收入)
              )}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUpIcon className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500 font-medium">+12.5%</span>
              <span className="ml-1">相比上月</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              本月支出
            </CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                formatCurrency(mockMonthlySummary[5].支出)
              )}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDownIcon className="mr-1 h-3 w-3 text-red-500" />
              <span className="text-red-500 font-medium">+8.2%</span>
              <span className="ml-1">相比上月</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              本月净收入
            </CardTitle>
            <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                formatCurrency(mockMonthlySummary[5].净收入)
              )}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUpIcon className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500 font-medium">+15.3%</span>
              <span className="ml-1">相比上月</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 图表和账户列表 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>月度收支趋势</CardTitle>
            <CardDescription>
              最近6个月的收支情况
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockMonthlySummary}>
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} width={60} />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                      labelFormatter={(label: any) => `${label}`}
                    />
                    <Legend />
                    <Bar dataKey="收入" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="支出" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>账户余额</CardTitle>
            <CardDescription>
              各资金账户当前余额
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : accountBalances.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6">
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
              <div className="space-y-2">
                {accountBalances.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
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
              管理账户
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* 收支分类分析 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>收入分类分析</CardTitle>
            <CardDescription>
              本月收入来源分布
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockIncomeCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mockIncomeCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>支出分类分析</CardTitle>
            <CardDescription>
              本月支出分布
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockExpenseCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mockExpenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
