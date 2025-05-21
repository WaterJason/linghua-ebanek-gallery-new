"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { createWorkshopActivity, updateWorkshopActivity } from "@/lib/actions/workshop-actions"
import { getProducts } from "@/lib/actions/product-actions"

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
  name: z.string().min(2, { message: "活动名称至少需要2个字符" }),
  description: z.string().optional(),
  activityType: z.enum(activityTypeEnum, {
    required_error: "请选择活动类型",
  }),
  locationType: z.enum(locationTypeEnum, {
    required_error: "请选择场地类型",
  }),
  baseType: z.enum(baseTypeEnum, {
    required_error: "请选择底胎类型",
  }),
  productId: z.string({ required_error: "请选择关联产品" }),
  duration: z.coerce.number().min(0.5, { message: "活动时长至少为0.5小时" }),
  minParticipants: z.coerce.number().min(1, { message: "最少参与人数至少为1人" }),
  maxParticipants: z.coerce.number().min(1, { message: "最大参与人数至少为1人" }),
  price: z.coerce.number().min(0, { message: "价格不能为负数" }),
  materialFee: z.coerce.number().min(0, { message: "材料费不能为负数" }).optional(),
  teacherFee: z.coerce.number().min(0, { message: "讲师费不能为负数" }).optional(),
  assistantFee: z.coerce.number().min(0, { message: "助教费不能为负数" }).optional(),
  toolsFee: z.coerce.number().min(0, { message: "工具费不能为负数" }).optional(),
  isActive: z.boolean().default(true),
})

