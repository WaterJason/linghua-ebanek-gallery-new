/**
 * 财务管理模块类型定义
 */

// 资金账户类型
export interface FinancialAccount {
  id?: number;
  name: string;
  accountNumber?: string;
  accountType: 'bank' | 'cash' | 'alipay' | 'wechat' | 'other';
  bankName?: string;
  initialBalance: number;
  currentBalance: number;
  isActive: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 资金账户表单数据
export interface FinancialAccountFormData {
  id?: number;
  name: string;
  accountNumber?: string;
  accountType: string;
  bankName?: string;
  initialBalance: number;
  isActive?: boolean;
  notes?: string;
}

// 收支分类类型
export interface FinancialCategory {
  id?: number;
  name: string;
  type: 'income' | 'expense';
  code: string;
  parentId?: number | null;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  children?: FinancialCategory[];
}

// 收支分类表单数据
export interface FinancialCategoryFormData {
  id?: number;
  name: string;
  type: string;
  code: string;
  parentId?: number | null;
  description?: string;
  isSystem?: boolean;
  isActive?: boolean;
}

// 资金交易记录类型
export interface FinancialTransaction {
  id?: number;
  transactionDate: Date;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  accountId: number;
  categoryId?: number | null;
  paymentMethod?: string;
  relatedId?: number | null;
  relatedType?: string | null;
  counterparty?: string;
  notes?: string;
  attachmentUrl?: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdById?: string;
  createdAt?: Date;
  updatedAt?: Date;
  account?: FinancialAccount;
  category?: FinancialCategory;
}

// 资金交易记录表单数据
export interface FinancialTransactionFormData {
  id?: number;
  transactionDate: Date | string;
  amount: number;
  type: string;
  accountId: number;
  categoryId?: number | null;
  paymentMethod?: string;
  relatedId?: number | null;
  relatedType?: string | null;
  counterparty?: string;
  notes?: string;
  attachmentUrl?: string;
  status?: string;
}

// 资金流水查询参数
export interface FinancialTransactionQueryParams {
  startDate?: Date | string;
  endDate?: Date | string;
  accountId?: number;
  categoryId?: number;
  type?: string;
  status?: string;
  relatedType?: string;
  searchQuery?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// 资金账户余额
export interface AccountBalance {
  id: number;
  name: string;
  accountType: string;
  initialBalance: number;
  currentBalance: number;
  transactionsCount: number;
}

// 收支统计数据
export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  incomeByCategory: CategorySummary[];
  expenseByCategory: CategorySummary[];
  incomeByAccount: AccountSummary[];
  expenseByAccount: AccountSummary[];
  dailyTransactions: DailyTransactionSummary[];
}

// 分类统计数据
export interface CategorySummary {
  categoryId: number;
  categoryName: string;
  amount: number;
  percentage: number;
}

// 账户统计数据
export interface AccountSummary {
  accountId: number;
  accountName: string;
  amount: number;
  percentage: number;
}

// 每日交易统计
export interface DailyTransactionSummary {
  date: string;
  income: number;
  expense: number;
  net: number;
}
