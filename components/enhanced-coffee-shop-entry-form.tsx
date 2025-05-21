"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, RefreshCwIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { getEmployees } from "@/lib/actions/employee-actions";
import { createCoffeeShopSale } from "@/lib/actions/sales-actions";
import { getSystemSettings } from "@/lib/actions/system-actions";
import { getSchedulesByDate } from "@/lib/actions/schedule-actions";
import { toast } from "@/components/ui/use-toast"
import { CoffeeShopImportForm } from "./coffee-shop-import-form"

const formSchema = z.object({
  date: z.date({
    required_error: "请选择日期",
  }),
  totalSales: z.number().min(0, {
    message: "销售额不能为负数",
  }),
  staffOnDuty: z.array(z.string()).min(1, {
    message: "至少选择一名值班员工",
  }),
  notes: z.string().optional(),
});

export function EnhancedCoffeeShopEntryForm() {
  const [employees, setEmployees] = useState([])
  const [schedules, setSchedules] = useState([])
  const [commissionRate, setCommissionRate] = useState(20)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("entry")
  const [loadingSchedules, setLoadingSchedules] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      totalSales: 0,
      staffOnDuty: [],
      notes: "",
    },
  })

  const selectedDate = form.watch("date");

  // 获取员工数据和系统设置
  useEffect(() => {
    async function fetchData() {
      try {
        const [employeesData, settings] = await Promise.all([getEmployees(), getSystemSettings()])

        setEmployees(employeesData.filter((e) => e.status === "active"))
        setCommissionRate(settings?.coffeeSalesCommissionRate || 20)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // 监听日期变化，获取当天排班信息
  useEffect(() => {
    if (selectedDate) {
      loadSchedulesForDate(selectedDate);
    }
  }, [selectedDate]);

  // 加载指定日期的排班信息
  const loadSchedulesForDate = async (date: Date) => {
    setLoadingSchedules(true);
    try {
      const schedulesData = await getSchedulesByDate(date);
      setSchedules(schedulesData);

      // 自动选择当天排班的员工
      const scheduledEmployeeIds = schedulesData.map(s => s.employeeId.toString());
      if (scheduledEmployeeIds.length > 0) {
        form.setValue("staffOnDuty", scheduledEmployeeIds);
      }
    } catch (error) {
      console.error("Error loading schedules:", error);
      toast({
        title: "加载排班信息失败",
        description: "无法获取当天排班信息",
        variant: "destructive",
      });
    } finally {
      setLoadingSchedules(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true)
    try {
      // 创建一个符合原有API的数据结构
      const submitData = {
        ...values,
        cashAmount: values.totalSales, // 将全部金额设为现金支付
        cardAmount: 0,
        wechatAmount: 0,
        alipayAmount: 0,
        otherAmount: 0,
        customerCount: 0,
        items: []
      };

      await createCoffeeShopSale(submitData)

      // 计算每位员工的提成
      const commissionTotal = values.totalSales * (commissionRate / 100)
      const commissionPerStaff = commissionTotal / values.staffOnDuty.length

      toast({
        title: "咖啡店销售数据提交成功",
        description: `总提成: ¥${commissionTotal.toFixed(2)}, 每人提成: ¥${commissionPerStaff.toFixed(2)}`,
      })

      form.reset({
        date: new Date(),
        totalSales: 0,
        staffOnDuty: [],
        notes: "",
      })

      // 重新加载当天排班信息
      loadSchedulesForDate(new Date());
    } catch (error) {
      console.error("Error submitting coffee shop sale data:", error)
      toast({
        title: "提交失败",
        description: "保存咖啡店销售记录时出错",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">加载数据中...</div>
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="entry">数据录入</TabsTrigger>
        <TabsTrigger value="import">批量导入</TabsTrigger>
      </TabsList>

      <TabsContent value="entry" className="space-y-4 pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
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
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "yyyy-MM-dd") : <span>选择日期</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {schedules.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">当日排班员工:</p>
                    <div className="flex flex-wrap gap-1">
                      {schedules.map((schedule) => (
                        <Badge key={schedule.id} variant="outline">
                          {schedule.employee.name} ({schedule.startTime}-{schedule.endTime})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="totalSales"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>咖啡店总销售额</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>提成将按总销售额的{commissionRate}%计算，由值班员工平分</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <FormField
              control={form.control}
              name="staffOnDuty"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>值班员工</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormDescription>选择当天在咖啡店值班的所有员工</FormDescription>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => loadSchedulesForDate(selectedDate)}
                        disabled={loadingSchedules}
                      >
                        <RefreshCwIcon className="h-4 w-4 mr-2" />
                        {loadingSchedules ? "加载中..." : "刷新排班"}
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {employees.map((staff) => (
                      <FormField
                        key={staff.id}
                        control={form.control}
                        name="staffOnDuty"
                        render={({ field }) => {
                          // 检查该员工是否在当天排班
                          const isScheduled = schedules.some(s => s.employeeId === staff.id);

                          return (
                            <FormItem key={staff.id} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(staff.id.toString())}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, staff.id.toString()])
                                      : field.onChange(field.value?.filter((value) => value !== staff.id.toString()))
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {staff.name}
                                {isScheduled && (
                                  <Badge variant="outline" className="ml-2">已排班</Badge>
                                )}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
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
                    <Textarea placeholder="添加备注信息..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full md:w-auto" disabled={submitting}>
              {submitting ? "提交中..." : "提交咖啡店销售记录"}
            </Button>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="import" className="pt-4">
        <CoffeeShopImportForm />
      </TabsContent>
    </Tabs>
  )
}
