import { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { CategoriesTable } from "@/components/finance/categories-table"
import { getFinancialCategories } from "@/lib/actions/finance-actions"

export const metadata: Metadata = {
  title: "收支分类管理",
  description: "管理企业收支分类，用于对财务交易记录进行分类统计。",
}

export default async function CategoriesPage() {
  // 获取所有收支分类，使用模拟数据
  const categories = await getFinancialCategories("all", true).catch(() => [])

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