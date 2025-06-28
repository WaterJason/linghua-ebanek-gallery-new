import { Metadata } from "next"
import { PurchaseReport } from "@/components/reports/purchase-report"

export const metadata: Metadata = {
  title: "采购报表 | 聆花掐丝珐琅馆",
  description: "查看采购数据分析和统计报表",
}

export default function ReportsPurchasePage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">采购报表</h1>
        <p className="text-muted-foreground">查看采购数据分析和统计报表</p>
      </div>

      <PurchaseReport />
    </div>
  )
}
