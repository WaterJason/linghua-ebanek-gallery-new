"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/hooks/use-toast"
import { CalendarIcon, UserIcon, PackageIcon, DollarSignIcon, Loader2, Save, ArrowLeft, Plus, Trash2 } from "lucide-react"

// 表单验证模式
const orderSchema = z.object({
  customerId: z.string().min(1, "请选择客户"),
  employeeId: z.string().min(1, "请选择销售员"),
  orderType: z.enum(["product", "custom", "workshop", "repair"], {
    required_error: "请选择订单类型",
  }),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, "请选择产品"),
    quantity: z.number().min(1, "数量必须大于0"),
    price: z.number().min(0, "价格不能为负数"),
    notes: z.string().optional(),
  })).min(1, "至少需要一个订单项"),
})

type OrderFormData = z.infer<typeof orderSchema>

export function NewOrderForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [products, setProducts] = useState([])

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerId: "",
      employeeId: "",
      orderType: "product",
      notes: "",
      items: [{ productId: "", quantity: 1, price: 0, notes: "" }],
    },
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // 加载客户列表
      const customersResponse = await fetch("/api/customers")
      if (customersResponse.ok) {
        const customersData = await customersResponse.json()
        setCustomers(customersData)
      }

      // 加载员工列表
      const employeesResponse = await fetch("/api/employees")
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json()
        setEmployees(employeesData)
      }

      // 加载产品列表
      const productsResponse = await fetch("/api/products")
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        setProducts(productsData)
      }
    } catch (error) {
      console.error("加载数据失败:", error)
      toast({
        title: "加载失败",
        description: "无法加载必要数据，请刷新页面重试",
        variant: "destructive",
      })
    }
  }

  const onSubmit = async (data: OrderFormData) => {
    setIsLoading(true)
    try {
      console.log("🔍 提交新订单数据:", data)

      // 计算总金额
      const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)

      // 转换数据格式以匹配API要求
      const orderData = {
        customerId: Number(data.customerId),
        employeeId: Number(data.employeeId),
        orderDate: new Date().toISOString(),
        status: "pending",
        totalAmount,
        paidAmount: 0,
        paymentStatus: "unpaid",
        notes: data.notes,
        items: data.items.map(item => ({
          productId: Number(item.productId),
          quantity: item.quantity,
          price: item.price,
          discount: 0,
          notes: item.notes,
        })),
      }

      console.log("🔍 转换后的订单数据:", orderData)

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      console.log("🔍 新订单创建响应状态:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ 新订单创建失败:", errorData)
        throw new Error(errorData.error || "创建订单失败")
      }

      const newOrder = await response.json()
      console.log("✅ 新订单创建成功:", newOrder)

      toast({
        title: "创建成功",
        description: `订单 "${newOrder.orderNumber}" 已成功创建`,
      })

      // 重定向到订单列表页面
      router.push("/sales/orders")
    } catch (error) {
      console.error("创建订单失败:", error)
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "创建订单时发生错误，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/sales/orders")
  }

  const addOrderItem = () => {
    const currentItems = form.getValues("items")
    form.setValue("items", [...currentItems, { productId: "", quantity: 1, price: 0, notes: "" }])
  }

  const removeOrderItem = (index: number) => {
    const currentItems = form.getValues("items")
    if (currentItems.length > 1) {
      form.setValue("items", currentItems.filter((_, i) => i !== index))
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>客户 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择客户" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name} - {customer.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>销售员 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择销售员" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((employee: any) => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.name} - {employee.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="orderType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>订单类型 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择订单类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="product">产品销售</SelectItem>
                      <SelectItem value="custom">定制作品</SelectItem>
                      <SelectItem value="workshop">手作团建</SelectItem>
                      <SelectItem value="repair">维修服务</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>备注</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入订单备注"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 订单项 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PackageIcon className="w-5 h-5" />
                订单项
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOrderItem}
              >
                <Plus className="w-4 h-4 mr-2" />
                添加商品
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {form.watch("items").map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">商品 {index + 1}</h4>
                  {form.watch("items").length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOrderItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.productId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>产品 *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择产品" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map((product: any) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name} - ¥{product.price}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>数量 *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="请输入数量"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>单价 (元) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="请输入单价"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.notes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>备注</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="请输入商品备注"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            取消
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                创建中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                创建订单
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
