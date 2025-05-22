import { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { AccountsTable } from "@/components/finance/accounts-table"
import { getFinancialAccounts } from "@/lib/actions/finance-actions"

export const metadata: Metadata = {
  title: "资金账户管理",
  description: "管理企业资金账户，包括银行账户、现金账户和第三方支付账户。",
}

export default async function AccountsPage() {
  // 获取所有资金账户，使用模拟数据
  const accounts = await getFinancialAccounts(true).catch(() => [])

  return (
    <DashboardShell>
      <DashboardHeader
        heading="资金账户管理"
        text="管理企业资金账户，包括银行账户、现金账户和第三方支付账户。"
      />
      <div className="grid gap-8">
        <AccountsTable accounts={accounts} />
      </div>
    </DashboardShell>
  )
}