import { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { FinanceReportDashboard } from "@/components/finance/finance-report-dashboard"
import { getAccountBalances } from "@/lib/actions/finance-actions"

export const metadata: Metadata = {
  title: "财务报表",
  description: "查看企业财务报表，包括收支统计和资金流水。",
}

export default async function ReportsPage() {
  // 获取账户余额，使用模拟数据
  const accountBalances = await getAccountBalances(true).catch(() => [])

  return (
    <DashboardShell>
      <DashboardHeader
        heading="财务报表"
        text="查看企业财务报表，包括收支统计和资金流水。"
      />
      <div className="grid gap-8">
        <FinanceReportDashboard accountBalances={accountBalances} />
      </div>
    </DashboardShell>
  )
}