import { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { WorkflowInstanceDetail } from "@/components/workflows/workflow-instance-detail"
import { getWorkflowInstance } from "@/lib/actions/workflow-actions"

interface WorkflowInstanceDetailPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: WorkflowInstanceDetailPageProps): Promise<Metadata> {
  const id = params.id
  
  try {
    const instance = await getWorkflowInstance(id)
    return {
      title: `工作流实例 - ${instance.workflow.name}`,
      description: `查看工作流实例详情和审批进度`,
    }
  } catch (error) {
    return {
      title: "工作流实例详情",
      description: "查看工作流实例详情和审批进度",
    }
  }
}

export default async function WorkflowInstanceDetailPage({ params }: WorkflowInstanceDetailPageProps) {
  const id = params.id
  
  try {
    const instance = await getWorkflowInstance(id)
    
    return (
      <div className="flex flex-col space-y-6">
        <PageHeader
          title={`工作流实例: ${instance.workflow.name}`}
          description="查看工作流实例详情和审批进度"
          backHref="/workflows"
          backLabel="返回工作流列表"
        />
        
        <div className="space-y-6">
          <WorkflowInstanceDetail instance={instance} />
        </div>
      </div>
    )
  } catch (error) {
    return notFound()
  }
}
