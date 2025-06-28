import { Metadata } from "next"
import { ProductionManagementWithTabs } from "@/components/production/production-management-with-tabs"

export const metadata: Metadata = {
  title: "生产/供应链管理 | 聆花掐丝珐琅馆",
  description: "智能生产/供应链管理系统 - 8阶段生产流程管理",
}

export default function ProductionPage() {
  return <ProductionManagementWithTabs />
}
