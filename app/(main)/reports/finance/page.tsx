import { Metadata } from "next"
import { FinanceReport } from "@/components/finance/finance-report"

export const metadata: Metadata = {
  title: "财务报表 | 聆花掐丝珐琅馆",
  description: "查看财务数据分析和统计报表",
}

export default function ReportsFinancePage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">财务报表</h1>
        <p className="text-muted-foreground">查看财务数据分析和统计报表</p>
      </div>

      <FinanceReport />
    </div>
  )
}
