"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/hooks/use-toast"
import { Loader2, Save, ArrowLeft, TruckIcon, DollarSignIcon, PackageIcon, Plus, Trash2 } from "lucide-react"

// 采购项目验证模式
const purchaseItemSchema = z.object({
  name: z.string().min(1, "请输入商品名称"),
  quantity: z.number().min(0.01, "数量必须大于0"),
  unit: z.string().min(1, "请输入单位"),
  unitPrice: z.number().min(0, "单价不能为负数"),
  total: z.number().min(0, "总价不能为负数"),
})

// 表单验证模式
const coffeeShopPurchaseSchema = z.object({
  date: z.string().min(1, "请选择日期"),
  supplier: z.string().min(1, "请输入供应商名称"),
  employeeId: z.string().min(1, "请选择采购员工"),
  items: z.array(purchaseItemSchema).min(1, "至少需要一个采购项目"),
  totalAmount: z.number().min(0, "总金额不能为负数"),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
})

type CoffeeShopPurchaseFormData = z.infer<typeof coffeeShopPurchaseSchema>

export function NewCoffeeShopPurchaseForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [employees, setEmployees] = useState([])

  const form = useForm<CoffeeShopPurchaseFormData>({
    resolver: zodResolver(coffeeShopPurchaseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      supplier: "",
      employeeId: "",
      items: [
        {
          name: "",
          quantity: 0,
          unit: "",
          unitPrice: 0,
          total: 0,
        }
      ],
      totalAmount: 0,
      paymentMethod: "",
      notes: "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
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

  // 计算单个项目总价
  const calculateItemTotal = (index: number) => {
    const quantity = form.watch(`items.${index}.quantity`) || 0
    const unitPrice = form.watch(`items.${index}.unitPrice`) || 0
    const total = quantity * unitPrice
    form.setValue(`items.${index}.total`, total)
    calculateTotalAmount()
  }

  // 计算总金额
  const calculateTotalAmount = () => {
    const items = form.watch("items")
    const total = items.reduce((sum, item) => sum + (item.total || 0), 0)
    form.setValue("totalAmount", total)
  }

  const onSubmit = async (data: CoffeeShopPurchaseFormData) => {
    setIsLoading(true)
    try {
      console.log("🔍 提交咖啡店采购数据:", data)

      const response = await fetch("/api/coffee-shop/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: data.date,
          supplier: data.supplier,
          employeeId: Number(data.employeeId),
          items: data.items,
          totalAmount: data.totalAmount,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
        }),
      })

      console.log("🔍 咖啡店采购创建响应状态:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ 咖啡店采购创建失败:", errorData)
        throw new Error(errorData.error || "创建采购记录失败")
      }

      const newPurchase = await response.json()
      console.log("✅ 咖啡店采购创建成功:", newPurchase)

      toast({
        title: "创建成功",
        description: `采购记录已成功创建`,
      })

      router.push("/coffee-shop/purchase")
    } catch (error) {
      console.error("创建采购记录失败:", error)
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "创建采购记录时发生错误，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/coffee-shop/purchase")
  }

  const addItem = () => {
    append({
      name: "",
      quantity: 0,
      unit: "",
      unitPrice: 0,
      total: 0,
    })
  }

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
      calculateTotalAmount()
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TruckIcon className="w-5 h-5" />
              采购基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>采购日期 *</FormLabel>
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
                    <FormLabel>采购员工 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择采购员工" />
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
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>供应商 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="请输入供应商名称"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 采购项目 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageIcon className="w-5 h-5" />
              采购项目
            </CardTitle>
            <CardDescription>
              添加采购的商品项目，系统会自动计算总金额
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">项目 {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>商品名称 *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="商品名称"
                            {...field}
                          />
                        </FormControl>
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
                            step="0.01"
                            min="0"
                            placeholder="数量"
                            {...field}
                            onChange={(e) => {
                              field.onChange(Number(e.target.value))
                              calculateItemTotal(index)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.unit`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>单位 *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="单位"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>单价 (元) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="单价"
                            {...field}
                            onChange={(e) => {
                              field.onChange(Number(e.target.value))
                              calculateItemTotal(index)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.total`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>小计 (元)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            readOnly
                            placeholder="小计"
                            {...field}
                            className="bg-muted"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加采购项目
            </Button>

            {/* 总金额显示 */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-lg">总金额:</span>
                <span className="text-2xl font-bold">¥{(form.watch("totalAmount") || 0).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 支付信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSignIcon className="w-5 h-5" />
              支付信息
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                      <SelectItem value="transfer">银行转账</SelectItem>
                      <SelectItem value="card">银行卡</SelectItem>
                      <SelectItem value="wechat">微信支付</SelectItem>
                      <SelectItem value="alipay">支付宝</SelectItem>
                      <SelectItem value="credit">赊账</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 备注 */}
        <Card>
          <CardHeader>
            <CardTitle>备注信息</CardTitle>
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
                创建采购记录
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
