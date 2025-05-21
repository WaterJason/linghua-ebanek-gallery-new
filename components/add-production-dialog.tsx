"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, PlusIcon, Trash2Icon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { getEmployees } from "@/lib/actions/employee-actions";
import { getPieceWorkItems } from "@/lib/actions/workshop-actions";
import { createPieceWork } from "@/lib/actions/piece-work-actions";

const formSchema = z.object({
  date: z.date({
    required_error: "请选择日期",
  }),
  employee: z.string({
    required_error: "请选择员工",
  }),
  workType: z.string({
    required_error: "请选择工作类型",
  }),
  items: z.array(
    z.object({
      itemId: z.string({
        required_error: "请选择工作项",
      }),
      quantity: z.coerce.number().min(1, "数量必须大于0"),
      price: z.coerce.number().min(0, "单价不能为负数"),
    })
  ).min(1, "至少添加一个工作项"),
  totalAmount: z.coerce.number(),
  notes: z.string().optional(),
})

export function AddProductionDialog({ open, onOpenChange, onProductionAdded }) {
  const [employees, setEmployees] = useState([])
  const [pieceWorkItems, setPieceWorkItems] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  // 监听工作类型变化，重置工作项
  const workType = form.watch("workType")
  useEffect(() => {
    form.setValue("items", [{ itemId: "", quantity: 1, price: 0 }])
    calculateTotal()
  }, [workType, form])

  // 监听工作项变化，自动设置单价
  const items = form.watch("items")
  useEffect(() => {
    calculateTotal()
  }, [items, form])

  // 加载员工和工作项数据
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [employeesData, accessoryData, enamellingData] = await Promise.all([
          getEmployees(),
          getPieceWorkItems("accessory"),
          getPieceWorkItems("enamelling"),
        ])

        setEmployees(employeesData.filter(emp => emp.status === "active"))
        setPieceWorkItems([...accessoryData, ...enamellingData])
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "加载失败",
          description: "无法加载员工或工作项数据",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      loadData()
    }
  }, [open])

  // 根据工作项ID设置单价
  const handleItemChange = (index: number, itemId: string) => {
    const selectedItem = pieceWorkItems.find(item => item.id.toString() === itemId)
    if (selectedItem) {
      form.setValue(`items.${index}.price`, selectedItem.price)
    }
  }

  // 计算总金额
  const calculateTotal = () => {
    const items = form.getValues("items")
    const total = items.reduce((sum, item) => {
      return sum + (Number(item.quantity) * Number(item.price))
    }, 0)
    form.setValue("totalAmount", total)
  }

  // 添加工作项
  const addItem = () => {
    append({ itemId: "", quantity: 1, price: 0 })
  }

  // 提交表单
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      await createPieceWork(values)
      toast({
        title: "添加成功",
        description: "制作工单已成功添加",
      })
      form.reset({
        date: new Date(),
        workType: "accessory",
        items: [{ itemId: "", quantity: 1, price: 0 }],
        totalAmount: 0,
        notes: "",
      })
      onProductionAdded()
    } catch (error) {
      console.error("Error submitting production data:", error)
      toast({
        title: "添加失败",
        description: "添加制作工单时出错",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 获取当前工作类型的工作项
  const getFilteredItems = () => {
    return pieceWorkItems.filter(item => item.type === workType)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>添加制作工单</DialogTitle>
          <DialogDescription>创建新的制作工单记录，计算计件工资</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-4">加载数据中...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择工作类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="accessory">配饰制作</SelectItem>
                        <SelectItem value="enamelling">点蓝制作</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <FormLabel>工作项目</FormLabel>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <PlusIcon className="h-4 w-4 mr-1" /> 添加项目
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                    <FormField
                      control={form.control}
                      name={`items.${index}.itemId`}
                      render={({ field }) => (
                        <FormItem className="col-span-5">
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value)
                              handleItemChange(index, value)
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择工作项" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getFilteredItems().map((item) => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                  {item.name} (¥{item.price})
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
                          <FormControl>
                            <Input type="number" min="1" {...field} onChange={(e) => {
                              field.onChange(e)
                              calculateTotal()
                            }} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.price`}
                      render={({ field }) => (
                        <FormItem className="col-span-3">
                          <FormControl>
                            <Input type="number" step="0.01" min="0" {...field} onChange={(e) => {
                              field.onChange(e)
                              calculateTotal()
                            }} />
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
                      onClick={() => {
                        remove(index)
                        calculateTotal()
                      }}
                      disabled={fields.length === 1}
                    >
                      <Trash2Icon className="h-4 w-4" />
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
                      <Input type="number" step="0.01" readOnly {...field} />
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
                      <Textarea placeholder="可选备注信息" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "保存中..." : "保存"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
