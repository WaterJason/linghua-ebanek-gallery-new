import { Metadata } from "next"
import { ModernPageContainer } from "@/components/modern-page-container"
import { NewTodoForm } from "@/components/todos/new-todo-form"

export const metadata: Metadata = {
  title: "新建待办事项 | 聆花掐丝珐琅馆",
  description: "创建新的待办事项",
}

export default function NewTodoPage() {
  return (
    <ModernPageContainer
      title="新建待办事项"
      description="创建新的待办任务"
    >
      <div className="max-w-2xl">
        <NewTodoForm />
      </div>
    </ModernPageContainer>
  )
}
