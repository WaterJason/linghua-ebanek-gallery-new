import { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { MyWorkflowList } from "@/components/workflows/my-workflow-list"

export const metadata: Metadata = {
  title: "我的工作流",
  description: "查看我发起的工作流实例",
}

export default function MyWorkflowsPage() {
  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="我的工作流"
        description="查看我发起的工作流实例"
      />
      
      <div className="space-y-6">
        <MyWorkflowList />
      </div>
    </div>
  )
}
