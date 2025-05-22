import { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { TransactionsTable } from "@/components/finance/transactions-table"
import { getFinancialTransactions, getFinancialAccounts, getFinancialCategories } from "@/lib/actions/finance-actions"

export const metadata: Metadata = {
  title: "财务交易记录",
  description: "管理企业财务交易记录，包括收入和支出。",
}

export default async function TransactionsPage() {
  // 获取财务交易记录，使用模拟数据
  const { data: transactions = [], total = 0 } = await getFinancialTransactions(
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    50,
    0
  ).catch(() => ({ data: [], total: 0 }))

  // 获取所有资金账户和收支分类，使用模拟数据
  const accounts = await getFinancialAccounts(true).catch(() => [])
  const categories = await getFinancialCategories("all", true).catch(() => [])

  return (
    <DashboardShell>
      <DashboardHeader
        heading="财务交易记录"
        text="管理企业财务交易记录，包括收入和支出。"
      />
      <div className="grid gap-8">
        <TransactionsTable
          transactions={transactions}
          total={total}
          accounts={accounts}
          categories={categories}
        />
      </div>
    </DashboardShell>
  )
}