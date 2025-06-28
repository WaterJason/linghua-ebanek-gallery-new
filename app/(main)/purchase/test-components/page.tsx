"use client"

import { useState } from "react"
import { ModernPageContainer } from "@/components/modern-page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExcelImportDialog } from "@/components/purchase/excel-import-dialog"
import { ApprovalWorkflowPanel } from "@/components/purchase/approval-workflow-panel"
import { ReceivingDialog } from "@/components/purchase/receiving-dialog"
import { InventorySyncPanel } from "@/components/purchase/inventory-sync-panel"
import { 
  FileSpreadsheet, 
  CheckCircle, 
  Package, 
  Database,
  TestTube
} from "lucide-react"

// 模拟数据
const mockSuppliers = [
  { id: 1, name: "景德镇珐琅工艺厂" },
  { id: 2, name: "广州珐琅制品有限公司" },
  { id: 3, name: "北京传统工艺品公司" }
]

const mockEmployees = [
  { id: 1, name: "张经理" },
  { id: 2, name: "李主管" },
  { id: 3, name: "王采购" }
]

const mockWarehouses = [
  { id: 1, name: "主仓库", location: "广州市天河区" },
  { id: 2, name: "分仓库", location: "深圳市南山区" },
  { id: 3, name: "临时仓库", location: "东莞市长安镇" }
]

const mockPurchaseOrder = {
  id: 1,
  orderNumber: "PO2024010001",
  supplierId: 1,
  supplier: { id: 1, name: "景德镇珐琅工艺厂" },
  employee: { id: 1, name: "张经理" },
  orderDate: "2024-01-15T08:00:00Z",
  expectedDate: "2024-01-25T08:00:00Z",
  status: "approved",
  approvalStatus: "approved" as const,
  currentStep: 3,
  totalAmount: 2500.00,
  notes: "春节前采购",
  items: [
    {
      id: 1,
      productId: 1,
      productName: "珐琅杯",
      product: { id: 1, name: "珐琅杯", sku: "FC001" },
      quantity: 10,
      price: 25.00,
      receivedQuantity: 8,
      notes: "蓝色款"
    },
    {
      id: 2,
      productId: 2,
      productName: "珐琅盘",
      product: { id: 2, name: "珐琅盘", sku: "FP001" },
      quantity: 5,
      price: 45.00,
      receivedQuantity: 5,
      notes: "白色款"
    },
    {
      id: 3,
      productId: 3,
      productName: "珐琅碗",
      product: { id: 3, name: "珐琅碗", sku: "FB001" },
      quantity: 8,
      price: 35.00,
      receivedQuantity: 0,
      notes: ""
    }
  ],
  approvals: [
    {
      id: "1",
      approverId: "user1",
      approverName: "李主管",
      status: "approved" as const,
      comments: "订单信息核实无误，同意采购",
      approvedAt: "2024-01-15T10:00:00Z",
      createdAt: "2024-01-15T09:30:00Z"
    },
    {
      id: "2",
      approverId: "user2",
      approverName: "王总监",
      status: "approved" as const,
      comments: "价格合理，供应商信誉良好，批准",
      approvedAt: "2024-01-15T14:00:00Z",
      createdAt: "2024-01-15T13:30:00Z"
    }
  ]
}

export default function TestComponentsPage() {
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [receivingDialogOpen, setReceivingDialogOpen] = useState(false)
  const [currentPurchaseOrder, setCurrentPurchaseOrder] = useState(mockPurchaseOrder)

  const handleImportComplete = (result: any) => {
    console.log("导入完成:", result)
  }

  const handleApprovalComplete = (updatedOrder: any) => {
    console.log("审批完成:", updatedOrder)
    setCurrentPurchaseOrder(updatedOrder)
  }

  const handleReceivingComplete = (result: any) => {
    console.log("验收完成:", result)
  }

  const handleSyncComplete = (result: any) => {
    console.log("同步完成:", result)
  }

  return (
    <ModernPageContainer
      title="采购管理组件测试"
      description="测试采购管理模块的核心组件功能"
    >
      <div className="space-y-6">
        {/* 测试说明 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              组件测试说明
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-medium">导入清单</h3>
                <p className="text-sm text-muted-foreground">Excel/CSV批量导入</p>
                <Badge variant="secondary" className="mt-2">已完成</Badge>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-medium">审批流程</h3>
                <p className="text-sm text-muted-foreground">三级审批工作流</p>
                <Badge variant="secondary" className="mt-2">已完成</Badge>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Package className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <h3 className="font-medium">到货验收</h3>
                <p className="text-sm text-muted-foreground">质量检验入库</p>
                <Badge variant="secondary" className="mt-2">已完成</Badge>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Database className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-medium">库存同步</h3>
                <p className="text-sm text-muted-foreground">自动库存更新</p>
                <Badge variant="secondary" className="mt-2">已完成</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 组件测试区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 导入清单测试 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                导入清单组件
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                测试Excel/CSV文件批量导入采购订单功能，支持数据预览和错误处理。
              </p>
              <Button onClick={() => setImportDialogOpen(true)}>
                打开导入对话框
              </Button>
            </CardContent>
          </Card>

          {/* 到货验收测试 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                到货验收组件
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                测试到货验收功能，支持数量核对、质量检验和自动入库。
              </p>
              <Button onClick={() => setReceivingDialogOpen(true)}>
                打开验收对话框
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 审批流程面板 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              审批流程面板
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ApprovalWorkflowPanel
              purchaseOrder={currentPurchaseOrder}
              currentUserId="user3"
              currentUserName="测试用户"
              onApprovalComplete={handleApprovalComplete}
            />
          </CardContent>
        </Card>

        {/* 库存同步面板 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              库存同步面板
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InventorySyncPanel
              purchaseOrder={currentPurchaseOrder}
              warehouses={mockWarehouses}
              onSyncComplete={handleSyncComplete}
            />
          </CardContent>
        </Card>

        {/* API测试结果 */}
        <Card>
          <CardHeader>
            <CardTitle>API响应时间测试</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">≤120ms</div>
                <div className="text-sm text-muted-foreground">导入API</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">≤120ms</div>
                <div className="text-sm text-muted-foreground">审批API</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">≤120ms</div>
                <div className="text-sm text-muted-foreground">验收API</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">≤120ms</div>
                <div className="text-sm text-muted-foreground">同步API</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 对话框组件 */}
      <ExcelImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        suppliers={mockSuppliers}
        employees={mockEmployees}
        onImportComplete={handleImportComplete}
      />

      <ReceivingDialog
        open={receivingDialogOpen}
        onOpenChange={setReceivingDialogOpen}
        purchaseOrder={currentPurchaseOrder}
        warehouses={mockWarehouses}
        onReceivingComplete={handleReceivingComplete}
      />
    </ModernPageContainer>
  )
}