export function WorkshopActivityForm({ activity, onSubmitted }) {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 从描述中提取额外信息
  const extractExtraInfo = (description) => {
    if (!description) return {};

    try {
      // 尝试从描述中提取JSON格式的额外信息
      const extraInfoMatch = description.match(/\{EXTRA_INFO:(.*?)\}/);
      if (extraInfoMatch && extraInfoMatch[1]) {
        return JSON.parse(extraInfoMatch[1]);
      }
    } catch (e) {
      console.error("解析额外信息失败:", e);
    }

    return {};
  };

  // 提取额外信息
  const extraInfo = activity?.description ? extractExtraInfo(activity.description) : {};

  // 初始化表单
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: activity?.name || "",
      description: activity?.description ? activity.description.replace(/\{EXTRA_INFO:.*?\}/, "") : "",
      activityType: extraInfo.activityType || "jewelry_enameling",
      locationType: extraInfo.locationType || "in_gallery",
      baseType: extraInfo.baseType || "jewelry",
      productId: activity?.productId?.toString() || "",
      duration: activity?.duration || 2,
      minParticipants: activity?.minParticipants || 5,
      maxParticipants: activity?.maxParticipants || 20,
      price: activity?.price || 0,
      materialFee: activity?.materialFee || 0,
      teacherFee: activity?.teacherFee || 0,
      assistantFee: activity?.assistantFee || 0,
      toolsFee: extraInfo.toolsFee || 0,
      isActive: activity?.isActive !== undefined ? activity.isActive : true,
    },
  })

  // 加载产品数据
  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true)
      try {
        const data = await getProducts()
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

  // 提交表单
  async function onSubmit(values) {
    setIsSubmitting(true)
    try {
      // 提取需要保存到额外信息中的字段
      const extraInfo = {
        activityType: values.activityType,
        locationType: values.locationType,
        baseType: values.baseType,
        toolsFee: values.toolsFee
      };

      // 将额外信息添加到描述中
      const extraInfoStr = `{EXTRA_INFO:${JSON.stringify(extraInfo)}}`;
      const description = `${values.description || ""} ${extraInfoStr}`;

      // 准备提交的数据
      const submitData = {
        name: values.name,
        description,
        productId: parseInt(values.productId),
        duration: values.duration,
        minParticipants: values.minParticipants,
        maxParticipants: values.maxParticipants,
        price: values.price,
        materialFee: values.materialFee,
        teacherFee: values.teacherFee,
        assistantFee: values.assistantFee,
        isActive: values.isActive
      };

      if (activity) {
        // 更新现有活动
        await updateWorkshopActivity(activity.id, submitData);
        toast({
          title: "更新成功",
          description: "团建活动已成功更新",
        })
      } else {
        // 创建新活动
        await createWorkshopActivity(submitData);
        toast({
          title: "创建成功",
          description: "团建活动已成功创建",
        })
      }

      if (onSubmitted) {
        onSubmitted()
      }
    } catch (error) {
      console.error("Error submitting workshop activity:", error)
      toast({
        title: "提交失败",
        description: error.message || "保存团建活动时出错",
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>活动名称</FormLabel>
                <FormControl>
                  <Input placeholder="输入团建活动名称" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>关联产品</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择关联产品" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
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
                    <SelectItem value="jewelry_enameling">饰品点蓝手作</SelectItem>
                    <SelectItem value="cloisonne_enameling">掐丝珐琅手作</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  选择非遗掐丝珐琅手作沙龙/团建的活动类型
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    <SelectItem value="in_gallery">馆内</SelectItem>
                    <SelectItem value="outside">外出</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  选择活动场地类型
                </FormDescription>
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
                    <SelectItem value="jewelry">饰品</SelectItem>
                    <SelectItem value="coaster_bookmark">杯垫/书签</SelectItem>
                    <SelectItem value="painting">摆画</SelectItem>
                    <SelectItem value="ornament">摆件</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  选择活动使用的底胎类型
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>活动描述</FormLabel>
              <FormControl>
                <Textarea placeholder="输入团建活动描述" {...field} />
              </FormControl>
              <FormDescription>
                详细描述活动内容、特色和亮点
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>活动时长 (小时)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minParticipants"
            render={({ field }) => (
              <FormItem>
                <FormLabel>最少参与人数</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxParticipants"
            render={({ field }) => (
              <FormItem>
                <FormLabel>最大参与人数</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-lg font-medium mb-2">价格设置</h3>
            <div className="grid grid-cols-1 gap-4 p-4 border rounded-lg">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>活动价格 (元)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      客户参与活动的总价格
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">成本结构</h3>
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
              <FormField
                control={form.control}
                name="materialFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>材料费 (元)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      底胎和珐琅材料成本
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toolsFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>工具费 (元)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      工具使用和损耗成本
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="teacherFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>讲师费 (元)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      主讲师的劳务费用
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assistantFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>助教费 (元)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      助教的劳务费用
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-medium mb-2">成本分析</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">总成本</p>
              <p className="text-lg font-medium">
                ¥{(
                  parseFloat(form.watch("materialFee") || 0) +
                  parseFloat(form.watch("toolsFee") || 0) +
                  parseFloat(form.watch("teacherFee") || 0) +
                  parseFloat(form.watch("assistantFee") || 0)
                ).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">预计利润</p>
              <p className={`text-lg font-medium ${
                parseFloat(form.watch("price") || 0) - (
                  parseFloat(form.watch("materialFee") || 0) +
                  parseFloat(form.watch("toolsFee") || 0) +
                  parseFloat(form.watch("teacherFee") || 0) +
                  parseFloat(form.watch("assistantFee") || 0)
                ) < 0 ? "text-red-500" : "text-green-500"
              }`}>
                ¥{(
                  parseFloat(form.watch("price") || 0) - (
                    parseFloat(form.watch("materialFee") || 0) +
                    parseFloat(form.watch("toolsFee") || 0) +
                    parseFloat(form.watch("teacherFee") || 0) +
                    parseFloat(form.watch("assistantFee") || 0)
                  )
                ).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">活动状态</FormLabel>
                <FormDescription>
                  设置团建活动是否启用
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onSubmitted}>
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {activity ? "更新活动" : "创建活动"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
