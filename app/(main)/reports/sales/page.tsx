import { Metadata } from "next"
import { SalesReportPage } from "@/components/reports/sales-report-page"

export const metadata: Metadata = {
  title: "销售报表 | 聆花掐丝珐琅馆",
  description: "查看销售数据分析和报表",
}

export default function SalesReportPageRoute() {
  return <SalesReportPage />
}
