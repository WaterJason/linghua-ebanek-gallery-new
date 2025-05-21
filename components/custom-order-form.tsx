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
import { CalendarIcon, PlusIcon, TrashIcon, UploadIcon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { createOrder, updateOrder } from "@/lib/actions/sales-actions";

const formSchema = z.object({
  customerId: z.string({
    required_error: "请选择客户",
  }),
  employeeId: z.string({
    required_error: "请选择员工",
  }),
  orderDate: z.date({
    required_error: "请选择日期",
  }),
  status: z.string().default("pending"),
  paymentStatus: z.string().default("unpaid"),
  paymentMethod: z.string().optional(),
  paidAmount: z.coerce.number().default(0),
  items: z.array(
    z.object({
      productId: z.string({
        required_error: "请选择产品",
      }),
      quantity: z.coerce.number().min(1, "数量必须大于0"),
      price: z.coerce.number().min(0, "价格不能为负数"),
      discount: z.coerce.number().default(0),
      notes: z.string().optional(),
    })
  ).min(1, "至少添加一个产品"),
  totalAmount: z.coerce.number(),
  notes: z.string().optional(),
  warehouseId: z.string().optional(),
  // 定制订单相关字段
  isCustom: z.boolean().default(true),
  customDesign: z.string().optional(),
  customRequirements: z.string().min(1, "请填写定制需求"),
  designImageUrl: z.string().optional(),
  expectedDeliveryDate: z.date().optional(),
  designApproved: z.boolean().default(false),
  designerNotes: z.string().optional(),
})

export function CustomOrderForm({ 
  open, 
  onOpenChange, 
  order = null, 
  customers = [], 
  employees = [], 
  products = [],
  warehouses = [],
  onOrderSaved 
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderDate: new Date(),
      status: "pending",
      paymentStatus: "unpaid",
      paidAmount: 0,
      items: [{ productId: "", quantity: 1, price: 0, discount: 0, notes: "" }],
      totalAmount: 0,
      notes: "",
      isCustom: true,
      designApproved: false,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const items = form.watch("items")
  const status = form.watch("status")

  // 当订单数据变化时，设置表单默认值
  useEffect(() => {
    if (order) {
      form.reset({
        customerId: order.customerId.toString(),
        employeeId: order.employeeId.toString(),
        orderDate: new Date(order.orderDate),
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod || undefined,
        paidAmount: order.paidAmount,
        items: order.items.map(item => ({
          productId: item.productId.toString(),
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          notes: item.notes || "",
        })),
        totalAmount: order.totalAmount,
        notes: order.notes || "",
        isCustom: order.isCustom || true,
        customDesign: order.customDesign || "",
        customRequirements: order.customRequirements || "",
        designImageUrl: order.designImageUrl || "",
        expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate) : undefined,
        designApproved: order.designApproved || false,
        designerNotes: order.designerNotes || "",
      })

      if (order.designImageUrl) {
        setImagePreview(order.designImageUrl)
      }
    }
  }, [order, form])

  // 计算总金额
  useEffect(() => {
    const total = items.reduce((sum, item) => {
      return sum + (item.quantity * item.price - (item.discount || 0))
    }, 0)
    form.setValue("totalAmount", total)
  }, [items, form])

  // 处理产品变化
  const handleProductChange = (index, productId) => {
    const selectedProduct = products.find(product => product.id.toString() === productId)
    if (selectedProduct) {
      form.setValue(`items.${index}.price`, selectedProduct.price)
    }
  }

  // 添加产品
  const handleAddItem = () => {
    append({ productId: "", quantity: 1, price: 0, discount: 0, notes: "" })
  }

  // 处理图片上传
  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // 在实际应用中，这里应该调用API上传图片
      // 这里仅做演示，创建一个本地预览
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        setImagePreview(imageUrl)
        form.setValue("designImageUrl", imageUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  // 提交表单
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      // 确保isCustom字段为true
      values.isCustom = true
      
      if (order) {
        // 更新订单
        await updateOrder(order.id, values)
        toast({
          title: "更新成功",
          description: "定制订单已成功更新",
        })
      } else {
        // 创建新订单
        await createOrder(values)
        toast({
          title: "创建成功",
          description: "定制订单已成功创建",
        })
      }
      onOrderSaved()
    } catch (error) {
      console.error("Error saving custom order:", error)
      toast({
        title: "保存失败",
        description: error.message || "保存定制订单时出错",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? "编辑定制订单" : "创建新定制订单"}</DialogTitle>
          <DialogDescription>
            {order ? `订单编号: ${order.orderNumber}` : "填写定制订单信息"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 客户选择 */}
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>客户</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择客户" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 员工选择 */}
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>销售员工</FormLabel>
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

              {/* 订单日期 */}
              <FormField
                control={form.control}
                name="orderDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>订单日期</FormLabel>
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
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 预计交付日期 */}
              <FormField
                control={form.control}
                name="expectedDeliveryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>预计交付日期</FormLabel>
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
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 订单状态 */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>订单状态</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择状态" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">待处理</SelectItem>
                        <SelectItem value="design">设计中</SelectItem>
                        <SelectItem value="production">生产中</SelectItem>
                        <SelectItem value="completed">已完成</SelectItem>
                        <SelectItem value="cancelled">已取消</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 支付状态 */}
              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>支付状态</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择支付状态" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unpaid">未支付</SelectItem>
                        <SelectItem value="deposit">已付定金</SelectItem>
                        <SelectItem value="partial">部分支付</SelectItem>
                        <SelectItem value="paid">已支付</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 支付方式 */}
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>支付方式</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择支付方式" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">现金</SelectItem>
                        <SelectItem value="wechat">微信</SelectItem>
                        <SelectItem value="alipay">支付宝</SelectItem>
                        <SelectItem value="card">银行卡</SelectItem>
                        <SelectItem value="other">其他</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 已支付金额 */}
              <FormField
                control={form.control}
                name="paidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>已支付金额</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 设计已批准 */}
              <FormField
                control={form.control}
                name="designApproved"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>设计已批准</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        客户已确认设计方案
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {/* 仓库选择 (仅当状态为已完成时显示) */}
              {status === "completed" && (
                <FormField
                  control={form.control}
                  name="warehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>出库仓库</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择仓库" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* 定制设计 */}
            <FormField
              control={form.control}
              name="customDesign"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>定制设计</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="输入定制设计描述..."
                      className="resize-none h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 定制需求 */}
            <FormField
              control={form.control}
              name="customRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>定制需求</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="输入客户的具体需求..."
                      className="resize-none h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 设计图片上传 */}
            <div className="space-y-2">
              <FormLabel>设计图片</FormLabel>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("design-image")?.click()}
                >
                  <UploadIcon className="mr-2 h-4 w-4" />
                  上传图片
                </Button>
                <Input
                  id="design-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {imagePreview && (
                  <div className="relative w-24 h-24 border rounded overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="设计图预览"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 设计师备注 */}
            <FormField
              control={form.control}
              name="designerNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>设计师备注</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="设计师的工作备注..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 订单项目 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <FormLabel>订单项目</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                >
                  <PlusIcon className="mr-1 h-4 w-4" />
                  添加产品
                </Button>
              </div>

              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem className="col-span-4">
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value)
                              handleProductChange(index, value)
                            }} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择产品" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name} (¥{product.price})
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
                        <FormItem className="col-span-2">
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

                    <FormField
                      control={form.control}
                      name={`items.${index}.discount`}
                      render={({ field }) => (
                        <FormItem className="col-span-2">
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

            {/* 备注 */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>备注</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="输入订单备注信息..."
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
                {isSubmitting ? "保存中..." : (order ? "更新定制订单" : "创建定制订单")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
