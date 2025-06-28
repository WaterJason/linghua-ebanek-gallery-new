import { Metadata } from "next"
import { CoffeeShopReport } from "@/components/reports/coffee-shop-report"

export const metadata: Metadata = {
  title: "咖啡店报表 | 聆花掐丝珐琅馆",
  description: "查看咖啡店销售数据分析和统计报表",
}

export default function ReportsCoffeeShopPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">咖啡店报表</h1>
        <p className="text-muted-foreground">查看咖啡店销售数据分析和统计报表</p>
      </div>

      <CoffeeShopReport />
    </div>
  )
}
