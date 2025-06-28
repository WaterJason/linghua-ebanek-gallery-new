import { Metadata } from "next"
import { WorkshopManagement } from "@/components/workshop/workshop-management"

export const metadata: Metadata = {
  title: "手作团建管理 | 聆花掐丝珐琅馆",
  description: "管理手作团建活动、师资和成本核算",
}

export default function WorkshopsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">手作团建管理</h1>
        <p className="text-muted-foreground">管理手作团建活动、师资安排和成本核算</p>
      </div>
      <WorkshopManagement />
    </div>
  )
}
