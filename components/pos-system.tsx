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
import { PlusIcon, MinusIcon, SearchIcon, ShoppingCartIcon, UserIcon, ImageIcon, TrashIcon } from "lucide-react"
import { getProducts } from "@/lib/actions/product-actions";
import { getEmployees } from "@/lib/actions/employee-actions";
import { getWarehouses } from "@/lib/actions/inventory-actions";
import { getCustomers, createCustomer } from "@/lib/actions/customer-actions";
import { createPosSale } from "@/lib/actions/pos-actions";
import { toast } from "@/components/ui/use-toast"

export function PosSystem() {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [employees, setEmployees] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [customers, setCustomers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [cartItems, setCartItems] = useState([])
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

  const handleAddToCart = (product) => {
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

  const handleUpdateCartItem = (index, field, value) => {
    const newCartItems = [...cartItems]
    newCartItems[index][field] = value
    setCartItems(newCartItems)
  }

  const handleRemoveCartItem = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index))
  }

  const handleSelectCustomer = (customerId) => {
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
      const customer = await createCustomer(newCustomer)
      toast({
        title: "成功",
        description: "客户已创建",
      })
      setSelectedCustomer(customer.id.toString())
      setIsNewCustomerDialogOpen(false)
      loadCustomers()
    } catch (error) {
      console.error("Error creating customer:", error)
      toast({
        title: "错误",
        description: error.message || "创建客户失败",
        variant: "destructive",
      })
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

      await createPosSale({
        employeeId: selectedEmployee,
        customerId: selectedCustomer || null,
        customerInfo,
        items: cartItems,
        warehouseId: selectedWarehouse,
        paymentMethod,
      })

      toast({
        title: "成功",
        description: "销售已完成",
      })

      // 清空购物车
      setCartItems([])
      setIsCheckoutDialogOpen(false)
    } catch (error) {
      console.error("Error creating POS sale:", error)
      toast({
        title: "错误",
        description: error.message || "销售失败",
        variant: "destructive",
      })
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 产品列表 */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>产品列表</CardTitle>
              <div className="relative w-64">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索产品..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
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
              <Button variant="outline" size="sm" onClick={() => setIsCustomerDialogOpen(true)}>
                <UserIcon className="h-4 w-4 mr-2" />
                {getSelectedCustomerName()}
              </Button>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemoveCartItem(index)}
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
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
            <Button
              className="w-full"
              size="lg"
              disabled={cartItems.length === 0}
              onClick={() => setIsCheckoutDialogOpen(true)}
            >
              结账
            </Button>
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
                <Input
                  placeholder="搜索客户..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      loadCustomers()
                    }
                  }}
                  className="pl-8"
                />
              </div>
              <Button variant="outline" onClick={loadCustomers}>
                搜索
              </Button>
              <Button onClick={() => setIsNewCustomerDialogOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                新建
              </Button>
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
              <Label htmlFor="name" className="text-right">
                客户名称
              </Label>
              <Input
                id="name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                电话
              </Label>
              <Input
                id="phone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                邮箱
              </Label>
              <Input
                id="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewCustomerDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateCustomer} disabled={isLoading}>
              {isLoading ? "保存中..." : "保存"}
            </Button>
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
            <Button onClick={handleCheckout} disabled={isLoading}>
              {isLoading ? "处理中..." : "确认结账"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
