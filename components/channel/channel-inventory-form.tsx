"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
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
import { upsertChannelInventory } from "@/lib/actions/channel-actions"
import { getProducts } from "@/lib/actions/product-actions"

// 导入增强操作系统
import { useEnhancedOperations } from "@/lib/enhanced-operations"

// 表单验证模式
const formSchema = z.object({
  channelId: z.string().min(1, "请选择渠道"),
  productId: z.string().min(1, "请选择产品"),
  quantity: z.string().min(1, "数量不能为空").refine(
    (val) => !isNaN(parseInt(val)) && parseInt(val) >= 0,
    { message: "数量必须是非负整数" }
  ),
  minQuantity: z.string().optional().refine(
    (val) => val === "" || (!isNaN(parseInt(val)) && parseInt(val) >= 0),
    { message: "最小库存必须是非负整数" }
  ),
  notes: z.string().optional(),
})

export function ChannelInventoryForm({ inventory, channels, onSuccess }) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [products, setProducts] = useState([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  // 增强操作系统
  const enhancedOps = useEnhancedOperations('channel')

  // 初始化表单
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      channelId: "",
      productId: "",
      quantity: "",
      minQuantity: "",
      notes: "",
    },
  })

  // 加载产品数据
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoadingProducts(true)
        const data = await getProducts()
        setProducts(data as any) // 暂时使用any类型避免类型错误
      } catch (error) {
        toast({
          title: "加载失败",
          description: error.message || "无法加载产品数据",
          variant: "destructive",
        })
      } finally {
        setIsLoadingProducts(false)
      }
    }

    loadProducts()
  }, [toast])

  // 如果有库存数据，填充表单
  useEffect(() => {
    if (inventory) {
      form.reset({
        channelId: inventory.channelId.toString(),
        productId: inventory.artworkId.toString(),
        quantity: inventory.quantity.toString(),
        minQuantity: inventory.minQuantity !== null ? inventory.minQuantity.toString() : "",
        notes: inventory.notes || "",
      })
    }
  }, [inventory, form])

  // 提交表单
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)

      const beforeData = inventory ? {
        channelId: inventory.channelId,
        productId: inventory.productId,
        quantity: inventory.quantity,
        minQuantity: inventory.minQuantity,
        notes: inventory.notes,
      } : null

      const submitData = {
        ...data,
        id: inventory?.id,
      }

      // 创建或更新库存
      if (inventory) {
        await enhancedOps.update('渠道库存').form(
          async () => {
            return await upsertChannelInventory(submitData)
          },
          beforeData,
          data,
          { canUndo: true }
        )
      } else {
        await enhancedOps.create('渠道库存').form(
          async () => {
            return await upsertChannelInventory(submitData)
          },
          null,
          data,
          { canUndo: true }
        )
      }

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("渠道库存表单提交错误:", error)
      // 错误已由增强操作系统处理
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="channelId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>渠道 *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!!inventory} // 编辑时不允许修改渠道
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择渠道" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id.toString()}>
                      {channel.name}
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
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>产品 *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!!inventory || isLoadingProducts} // 编辑时不允许修改产品
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingProducts ? "加载中..." : "请选择产品"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} ({product.code || "无编码"})
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
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>库存数量 *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="请输入库存数量"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                当前渠道的库存数量
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="minQuantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>最小库存</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="请输入最小库存"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                库存低于此数量时会显示警告
              </FormDescription>
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
                <Textarea
                  placeholder="请输入备注信息"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess && onSuccess()}
          >
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "提交中..." : inventory ? "更新" : "创建"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
