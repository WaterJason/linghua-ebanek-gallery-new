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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/hooks/use-toast"
import { Loader2, Save, ArrowLeft, CoffeeIcon, DollarSignIcon, UsersIcon } from "lucide-react"

// 表单验证模式
const coffeeShopSaleSchema = z.object({
  date: z.string().min(1, "请选择日期"),
  totalSales: z.number().min(0, "销售额不能为负数"),
  customerCount: z.number().min(0, "客户数量不能为负数"),
  employeeId: z.string().min(1, "请选择值班员工"),
  notes: z.string().optional(),
  paymentMethods: z.object({
    cash: z.number().min(0).optional(),
    wechat: z.number().min(0).optional(),
    alipay: z.number().min(0).optional(),
    card: z.number().min(0).optional(),
  }).optional(),
})

type CoffeeShopSaleFormData = z.infer<typeof coffeeShopSaleSchema>

export function NewCoffeeShopSaleForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [employees, setEmployees] = useState([])

  const form = useForm<CoffeeShopSaleFormData>({
    resolver: zodResolver(coffeeShopSaleSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      totalSales: 0,
      customerCount: 0,
      employeeId: "",
      notes: "",
      paymentMethods: {
        cash: 0,
        wechat: 0,
        alipay: 0,
        card: 0,
      },
    },
  })

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      const response = await fetch("/api/employees")
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error("加载员工数据失败:", error)
      toast({
        title: "加载失败",
        description: "无法加载员工数据，请刷新页面重试",
        variant: "destructive",
      })
    }
  }

  const onSubmit = async (data: CoffeeShopSaleFormData) => {
    setIsLoading(true)
    try {
      console.log("🔍 提交咖啡店销售数据:", data)

      // 验证支付方式总额
      const paymentTotal = (data.paymentMethods?.cash || 0) +
                          (data.paymentMethods?.wechat || 0) +
                          (data.paymentMethods?.alipay || 0) +
                          (data.paymentMethods?.card || 0)

      if (Math.abs(paymentTotal - data.totalSales) > 0.01) {
        toast({
          title: "数据错误",
          description: "支付方式金额总和与总销售额不匹配",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/coffee-shop/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: data.date,
          totalSales: data.totalSales,
          customerCount: data.customerCount,
          employeeId: Number(data.employeeId),
          notes: data.notes,
          paymentMethods: data.paymentMethods,
        }),
      })

      console.log("🔍 咖啡店销售创建响应状态:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ 咖啡店销售创建失败:", errorData)
        throw new Error(errorData.error || "创建销售记录失败")
      }

      const newSale = await response.json()
      console.log("✅ 咖啡店销售创建成功:", newSale)

      toast({
        title: "创建成功",
        description: `销售记录已成功创建`,
      })

      router.push("/coffee-shop/sales")
    } catch (error) {
      console.error("创建销售记录失败:", error)
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "创建销售记录时发生错误，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/coffee-shop/sales")
  }

  // 计算支付方式总额
  const paymentTotal = (form.watch("paymentMethods.cash") || 0) +
                      (form.watch("paymentMethods.wechat") || 0) +
                      (form.watch("paymentMethods.alipay") || 0) +
                      (form.watch("paymentMethods.card") || 0)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CoffeeIcon className="w-5 h-5" />
              销售基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>销售日期 *</FormLabel>
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

              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>值班员工 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择值班员工" />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalSales"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>总销售额 (元) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="请输入总销售额"
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
                name="customerCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>客户数量 *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="请输入客户数量"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* 支付方式明细 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSignIcon className="w-5 h-5" />
              支付方式明细
            </CardTitle>
            <CardDescription>
              请分别输入各种支付方式的金额，总计应等于总销售额
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paymentMethods.cash"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>现金 (元)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="现金金额"
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
                name="paymentMethods.wechat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>微信支付 (元)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="微信支付金额"
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
                name="paymentMethods.alipay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>支付宝 (元)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="支付宝金额"
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
                name="paymentMethods.card"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>银行卡 (元)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="银行卡金额"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 支付方式总计显示 */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">支付方式总计:</span>
                <span className="text-lg font-bold">¥{paymentTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="font-medium">总销售额:</span>
                <span className="text-lg font-bold">¥{(form.watch("totalSales") || 0).toFixed(2)}</span>
              </div>
              {Math.abs(paymentTotal - (form.watch("totalSales") || 0)) > 0.01 && (
                <div className="text-destructive text-sm mt-2">
                  ⚠️ 支付方式总计与总销售额不匹配
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 备注 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5" />
              备注信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>备注</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入备注信息（可选）"
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
                创建销售记录
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
