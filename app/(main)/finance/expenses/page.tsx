import { Metadata } from "next"
import { FinanceExpenseManagement } from "@/components/finance/finance-expense-management"

export const metadata: Metadata = {
  title: "付款管理 | 聆花掐丝珐琅馆",
  description: "管理付款记录和应付账款",
}

export default function FinanceExpensesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">付款管理</h1>
        <p className="text-muted-foreground">管理付款记录、应付账款和支出分析</p>
      </div>
      <FinanceExpenseManagement />
    </div>
  )
}
