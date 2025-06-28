import { Metadata } from "next"
import { ModernPageContainer } from "@/components/modern-page-container"
import { TodoList } from "@/components/dashboard/todo-list"
import { Card } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "待办事项 | 聆花掐丝珐琅馆",
  description: "查看和管理所有待办事项",
}

export default function TodosPage() {
  return (
    <ModernPageContainer
      title="待办事项"
      description="查看和管理所有待办任务"
    >
      <Card className="p-0">
        <TodoList limit={20} showCompleted={true} />
      </Card>
    </ModernPageContainer>
  )
}
