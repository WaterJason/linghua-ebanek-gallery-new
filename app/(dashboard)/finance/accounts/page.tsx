import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { AccountsTable } from "@/components/finance/accounts-table"
import { getFinancialAccounts } from "@/lib/actions/finance-actions"

export const metadata: Metadata = {
  title: "资金账户管理",
  description: "管理企业资金账户，包括银行账户、现金账户和第三方支付账户。",
}

export default async function AccountsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // 获取所有资金账户
  const accounts = await getFinancialAccounts(true)

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
