"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  PlusIcon,
  TrashIcon,
  SearchIcon,
  PackageIcon,
  CalendarIcon,
  UserIcon,
  BuildingIcon,
  ClipboardCheckIcon,
  DollarSignIcon,
  FileTextIcon,
  XIcon,
  CheckIcon,
  SaveIcon,
  Loader2Icon,
  KeyboardIcon,
  ListIcon,
  ShoppingCartIcon,
  SearchXIcon,
  PencilIcon
} from "lucide-react"
import { createPurchaseOrder, updatePurchaseOrder } from "@/lib/actions/purchase-actions";
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface Product {
  id: number
  name: string
  cost?: number
  price: number
  imageUrl?: string
  dimensions?: string
  category?: string
  unit?: string
  tempQuantity?: number // 临时存储产品数量的属性
}

interface Supplier {
  id: number
  name: string
  contactPerson?: string
  phone?: string
  email?: string
}

interface Employee {
  id: number
  name: string
  position?: string
}

interface PurchaseOrderItem {
  id?: number
  productId: string
  quantity: number
  price: number
  notes?: string
  receivedQuantity?: number
}

interface PurchaseOrderFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: any
  suppliers: Supplier[]
  employees: Employee[]
  products: Product[]
  isEditing: boolean
  onSaved: () => void
}

