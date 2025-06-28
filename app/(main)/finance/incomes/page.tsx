import { Metadata } from "next"
import { FinanceIncomeManagement } from "@/components/finance/finance-income-management"

export const metadata: Metadata = {
  title: "收款管理 | 聆花掐丝珐琅馆",
  description: "管理收款记录和应收账款",
}

export default function FinanceIncomesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">收款管理</h1>
        <p className="text-muted-foreground">管理收款记录、应收账款和收款分析</p>
      </div>
      <FinanceIncomeManagement />
    </div>
  )
}
