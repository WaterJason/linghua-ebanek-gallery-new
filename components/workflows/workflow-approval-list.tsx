"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { 
  ClockIcon,
  CheckIcon,
  XIcon,
  FileTextIcon,
  ArrowRightIcon
} from "lucide-react"
import { format } from "date-fns"
import { getMyPendingApprovals } from "@/lib/actions/workflow-actions"

// 工作流审批类型
interface WorkflowApproval {
  id: string
  workflowInstanceId: string
  workflowStepId: number
  workflowStep: {
    id: number
    name: string
    stepNumber: number
  }
  approverId: string
  approverName?: string
  status: "pending" | "approved" | "rejected"
  comments?: string
  actionDate?: Date
  createdAt: Date
  updatedAt: Date
  workflowInstance: {
    id: string
    workflow: {
      id: number
      name: string
      entityType: string
    }
    entityId: string
    entityType: string
    status: "pending" | "approved" | "rejected" | "canceled"
    initiatedBy: string
    initiatorName?: string
    createdAt: Date
  }
}

export function WorkflowApprovalList() {
  const router = useRouter()
  const [approvals, setApprovals] = useState<WorkflowApproval[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 加载待审批工作流
  useEffect(() => {
    const loadApprovals = async () => {
      setIsLoading(true)
      try {
        // 从服务器获取待审批工作流
        const data = await getMyPendingApprovals()
        setApprovals(data)
      } catch (error) {
        console.error("Error loading pending approvals:", error)
        toast({
          title: "加载失败",
          description: "无法加载待审批工作流，请稍后再试",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadApprovals()
  }, [])

  // 查看工作流实例详情
  const handleViewInstance = (instanceId: string) => {
    router.push(`/workflows/instances/${instanceId}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>待我审批</CardTitle>
        <CardDescription>需要您处理的工作流审批</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : approvals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
            <div className="text-muted-foreground mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 opacity-50">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
                <path d="M10 9H8" />
              </svg>
              <p>暂无待审批的工作流</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((approval) => (
              <div key={approval.id} className="border rounded-md p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 gap-1">
                      <ClockIcon className="h-3.5 w-3.5" />
                      <span>待审批</span>
                    </Badge>
                    <h3 className="font-medium">{approval.workflowInstance.workflow.name}</h3>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(approval.createdAt), "yyyy-MM-dd HH:mm")}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">步骤</div>
                    <div>{approval.workflowStep.name}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">发起人</div>
                    <div>{approval.workflowInstance.initiatorName || approval.workflowInstance.initiatedBy}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">实体类型</div>
                    <div>{approval.workflowInstance.workflow.entityType}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">实体ID</div>
                    <div className="font-mono text-xs">{approval.workflowInstance.entityId}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleViewInstance(approval.workflowInstanceId)}
                    >
                      <XIcon className="h-4 w-4 mr-2" />
                      拒绝
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleViewInstance(approval.workflowInstanceId)}
                    >
                      <CheckIcon className="h-4 w-4 mr-2" />
                      通过
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewInstance(approval.workflowInstanceId)}
                  >
                    查看详情
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
