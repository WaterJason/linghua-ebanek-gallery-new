"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  AlertCircleIcon,
  UserIcon,
  CalendarIcon,
  FileTextIcon,
  CheckIcon,
  XIcon,
  AlertTriangleIcon
} from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { approveWorkflow, cancelWorkflowInstance } from "@/lib/actions/workflow-actions"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

// 工作流实例类型
interface WorkflowInstance {
  id: string
  workflowId: number
  workflow: {
    id: number
    name: string
    entityType: string
    steps: WorkflowStep[]
  }
  entityId: string
  entityType: string
  status: "pending" | "approved" | "rejected" | "canceled"
  initiatedBy: string
  initiatorName?: string
  currentStepNumber: number
  notes?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  approvals: WorkflowApproval[]
}

// 工作流步骤类型
interface WorkflowStep {
  id: number
  workflowId: number
  name: string
  description?: string
  stepNumber: number
  approverType: string
  approverId?: string
  approverName?: string
  isRequired: boolean
  createdAt: Date
  updatedAt: Date
}

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
}

// 获取状态标签
const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 gap-1">
          <ClockIcon className="h-3.5 w-3.5" />
          <span>审批中</span>
        </Badge>
      );
    case "approved":
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircleIcon className="h-3.5 w-3.5" />
          <span>已通过</span>
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircleIcon className="h-3.5 w-3.5" />
          <span>已拒绝</span>
        </Badge>
      );
    case "canceled":
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertCircleIcon className="h-3.5 w-3.5" />
          <span>已取消</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status}
        </Badge>
      );
  }
};

interface WorkflowInstanceDetailProps {
  instance: WorkflowInstance
}

