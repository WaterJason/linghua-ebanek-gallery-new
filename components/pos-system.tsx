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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SmartInput } from "@/components/ui/smart-input"
import { SmartTooltip } from "@/components/ui/tooltip"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PlusIcon, MinusIcon, SearchIcon, ShoppingCartIcon, UserIcon, ImageIcon, TrashIcon } from "lucide-react"
import { getProducts } from "@/lib/actions/product-actions";
import { getEmployees } from "@/lib/actions/employee-actions";
import { getWarehouses } from "@/lib/actions/inventory-actions";
import { getCustomers, createCustomer } from "@/lib/actions/customer-actions";
import { createPosSale } from "@/lib/actions/pos-actions";
import { toast } from "@/components/ui/use-toast"

// 导入增强操作系统
import { useEnhancedOperations } from "@/lib/enhanced-operations-integration"

// 类型定义
interface Product {
  id: number
  name: string
  price: number
  sku?: string | null
  barcode?: string | null
  imageUrl?: string | null
}

interface Employee {
  id: number
  name: string
}

interface Warehouse {
  id: number
  name: string
}

interface Customer {
  id: number
  name: string
  phone?: string | null
  email?: string | null
}

interface CartItem {
  productId: number
  productName: string
  price: number
  quantity: number
  discount: number
  imageUrl?: string | null
}

