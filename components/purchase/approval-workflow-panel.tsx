"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  MessageSquare,
  ArrowRight,
  Send,
  AlertCircle
} from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

interface ApprovalRecord {
  id: string
  approverId: string
  approverName: string
  status: "pending" | "approved" | "rejected"
  comments?: string
  approvedAt?: string
  createdAt: string
}

interface PurchaseOrder {
  id: number
  orderNumber: string
  supplierId: number
  supplier: {
    id: number
    name: string
  }
  employee: {
    id: number
    name: string
  }
  orderDate: string
  expectedDate?: string
  status: string
  approvalStatus: "draft" | "pending_approval" | "approved" | "rejected"
  currentStep: number
  totalAmount: number
  notes?: string
  approvals: ApprovalRecord[]
}

interface ApprovalWorkflowPanelProps {
  purchaseOrder: PurchaseOrder
  currentUserId: string
  currentUserName: string
  onApprovalComplete?: (updatedOrder: PurchaseOrder) => void
}

export function ApprovalWorkflowPanel({
  purchaseOrder,
  currentUserId,
  currentUserName,
  onApprovalComplete
}: ApprovalWorkflowPanelProps) {
  const [comments, setComments] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [approvalHistory, setApprovalHistory] = useState<ApprovalRecord[]>([])

  // 获取审批历史
  useEffect(() => {
    const fetchApprovalHistory = async () => {
      try {
        const response = await fetch(`/api/purchase-orders/${purchaseOrder.id}/approve`)
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setApprovalHistory(result.data)
          }
        }
      } catch (error) {
        console.error("获取审批历史失败:", error)
      }
    }

    if (purchaseOrder.id) {
      fetchApprovalHistory()
    }
  }, [purchaseOrder.id])

  // 获取审批状态信息
  const getApprovalStatusInfo = (status: string) => {
    switch (status) {
      case "draft":
        return {
          label: "草稿",
          color: "bg-gray-100 text-gray-800",
          icon: Clock
        }
      case "pending_approval":
        return {
          label: "待审批",
          color: "bg-yellow-100 text-yellow-800",
          icon: Clock
        }
      case "approved":
        return {
          label: "已审批",
          color: "bg-green-100 text-green-800",
          icon: CheckCircle
        }
      case "rejected":
        return {
          label: "已拒绝",
          color: "bg-red-100 text-red-800",
          icon: XCircle
        }
      default:
        return {
          label: status,
          color: "bg-gray-100 text-gray-800",
          icon: Clock
        }
    }
  }

  // 检查当前用户是否可以审批
  const canApprove = () => {
    return purchaseOrder.approvalStatus === "pending_approval" && 
           currentUserId && 
           !approvalHistory.some(approval => approval.approverId === currentUserId)
  }

  // 检查是否可以提交审批
  const canSubmitForApproval = () => {
    return purchaseOrder.approvalStatus === "draft" && currentUserId
  }

  // 执行审批操作
  const handleApproval = async (action: "approve" | "reject" | "submit_for_approval") => {
    if (!currentUserId) {
      toast({
        title: "错误",
        description: "用户信息无效",
        variant: "destructive"
      })
      return
    }

    if ((action === "approve" || action === "reject") && !comments.trim()) {
      toast({
        title: "错误",
        description: "请填写审批意见",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/purchase-orders/${purchaseOrder.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action,
          comments: comments.trim() || undefined
        })
      })

      if (!response.ok) {
        throw new Error("审批操作失败")
      }

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "成功",
          description: result.message
        })
        
        // 清空评论
        setComments("")
        
        // 更新审批历史
        setApprovalHistory(result.data.purchaseOrder.approvals || [])
        
        // 通知父组件
        onApprovalComplete?.(result.data.purchaseOrder)
      } else {
        throw new Error(result.error || "审批操作失败")
      }

    } catch (error) {
      console.error("审批操作失败:", error)
      toast({
        title: "审批失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const statusInfo = getApprovalStatusInfo(purchaseOrder.approvalStatus)
  const StatusIcon = statusInfo.icon

  return (
    <div className="space-y-6">
      {/* 审批状态概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            审批状态
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className={statusInfo.color}>
                  {statusInfo.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  当前步骤: {purchaseOrder.currentStep}/3
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                订单号: {purchaseOrder.orderNumber}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">
                ¥{purchaseOrder.totalAmount.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                {purchaseOrder.supplier.name}
              </div>
            </div>
          </div>

          {/* 审批流程进度 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">审批进度</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => {
                const isCompleted = purchaseOrder.currentStep > step
                const isCurrent = purchaseOrder.currentStep === step
                const isPending = purchaseOrder.currentStep < step

                return (
                  <div key={step} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      isCompleted 
                        ? "border-green-500 bg-green-500 text-white" 
                        : isCurrent 
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground text-muted-foreground"
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-medium">{step}</span>
                      )}
                    </div>
                    <span className={`ml-2 text-sm ${
                      isCurrent ? "text-primary font-medium" : "text-muted-foreground"
                    }`}>
                      {step === 1 ? "初审" : step === 2 ? "复审" : "终审"}
                    </span>
                    {step < 3 && (
                      <ArrowRight className={`h-4 w-4 mx-2 ${
                        isCompleted ? "text-green-500" : "text-muted-foreground"
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 审批操作 */}
      {(canApprove() || canSubmitForApproval()) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              审批操作
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canSubmitForApproval() && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  此采购订单为草稿状态，需要提交审批后才能进入审批流程。
                </AlertDescription>
              </Alert>
            )}

            {canApprove() && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  您有权限审批此采购订单，请仔细审核订单信息后做出决定。
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="comments">审批意见</Label>
              <Textarea
                id="comments"
                placeholder={canSubmitForApproval() ? "提交审批说明（可选）" : "请填写审批意见"}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              {canSubmitForApproval() && (
                <Button 
                  onClick={() => handleApproval("submit_for_approval")}
                  disabled={isLoading}
                >
                  {isLoading ? "提交中..." : "提交审批"}
                </Button>
              )}

              {canApprove() && (
                <>
                  <Button 
                    onClick={() => handleApproval("approve")}
                    disabled={isLoading || !comments.trim()}
                  >
                    {isLoading ? "审批中..." : "通过"}
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleApproval("reject")}
                    disabled={isLoading || !comments.trim()}
                  >
                    {isLoading ? "审批中..." : "拒绝"}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 审批历史 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            审批历史
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvalHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              暂无审批记录
            </p>
          ) : (
            <div className="space-y-4">
              {approvalHistory.map((approval, index) => {
                const approvalStatusInfo = getApprovalStatusInfo(approval.status)
                const ApprovalIcon = approvalStatusInfo.icon

                return (
                  <div key={approval.id}>
                    <div className="flex items-start gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        approval.status === "approved" 
                          ? "bg-green-100 text-green-600"
                          : approval.status === "rejected"
                            ? "bg-red-100 text-red-600"
                            : "bg-yellow-100 text-yellow-600"
                      }`}>
                        <ApprovalIcon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{approval.approverName}</span>
                          <Badge variant="outline" className={approvalStatusInfo.color}>
                            {approvalStatusInfo.label}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(new Date(approval.createdAt), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
                          </span>
                        </div>
                        
                        {approval.comments && (
                          <div className="text-sm bg-muted p-2 rounded-md">
                            {approval.comments}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {index < approvalHistory.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
