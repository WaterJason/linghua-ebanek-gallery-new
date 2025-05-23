"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  AlertCircleIcon,
  FileTextIcon,
  ArrowRightIcon
} from "lucide-react"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { 
  createWorkflowInstance, 
  getWorkflowByEntityType,
  getWorkflowInstance
} from "@/lib/actions/workflow-actions"

// 采购订单类型
interface PurchaseOrder {
  id: number
  orderNumber: string
  supplierId: number
  supplier?: {
    id: number
    name: string
  }
  employeeId?: number
  employee?: {
    id: number
    name: string
  }
  orderDate: Date
  expectedDate?: Date
  status: string
  totalAmount: number
  paymentStatus: string
  paymentMethod?: string
  paidAmount?: number
  notes?: string
  items: PurchaseOrderItem[]
}

// 采购订单项类型
interface PurchaseOrderItem {
  id: number
  orderId: number
  productId: number
  product?: {
    id: number
    name: string
  }
  quantity: number
  price: number
  receivedQuantity: number
  notes?: string
}

// 工作流实例类型
interface WorkflowInstance {
  id: string
  workflowId: number
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
  currentStepNumber: number
  notes?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  approvals: WorkflowApproval[]
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

interface PurchaseOrderWorkflowProps {
  order: PurchaseOrder
  onWorkflowUpdated?: () => void
}

export function PurchaseOrderWorkflow({ order, onWorkflowUpdated }: PurchaseOrderWorkflowProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [workflowInstance, setWorkflowInstance] = useState<WorkflowInstance | null>(null)
  const [availableWorkflows, setAvailableWorkflows] = useState<any[]>([])
  const [showStartDialog, setShowStartDialog] = useState(false)
  const [notes, setNotes] = useState("")
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false)

  // 加载工作流实例
  useEffect(() => {
    const loadWorkflowInstance = async () => {
      setIsLoading(true)
      try {
        // 查询是否有与此采购订单关联的工作流实例
        const instance = await getWorkflowInstance("purchase", order.id.toString())
        if (instance) {
          setWorkflowInstance(instance)
        }
      } catch (error) {
        console.error("Error loading workflow instance:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadWorkflowInstance()
  }, [order.id])

  // 加载可用的工作流
  useEffect(() => {
    const loadAvailableWorkflows = async () => {
      setIsLoadingWorkflows(true)
      try {
        // 获取适用于采购订单的工作流
        const workflows = await getWorkflowByEntityType("purchase")
        setAvailableWorkflows(workflows)
      } catch (error) {
        console.error("Error loading available workflows:", error)
      } finally {
        setIsLoadingWorkflows(false)
      }
    }

    if (!workflowInstance) {
      loadAvailableWorkflows()
    }
  }, [workflowInstance])

  // 启动工作流
  const handleStartWorkflow = async (workflowId: number) => {
    setIsLoading(true)
    try {
      // 创建工作流实例
      const instance = await createWorkflowInstance({
        workflowId,
        entityType: "purchase",
        entityId: order.id.toString(),
        notes,
      })

      setWorkflowInstance(instance)
      setShowStartDialog(false)
      setNotes("")

      toast({
        title: "工作流已启动",
        description: "采购订单审批流程已成功启动",
      })

      if (onWorkflowUpdated) {
        onWorkflowUpdated()
      }
    } catch (error) {
      console.error("Error starting workflow:", error)
      toast({
        title: "启动失败",
        description: error instanceof Error ? error.message : "无法启动工作流，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 查看工作流详情
  const handleViewWorkflow = () => {
    if (workflowInstance) {
      window.open(`/workflows/instances/${workflowInstance.id}`, "_blank")
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">加载中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (workflowInstance) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">审批流程</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium">{workflowInstance.workflow.name}</div>
                <div className="text-sm text-muted-foreground">
                  启动时间: {format(new Date(workflowInstance.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                </div>
              </div>
              <div>
                {getStatusBadge(workflowInstance.status)}
              </div>
            </div>

            <div className="text-sm">
              <div className="font-medium">当前状态</div>
              <div className="mt-1">
                {workflowInstance.status === "pending" ? (
                  <div className="text-yellow-600 dark:text-yellow-400">
                    正在等待审批 (步骤 {workflowInstance.currentStepNumber})
                  </div>
                ) : workflowInstance.status === "approved" ? (
                  <div className="text-green-600 dark:text-green-400">
                    审批已通过 ({workflowInstance.completedAt ? format(new Date(workflowInstance.completedAt), "yyyy-MM-dd HH:mm", { locale: zhCN }) : ""})
                  </div>
                ) : workflowInstance.status === "rejected" ? (
                  <div className="text-red-600 dark:text-red-400">
                    审批已拒绝 ({workflowInstance.completedAt ? format(new Date(workflowInstance.completedAt), "yyyy-MM-dd HH:mm", { locale: zhCN }) : ""})
                  </div>
                ) : (
                  <div className="text-gray-600 dark:text-gray-400">
                    审批已取消 ({workflowInstance.completedAt ? format(new Date(workflowInstance.completedAt), "yyyy-MM-dd HH:mm", { locale: zhCN }) : ""})
                  </div>
                )}
              </div>
            </div>

            {workflowInstance.notes && (
              <div className="text-sm">
                <div className="font-medium">备注</div>
                <div className="mt-1 text-muted-foreground">{workflowInstance.notes}</div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={handleViewWorkflow}>
            查看详情
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">审批流程</CardTitle>
        <CardDescription>此采购订单尚未启动审批流程</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingWorkflows ? (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">加载中...</span>
          </div>
        ) : availableWorkflows.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileTextIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>没有可用的审批流程</p>
            <p className="text-sm mt-1">请先在工作流管理中创建采购订单审批流程</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              选择一个审批流程启动采购订单审批
            </p>
            <div className="grid gap-2">
              {availableWorkflows.map((workflow) => (
                <Button
                  key={workflow.id}
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    setShowStartDialog(true)
                  }}
                >
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  {workflow.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* 启动工作流对话框 */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>启动审批流程</DialogTitle>
            <DialogDescription>
              为采购订单 #{order.orderNumber} 启动审批流程
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium">订单编号</div>
                <div className="text-sm">{order.orderNumber}</div>
              </div>
              <div>
                <div className="text-sm font-medium">供应商</div>
                <div className="text-sm">{order.supplier?.name || "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium">总金额</div>
                <div className="text-sm">¥{order.totalAmount.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm font-medium">订单日期</div>
                <div className="text-sm">{format(new Date(order.orderDate), "yyyy-MM-dd", { locale: zhCN })}</div>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-2">审批流程</div>
              <div className="space-y-2">
                {availableWorkflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="flex items-center space-x-2 p-2 border rounded-md"
                  >
                    <input
                      type="radio"
                      id={`workflow-${workflow.id}`}
                      name="workflow"
                      value={workflow.id}
                      className="h-4 w-4"
                      defaultChecked={availableWorkflows.length === 1}
                    />
                    <label htmlFor={`workflow-${workflow.id}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{workflow.name}</div>
                      {workflow.description && (
                        <div className="text-sm text-muted-foreground">{workflow.description}</div>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-2">备注 (可选)</div>
              <Textarea
                placeholder="输入审批备注信息"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStartDialog(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                const selectedWorkflowId = document.querySelector('input[name="workflow"]:checked')?.value;
                if (selectedWorkflowId) {
                  handleStartWorkflow(Number(selectedWorkflowId));
                } else {
                  toast({
                    title: "请选择审批流程",
                    variant: "destructive",
                  });
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? "启动中..." : "启动审批"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
