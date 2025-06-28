"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, CalendarIcon, Plus, Trash2, Clock, Users, MapPin } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CustomerSelector } from "@/components/customer-selector"
import { EmployeeSelector } from "@/components/employee-selector"
import { createWorkshop } from "@/lib/actions/workshop-order-actions"
import { getProducts } from "@/lib/actions/product-actions"

// 导入增强操作系统
import { useEnhancedOperations } from "@/lib/enhanced-operations"

// 活动类型枚举
const activityTypeEnum = [
  "jewelry_enameling", // 饰品点蓝手作
  "cloisonne_enameling" // 掐丝珐琅手作
] as const;

// 场地类型枚举
const locationTypeEnum = [
  "in_gallery", // 馆内
  "outside" // 外出
] as const;

// 底胎类型枚举
const baseTypeEnum = [
  "jewelry", // 饰品
  "coaster_bookmark", // 杯垫/书签
  "painting", // 摆画
  "ornament" // 摆件
] as const;

// 表单验证模式
const formSchema = z.object({
  customerId: z.string({ required_error: "请选择客户" }),
  activityDate: z.date({ required_error: "请选择活动日期" }),
  activityTime: z.string({ required_error: "请输入活动时间" }),
  activityType: z.enum(activityTypeEnum, { required_error: "请选择活动类型" }),
  locationType: z.enum(locationTypeEnum, { required_error: "请选择场地类型" }),
  baseType: z.enum(baseTypeEnum, { required_error: "请选择底胎类型" }),
  location: z.string().min(2, { message: "请输入具体地点" }),
  participants: z.coerce.number().min(1, { message: "参与人数至少为1人" }),
  duration: z.coerce.number().min(0.5, { message: "活动时长至少为0.5小时" }),
  teacherId: z.string({ required_error: "请选择讲师" }),
  assistantId: z.string().optional(),
  managerId: z.string({ required_error: "请选择项目负责人" }),
  notes: z.string().optional(),
  serviceItems: z.array(
    z.object({
      productId: z.string({ required_error: "请选择服务项目" }),
      quantity: z.coerce.number().min(1, { message: "数量至少为1" }),
      price: z.coerce.number().min(0, { message: "价格不能为负数" }),
      notes: z.string().optional(),
    })
  ).min(1, { message: "至少添加一个服务项目" }),
});

// 活动类型映射
const activityTypeMap = {
  "jewelry_enameling": "饰品点蓝手作",
  "cloisonne_enameling": "掐丝珐琅手作"
};

// 场地类型映射
const locationTypeMap = {
  "in_gallery": "馆内",
  "outside": "外出"
};

// 底胎类型映射
const baseTypeMap = {
  "jewelry": "饰品",
  "coaster_bookmark": "杯垫/书签",
  "painting": "摆画",
  "ornament": "摆件"
};

