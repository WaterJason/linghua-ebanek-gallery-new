import { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { WorkflowApprovalList } from "@/components/workflows/workflow-approval-list"

export const metadata: Metadata = {
  title: "我的审批",
  description: "查看和处理待我审批的工作流",
}

export default function WorkflowApprovalsPage() {
  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="我的审批"
        description="查看和处理待我审批的工作流"
      />
      
      <div className="space-y-6">
        <WorkflowApprovalList />
      </div>
    </div>
  )
}
