import { Metadata } from "next"
import { EnhancedCoffeeSalesReport } from "@/components/enhanced-coffee-sales-report"

export const metadata: Metadata = {
  title: "咖啡店报表 | 聆花掐丝珐琅馆",
  description: "查看咖啡店销售报表和分析",
}

export default function CoffeeReportsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">咖啡店报表</h1>
        <p className="text-muted-foreground">查看咖啡店销售数据和分析</p>
      </div>

      <EnhancedCoffeeSalesReport />
    </div>
  )
}
