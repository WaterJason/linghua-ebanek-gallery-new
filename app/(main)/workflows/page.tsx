import { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { WorkflowList } from "@/components/workflows/workflow-list"

export const metadata: Metadata = {
  title: "工作流管理",
  description: "管理系统工作流和审批流程",
}

export default function WorkflowsPage() {
  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="工作流管理"
        description="管理系统工作流和审批流程"
      />
      
      <div className="space-y-6">
        <WorkflowList />
      </div>
    </div>
  )
}
