"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ResponsiveContainer } from '@/src/components/ui/responsive-container';
import MobileFinanceDashboard from '../components/mobile/FinanceDashboard';
import DesktopFinanceDashboard from '../components/desktop/FinanceDashboard';
import { useAccountData } from '../hooks/useAccountData';
import { useTransactionData } from '../hooks/useTransactionData';
import { useToast } from '@/components/ui/use-toast';

/**
 * 财务仪表盘页面
 */
export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [accountState] = useAccountData();
  const [transactionState] = useTransactionData();
  const [isLoading, setIsLoading] = useState(true);

  // 模拟数据加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 共享属性
  const sharedProps = {
    accountBalances: accountState.accounts,
    recentTransactions: transactionState.transactions.slice(0, 5),
    isLoading: isLoading || accountState.isLoading || transactionState.isLoading,
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">财务总览</h1>

      <ResponsiveContainer
        mobile={MobileFinanceDashboard}
        desktop={DesktopFinanceDashboard}
        breakpoint="md"
        props={sharedProps}
      />
    </div>
  );
}
