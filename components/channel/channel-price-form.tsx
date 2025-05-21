"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
import { createChannelPrice, updateChannelPrice } from "@/lib/actions/channel-actions"

// 表单验证模式
const formSchema = z.object({
  channelId: z.string().min(1, "请选择渠道"),
  productId: z.string().min(1, "请选择产品"),
  price: z.string().min(1, "价格不能为空").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    { message: "价格必须是非负数" }
  ),
  isActive: z.boolean().default(true),
})

export function ChannelPriceForm({ price, channels, products, onSuccess }) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 初始化表单
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      channelId: "",
      productId: "",
      price: "",
      isActive: true,
    },
  })

  // 如果有价格数据，填充表单
  useEffect(() => {
    if (price) {
      form.reset({
        channelId: price.channelId.toString(),
        productId: price.productId.toString(),
        price: price.price.toString(),
        isActive: price.isActive,
      })
    }
  }, [price, form])

  // 提交表单
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)
      
      if (price) {
        // 更新价格
        await updateChannelPrice(price.id, data)
        toast({
          title: "更新成功",
          description: "渠道价格已成功更新",
        })
      } else {
        // 创建价格
        await createChannelPrice(data)
        toast({
          title: "创建成功",
          description: "渠道价格已成功创建",
        })
      }
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: price ? "更新失败" : "创建失败",
        description: error.message || "操作失败，请重试",
        variant: "destructive",
      })
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
                disabled={!!price} // 编辑时不允许修改渠道
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
                disabled={!!price} // 编辑时不允许修改产品
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择产品" />
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
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>价格 (¥) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="请输入价格"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                设置该渠道的专属价格
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>启用状态</FormLabel>
                <FormDescription>
                  禁用后，该价格将不会在系统中生效
                </FormDescription>
              </div>
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
            {isSubmitting ? "提交中..." : price ? "更新" : "创建"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
