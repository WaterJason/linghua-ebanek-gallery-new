"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  PlusIcon,
  SearchIcon,
  ArrowRightIcon,
  CalendarIcon,
  FileTextIcon,
  PackageIcon,
  TruckIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  CopyIcon
} from "lucide-react"
import { getPurchaseOrders, getSuppliers, updatePurchaseOrder, deletePurchaseOrder, receivePurchaseOrder } from "@/lib/actions/purchase-actions";
import { getEmployees } from "@/lib/actions/employee-actions";
import { getWarehouses } from "@/lib/actions/inventory-actions";
import { getProducts } from "@/lib/actions/product-actions";
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { PurchaseOrderForm } from "./purchase-order-form"
import { PurchaseReceiveDialog } from "./purchase-receive-dialog"
import { PurchaseOrderTemplates } from "./purchase-order-templates"
import { PurchaseOrderWorkflow } from "./purchase/purchase-order-workflow"
import { EntityAuditLog } from "./audit/entity-audit-log"

export function PurchaseOrderManagement() {
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [totalOrders, setTotalOrders] = useState(0)
  const [suppliers, setSuppliers] = useState([])
  const [employees, setEmployees] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false)
  const [isTemplatesVisible, setIsTemplatesVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [filters, setFilters] = useState({
    status: "all",
    supplierId: "all",
    employeeId: "all",
    startDate: "",
    endDate: "",
  })
  const [page, setPage] = useState(0)
  const limit = 10

  useEffect(() => {
    loadPurchaseOrders()
    loadSuppliers()
    loadEmployees()
    loadWarehouses()
    loadProducts()
  }, [])

  useEffect(() => {
    loadPurchaseOrders()
  }, [filters, page])

  const loadPurchaseOrders = async () => {
    setIsLoading(true)
    try {
      const data = await getPurchaseOrders(
        filters.status && filters.status !== "all" ? filters.status : undefined,
        filters.supplierId && filters.supplierId !== "all" ? Number(filters.supplierId) : undefined,
        filters.employeeId && filters.employeeId !== "all" ? Number(filters.employeeId) : undefined,
        filters.startDate || undefined,
        filters.endDate || undefined,
        limit,
        page * limit
      )
      setPurchaseOrders(data.data)
      setTotalOrders(data.total)
    } catch (error) {
      console.error("Error loading purchase orders:", error)
      toast({
        title: "错误",
        description: "加载采购订单列表失败",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadSuppliers = async () => {
    try {
      const data = await getSuppliers()
      setSuppliers(data)
    } catch (error) {
      console.error("Error loading suppliers:", error)
    }
  }

  const loadEmployees = async () => {
    try {
      const data = await getEmployees()
      setEmployees(data)
    } catch (error) {
      console.error("Error loading employees:", error)
    }
  }

  const loadWarehouses = async () => {
    try {
      const data = await getWarehouses()
      setWarehouses(data)
    } catch (error) {
      console.error("Error loading warehouses:", error)
    }
  }

  const loadProducts = async () => {
    try {
      const data = await getProducts()
      setProducts(data)
    } catch (error) {
      console.error("Error loading products:", error)
    }
  }

  const handleViewOrder = (order) => {
    setSelectedOrder(order)
    setIsViewDialogOpen(true)
  }

  const handleAddOrder = () => {
    setSelectedOrder(null)
    setIsEditing(false)
    setIsFormDialogOpen(true)
  }

  const handleEditOrder = (order) => {
    setSelectedOrder(order)
    setIsEditing(true)
    setIsFormDialogOpen(true)
  }

  const handleCopyOrder = (order) => {
    // 创建一个新的订单对象，基于现有订单但移除ID和订单编号
    const newOrder = {
      ...order,
      id: undefined,
      orderNumber: undefined,
      orderDate: new Date().toISOString().split('T')[0], // 设置为今天
      status: "pending", // 设置为待处理状态
      items: order.items.map(item => ({
        ...item,
        id: undefined,
        receivedQuantity: 0 // 重置已收货数量
      }))
    }

    setSelectedOrder(newOrder)
    setIsEditing(false) // 虽然是基于现有订单，但实际上是创建新订单
    setIsFormDialogOpen(true)

    toast({
      title: "已复制订单",
      description: `已创建基于订单 ${order.orderNumber} 的新订单`,
    })
  }

  const handleReceiveOrder = (order) => {
    setSelectedOrder(order)
    setIsReceiveDialogOpen(true)
  }

  const handleDeleteOrder = async (id) => {
    if (!confirm("确定要删除这个采购订单吗？")) return

    try {
      await deletePurchaseOrder(id)
      toast({
        title: "成功",
        description: "采购订单已删除",
      })
      loadPurchaseOrders()
    } catch (error) {
      console.error("Error deleting purchase order:", error)
      toast({
        title: "错误",
        description: error.message || "删除采购订单失败",
        variant: "destructive",
      })
    }
  }

  const handleOrderSaved = () => {
    setIsFormDialogOpen(false)
    loadPurchaseOrders()
  }

  const handleOrderReceived = () => {
    setIsReceiveDialogOpen(false)
    loadPurchaseOrders()
  }

  const handleUseTemplate = (template) => {
    // 创建一个新的订单对象，基于模板
    const newOrder = {
      supplierId: template.supplierId,
      orderDate: new Date().toISOString().split('T')[0], // 设置为今天
      status: "pending",
      paymentStatus: "unpaid",
      totalAmount: template.items.reduce((total, item) => total + (item.quantity * item.price), 0),
      notes: template.notes || "",
      items: template.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || ""
      }))
    }

    setSelectedOrder(newOrder)
    setIsEditing(false)
    setIsFormDialogOpen(true)

    toast({
      title: "已应用模板",
      description: `已应用模板 "${template.name}" 创建新订单`,
    })
  }

  const toggleTemplatesVisibility = () => {
    setIsTemplatesVisible(!isTemplatesVisible)
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: "待处理", className: "bg-yellow-100 text-yellow-800" },
      confirmed: { label: "已确认", className: "bg-blue-100 text-blue-800" },
      received: { label: "已收货", className: "bg-green-100 text-green-800" },
      cancelled: { label: "已取消", className: "bg-gray-100 text-gray-800" },
    }

    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" }

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      unpaid: { label: "未付款", className: "bg-red-100 text-red-800" },
      partial: { label: "部分付款", className: "bg-orange-100 text-orange-800" },
      paid: { label: "已付款", className: "bg-green-100 text-green-800" },
    }

    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" }

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return "-"
    return format(new Date(dateString), "yyyy-MM-dd", { locale: zhCN })
  }

  const formatCurrency = (amount) => {
    return `¥${amount.toFixed(2)}`
  }

  return (
    <div className="space-y-4">
      {isTemplatesVisible && (
        <Card>
          <CardContent className="pt-6">
            <PurchaseOrderTemplates
              suppliers={suppliers}
              products={products}
              onUseTemplate={handleUseTemplate}
            />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>采购订单管理</CardTitle>
              <CardDescription>管理采购订单和入库</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={toggleTemplatesVisibility}>
                <FileTextIcon className="mr-2 h-4 w-4" />
                {isTemplatesVisible ? "隐藏模板" : "订单模板"}
              </Button>
              <Button onClick={handleAddOrder}>
                <PlusIcon className="mr-2 h-4 w-4" />
                新建采购订单
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 筛选条件 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <Label htmlFor="status">订单状态</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">待处理</SelectItem>
                  <SelectItem value="confirmed">已确认</SelectItem>
                  <SelectItem value="received">已收货</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="supplier">供应商</Label>
              <Select
                value={filters.supplierId}
                onValueChange={(value) => setFilters({ ...filters, supplierId: value })}
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="选择供应商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部供应商</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="employee">采购员工</Label>
              <Select
                value={filters.employeeId}
                onValueChange={(value) => setFilters({ ...filters, employeeId: value })}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="选择员工" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部员工</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">开始日期</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">结束日期</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* 采购订单列表 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单编号</TableHead>
                  <TableHead>供应商</TableHead>
                  <TableHead>采购日期</TableHead>
                  <TableHead>预计到货日期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>总金额</TableHead>
                  <TableHead>付款状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      <div className="flex justify-center items-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2">加载中...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : purchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      暂无采购订单数据
                    </TableCell>
                  </TableRow>
                ) : (
                  purchaseOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{order.supplier?.name || "-"}</TableCell>
                      <TableCell>{formatDate(order.orderDate)}</TableCell>
                      <TableCell>{formatDate(order.expectedDate)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewOrder(order)}
                            title="查看详情"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyOrder(order)}
                            title="复制订单"
                          >
                            <CopyIcon className="h-4 w-4" />
                          </Button>

                          {order.status !== "received" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditOrder(order)}
                                title="编辑订单"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>

                              {order.status !== "cancelled" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleReceiveOrder(order)}
                                  title="入库"
                                >
                                  <TruckIcon className="h-4 w-4" />
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteOrder(order.id)}
                                title="删除订单"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {totalOrders > 0 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                共 {totalOrders} 条记录，当前显示 {page * limit + 1} - {Math.min((page + 1) * limit, totalOrders)}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * limit >= totalOrders}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 查看订单对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>采购订单详情</DialogTitle>
            <DialogDescription>
              查看采购订单详细信息
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium">订单编号</h3>
                      <p>{selectedOrder.orderNumber}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">采购日期</h3>
                      <p>{formatDate(selectedOrder.orderDate)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">供应商</h3>
                      <p>{selectedOrder.supplier?.name || "-"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">采购员工</h3>
                      <p>{selectedOrder.employee?.name || "-"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">预计到货日期</h3>
                      <p>{formatDate(selectedOrder.expectedDate)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">状态</h3>
                      <p>{getStatusBadge(selectedOrder.status)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">总金额</h3>
                      <p>{formatCurrency(selectedOrder.totalAmount)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">付款状态</h3>
                      <p>{getPaymentStatusBadge(selectedOrder.paymentStatus)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">已付金额</h3>
                      <p>{formatCurrency(selectedOrder.paidAmount)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">付款方式</h3>
                      <p>{selectedOrder.paymentMethod || "-"}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">备注</h3>
                    <p className="text-sm">{selectedOrder.notes || "-"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">订单项目</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>产品</TableHead>
                            <TableHead>数量</TableHead>
                            <TableHead>单价</TableHead>
                            <TableHead>小计</TableHead>
                            <TableHead>已收货数量</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrder.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.product?.name || "-"}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{formatCurrency(item.price)}</TableCell>
                              <TableCell>{formatCurrency(item.quantity * item.price)}</TableCell>
                              <TableCell>{item.receivedQuantity}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                {/* 审批流程 */}
                <div className="md:col-span-1 space-y-4">
                  <PurchaseOrderWorkflow
                    order={selectedOrder}
                    onWorkflowUpdated={loadPurchaseOrders}
                  />

                  <EntityAuditLog
                    entityType="purchase"
                    entityId={selectedOrder.id.toString()}
                    limit={5}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  handleCopyOrder(selectedOrder);
                  setIsViewDialogOpen(false);
                }}
              >
                <CopyIcon className="mr-2 h-4 w-4" />
                复制订单
              </Button>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                关闭
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 采购订单表单对话框 */}
      {isFormDialogOpen && (
        <PurchaseOrderForm
          open={isFormDialogOpen}
          onOpenChange={setIsFormDialogOpen}
          order={selectedOrder}
          suppliers={suppliers}
          employees={employees}
          products={products}
          isEditing={isEditing}
          onSaved={handleOrderSaved}
        />
      )}

      {/* 采购入库对话框 */}
      {isReceiveDialogOpen && selectedOrder && (
        <PurchaseReceiveDialog
          open={isReceiveDialogOpen}
          onOpenChange={setIsReceiveDialogOpen}
          order={selectedOrder}
          warehouses={warehouses}
          onReceived={handleOrderReceived}
        />
      )}
    </div>
  )
}
