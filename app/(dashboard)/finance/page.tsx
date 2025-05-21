import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { FinanceDashboard } from "@/components/finance/finance-dashboard"
import { getUser } from "@/lib/actions/user-actions"

export const metadata: Metadata = {
  title: "财务管理",
  description: "管理企业财务，包括资金账户、收支记录和财务报表。",
}

export default async function FinancePage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const user = await getUser(session.user.id)

  return (
    <DashboardShell>
      <DashboardHeader
        heading="财务管理"
        text="管理企业财务，包括资金账户、收支记录和财务报表。"
      />
      <div className="grid gap-8">
        <FinanceDashboard />
      </div>
    </DashboardShell>
  )
}
