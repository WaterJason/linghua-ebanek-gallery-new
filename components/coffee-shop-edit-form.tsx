"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { getEmployees } from "@/lib/actions/employee-actions";
import { getSystemSettings } from "@/lib/actions/system-actions";
import { updateCoffeeShopSale } from "@/lib/actions/sales-actions";

// 表单验证模式
const formSchema = z.object({
  date: z.date({
    required_error: "请选择日期",
  }),
  totalSales: z.number().min(0, {
    message: "销售额不能为负数",
  }),
  cashAmount: z.number().min(0, { message: "金额不能为负数" }).default(0),
  cardAmount: z.number().min(0, { message: "金额不能为负数" }).default(0),
  wechatAmount: z.number().min(0, { message: "金额不能为负数" }).default(0),
  alipayAmount: z.number().min(0, { message: "金额不能为负数" }).default(0),
  otherAmount: z.number().min(0, { message: "金额不能为负数" }).default(0),
  customerCount: z.number().min(0, { message: "顾客数不能为负数" }).default(0),
  staffOnDuty: z.array(z.string()).min(1, {
    message: "至少选择一名值班员工",
  }),
  notes: z.string().optional(),
}).refine(data => {
  const sum = data.cashAmount + data.cardAmount + data.wechatAmount + data.alipayAmount + data.otherAmount;
  return Math.abs(sum - data.totalSales) < 0.01; // 允许0.01的误差
}, {
  message: "各支付方式金额总和必须等于总销售额",
  path: ["totalSales"],
});

interface CoffeeShopEditFormProps {
  saleData: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CoffeeShopEditForm({ saleData, onSuccess, onCancel }: CoffeeShopEditFormProps) {
  const [employees, setEmployees] = useState([])
  const [commissionRate, setCommissionRate] = useState(20)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(saleData.date),
      totalSales: saleData.totalSales,
      cashAmount: saleData.cashAmount,
      cardAmount: saleData.cardAmount,
      wechatAmount: saleData.wechatAmount,
      alipayAmount: saleData.alipayAmount,
      otherAmount: saleData.otherAmount,
      customerCount: saleData.customerCount,
      staffOnDuty: saleData.shifts.map(shift => shift.employeeId.toString()),
      notes: saleData.notes || "",
    },
  })

  // 加载员工数据和系统设置
  useEffect(() => {
    async function loadData() {
      try {
        const [employeesData, settings] = await Promise.all([
          getEmployees(),
          getSystemSettings()
        ])

        setEmployees(employeesData.filter(emp => emp.status === "active"))
        setCommissionRate(settings?.coffeeSalesCommissionRate || 20)
        setLoading(false)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "加载失败",
          description: "无法加载员工数据或系统设置",
          variant: "destructive",
        })
      }
    }

    loadData()
  }, [])

  // 提交表单
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true)
    try {
      await updateCoffeeShopSale(saleData.id, values)

      toast({
        title: "更新成功",
        description: "咖啡店销售数据已更新",
      })

      onSuccess()
    } catch (error) {
      console.error("Error updating coffee shop sale:", error)
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "无法更新咖啡店销售数据",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">加载中...</div>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 日期选择 */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>日期</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "yyyy-MM-dd")
                        ) : (
                          <span>选择日期</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 总销售额 */}
          <FormField
            control={form.control}
            name="totalSales"
            render={({ field }) => (
              <FormItem>
                <FormLabel>总销售额</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="输入总销售额"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 支付方式 */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <FormField
            control={form.control}
            name="cashAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>现金</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="现金金额"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cardAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>刷卡</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="刷卡金额"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="wechatAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>微信</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="微信金额"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="alipayAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>支付宝</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="支付宝金额"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="otherAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>其他</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="其他金额"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 顾客数 */}
          <FormField
            control={form.control}
            name="customerCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>顾客数</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="输入顾客数"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 值班员工 */}
          <FormField
            control={form.control}
            name="staffOnDuty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>值班员工</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange([...field.value, value])}
                  value=""
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择员工" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem
                        key={employee.id}
                        value={employee.id.toString()}
                        disabled={field.value.includes(employee.id.toString())}
                      >
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {field.value.map((employeeId) => {
                    const employee = employees.find((e) => e.id.toString() === employeeId)
                    return (
                      <div
                        key={employeeId}
                        className="flex items-center bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                      >
                        {employee?.name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-2"
                          onClick={() => {
                            field.onChange(field.value.filter((id) => id !== employeeId))
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    )
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 备注 */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>备注</FormLabel>
              <FormControl>
                <Textarea placeholder="输入备注信息" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            取消
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "保存中..." : "保存修改"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
