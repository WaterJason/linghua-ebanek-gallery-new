"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, PlusIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getEmployees } from "@/lib/actions/employee-actions";
import { getPieceWorkItems, createPieceWork } from "@/lib/actions/workshop-actions";
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  date: z.date({
    required_error: "请选择日期",
  }),
  employee: z.string({
    required_error: "请选择员工",
  }),
  workType: z.enum(["accessory", "enamelling"]),
  items: z
    .array(
      z.object({
        itemId: z.string(),
        quantity: z.number().min(1),
        price: z.number().min(0),
      }),
    )
    .min(1, "至少添加一项工作"),
  totalAmount: z.number().min(0),
  notes: z.string().optional(),
})

export function PieceWorkEntryForm() {
  const [workType, setWorkType] = useState<"accessory" | "enamelling">("accessory")
  const [items, setItems] = useState([{ id: 1, itemId: "", quantity: 1, price: 0 }])
  const [employees, setEmployees] = useState([])
  const [pieceWorkItems, setPieceWorkItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      workType: "accessory",
      items: [{ itemId: "", quantity: 1, price: 0 }],
      totalAmount: 0,
      notes: "",
    },
  })

  // 获取员工和计件工项数据
  useEffect(() => {
    async function fetchData() {
      try {
        const [employeesData, itemsData] = await Promise.all([getEmployees(), getPieceWorkItems(workType)])

        setEmployees(employeesData.filter((e) => e.status === "active"))
        setPieceWorkItems(itemsData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [workType])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true)
    try {
      await createPieceWork(values)
      toast({
        title: "计件工作数据提交成功",
        description: "计件工作记录已保存到数据库",
      })
      form.reset({
        date: new Date(),
        workType: workType,
        items: [{ itemId: "", quantity: 1, price: 0 }],
        totalAmount: 0,
        notes: "",
      })
      setItems([{ id: 1, itemId: "", quantity: 1, price: 0 }])
    } catch (error) {
      console.error("Error submitting piece work data:", error)
      toast({
        title: "提交失败",
        description: "保存计件工作记录时出错",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const addItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1
    setItems([...items, { id: newId, itemId: "", quantity: 1, price: 0 }])
  }

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))

      // 更新表单中的items
      const updatedItems = form.getValues("items").filter((_, index) => items[index].id !== id)
      form.setValue("items", updatedItems)

      // 重新计算总金额
      const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      form.setValue("totalAmount", total)
    }
  }

  const updateItem = (id: number, field: string, value: any) => {
    const updatedItems = items.map((item) => {
      if (item.id === id) {
        if (field === "itemId") {
          const workItem = pieceWorkItems.find((p) => p.id.toString() === value)
          return {
            ...item,
            [field]: value,
            price: workItem ? workItem.price : 0,
          }
        }
        return { ...item, [field]: value }
      }
      return item
    })
    setItems(updatedItems)

    // 更新表单中的items
    const formItems = updatedItems.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity,
      price: item.price,
    }))
    form.setValue("items", formItems)

    // 更新总金额
    const total = updatedItems.reduce((sum, item) => {
      return sum + item.price * item.quantity
    }, 0)
    form.setValue("totalAmount", total)
  }

  const handleWorkTypeChange = (value: "accessory" | "enamelling") => {
    setWorkType(value)
    form.setValue("workType", value)
    setItems([{ id: 1, itemId: "", quantity: 1, price: 0 }])
    form.setValue("totalAmount", 0)
    setLoading(true) // 重新加载工项数据
  }

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
            name="employee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>员工</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择员工" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.name} ({employee.position})
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
          name="workType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>工作类型</FormLabel>
              <FormControl>
                <Tabs
                  value={field.value}
                  onValueChange={(value: "accessory" | "enamelling") => handleWorkTypeChange(value)}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="accessory">配饰工时费</TabsTrigger>
                    <TabsTrigger value="enamelling">点蓝工时费</TabsTrigger>
                  </TabsList>
                </Tabs>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <FormLabel>工作项目</FormLabel>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <PlusIcon className="h-4 w-4 mr-2" />
              添加项目
            </Button>
          </div>

          {items.map((item, index) => (
            <div key={item.id} className="flex items-end gap-4">
              <div className="flex-1">
                <FormLabel className={index !== 0 ? "sr-only" : ""}>项目</FormLabel>
                <Select value={item.itemId.toString()} onValueChange={(value) => updateItem(item.id, "itemId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择项目" />
                  </SelectTrigger>
                  <SelectContent>
                    {pieceWorkItems.map((workItem) => (
                      <SelectItem key={workItem.id} value={workItem.id.toString()}>
                        {workItem.name} (¥{workItem.price}/件)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-20">
                <FormLabel className={index !== 0 ? "sr-only" : ""}>数量</FormLabel>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, "quantity", Number.parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="w-28">
                <FormLabel className={index !== 0 ? "sr-only" : ""}>单价</FormLabel>
                <Input type="number" value={item.price} readOnly />
              </div>

              <div className="w-28">
                <FormLabel className={index !== 0 ? "sr-only" : ""}>小计</FormLabel>
                <Input type="number" value={item.price * item.quantity} readOnly />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
                disabled={items.length <= 1}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <FormField
          control={form.control}
          name="totalAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>总金额</FormLabel>
              <FormControl>
                <Input type="number" {...field} readOnly />
              </FormControl>
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
                <Textarea placeholder="添加工作备注信息..." className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full md:w-auto" disabled={submitting}>
          {submitting ? "提交中..." : "提交计件工作记录"}
        </Button>
      </form>
    </Form>
  )
}