export function PosSystem() {
  // 增强操作系统
  const { executeOperation, executeFormOperation } = useEnhancedOperations()

  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [selectedWarehouse, setSelectedWarehouse] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false)
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState("")

  // 智能建议数据
  const productSearchSuggestions = [
    { id: '1', value: '掐丝珐琅手镯', label: '掐丝珐琅手镯', category: '热销产品', frequency: 15 },
    { id: '2', value: '珐琅耳环', label: '珐琅耳环', category: '热销产品', frequency: 12 },
    { id: '3', value: '景泰蓝花瓶', label: '景泰蓝花瓶', category: '装饰品', frequency: 8 },
    { id: '4', value: '珐琅胸针', label: '珐琅胸针', category: '配饰', frequency: 6 },
  ]

  const customerNameSuggestions = [
    { id: '1', value: '张女士', label: '张女士', category: '常客', frequency: 10 },
    { id: '2', value: '李先生', label: '李先生', category: '常客', frequency: 8 },
    { id: '3', value: '王总', label: '王总', category: 'VIP客户', frequency: 6 },
    { id: '4', value: '散客', label: '散客', category: '临时客户', frequency: 20 },
  ]

  useEffect(() => {
    loadProducts()
    loadEmployees()
    loadWarehouses()
    loadCustomers()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (product.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [searchQuery, products])

  const loadProducts = async () => {
    try {
      const data = await getProducts()
      setProducts(data)
      setFilteredProducts(data)
    } catch (error) {
      console.error("Error loading products:", error)
      toast({
        title: "错误",
        description: "加载产品列表失败",
        variant: "destructive",
      })
    }
  }

  const loadEmployees = async () => {
    try {
      const data = await getEmployees()
      setEmployees(data)
      if (data.length > 0) {
        setSelectedEmployee(data[0].id.toString())
      }
    } catch (error) {
      console.error("Error loading employees:", error)
      toast({
        title: "错误",
        description: "加载员工列表失败",
        variant: "destructive",
      })
    }
  }

  const loadWarehouses = async () => {
    try {
      const data = await getWarehouses()
      setWarehouses(data)
      if (data.length > 0) {
        setSelectedWarehouse(data[0].id.toString())
      }
    } catch (error) {
      console.error("Error loading warehouses:", error)
      toast({
        title: "错误",
        description: "加载仓库列表失败",
        variant: "destructive",
      })
    }
  }

  const loadCustomers = async () => {
    try {
      const data = await getCustomers(undefined, customerSearchQuery)
      setCustomers(data)
    } catch (error) {
      console.error("Error loading customers:", error)
      toast({
        title: "错误",
        description: "加载客户列表失败",
        variant: "destructive",
      })
    }
  }

  const handleAddToCart = (product: Product) => {
    const existingItem = cartItems.find((item) => item.productId === product.id)
    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      )
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 1,
          discount: 0,
          imageUrl: product.imageUrl,
        },
      ])
    }
  }

  const handleUpdateCartItem = (index: number, field: keyof CartItem, value: any) => {
    const newCartItems = [...cartItems]
    newCartItems[index][field] = value
    setCartItems(newCartItems)
  }

  const handleRemoveCartItem = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index))
  }

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomer(customerId)
    setIsCustomerDialogOpen(false)
  }

  const handleCreateCustomer = async () => {
    if (!newCustomer.name) {
      toast({
        title: "错误",
        description: "客户名称为必填项",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await executeFormOperation(
        async () => {
          return await createCustomer(newCustomer)
        },
        null,
        newCustomer,
        '创建客户',
        'sales',
        {
          playSound: true,
          soundType: 'success',
          enableUndo: true,
          undoTags: ['create', 'customer'],
          undoPriority: 5
        }
      )

      if (result.success && result.data) {
        setSelectedCustomer(result.data.id.toString())
      }
      setIsNewCustomerDialogOpen(false)
      loadCustomers()
    } catch (error) {
      console.error("Error creating customer:", error)
      // 错误已由增强操作系统处理
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "错误",
        description: "购物车为空",
        variant: "destructive",
      })
      return
    }

    if (!selectedEmployee) {
      toast({
        title: "错误",
        description: "请选择销售员",
        variant: "destructive",
      })
      return
    }

    if (!selectedWarehouse) {
      toast({
        title: "错误",
        description: "请选择仓库",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const customerInfo = selectedCustomer
        ? null
        : {
            name: "散客",
          }

      const saleData = {
        employeeId: selectedEmployee,
        customerId: selectedCustomer || null,
        customerInfo,
        items: cartItems,
        warehouseId: selectedWarehouse,
        paymentMethod,
      }

      await executeFormOperation(
        async () => {
          return await createPosSale(saleData)
        },
        null,
        saleData,
        'POS销售',
        'sales',
        {
          playSound: true,
          soundType: 'success',
          enableUndo: true,
          undoTags: ['create', 'pos-sale'],
          undoPriority: 6
        }
      )

      // 清空购物车
      setCartItems([])
      setIsCheckoutDialogOpen(false)
    } catch (error) {
      console.error("Error creating POS sale:", error)
      // 错误已由增强操作系统处理
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity - item.discount)
    }, 0)
  }

  const getSelectedCustomerName = () => {
    if (!selectedCustomer) return "散客"
    const customer = customers.find((c) => c.id.toString() === selectedCustomer)
    return customer ? customer.name : "散客"
  }

  const getSelectedEmployeeName = () => {
    if (!selectedEmployee) return ""
    const employee = employees.find((e) => e.id.toString() === selectedEmployee)
    return employee ? employee.name : ""
  }

  const getSelectedWarehouseName = () => {
    if (!selectedWarehouse) return ""
    const warehouse = warehouses.find((w) => w.id.toString() === selectedWarehouse)
    return warehouse ? warehouse.name : ""
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 产品列表 */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>产品列表</CardTitle>
                <div className="relative w-64">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <SmartTooltip
                    content="搜索产品名称、SKU或条形码，支持智能建议"
                    type="help"
                    title="产品搜索"
                  >
                    <SmartInput
                      suggestions={productSearchSuggestions}
                      value={searchQuery}
                      onChange={setSearchQuery}
                      onSuggestionSelect={(suggestion) => {
                        setSearchQuery(suggestion.value)
                      }}
                      placeholder="搜索产品..."
                      showHistory={true}
                      showFrequent={true}
                      className="pl-8"
                    />
                  </SmartTooltip>
                </div>
              </div>
            </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleAddToCart(product)}
                  >
                    <CardContent className="p-2">
                      <div className="aspect-square w-full overflow-hidden rounded-md">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg"
                            }}
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <h3 className="text-sm font-medium">{product.name}</h3>
                        <p className="text-sm font-bold">¥{product.price.toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* 购物车 */}
      <div>
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>购物车</CardTitle>
              <SmartTooltip
                content="选择客户，可以选择现有客户或创建新客户"
                type="info"
                title="选择客户"
              >
                <Button variant="outline" size="sm" onClick={() => setIsCustomerDialogOpen(true)}>
                  <UserIcon className="h-4 w-4 mr-2" />
                  {getSelectedCustomerName()}
                </Button>
              </SmartTooltip>
            </div>
            <CardDescription>
              销售员: {getSelectedEmployeeName()}
              <br />
              仓库: {getSelectedWarehouseName()}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow overflow-auto">
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCartIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">购物车为空</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>产品</TableHead>
                    <TableHead className="text-right">单价</TableHead>
                    <TableHead className="text-right">数量</TableHead>
                    <TableHead className="text-right">折扣</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cartItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <Input
                            type="number"
                            value={item.price}
                            onChange={(e) =>
                              handleUpdateCartItem(index, "price", parseFloat(e.target.value) || 0)
                            }
                            className="w-20 text-right"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              handleUpdateCartItem(
                                index,
                                "quantity",
                                Math.max(1, item.quantity - 1)
                              )
                            }
                          >
                            <MinusIcon className="h-3 w-3" />
                          </Button>
                          <span className="mx-2">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              handleUpdateCartItem(index, "quantity", item.quantity + 1)
                            }
                          >
                            <PlusIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <Input
                            type="number"
                            value={item.discount || 0}
                            onChange={(e) =>
                              handleUpdateCartItem(index, "discount", parseFloat(e.target.value) || 0)
                            }
                            className="w-20 text-right"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <SmartTooltip
                          content="从购物车中移除此商品"
                          type="warning"
                          title="移除商品"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveCartItem(index)}
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </SmartTooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter className="flex-col items-stretch space-y-2 pt-6">
            <div className="flex justify-between text-lg font-bold">
              <span>总计:</span>
              <span>¥{calculateTotal().toFixed(2)}</span>
            </div>
            <SmartTooltip
              content="确认购物车商品并进行结账，需要选择销售员和仓库"
              type="success"
              title="结账"
            >
              <Button
                className="w-full"
                size="lg"
                disabled={cartItems.length === 0}
                onClick={() => setIsCheckoutDialogOpen(true)}
              >
                结账
              </Button>
            </SmartTooltip>
          </CardFooter>
        </Card>
      </div>

      {/* 选择客户对话框 */}
      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>选择客户</DialogTitle>
            <DialogDescription>选择一个现有客户或创建新客户</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <SmartTooltip
                  content="搜索现有客户，支持按姓名、电话或邮箱搜索"
                  type="info"
                  title="客户搜索"
                >
                  <SmartInput
                    suggestions={customerNameSuggestions}
                    value={customerSearchQuery}
                    onChange={setCustomerSearchQuery}
                    onSuggestionSelect={(suggestion) => {
                      setCustomerSearchQuery(suggestion.value)
                    }}
                    placeholder="搜索客户..."
                    showHistory={true}
                    showFrequent={true}
                    className="pl-8"
                    onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      loadCustomers()
                    }
                  }}
                  />
                </SmartTooltip>
              </div>
              <Button variant="outline" onClick={loadCustomers}>
                搜索
              </Button>
              <SmartTooltip
                content="创建新客户，填写基本信息后可立即使用"
                type="help"
                title="新建客户"
              >
                <Button onClick={() => setIsNewCustomerDialogOpen(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  新建
                </Button>
              </SmartTooltip>
            </div>

            <div className="max-h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>客户名称</TableHead>
                    <TableHead>电话</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">散客</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleSelectCustomer("")}>
                        选择
                      </Button>
                    </TableCell>
                  </TableRow>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.phone || "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectCustomer(customer.id.toString())}
                        >
                          选择
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomerDialogOpen(false)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新建客户对话框 */}
      <Dialog open={isNewCustomerDialogOpen} onOpenChange={setIsNewCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建客户</DialogTitle>
            <DialogDescription>创建新客户信息</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <SmartTooltip
                content="输入客户姓名，必填项"
                type="help"
                title="客户名称"
              >
                <Label htmlFor="name" className="text-right">
                  客户名称
                </Label>
              </SmartTooltip>
              <SmartInput
                id="name"
                suggestions={customerNameSuggestions}
                value={newCustomer.name}
                onChange={(value) => setNewCustomer({ ...newCustomer, name: value })}
                onSuggestionSelect={(suggestion) => {
                  setNewCustomer({ ...newCustomer, name: suggestion.value })
                }}
                placeholder="输入客户名称"
                showHistory={true}
                showFrequent={true}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <SmartTooltip
                content="输入客户联系电话，便于后续联系"
                type="info"
                title="联系电话"
              >
                <Label htmlFor="phone" className="text-right">
                  电话
                </Label>
              </SmartTooltip>
              <Input
                id="phone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                placeholder="请输入联系电话"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <SmartTooltip
                content="输入客户邮箱地址，用于发送订单确认"
                type="info"
                title="邮箱地址"
              >
                <Label htmlFor="email" className="text-right">
                  邮箱
                </Label>
              </SmartTooltip>
              <Input
                id="email"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                placeholder="请输入邮箱地址"
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewCustomerDialogOpen(false)}>
              取消
            </Button>
            <SmartTooltip
              content="保存新客户信息，确保客户名称已填写"
              type="success"
              title="保存客户"
            >
              <Button onClick={handleCreateCustomer} disabled={isLoading}>
                {isLoading ? "保存中..." : "保存"}
              </Button>
            </SmartTooltip>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 结账对话框 */}
      <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认结账</DialogTitle>
            <DialogDescription>确认销售信息并完成结账</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employee">销售员</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择销售员" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="warehouse">仓库</Label>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择仓库" />
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
            </div>

            <div>
              <Label htmlFor="paymentMethod">支付方式</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="选择支付方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">现金</SelectItem>
                  <SelectItem value="wechat">微信</SelectItem>
                  <SelectItem value="alipay">支付宝</SelectItem>
                  <SelectItem value="card">银行卡</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>客户</Label>
              <div className="flex items-center justify-between p-2 border rounded-md">
                <span>{getSelectedCustomerName()}</span>
                <Button variant="outline" size="sm" onClick={() => setIsCustomerDialogOpen(true)}>
                  更改
                </Button>
              </div>
            </div>

            <div>
              <Label>商品清单</Label>
              <div className="max-h-[200px] overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>产品</TableHead>
                      <TableHead className="text-right">单价</TableHead>
                      <TableHead className="text-right">数量</TableHead>
                      <TableHead className="text-right">小计</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cartItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-right">¥{item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          ¥{((item.price * item.quantity) - item.discount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="text-right text-lg font-bold">
              总计: ¥{calculateTotal().toFixed(2)}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutDialogOpen(false)}>
              取消
            </Button>
            <SmartTooltip
              content="确认所有信息无误后完成结账，将扣减库存并生成销售记录"
              type="success"
              title="确认结账"
            >
              <Button onClick={handleCheckout} disabled={isLoading}>
                {isLoading ? "处理中..." : "确认结账"}
              </Button>
            </SmartTooltip>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  )
}
