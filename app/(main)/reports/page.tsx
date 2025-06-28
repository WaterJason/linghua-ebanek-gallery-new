import { Metadata } from "next"
import { ReportsPage } from "@/components/reports/reports-page"

export const metadata: Metadata = {
  title: "综合报表 | 聆花掐丝珐琅馆",
  description: "查看业务综合报表和数据分析",
}

export default function ReportsPageRoute() {
  return <ReportsPage />
}
