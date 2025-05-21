"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, PlusIcon, TrashIcon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { updatePieceWork } from "@/lib/actions/piece-work-actions";
import { getEmployees } from "@/lib/actions/employee-actions";
import { getPieceWorkItems } from "@/lib/actions/workshop-actions";

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

export function EditProductionDialog({ open, onOpenChange, pieceWork, onProductionUpdated }) {
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

  const workType = form.watch("workType")
  const items = form.watch("items")

  // 加载员工和工作项数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // 获取员工和工作项数据
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

    fetchData()
  }, [])

  // 当pieceWork变化时，设置表单默认值
  useEffect(() => {
    if (pieceWork && !loading) {
      form.reset({
        date: new Date(pieceWork.date),
        employee: pieceWork.employeeId.toString(),
        workType: pieceWork.workType,
        items: pieceWork.details.map(detail => ({
          itemId: detail.pieceWorkItemId.toString(),
          quantity: detail.quantity,
          price: detail.price,
        })),
        totalAmount: pieceWork.totalAmount,
        notes: pieceWork.notes || "",
      })
    }
  }, [pieceWork, loading, form])

  // 计算总金额
  useEffect(() => {
    const total = items.reduce((sum, item) => {
      return sum + (item.quantity * item.price)
    }, 0)
    form.setValue("totalAmount", total)
  }, [items, form])

  // 处理工作项变化
  const handleItemChange = (index, itemId) => {
    const selectedItem = pieceWorkItems.find(item => item.id.toString() === itemId)
    if (selectedItem) {
      form.setValue(`items.${index}.price`, selectedItem.price)
    }
  }

  // 添加工作项
  const handleAddItem = () => {
    append({ itemId: "", quantity: 1, price: 0 })
  }

  // 提交表单
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      await updatePieceWork(pieceWork.id, values)
      toast({
        title: "更新成功",
        description: "制作工单已成功更新",
      })
      onProductionUpdated()
    } catch (error) {
      console.error("Error updating production data:", error)
      toast({
        title: "更新失败",
        description: "更新制作工单时出错",
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
          <DialogTitle>编辑制作工单</DialogTitle>
          <DialogDescription>修改制作工单记录，更新计件工资</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <p>加载中...</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
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
                                "pl-3 text-left font-normal",
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
                            disabled={(date) =>
                              date > new Date() || date < new Date("2000-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 员工选择 */}
                <FormField
                  control={form.control}
                  name="employee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>员工</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择员工" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              {employee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 工作类型选择 */}
                <FormField
                  control={form.control}
                  name="workType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>工作类型</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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

                {/* 总金额 */}
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>总金额</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          readOnly
                          {...field}
                          value={field.value.toFixed(2)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 工作项列表 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <FormLabel>工作项目</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                  >
                    <PlusIcon className="mr-1 h-4 w-4" />
                    添加项目
                  </Button>
                </div>

                <div className="space-y-2">
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
                              <Input type="number" min="1" {...field} />
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
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
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
                        onClick={() => remove(index)}
                        className="col-span-1"
                        disabled={fields.length === 1}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 备注 */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>备注</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="输入备注信息（可选）"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "保存中..." : "保存修改"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
