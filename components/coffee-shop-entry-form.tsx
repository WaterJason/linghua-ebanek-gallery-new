"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getEmployees } from "@/lib/actions/employee-actions";
import { createCoffeeShopSale } from "@/lib/actions/sales-actions";
import { getSystemSettings } from "@/lib/actions/system-actions";
import { toast } from "@/components/ui/use-toast"

const itemSchema = z.object({
  name: z.string().min(1, "商品名称不能为空"),
  category: z.string().min(1, "请选择商品类别"),
  quantity: z.number().min(1, "数量必须大于0"),
  unitPrice: z.number().min(0, "单价不能为负数"),
  totalPrice: z.number().min(0, "总价不能为负数"),
})

const formSchema = z.object({
  date: z.date({
    required_error: "请选择日期",
  }),
  totalSales: z.number().min(0, {
    message: "销售额不能为负数",
  }),
  cashAmount: z.number().min(0, "金额不能为负数"),
  cardAmount: z.number().min(0, "金额不能为负数"),
  wechatAmount: z.number().min(0, "金额不能为负数"),
  alipayAmount: z.number().min(0, "金额不能为负数"),
  otherAmount: z.number().min(0, "金额不能为负数"),
  customerCount: z.number().min(0, "顾客数不能为负数"),
  staffOnDuty: z.array(z.string()).min(1, {
    message: "至少选择一名值班员工",
  }),
  items: z.array(itemSchema).optional(),
  notes: z.string().optional(),
}).refine(data => {
  const sum = data.cashAmount + data.cardAmount + data.wechatAmount + data.alipayAmount + data.otherAmount;
  return Math.abs(sum - data.totalSales) < 0.01; // 允许0.01的误差
}, {
  message: "各支付方式金额总和必须等于总销售额",
  path: ["totalSales"],
});

const CATEGORY_OPTIONS = [
  { value: "coffee", label: "咖啡" },
  { value: "tea", label: "茶饮" },
  { value: "food", label: "食品" },
  { value: "dessert", label: "甜点" },
  { value: "other", label: "其他" },
];

export function CoffeeShopEntryForm() {
  const [employees, setEmployees] = useState([])
  const [commissionRate, setCommissionRate] = useState(20)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      totalSales: 0,
      cashAmount: 0,
      cardAmount: 0,
      wechatAmount: 0,
      alipayAmount: 0,
      otherAmount: 0,
      customerCount: 0,
      staffOnDuty: [],
      items: [],
      notes: "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // 监听销售项目变化，自动计算总销售额
  const items = form.watch("items") || [];
  const totalSales = form.watch("totalSales");

  useEffect(() => {
    if (items.length > 0) {
      const calculatedTotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      if (Math.abs(calculatedTotal - totalSales) > 0.01) {
        form.setValue("totalSales", calculatedTotal);
      }
    }
  }, [items, form, totalSales]);

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true)
    try {
      await createCoffeeShopSale(values)

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
        cashAmount: 0,
        cardAmount: 0,
        wechatAmount: 0,
        alipayAmount: 0,
        otherAmount: 0,
        customerCount: 0,
        staffOnDuty: [],
        items: [],
        notes: "",
      })
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

  const addItem = () => {
    append({
      name: "",
      category: "coffee",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    });
  };

  const handleUnitPriceChange = (index: number, value: number) => {
    const quantity = form.getValues(`items.${index}.quantity`) || 0;
    form.setValue(`items.${index}.totalPrice`, value * quantity);
  };

  const handleQuantityChange = (index: number, value: number) => {
    const unitPrice = form.getValues(`items.${index}.unitPrice`) || 0;
    form.setValue(`items.${index}.totalPrice`, unitPrice * value);
  };

  if (loading) {
    return <div className="text-center py-4">加载数据中...</div>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <FormField
            control={form.control}
            name="customerCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>顾客数量</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">销售项目</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <PlusIcon className="h-4 w-4 mr-2" />
                添加项目
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                暂无销售项目，点击"添加项目"按钮添加
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                    <FormField
                      control={form.control}
                      name={`items.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="col-span-3">
                          <FormLabel className={index !== 0 ? "sr-only" : undefined}>商品名称</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="商品名称" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.category`}
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className={index !== 0 ? "sr-only" : undefined}>类别</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择类别" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CATEGORY_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
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
                        <FormItem className="col-span-2">
                          <FormLabel className={index !== 0 ? "sr-only" : undefined}>数量</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              onChange={(e) => {
                                const value = Number.parseInt(e.target.value) || 0;
                                field.onChange(value);
                                handleQuantityChange(index, value);
                              }}
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
                        <FormItem className="col-span-2">
                          <FormLabel className={index !== 0 ? "sr-only" : undefined}>单价</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              {...field}
                              onChange={(e) => {
                                const value = Number.parseFloat(e.target.value) || 0;
                                field.onChange(value);
                                handleUnitPriceChange(index, value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.totalPrice`}
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className={index !== 0 ? "sr-only" : undefined}>总价</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="col-span-1"
                      onClick={() => remove(index)}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                    min={0}
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
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
                    min={0}
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
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
                    min={0}
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
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
                    min={0}
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
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
                    min={0}
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
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
                <FormDescription>选择当天在咖啡店值班的所有员工</FormDescription>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {employees.map((staff) => (
                  <FormField
                    key={staff.id}
                    control={form.control}
                    name="staffOnDuty"
                    render={({ field }) => {
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
                          <FormLabel className="font-normal">{staff.name}</FormLabel>
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
  )
}