export function WorkflowInstanceDetail({ instance: initialInstance }: WorkflowInstanceDetailProps) {
  const router = useRouter()
  const [instance, setInstance] = useState<WorkflowInstance>(initialInstance)
  const [isLoading, setIsLoading] = useState(false)
  const [comments, setComments] = useState("")
  const [cancelReason, setCancelReason] = useState("")
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  
  // 获取当前步骤
  const getCurrentStep = () => {
    if (instance.status !== "pending") return null
    
    return instance.workflow.steps.find(
      step => step.stepNumber === instance.currentStepNumber
    )
  }
  
  // 获取当前审批
  const getCurrentApproval = () => {
    if (instance.status !== "pending") return null
    
    const currentStep = getCurrentStep()
    if (!currentStep) return null
    
    return instance.approvals.find(
      approval => approval.workflowStepId === currentStep.id && approval.status === "pending"
    )
  }
  
  // 审批工作流
  const handleApprove = async () => {
    setIsLoading(true)
    try {
      const currentApproval = getCurrentApproval()
      if (!currentApproval) {
        throw new Error("找不到当前审批")
      }
      
      const result = await approveWorkflow({
        workflowInstanceId: instance.id,
        status: "approved",
        comments: comments,
      })
      
      setInstance(result)
      toast({
        title: "审批成功",
        description: "工作流已成功审批通过",
      })
      setShowApproveDialog(false)
    } catch (error) {
      console.error("Error approving workflow:", error)
      toast({
        title: "审批失败",
        description: error instanceof Error ? error.message : "无法审批工作流，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // 拒绝工作流
  const handleReject = async () => {
    setIsLoading(true)
    try {
      const currentApproval = getCurrentApproval()
      if (!currentApproval) {
        throw new Error("找不到当前审批")
      }
      
      const result = await approveWorkflow({
        workflowInstanceId: instance.id,
        status: "rejected",
        comments: comments,
      })
      
      setInstance(result)
      toast({
        title: "拒绝成功",
        description: "工作流已成功拒绝",
      })
      setShowRejectDialog(false)
    } catch (error) {
      console.error("Error rejecting workflow:", error)
      toast({
        title: "拒绝失败",
        description: error instanceof Error ? error.message : "无法拒绝工作流，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // 取消工作流
  const handleCancel = async () => {
    setIsLoading(true)
    try {
      const result = await cancelWorkflowInstance(instance.id, cancelReason)
      
      setInstance(result)
      toast({
        title: "取消成功",
        description: "工作流已成功取消",
      })
      setShowCancelDialog(false)
    } catch (error) {
      console.error("Error canceling workflow:", error)
      toast({
        title: "取消失败",
        description: error instanceof Error ? error.message : "无法取消工作流，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // 当前步骤和审批
  const currentStep = getCurrentStep()
  const currentApproval = getCurrentApproval()
  
  // 排序后的审批列表
  const sortedApprovals = [...instance.approvals].sort(
    (a, b) => a.workflowStep.stepNumber - b.workflowStep.stepNumber
  )

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle>{instance.workflow.name}</CardTitle>
                {getStatusBadge(instance.status)}
              </div>
              <CardDescription>
                实例ID: {instance.id} | 实体ID: {instance.entityId}
              </CardDescription>
            </div>
            {instance.status === "pending" && (
              <Button 
                variant="destructive" 
                onClick={() => setShowCancelDialog(true)}
                disabled={isLoading}
              >
                <AlertTriangleIcon className="h-4 w-4 mr-2" />
                取消工作流
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">发起人</div>
              <div className="text-sm flex items-center">
                <UserIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                {instance.initiatorName || instance.initiatedBy}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">发起时间</div>
              <div className="text-sm flex items-center">
                <CalendarIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                {format(new Date(instance.createdAt), "yyyy-MM-dd HH:mm:ss", { locale: zhCN })}
              </div>
            </div>
            {instance.status !== "pending" && instance.completedAt && (
              <>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">完成时间</div>
                  <div className="text-sm flex items-center">
                    <CalendarIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    {format(new Date(instance.completedAt), "yyyy-MM-dd HH:mm:ss", { locale: zhCN })}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">结果</div>
                  <div className="text-sm">
                    {instance.status === "approved" ? "通过" : instance.status === "rejected" ? "拒绝" : "取消"}
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* 备注 */}
          {instance.notes && (
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">备注</div>
              <div className="text-sm p-3 bg-muted rounded-md whitespace-pre-line">
                {instance.notes}
              </div>
            </div>
          )}
          
          {/* 当前步骤 */}
          {instance.status === "pending" && currentStep && (
            <div className="border rounded-md p-4 bg-muted/50">
              <h3 className="text-sm font-medium mb-2">当前步骤</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{currentStep.name}</div>
                  {currentStep.description && (
                    <div className="text-sm text-muted-foreground mt-1">{currentStep.description}</div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={isLoading}
                  >
                    <XIcon className="h-4 w-4 mr-2" />
                    拒绝
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => setShowApproveDialog(true)}
                    disabled={isLoading}
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    通过
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* 审批步骤 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">审批步骤</h3>
            <div className="space-y-4">
              {sortedApprovals.map((approval, index) => (
                <div 
                  key={approval.id} 
                  className={cn(
                    "relative pl-8 pb-4",
                    index !== sortedApprovals.length - 1 && "border-l-2 border-l-muted ml-3"
                  )}
                >
                  <div className={cn(
                    "absolute left-[-9px] top-0 h-5 w-5 rounded-full border-2 border-muted flex items-center justify-center",
                    approval.status === "approved" && "bg-green-100 border-green-500 dark:bg-green-900/20 dark:border-green-700",
                    approval.status === "rejected" && "bg-red-100 border-red-500 dark:bg-red-900/20 dark:border-red-700",
                    approval.status === "pending" && instance.currentStepNumber === approval.workflowStep.stepNumber && "bg-yellow-100 border-yellow-500 dark:bg-yellow-900/20 dark:border-yellow-700",
                    approval.status === "pending" && instance.currentStepNumber !== approval.workflowStep.stepNumber && "bg-gray-100 border-gray-500 dark:bg-gray-900/20 dark:border-gray-700"
                  )}>
                    {approval.status === "approved" ? (
                      <CheckIcon className="h-3 w-3 text-green-500 dark:text-green-400" />
                    ) : approval.status === "rejected" ? (
                      <XIcon className="h-3 w-3 text-red-500 dark:text-red-400" />
                    ) : instance.currentStepNumber === approval.workflowStep.stepNumber ? (
                      <ClockIcon className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {approval.workflowStep.name}
                      </div>
                      {approval.status === "approved" ? (
                        <Badge variant="success">已通过</Badge>
                      ) : approval.status === "rejected" ? (
                        <Badge variant="destructive">已拒绝</Badge>
                      ) : instance.currentStepNumber === approval.workflowStep.stepNumber ? (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
                          处理中
                        </Badge>
                      ) : (
                        <Badge variant="outline">等待中</Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      审批人: {approval.approverName || approval.approverId || "未指定"}
                    </div>
                    
                    {approval.status !== "pending" && (
                      <>
                        {approval.actionDate && (
                          <div className="text-sm text-muted-foreground">
                            处理时间: {format(new Date(approval.actionDate), "yyyy-MM-dd HH:mm:ss")}
                          </div>
                        )}
                        
                        {approval.comments && (
                          <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                            <div className="font-medium mb-1">审批意见:</div>
                            <div className="text-muted-foreground">{approval.comments}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 审批通过对话框 */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>审批通过</AlertDialogTitle>
            <AlertDialogDescription>
              确认通过此工作流步骤？
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Textarea
              placeholder="审批意见（可选）"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleApprove()
              }}
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? "处理中..." : "确认通过"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 审批拒绝对话框 */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>审批拒绝</AlertDialogTitle>
            <AlertDialogDescription>
              确认拒绝此工作流？拒绝后工作流将终止。
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Textarea
              placeholder="拒绝原因（必填）"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="resize-none"
              rows={4}
              required
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (!comments.trim()) {
                  toast({
                    title: "请填写拒绝原因",
                    variant: "destructive",
                  })
                  return
                }
                handleReject()
              }}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "处理中..." : "确认拒绝"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 取消工作流对话框 */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>取消工作流</AlertDialogTitle>
            <AlertDialogDescription>
              确认取消此工作流？取消后工作流将终止。
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Textarea
              placeholder="取消原因（可选）"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleCancel()
              }}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "处理中..." : "确认取消"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
