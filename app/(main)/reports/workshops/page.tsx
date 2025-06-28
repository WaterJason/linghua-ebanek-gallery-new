import { Metadata } from "next"
import { WorkshopReport } from "@/components/reports/workshop-report"

export const metadata: Metadata = {
  title: "团建报表 | 聆花掐丝珐琅馆",
  description: "查看团建活动数据分析和统计报表",
}

export default function ReportsWorkshopsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">团建报表</h1>
        <p className="text-muted-foreground">查看团建活动数据分析和统计报表</p>
      </div>

      <WorkshopReport />
    </div>
  )
}