export function PurchaseOrderForm({
  open,
  onOpenChange,
  order,
  suppliers,
  employees,
  products,
  isEditing,
  onSaved,
}: PurchaseOrderFormProps) {
  const [formData, setFormData] = useState({
    id: 0,
    supplierId: "",
    employeeId: "",
    orderDate: new Date().toISOString().split("T")[0],
    expectedDate: "",
    status: "pending",
    totalAmount: 0,
    paidAmount: 0,
    paymentStatus: "unpaid",
    paymentMethod: "",
    notes: "",
    items: [] as PurchaseOrderItem[],
  })

  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [showProductSearch, setShowProductSearch] = useState(false)

  const [newItem, setNewItem] = useState<PurchaseOrderItem>({
    productId: "",
    quantity: 1,
    price: 0,
    notes: "",
  })

  const [errors, setErrors] = useState({
    supplierId: false,
    employeeId: false,
    items: false,
    orderDate: false,
  })

  // Refs for keyboard shortcuts
  const addItemButtonRef = useRef<HTMLButtonElement>(null)
  const saveButtonRef = useRef<HTMLButtonElement>(null)

  // 计算订单总金额的函数
  const calculateTotal = (items: PurchaseOrderItem[]) => {
    return items.reduce((total, item) => total + item.quantity * item.price, 0)
  }

  // Filtered products based on search query
  const filteredProducts = productSearchQuery.trim() === ""
    ? products
    : products.filter(product => {
        const searchTerm = productSearchQuery.toLowerCase();
        const categoryText = typeof product.category === 'object'
          ? product.category?.name?.toLowerCase()
          : typeof product.category === 'string'
            ? product.category.toLowerCase()
            : '';

        return product.name.toLowerCase().includes(searchTerm) ||
          (categoryText && categoryText.includes(searchTerm)) ||
          (product.dimensions?.toLowerCase()?.includes(searchTerm) || false);
      })

  // 处理编辑模式下的订单初始化
  useEffect(() => {
    if (isEditing && order) {
      setFormData({
        id: order.id,
        supplierId: order.supplierId.toString(),
        employeeId: order.employeeId.toString(),
        orderDate: new Date(order.orderDate).toISOString().split("T")[0],
        expectedDate: order.expectedDate ? new Date(order.expectedDate).toISOString().split("T")[0] : "",
        status: order.status,
        totalAmount: order.totalAmount,
        paidAmount: order.paidAmount,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod || "",
        notes: order.notes || "",
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId.toString(),
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || "",
        })),
      })
    }
  }, [isEditing, order])

  // 处理非编辑模式下的订单初始化（新建或复制）
  useEffect(() => {
    if (!isEditing && order) {
      // 如果是从模板或复制创建的订单
      setFormData({
        id: 0,
        supplierId: order.supplierId?.toString() || "",
        employeeId: order.employeeId?.toString() || "",
        orderDate: order.orderDate || new Date().toISOString().split("T")[0],
        expectedDate: order.expectedDate || "",
        status: order.status || "pending",
        totalAmount: order.totalAmount || 0,
        paidAmount: order.paidAmount || 0,
        paymentStatus: order.paymentStatus || "unpaid",
        paymentMethod: order.paymentMethod || "",
        notes: order.notes || "",
        items: Array.isArray(order.items) ? order.items.map((item) => ({
          productId: item.productId.toString(),
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || "",
        })) : [],
      })

      // 如果是从模板创建的订单，可能需要重新计算总金额
      if (Array.isArray(order.items) && (!order.totalAmount || order.totalAmount === 0)) {
        const calculatedItems = order.items.map(item => ({
          productId: item.productId.toString(),
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || "",
        }));
        const calculatedTotal = calculateTotal(calculatedItems);
        setFormData(prev => ({
          ...prev,
          totalAmount: calculatedTotal
        }));
      }
    }
  }, [isEditing, order, calculateTotal])

  // Add keyboard shortcut effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+A: Add item
      if (e.altKey && e.key === 'a' && addItemButtonRef.current && !isLoading) {
        e.preventDefault()
        addItemButtonRef.current.click()
      }

      // Alt+S: Save order
      if (e.altKey && e.key === 's' && saveButtonRef.current && !isLoading) {
        e.preventDefault()
        saveButtonRef.current.click()
      }

      // Escape: Close product search
      if (e.key === 'Escape' && showProductSearch) {
        e.preventDefault()
        setShowProductSearch(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLoading, showProductSearch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    // Clear error for this field if it exists
    if (errors[name as keyof typeof errors]) {
      setErrors({ ...errors, [name]: false })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
    if (name === "supplierId" || name === "employeeId" || name === "orderDate") {
      setErrors({ ...errors, [name]: false })
    }
  }

  const handleNewItemChange = (name: string, value: any) => {
    setNewItem({ ...newItem, [name]: value })
  }

  const handleAddItem = () => {
    if (!newItem.productId) {
      toast({
        title: "错误",
        description: "请选择产品",
        variant: "destructive",
      })
      return
    }

    if (newItem.quantity <= 0) {
      toast({
        title: "错误",
        description: "数量必须大于0",
        variant: "destructive",
      })
      return
    }

    if (newItem.price <= 0) {
      toast({
        title: "错误",
        description: "价格必须大于0",
        variant: "destructive",
      })
      return
    }

    // 检查是否已存在相同产品
    const existingItemIndex = formData.items.findIndex(
      (item) => item.productId === newItem.productId
    )

    if (existingItemIndex >= 0) {
      // 更新现有项
      const updatedItems = [...formData.items]
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + newItem.quantity,
        price: newItem.price, // 使用新价格
      }
      setFormData({
        ...formData,
        items: updatedItems,
        totalAmount: calculateTotal(updatedItems),
      })

      toast({
        title: "已更新",
        description: `已更新产品数量: ${products.find(p => p.id.toString() === newItem.productId)?.name}`,
      })
    } else {
      // 添加新项
      const updatedItems = [
        ...formData.items,
        {
          productId: newItem.productId,
          quantity: newItem.quantity,
          price: newItem.price,
          notes: newItem.notes,
        },
      ]
      setFormData({
        ...formData,
        items: updatedItems,
        totalAmount: calculateTotal(updatedItems),
      })

      toast({
        title: "已添加",
        description: `已添加产品: ${products.find(p => p.id.toString() === newItem.productId)?.name}`,
      })
    }

    // 重置新项表单
    setNewItem({
      productId: "",
      quantity: 1,
      price: 0,
      notes: "",
    })

    // 清除错误
    setErrors({ ...errors, items: false })

    // Hide product search if it's open
    setShowProductSearch(false)
  }

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...formData.items]
    const removedItem = updatedItems[index]
    const productName = products.find(p => p.id.toString() === removedItem.productId)?.name

    updatedItems.splice(index, 1)
    setFormData({
      ...formData,
      items: updatedItems,
      totalAmount: calculateTotal(updatedItems),
    })

    toast({
      title: "已移除",
      description: `已移除产品: ${productName || '未知产品'}`,
    })
  }



  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p.id.toString() === productId)
    if (product) {
      setNewItem({
        ...newItem,
        productId,
        price: product.cost || product.price || 0,
      })
    }
  }

  const handleProductSearchSelect = (product: Product) => {
    setNewItem({
      ...newItem,
      productId: product.id.toString(),
      price: product.cost || product.price || 0,
    })
    setShowProductSearch(false)
    setProductSearchQuery("")
  }

  const validateForm = () => {
    const newErrors = {
      supplierId: !formData.supplierId,
      employeeId: !formData.employeeId,
      items: formData.items.length === 0,
      orderDate: !formData.orderDate,
    }
    setErrors(newErrors)
    return !Object.values(newErrors).some(Boolean)
  }

  const handleSubmitClick = () => {
    if (!validateForm()) {
      toast({
        title: "表单验证失败",
        description: "请填写所有必填字段",
        variant: "destructive",
      })
      return
    }

    // Show confirmation dialog
    setShowConfirmDialog(true)
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      if (isEditing) {
        await updatePurchaseOrder(formData.id, {
          supplierId: Number(formData.supplierId),
          employeeId: Number(formData.employeeId),
          orderDate: formData.orderDate,
          expectedDate: formData.expectedDate || null,
          status: formData.status,
          totalAmount: formData.totalAmount,
          paidAmount: Number(formData.paidAmount) || 0,
          paymentStatus: formData.paymentStatus,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
          items: formData.items.map((item) => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
            receivedQuantity: item.receivedQuantity || 0,
            notes: item.notes,
          })),
        })
        toast({
          title: "成功",
          description: "采购订单已更新",
        })
      } else {
        await createPurchaseOrder({
          supplierId: Number(formData.supplierId),
          employeeId: Number(formData.employeeId),
          orderDate: formData.orderDate,
          expectedDate: formData.expectedDate || null,
          status: formData.status,
          totalAmount: formData.totalAmount,
          paidAmount: Number(formData.paidAmount) || 0,
          paymentStatus: formData.paymentStatus,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
          items: formData.items.map((item) => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
            notes: item.notes,
          })),
        })
        toast({
          title: "成功",
          description: "采购订单已创建",
        })
      }
      onSaved()
    } catch (error) {
      console.error("Error saving purchase order:", error)
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "保存采购订单失败",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setShowConfirmDialog(false)
    }
  }

  // Format currency with Chinese Yuan symbol
  const formatCurrency = (amount: number) => {
    return `¥${Number(amount).toFixed(2)}`
  }

  // Get supplier and employee names for display
  const getSupplierName = (id: string) => {
    return suppliers.find(s => s.id.toString() === id)?.name || "未选择"
  }

  const getEmployeeName = (id: string) => {
    return employees.find(e => e.id.toString() === id)?.name || "未选择"
  }

  // Toggle product search panel
  const toggleProductSearch = () => {
    setShowProductSearch(!showProductSearch)
    if (!showProductSearch) {
      setProductSearchQuery("")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "编辑采购订单" : (
                order && order.orderNumber ? `复制采购订单 (${order.orderNumber})` : "新建采购订单"
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? "修改采购订单信息" : (
                order && order.orderNumber ?
                "基于现有订单创建新的采购订单，您可以根据需要修改信息" :
                "创建新的采购订单"
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 h-full max-h-[calc(90vh-10rem)]">
            {/* 两栏布局：左侧基本信息，右侧产品添加和订单项 */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-1">
              {/* 左侧：基本信息和备注 */}
              <div className="lg:col-span-2 space-y-6">
                {/* 基本信息卡片 */}
                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    <h3 className="text-base font-medium mb-4 flex items-center">
                      <BuildingIcon className="h-4 w-4 mr-2" />
                      基本信息
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="supplierId" className={errors.supplierId ? "text-destructive" : ""}>
                          供应商 <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.supplierId}
                          onValueChange={(value) => handleSelectChange("supplierId", value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger id="supplierId" className={errors.supplierId ? "border-destructive" : ""}>
                            <SelectValue placeholder="选择供应商" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.supplierId && <p className="text-xs text-destructive mt-1">请选择供应商</p>}
                      </div>
                      <div>
                        <Label htmlFor="employeeId" className={errors.employeeId ? "text-destructive" : ""}>
                          采购员工 <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.employeeId}
                          onValueChange={(value) => handleSelectChange("employeeId", value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger id="employeeId" className={errors.employeeId ? "border-destructive" : ""}>
                            <SelectValue placeholder="选择员工" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                {employee.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.employeeId && <p className="text-xs text-destructive mt-1">请选择员工</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="orderDate" className={errors.orderDate ? "text-destructive" : ""}>
                            采购日期 <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="orderDate"
                            name="orderDate"
                            type="date"
                            value={formData.orderDate}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            className={errors.orderDate ? "border-destructive" : ""}
                          />
                          {errors.orderDate && <p className="text-xs text-destructive mt-1">请选择采购日期</p>}
                        </div>
                        <div>
                          <Label htmlFor="expectedDate">
                            预计到货日期
                          </Label>
                          <Input
                            id="expectedDate"
                            name="expectedDate"
                            type="date"
                            value={formData.expectedDate}
                            onChange={handleInputChange}
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="status">
                            订单状态
                          </Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) => handleSelectChange("status", value)}
                            disabled={isLoading}
                          >
                            <SelectTrigger id="status">
                              <SelectValue placeholder="选择状态" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">待处理</SelectItem>
                              <SelectItem value="confirmed">已确认</SelectItem>
                              <SelectItem value="cancelled">已取消</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="paymentStatus">
                            付款状态
                          </Label>
                          <Select
                            value={formData.paymentStatus}
                            onValueChange={(value) => handleSelectChange("paymentStatus", value)}
                            disabled={isLoading}
                          >
                            <SelectTrigger id="paymentStatus">
                              <SelectValue placeholder="选择付款状态" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unpaid">未付款</SelectItem>
                              <SelectItem value="partial">部分付款</SelectItem>
                              <SelectItem value="paid">已付款</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="paidAmount">
                            已付金额
                          </Label>
                          <Input
                            id="paidAmount"
                            name="paidAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.paidAmount}
                            onChange={handleInputChange}
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <Label htmlFor="paymentMethod">
                            付款方式
                          </Label>
                          <Input
                            id="paymentMethod"
                            name="paymentMethod"
                            value={formData.paymentMethod}
                            onChange={handleInputChange}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 备注卡片 */}
                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    <h3 className="text-base font-medium mb-4 flex items-center">
                      <FileTextIcon className="h-4 w-4 mr-2" />
                      备注信息
                    </h3>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="min-h-[120px]"
                      placeholder="输入订单备注信息..."
                    />
                  </CardContent>
                </Card>

                {/* 订单汇总信息 */}
                <Card className="shadow-sm bg-muted/30">
                  <CardContent className="pt-6">
                    <h3 className="text-base font-medium mb-4 flex items-center">
                      <DollarSignIcon className="h-4 w-4 mr-2" />
                      订单汇总
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">订单项数量:</span>
                        <span className="font-medium">{formData.items.length} 项</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">订单总金额:</span>
                        <span className="text-xl font-bold">{formatCurrency(formData.totalAmount)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 右侧：产品添加和订单项列表 */}
              <div className="lg:col-span-3 space-y-6">
                {/* 订单项目卡片 */}
                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-base font-medium flex items-center">
                        <PackageIcon className="h-4 w-4 mr-2" />
                        订单项目 <span className="text-destructive ml-1">*</span>
                      </h3>
                      {errors.items && (
                        <Badge variant="destructive" className="ml-2">
                          请添加至少一个订单项
                        </Badge>
                      )}
                    </div>

                    {/* 产品搜索面板 - 增强版 */}
                    <div className="mb-6 rounded-md border shadow-sm overflow-hidden">
                      <div className="bg-muted p-3 border-b">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="搜索产品名称、分类或尺寸..."
                              value={productSearchQuery}
                              onChange={(e) => {
                                setProductSearchQuery(e.target.value);
                                setShowProductSearch(true);
                              }}
                              className="pl-9 bg-background"
                              onFocus={() => setShowProductSearch(true)}
                            />
                            {productSearchQuery && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full"
                                onClick={() => setProductSearchQuery("")}
                              >
                                <XIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleProductSearch}
                            className="whitespace-nowrap"
                          >
                            {showProductSearch ? "隐藏列表" : "显示全部"}
                          </Button>
                        </div>
                      </div>

                      {showProductSearch && (
                        <div className="max-h-[320px] overflow-y-auto p-2 bg-background">
                          {filteredProducts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <SearchXIcon className="h-12 w-12 mx-auto mb-2 text-muted" />
                              <p>未找到匹配的产品</p>
                              <p className="text-xs mt-1">尝试使用其他关键词搜索</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {filteredProducts.map(product => (
                                <div
                                  key={product.id}
                                  className="border rounded-md overflow-hidden hover:border-primary transition-colors"
                                >
                                  <div className="p-3 flex items-start gap-3">
                                    {/* 产品图片 */}
                                    {product.imageUrl ? (
                                      <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="w-14 h-14 object-cover rounded-md flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-14 h-14 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                                        <PackageIcon className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                    )}

                                    {/* 产品信息 */}
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-base truncate">{product.name}</div>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {product.dimensions && (
                                          <Badge variant="outline" className="text-xs">
                                            {product.dimensions}
                                          </Badge>
                                        )}
                                        {product.category && (
                                          <Badge variant="secondary" className="text-xs">
                                            {typeof product.category === 'object' ? product.category.name : product.category}
                                          </Badge>
                                        )}
                                        {product.unit && (
                                          <Badge variant="outline" className="text-xs bg-blue-50">
                                            {product.unit}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="mt-2 flex items-center justify-between">
                                        <div className="font-medium text-primary">
                                          {formatCurrency(product.cost || product.price)}
                                        </div>

                                        {/* 快速添加控件 */}
                                        <div className="flex items-center gap-2">
                                          <Input
                                            type="number"
                                            min="1"
                                            placeholder="数量"
                                            defaultValue="1"
                                            className="w-20 h-8"
                                            onChange={(e) => {
                                              product.tempQuantity = parseInt(e.target.value) || 1;
                                            }}
                                          />
                                          <Button
                                            size="sm"
                                            className="h-8"
                                            onClick={() => {
                                              const quantity = product.tempQuantity || 1;
                                              setNewItem({
                                                productId: product.id.toString(),
                                                quantity: quantity,
                                                price: product.cost || product.price || 0,
                                                notes: "",
                                              });
                                              handleAddItem();
                                            }}
                                          >
                                            <PlusIcon className="h-4 w-4 mr-1" />
                                            添加
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 手动添加项目 - 优化版 */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium flex items-center">
                          <PencilIcon className="h-3.5 w-3.5 mr-1.5" />
                          手动添加产品
                        </h4>
                        <div className="text-xs text-muted-foreground">
                          按 Alt+A 快速添加
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-12 md:col-span-5">
                          <Label htmlFor="product-select" className="text-xs mb-1.5 block">产品</Label>
                          <Select
                            value={newItem.productId}
                            onValueChange={(value) => handleProductSelect(value)}
                            disabled={isLoading}
                          >
                            <SelectTrigger id="product-select">
                              <SelectValue placeholder="选择产品" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <Label htmlFor="quantity-input" className="text-xs mb-1.5 block">数量</Label>
                          <Input
                            id="quantity-input"
                            type="number"
                            min="1"
                            placeholder="数量"
                            value={newItem.quantity}
                            onChange={(e) => handleNewItemChange("quantity", parseInt(e.target.value) || 1)}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <Label htmlFor="price-input" className="text-xs mb-1.5 block">单价</Label>
                          <Input
                            id="price-input"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="单价"
                            value={newItem.price}
                            onChange={(e) => handleNewItemChange("price", parseFloat(e.target.value) || 0)}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <Label htmlFor="notes-input" className="text-xs mb-1.5 block">备注</Label>
                          <Input
                            id="notes-input"
                            placeholder="备注"
                            value={newItem.notes}
                            onChange={(e) => handleNewItemChange("notes", e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="col-span-12 md:col-span-1 flex justify-end">
                          <Button
                            type="button"
                            onClick={handleAddItem}
                            disabled={isLoading || !newItem.productId}
                            ref={addItemButtonRef}
                            className="w-full md:w-auto"
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            添加
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* 订单项列表 */}
                    <div>
                      <h4 className="text-sm font-medium flex items-center mb-3">
                        <ListIcon className="h-3.5 w-3.5 mr-1.5" />
                        已添加产品 ({formData.items.length})
                      </h4>

                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="font-medium">产品</TableHead>
                              <TableHead className="font-medium text-center">数量</TableHead>
                              <TableHead className="font-medium text-right">单价</TableHead>
                              <TableHead className="font-medium text-right">小计</TableHead>
                              <TableHead className="font-medium">备注</TableHead>
                              <TableHead className="w-[60px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {formData.items.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center">
                                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                                    <ShoppingCartIcon className="h-10 w-10 mb-2" />
                                    <p>暂无订单项</p>
                                    <p className="text-xs mt-1">请使用上方搜索或手动添加产品</p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : (
                              formData.items.map((item, index) => {
                                const product = products.find((p) => p.id.toString() === item.productId)
                                return (
                                  <TableRow key={index} className="hover:bg-muted/20">
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        {product?.imageUrl ? (
                                          <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-10 h-10 object-cover rounded-md"
                                          />
                                        ) : (
                                          <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                                            <PackageIcon className="h-5 w-5 text-muted-foreground" />
                                          </div>
                                        )}
                                        <div>
                                          <div className="font-medium">{product?.name || "-"}</div>
                                          {product?.dimensions && (
                                            <div className="text-xs text-muted-foreground">{product.dimensions}</div>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(item.quantity * item.price)}</TableCell>
                                    <TableCell>
                                      {item.notes ? (
                                        <span>{item.notes}</span>
                                      ) : (
                                        <span className="text-muted-foreground text-xs">无</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveItem(index)}
                                        disabled={isLoading}
                                        className="hover:bg-red-50 hover:text-red-600"
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                )
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {formData.items.length > 0 && (
                        <div className="flex justify-end mt-4 bg-muted/20 p-3 rounded-md">
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">订单总计</div>
                            <div className="text-xl font-bold text-primary">{formatCurrency(formData.totalAmount)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="pt-4 border-t">
            <div className="flex items-center gap-2 mr-auto">
              <KeyboardIcon className="h-4 w-4 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">
                按 <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Alt+S</kbd> 保存订单
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="gap-2"
            >
              <XIcon className="h-4 w-4" />
              取消
            </Button>
            <Button
              onClick={handleSubmitClick}
              disabled={isLoading}
              ref={saveButtonRef}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4" />
                  保存订单
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 确认对话框 */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg">
              <ClipboardCheckIcon className="h-5 w-5" />
              确认{isEditing ? "更新" : "创建"}采购订单
            </AlertDialogTitle>
            <AlertDialogDescription>
              请确认以下采购订单信息是否正确：
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4 p-4 border rounded-md bg-muted/30 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">供应商</div>
                <div className="font-medium">{getSupplierName(formData.supplierId)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">采购员工</div>
                <div className="font-medium">{getEmployeeName(formData.employeeId)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">采购日期</div>
                <div className="font-medium">{formData.orderDate}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">预计到货日期</div>
                <div className="font-medium">{formData.expectedDate || "未设置"}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">订单状态</div>
                <div className="font-medium">
                  {formData.status === "pending" && "待处理"}
                  {formData.status === "confirmed" && "已确认"}
                  {formData.status === "cancelled" && "已取消"}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">付款状态</div>
                <div className="font-medium">
                  {formData.paymentStatus === "unpaid" && "未付款"}
                  {formData.paymentStatus === "partial" && "部分付款"}
                  {formData.paymentStatus === "paid" && "已付款"}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">订单项数量</div>
                  <div className="font-medium">{formData.items.length} 项</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">订单总金额</div>
                  <div className="text-lg font-bold text-primary">{formatCurrency(formData.totalAmount)}</div>
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} className="gap-2">
              <XIcon className="h-4 w-4" />
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  确认{isEditing ? "更新" : "创建"}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
