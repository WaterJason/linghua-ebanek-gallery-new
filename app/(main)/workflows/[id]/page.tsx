import { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { WorkflowDetail } from "@/components/workflows/workflow-detail"
import { getWorkflow } from "@/lib/actions/workflow-actions"

interface WorkflowDetailPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: WorkflowDetailPageProps): Promise<Metadata> {
  const id = parseInt(params.id)
  
  try {
    const workflow = await getWorkflow(id)
    return {
      title: `工作流 - ${workflow.name}`,
      description: workflow.description || `管理工作流 ${workflow.name} 的步骤和实例`,
    }
  } catch (error) {
    return {
      title: "工作流详情",
      description: "管理工作流的步骤和实例",
    }
  }
}

export default async function WorkflowDetailPage({ params }: WorkflowDetailPageProps) {
  const id = parseInt(params.id)
  
  try {
    const workflow = await getWorkflow(id)
    
    return (
      <div className="flex flex-col space-y-6">
        <PageHeader
          title={`工作流: ${workflow.name}`}
          description={workflow.description || "管理工作流的步骤和实例"}
          backHref="/workflows"
          backLabel="返回工作流列表"
        />
        
        <div className="space-y-6">
          <WorkflowDetail workflow={workflow} />
        </div>
      </div>
    )
  } catch (error) {
    return notFound()
  }
}
