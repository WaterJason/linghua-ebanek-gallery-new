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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlusIcon, SearchIcon, ArrowRightIcon, CalendarIcon, ChevronDownIcon, PencilIcon, Scissors } from "lucide-react"
import { getOrders, updateOrder } from "@/lib/actions/sales-actions";
import { getCustomers } from "@/lib/actions/customer-actions";
import { getEmployees } from "@/lib/actions/employee-actions";
import { getWarehouses } from "@/lib/actions/inventory-actions";
import { getProducts } from "@/lib/actions/product-actions";
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { OrderForm } from "./order-form"
import { CustomOrderForm } from "./custom-order-form"
import { SalesOrderWorkflow } from "./sales/sales-order-workflow"
import { EntityAuditLog } from "./audit/entity-audit-log"

export function OrderManagement() {
  const [orders, setOrders] = useState([])
  const [totalOrders, setTotalOrders] = useState(0)
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false)
  const [isCustomOrderFormOpen, setIsCustomOrderFormOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({
    status: "all",
    customerId: "all",
    employeeId: "all",
    startDate: "",
    endDate: "",
    isCustom: "all",
  })
  const [page, setPage] = useState(0)
  const limit = 10

  useEffect(() => {
    loadOrders()
    loadCustomers()
    loadEmployees()
    loadWarehouses()
    loadProducts()
  }, [])

  useEffect(() => {
    loadOrders()
  }, [filters, page])

  const loadOrders = async () => {
    setIsLoading(true)
    try {
      const data = await getOrders(
        filters.status && filters.status !== "all" ? filters.status : undefined,
        filters.customerId && filters.customerId !== "all" ? Number(filters.customerId) : undefined,
        filters.employeeId && filters.employeeId !== "all" ? Number(filters.employeeId) : undefined,
        filters.startDate || undefined,
        filters.endDate || undefined,
        limit,
        page * limit,
        filters.isCustom !== "all" ? filters.isCustom === "custom" : undefined
      )
      setOrders(data.data)
      setTotalOrders(data.total)
    } catch (error) {
      console.error("Error loading orders:", error)
      toast({
        title: "错误",
        description: "加载订单列表失败",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadCustomers = async () => {
    try {
      const data = await getCustomers()
      setCustomers(data)
    } catch (error) {
      console.error("Error loading customers:", error)
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

  const handleChangeStatus = (order) => {
    setSelectedOrder(order)
    setIsStatusDialogOpen(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return

    setIsLoading(true)

    try {
      // 如果状态变为已完成，需要选择仓库
      if (selectedOrder.status === "completed" && !selectedOrder.warehouseId) {
        toast({
          title: "错误",
          description: "订单完成时需要选择出库仓库",
          variant: "destructive",
        })
        return
      }

      await updateOrder(selectedOrder.id, {
        status: selectedOrder.status,
        paymentStatus: selectedOrder.paymentStatus,
        paidAmount: selectedOrder.paidAmount,
        warehouseId: selectedOrder.warehouseId,
      })

      toast({
        title: "成功",
        description: "订单状态已更新",
      })

      setIsStatusDialogOpen(false)
      loadOrders()
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "错误",
        description: error.message || "更新订单状态失败",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value })
    setPage(0) // 重置页码
  }

  const handleClearFilters = () => {
    setFilters({
      status: "all",
      customerId: "all",
      employeeId: "all",
      startDate: "",
      endDate: "",
      isCustom: "all",
    })
    setPage(0)
  }

  const handleCreateOrder = () => {
    setSelectedOrder(null)
    setIsOrderFormOpen(true)
  }

  const handleCreateCustomOrder = () => {
    setSelectedOrder(null)
    setIsCustomOrderFormOpen(true)
  }

  const handleOrderSaved = () => {
    setIsOrderFormOpen(false)
    setIsCustomOrderFormOpen(false)
    loadOrders()
  }

  const handleEditOrder = (order) => {
    setSelectedOrder(order)
    if (order.isCustom) {
      setIsCustomOrderFormOpen(true)
    } else {
      setIsOrderFormOpen(true)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">待处理</Badge>
      case "processing":
        return <Badge variant="secondary">处理中</Badge>
      case "design":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100">设计中</Badge>
      case "production":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">生产中</Badge>
      case "completed":
        return <Badge variant="success">已完成</Badge>
      case "cancelled":
        return <Badge variant="destructive">已取消</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case "unpaid":
        return <Badge variant="outline">未支付</Badge>
      case "partial":
        return <Badge variant="secondary">部分支付</Badge>
      case "paid":
        return <Badge variant="success">已支付</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "yyyy-MM-dd HH:mm", { locale: zhCN })
    } catch (error) {
      return dateString
    }
  }

  const totalPages = Math.ceil(totalOrders / limit)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">订单管理</h3>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                新建订单
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCreateOrder}>
                <PlusIcon className="mr-2 h-4 w-4" />
                普通订单
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCreateCustomOrder}>
                <Scissors className="mr-2 h-4 w-4" />
                作品定制
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
        <div>
          <Label htmlFor="status-filter">订单状态</Label>
          <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="所有状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有状态</SelectItem>
              <SelectItem value="pending">待处理</SelectItem>
              <SelectItem value="processing">处理中</SelectItem>
              <SelectItem value="design">设计中</SelectItem>
              <SelectItem value="production">生产中</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="customer-filter">客户</Label>
          <Select value={filters.customerId} onValueChange={(value) => handleFilterChange("customerId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="所有客户" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有客户</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id.toString()}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="employee-filter">销售员</Label>
          <Select value={filters.employeeId} onValueChange={(value) => handleFilterChange("employeeId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="所有销售员" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有销售员</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id.toString()}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="order-type">订单类型</Label>
          <Select value={filters.isCustom} onValueChange={(value) => handleFilterChange("isCustom", value)}>
            <SelectTrigger>
              <SelectValue placeholder="所有类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有类型</SelectItem>
              <SelectItem value="regular">普通订单</SelectItem>
              <SelectItem value="custom">定制订单</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="date-filter">日期范围</Label>
          <div className="flex gap-2">
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="w-full"
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        <div className="flex items-end">
          <Button variant="outline" onClick={handleClearFilters} className="w-full">
            清除筛选
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>订单编号</TableHead>
              <TableHead>客户</TableHead>
              <TableHead>销售员</TableHead>
              <TableHead>订单日期</TableHead>
              <TableHead>金额</TableHead>
              <TableHead>订单状态</TableHead>
              <TableHead>支付状态</TableHead>
              <TableHead>订单类型</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  加载中...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  暂无订单数据
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.customer?.name || "-"}</TableCell>
                  <TableCell>{order.employee?.name || "-"}</TableCell>
                  <TableCell>{formatDate(order.orderDate)}</TableCell>
                  <TableCell>¥{order.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                  <TableCell>
                    {order.isCustom ? (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        定制订单
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        普通订单
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order)}>
                        查看
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditOrder(order)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleChangeStatus(order)}>
                        更新状态
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div>
            显示 {page * limit + 1} - {Math.min((page + 1) * limit, totalOrders)} 条，共 {totalOrders} 条
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
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* 查看订单对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>订单详情</DialogTitle>
            <DialogDescription>订单编号: {selectedOrder?.orderNumber}</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">客户信息</h4>
                      <p className="text-sm">{selectedOrder.customer?.name}</p>
                      <p className="text-sm">{selectedOrder.customer?.phone || "-"}</p>
                      <p className="text-sm">{selectedOrder.customer?.email || "-"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">订单信息</h4>
                      <p className="text-sm">销售员: {selectedOrder.employee?.name}</p>
                      <p className="text-sm">订单日期: {formatDate(selectedOrder.orderDate)}</p>
                      <p className="text-sm">
                        订单状态: {getStatusBadge(selectedOrder.status)}
                      </p>
                      <p className="text-sm">
                        支付状态: {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                      </p>
                      <p className="text-sm">
                        支付方式: {selectedOrder.paymentMethod || "-"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">订单项目</h4>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>产品</TableHead>
                            <TableHead className="text-right">单价</TableHead>
                            <TableHead className="text-right">数量</TableHead>
                            <TableHead className="text-right">折扣</TableHead>
                            <TableHead className="text-right">小计</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrder.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.product?.name}</TableCell>
                              <TableCell className="text-right">¥{item.price.toFixed(2)}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">¥{item.discount?.toFixed(2) || "0.00"}</TableCell>
                              <TableCell className="text-right">
                                ¥{((item.price * item.quantity) - (item.discount || 0)).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm">备注: {selectedOrder.notes || "-"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">总金额: ¥{selectedOrder.totalAmount.toFixed(2)}</p>
                      <p className="text-sm">已支付: ¥{selectedOrder.paidAmount.toFixed(2)}</p>
                      <p className="text-sm font-medium">
                        待支付: ¥{(selectedOrder.totalAmount - selectedOrder.paidAmount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 右侧边栏 */}
                <div className="md:col-span-1 space-y-4">
                  {/* 工作流组件 */}
                  <SalesOrderWorkflow
                    order={selectedOrder}
                    onWorkflowUpdated={loadOrders}
                  />

                  {/* 审计日志组件 */}
                  <EntityAuditLog
                    entityType="order"
                    entityId={selectedOrder.id.toString()}
                    limit={5}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 更新状态对话框 */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>更新订单状态</DialogTitle>
            <DialogDescription>订单编号: {selectedOrder?.orderNumber}</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  订单状态
                </Label>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value) => setSelectedOrder({ ...selectedOrder, status: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="选择订单状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">待处理</SelectItem>
                    <SelectItem value="processing">处理中</SelectItem>
                    {selectedOrder?.isCustom && (
                      <>
                        <SelectItem value="design">设计中</SelectItem>
                        <SelectItem value="production">生产中</SelectItem>
                      </>
                    )}
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedOrder.status === "completed" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="warehouse" className="text-right">
                    出库仓库
                  </Label>
                  <Select
                    value={selectedOrder.warehouseId?.toString() || ""}
                    onValueChange={(value) => setSelectedOrder({ ...selectedOrder, warehouseId: Number(value) })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="选择出库仓库" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentStatus" className="text-right">
                  支付状态
                </Label>
                <Select
                  value={selectedOrder.paymentStatus}
                  onValueChange={(value) => setSelectedOrder({ ...selectedOrder, paymentStatus: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="选择支付状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">未支付</SelectItem>
                    {selectedOrder?.isCustom && (
                      <SelectItem value="deposit">已付定金</SelectItem>
                    )}
                    <SelectItem value="partial">部分支付</SelectItem>
                    <SelectItem value="paid">已支付</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paidAmount" className="text-right">
                  已支付金额
                </Label>
                <Input
                  id="paidAmount"
                  type="number"
                  value={selectedOrder.paidAmount}
                  onChange={(e) =>
                    setSelectedOrder({
                      ...selectedOrder,
                      paidAmount: Number(e.target.value),
                      paymentStatus:
                        Number(e.target.value) === 0
                          ? "unpaid"
                          : Number(e.target.value) < selectedOrder.totalAmount
                          ? "partial"
                          : "paid",
                    })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateStatus} disabled={isLoading}>
              {isLoading ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 普通订单表单 */}
      <OrderForm
        open={isOrderFormOpen}
        onOpenChange={setIsOrderFormOpen}
        order={selectedOrder}
        customers={customers}
        employees={employees}
        products={products}
        warehouses={warehouses}
        onOrderSaved={handleOrderSaved}
      />

      {/* 定制订单表单 */}
      <CustomOrderForm
        open={isCustomOrderFormOpen}
        onOpenChange={setIsCustomOrderFormOpen}
        order={selectedOrder}
        customers={customers}
        employees={employees}
        products={products}
        warehouses={warehouses}
        onOrderSaved={handleOrderSaved}
      />
    </div>
  )
}
