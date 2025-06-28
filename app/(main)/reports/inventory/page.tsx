import { Metadata } from "next"
import { InventoryReport } from "@/components/reports/inventory-report"

export const metadata: Metadata = {
  title: "库存报表 | 聆花掐丝珐琅馆",
  description: "查看库存数据分析和统计报表",
}

export default function ReportsInventoryPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">库存报表</h1>
        <p className="text-muted-foreground">查看库存数据分析和统计报表</p>
      </div>

      <InventoryReport />
    </div>
  )
}
