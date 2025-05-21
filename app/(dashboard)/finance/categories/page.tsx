import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { CategoriesTable } from "@/components/finance/categories-table"
import { getFinancialCategories } from "@/lib/actions/finance-actions"

export const metadata: Metadata = {
  title: "收支分类管理",
  description: "管理企业收支分类，用于对财务交易记录进行分类统计。",
}

export default async function CategoriesPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // 获取所有收支分类
  const categories = await getFinancialCategories("all", true)

  return (
    <DashboardShell>
      <DashboardHeader
        heading="收支分类管理"
        text="管理企业收支分类，用于对财务交易记录进行分类统计。"
      />
      <div className="grid gap-8">
        <CategoriesTable categories={categories} />
      </div>
    </DashboardShell>
  )
}
