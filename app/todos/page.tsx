import { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { TodoList } from "@/components/dashboard/todo-list"
import { Card } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "待办事项",
  description: "查看和管理所有待办事项",
}

export default function TodosPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="待办事项"
        text="查看和管理所有待办任务"
      />
      <Card className="p-0">
        <TodoList limit={20} showCompleted={true} />
      </Card>
    </DashboardShell>
  )
}