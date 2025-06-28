"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/hooks/use-toast"
import { Loader2, Save, ArrowLeft, UserIcon, PackageIcon, CalendarIcon, ImageIcon } from "lucide-react"

// 表单验证模式
const customWorkSchema = z.object({
  customerId: z.string().min(1, "请选择客户"),
  employeeId: z.string().min(1, "请选择销售员"),
  productName: z.string().min(1, "请输入作品名称"),
  customDesign: z.string().min(1, "请描述定制需求"),
  customRequirements: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  totalAmount: z.number().min(0, "金额不能为负数"),
  paidAmount: z.number().min(0, "已付金额不能为负数").optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  designImageUrl: z.string().optional(),
})

type CustomWorkFormData = z.infer<typeof customWorkSchema>

export function NewCustomWorkForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])

  const form = useForm<CustomWorkFormData>({
    resolver: zodResolver(customWorkSchema),
    defaultValues: {
      customerId: "",
      employeeId: "",
      productName: "",
      customDesign: "",
      customRequirements: "",
      expectedDeliveryDate: "",
      totalAmount: 0,
      paidAmount: 0,
      paymentMethod: "",
      notes: "",
      designImageUrl: "",
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
    } catch (error) {
      console.error("加载数据失败:", error)
      toast({
        title: "加载失败",
        description: "无法加载必要数据，请刷新页面重试",
        variant: "destructive",
      })
    }
  }

  const onSubmit = async (data: CustomWorkFormData) => {
    setIsLoading(true)
    try {
      console.log("🔍 提交新定制订单数据:", data)

      // 转换数据格式以匹配API要求
      const orderData = {
        customerId: Number(data.customerId),
        employeeId: Number(data.employeeId),
        orderDate: new Date().toISOString(),
        status: "design", // 定制订单默认状态为设计中
        totalAmount: data.totalAmount,
        paidAmount: data.paidAmount || 0,
        paymentStatus: (data.paidAmount || 0) >= data.totalAmount ? "paid" : 
                      (data.paidAmount || 0) > 0 ? "partial" : "unpaid",
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        isCustom: true, // 标记为定制订单
        customDesign: data.customDesign,
        customRequirements: data.customRequirements,
        designImageUrl: data.designImageUrl,
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate).toISOString() : null,
        designApproved: false,
        items: [
          {
            productId: 1, // 临时使用默认产品ID，实际应该创建定制产品
            quantity: 1,
            price: data.totalAmount,
            discount: 0,
            notes: `定制作品: ${data.productName}`,
          }
        ],
      }

      console.log("🔍 转换后的定制订单数据:", orderData)

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      console.log("🔍 新定制订单创建响应状态:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ 新定制订单创建失败:", errorData)
        throw new Error(errorData.error || "创建定制订单失败")
      }

      const newOrder = await response.json()
      console.log("✅ 新定制订单创建成功:", newOrder)

      toast({
        title: "创建成功",
        description: `定制订单 "${newOrder.orderNumber}" 已成功创建`,
      })

      // 重定向到定制作品列表页面
      router.push("/sales/custom-works")
    } catch (error) {
      console.error("创建定制订单失败:", error)
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "创建定制订单时发生错误，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/sales/custom-works")
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
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>作品名称 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="请输入定制作品名称"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 定制需求 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageIcon className="w-5 h-5" />
              定制需求
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="customDesign"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>设计描述 *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请详细描述定制设计需求..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>特殊要求</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入特殊要求或注意事项..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="designImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>设计图片链接</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="请输入设计图片URL"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedDeliveryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>预期交付日期</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* 价格信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              价格信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>总金额 (元) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="请输入总金额"
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
                name="paidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>已付金额 (元)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="请输入已付金额"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>支付方式</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择支付方式" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">现金</SelectItem>
                      <SelectItem value="wechat">微信支付</SelectItem>
                      <SelectItem value="alipay">支付宝</SelectItem>
                      <SelectItem value="card">银行卡</SelectItem>
                      <SelectItem value="transfer">银行转账</SelectItem>
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
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                创建定制订单
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
