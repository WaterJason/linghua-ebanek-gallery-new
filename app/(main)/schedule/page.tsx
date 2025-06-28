import { Metadata } from "next"
import { ModernPageContainer } from "@/components/modern-page-container"
import { SchedulePage } from "@/components/schedule/schedule-page"

export const metadata: Metadata = {
  title: "排班管理 | 聆花掐丝珐琅馆",
  description: "管理员工排班和工作时间安排",
}

export default function SchedulePageRoute() {
  // 提供默认的员工数据，避免构建时错误
  const defaultEmployees = [
    { id: 1, name: "张三" },
    { id: 2, name: "李四" },
    { id: 3, name: "王五" }
  ]

  return (
    <ModernPageContainer
      title="排班管理"
      description="管理员工排班和工作时间安排"
    >
      <SchedulePage employees={defaultEmployees} />
    </ModernPageContainer>
  )
}
