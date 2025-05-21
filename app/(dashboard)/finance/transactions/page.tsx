import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { TransactionsTable } from "@/components/finance/transactions-table"
import { getFinancialTransactions, getFinancialAccounts, getFinancialCategories } from "@/lib/actions/finance-actions"

export const metadata: Metadata = {
  title: "财务交易记录",
  description: "管理企业财务交易记录，包括收入和支出。",
}

export default async function TransactionsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // 获取财务交易记录
  const { data: transactions, total } = await getFinancialTransactions(
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    50,
    0
  )

  // 获取所有资金账户和收支分类
  const accounts = await getFinancialAccounts(true)
  const categories = await getFinancialCategories("all", true)

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
