"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ModernPageContainer } from "@/components/modern-page-container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { 
  ArrowLeft, 
  Edit, 
  Copy, 
  Package, 
  DollarSign,
  Calendar,
  User,
  Building,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react"
import { ApprovalWorkflowPanel } from "@/components/purchase/approval-workflow-panel"
import { ReceivingDialog } from "@/components/purchase/receiving-dialog"
import { InventorySyncPanel } from "@/components/purchase/inventory-sync-panel"
import { EntityAuditLog } from "@/components/audit/entity-audit-log"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

// 采购订单详情页面
export default function PurchaseOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [purchaseOrder, setPurchaseOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const orderId = params.id as string

  useEffect(() => {
    if (orderId) {
      loadPurchaseOrder()
    }
  }, [orderId])

  const loadPurchaseOrder = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/purchase-orders/${orderId}`)
      const result = await response.json()
      
      if (result.success) {
        setPurchaseOrder(result.data)
      } else {
        setError(result.error || "加载采购订单失败")
      }
    } catch (error) {
      console.error("Error loading purchase order:", error)
      setError("网络错误，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprovalComplete = (updatedOrder) => {
    setPurchaseOrder(updatedOrder)
    toast({
      title: "审批操作完成",
      description: "采购订单状态已更新",
    })
  }

  const handleReceivingComplete = (updatedOrder) => {
    setPurchaseOrder(updatedOrder)
    toast({
      title: "到货验收完成",
      description: "库存已更新",
    })
  }

  const handleSyncComplete = (updatedOrder) => {
    setPurchaseOrder(updatedOrder)
    toast({
      title: "库存同步完成",
      description: "库存数据已同步",
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return "-"
    return format(new Date(dateString), "yyyy-MM-dd HH:mm", { locale: zhCN })
  }

  const formatCurrency = (amount) => {
    return `¥${amount.toFixed(2)}`
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: "草稿", variant: "secondary", icon: FileText },
      pending_approval: { label: "待审批", variant: "warning", icon: Clock },
      approved: { label: "已审批", variant: "success", icon: CheckCircle },
      rejected: { label: "已拒绝", variant: "destructive", icon: AlertCircle },
      received: { label: "已收货", variant: "success", icon: Package },
      cancelled: { label: "已取消", variant: "secondary", icon: AlertCircle },
    }

    const statusInfo = statusMap[status] || { label: status, variant: "secondary", icon: FileText }
    const Icon = statusInfo.icon

    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <ModernPageContainer
        title="采购订单详情"
        description="加载中..."
      >
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3">加载采购订单详情...</span>
        </div>
      </ModernPageContainer>
    )
  }

  if (error) {
    return (
      <ModernPageContainer
        title="采购订单详情"
        description="加载失败"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">加载失败</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回
                </Button>
                <Button onClick={loadPurchaseOrder}>
                  重新加载
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </ModernPageContainer>
    )
  }

  if (!purchaseOrder) {
    return (
      <ModernPageContainer
        title="采购订单详情"
        description="订单不存在"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">订单不存在</h3>
              <p className="text-muted-foreground mb-4">找不到指定的采购订单</p>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
            </div>
          </CardContent>
        </Card>
      </ModernPageContainer>
    )
  }

  return (
    <ModernPageContainer
      title={`采购订单 ${purchaseOrder.orderNumber}`}
      description="查看采购订单详情、审批流程和操作历史"
    >
      <div className="space-y-6">
        {/* 页面头部操作 */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              复制订单
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              编辑订单
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：订单基本信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>基本信息</span>
                  {getStatusBadge(purchaseOrder.approvalStatus || purchaseOrder.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">订单编号</div>
                    <div className="font-medium">{purchaseOrder.orderNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">采购日期</div>
                    <div>{formatDate(purchaseOrder.orderDate)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">预计到货</div>
                    <div>{formatDate(purchaseOrder.expectedDate)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">供应商</div>
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      {purchaseOrder.supplier?.name || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">采购员</div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {purchaseOrder.employee?.name || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">订单金额</div>
                    <div className="flex items-center gap-1 font-medium text-lg">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      {formatCurrency(purchaseOrder.totalAmount)}
                    </div>
                  </div>
                </div>
                
                {purchaseOrder.notes && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">备注</div>
                      <div className="text-sm bg-muted p-3 rounded-md">
                        {purchaseOrder.notes}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 订单项目 */}
            <Card>
              <CardHeader>
                <CardTitle>订单项目</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>产品名称</TableHead>
                        <TableHead>数量</TableHead>
                        <TableHead>单价</TableHead>
                        <TableHead>小计</TableHead>
                        <TableHead>已收货</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseOrder.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.product?.name || item.productName || "-"}
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.price)}</TableCell>
                          <TableCell>{formatCurrency(item.quantity * item.price)}</TableCell>
                          <TableCell>
                            <Badge variant={item.receivedQuantity >= item.quantity ? "success" : "secondary"}>
                              {item.receivedQuantity || 0} / {item.quantity}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：审批流程和操作 */}
          <div className="space-y-6">
            {/* 审批流程 */}
            {session?.user && (
              <ApprovalWorkflowPanel
                purchaseOrder={purchaseOrder}
                currentUserId={session.user.id}
                currentUserName={session.user.name || session.user.email || "未知用户"}
                onApprovalComplete={handleApprovalComplete}
              />
            )}

            {/* 到货验收 */}
            {purchaseOrder.approvalStatus === "approved" && (
              <ReceivingDialog
                purchaseOrder={purchaseOrder}
                warehouses={[]} // 需要传入仓库列表
                onReceivingComplete={handleReceivingComplete}
              />
            )}

            {/* 库存同步 */}
            {purchaseOrder.status === "received" && (
              <InventorySyncPanel
                purchaseOrder={purchaseOrder}
                warehouses={[]} // 需要传入仓库列表
                onSyncComplete={handleSyncComplete}
              />
            )}

            {/* 操作历史 */}
            <EntityAuditLog
              entityType="purchase"
              entityId={purchaseOrder.id.toString()}
              limit={10}
            />
          </div>
        </div>
      </div>
    </ModernPageContainer>
  )
}