export function WorkshopEntryForm() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 增强操作系统
  const enhancedOps = useEnhancedOperations('workshop')

  // 初始化表单
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: "",
      activityDate: new Date(),
      activityTime: "14:00",
      activityType: "jewelry_enameling",
      locationType: "in_gallery",
      baseType: "jewelry",
      location: "",
      participants: 10,
      duration: 2,
      teacherId: "",
      assistantId: "",
      managerId: "",
      notes: "",
      serviceItems: [{ productId: "", quantity: 1, price: 0, notes: "" }],
    },
  })

  // 加载产品数据
  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true)
      try {
        const data = await getArtworks()
        setProducts(data)
      } catch (error) {
        console.error("Error loading products:", error)
        toast({
          title: "加载失败",
          description: "无法加载产品数据",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [])

  // 添加服务项目
  const addServiceItem = () => {
    const serviceItems = form.getValues("serviceItems")
    form.setValue("serviceItems", [
      ...serviceItems,
      { productId: "", quantity: 1, price: 0, notes: "" }
    ])
  }

  // 删除服务项目
  const removeServiceItem = (index) => {
    const serviceItems = form.getValues("serviceItems")
    if (serviceItems.length > 1) {
      form.setValue("serviceItems", serviceItems.filter((_, i) => i !== index))
    }
  }

  // 提交表单
  async function onSubmit(values) {
    setIsSubmitting(true)
    try {
      // 准备提交的数据
      const submitData = {
        ...values,
        customerId: parseInt(values.customerId),
        teacherId: parseInt(values.teacherId),
        assistantId: values.assistantId ? parseInt(values.assistantId) : null,
        managerId: parseInt(values.managerId),
        // 根据活动类型设置角色
        role: values.activityType === "jewelry_enameling" ? "jewelry_workshop" : "cloisonne_workshop",
        // 设置默认状态为已完成
        status: "completed",
        // 设置默认支付状态为已付全款
        paymentStatus: "fully_paid",
        // 计算总金额
        totalAmount: values.serviceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0),
        depositAmount: 0,
        serviceItems: values.serviceItems
          .filter(item => item.productId && item.artworkId.trim() !== "") // 过滤掉没有选择产品的项目
          .map(item => ({
            ...item,
            productId: parseInt(item.productId)
          })),
        // 合并日期和时间
        date: new Date(
          values.activityDate.getFullYear(),
          values.activityDate.getMonth(),
          values.activityDate.getDate(),
          ...values.activityTime.split(":").map(Number)
        )
      }

      // 创建新活动
      await enhancedOps.create('团建记录').form(
        async () => {
          return await createWorkshop(submitData)
        },
        null,
        submitData,
        { canUndo: true }
      )

      // 重置表单
      form.reset({
        customerId: "",
        activityDate: new Date(),
        activityTime: "14:00",
        activityType: "jewelry_enameling",
        locationType: "in_gallery",
        baseType: "jewelry",
        location: "",
        participants: 10,
        duration: 2,
        teacherId: "",
        assistantId: "",
        managerId: "",
        notes: "",
        serviceItems: [{ productId: "", quantity: 1, price: 0, notes: "" }],
      })
    } catch (error) {
      console.error("Error submitting workshop data:", error)
      toast({
        title: "提交失败",
        description: error.message || "保存手作团建记录时出错",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>加载数据中...</span>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 客户和基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>客户和基本信息</CardTitle>
              <CardDescription>选择客户并填写活动基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>客户</FormLabel>
                    <CustomerSelector
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="activityDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>活动日期</FormLabel>
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

                <FormField
                  control={form.control}
                  name="activityTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>活动时间</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <Input type="time" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="participants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>参与人数</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>活动时长 (小时)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          min="0.5"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* 活动类型和地点 */}
          <Card>
            <CardHeader>
              <CardTitle>活动类型和地点</CardTitle>
              <CardDescription>选择活动类型、场地类型和底胎类型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="activityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>活动类型</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择活动类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(activityTypeMap).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="locationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>场地类型</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择场地类型" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(locationTypeMap).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="baseType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>底胎类型</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择底胎类型" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(baseTypeMap).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>具体地点</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="输入具体地点" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* 服务人员 */}
        <Card>
          <CardHeader>
            <CardTitle>服务人员</CardTitle>
            <CardDescription>选择讲师、助理和项目负责人</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="teacherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>讲师</FormLabel>
                    <EmployeeSelector
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assistantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>助理 (可选)</FormLabel>
                    <EmployeeSelector
                      value={field.value}
                      onChange={field.onChange}
                      allowEmpty={true}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>项目负责人</FormLabel>
                    <EmployeeSelector
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* 服务项目 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>服务项目</CardTitle>
              <CardDescription>添加团建活动中的服务项目</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addServiceItem}>
              <Plus className="mr-2 h-4 w-4" />
              添加项目
            </Button>
          </CardHeader>
          <CardContent>
            {form.getValues("serviceItems").map((_, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 mb-4 items-end">
                <div className="col-span-5">
                  <FormField
                    control={form.control}
                    name={`serviceItems.${index}.productId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>服务项目</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择服务项目" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {artworks.map((product) => (
                              <SelectItem key={artwork.id} value={artwork.id.toString()}>
                                {artwork.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name={`serviceItems.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>数量</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) => {
                              field.onChange(Number.parseInt(e.target.value) || 0);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name={`serviceItems.${index}.price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>单价</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => {
                              field.onChange(Number.parseFloat(e.target.value) || 0);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name={`serviceItems.${index}.notes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>备注</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeServiceItem(index)}
                    disabled={form.getValues("serviceItems").length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 备注 */}
        <Card>
          <CardHeader>
            <CardTitle>备注信息</CardTitle>
            <CardDescription>添加活动备注信息</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="输入活动备注信息..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "提交中..." : "提交手作团建记录"}
        </Button>
      </form>
    </Form>
  )
}
