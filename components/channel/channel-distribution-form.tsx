"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
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
import { createChannelDistribution } from "@/lib/actions/channel-actions"
import { getProducts } from "@/lib/actions/product-actions"

// 表单验证模式
const formSchema = z.object({
  channelId: z.string().min(1, "请选择渠道"),
  channelInventoryId: z.string().min(1, "请选择产品"),
  quantity: z.string().min(1, "数量不能为空").refine(
    (val) => !isNaN(parseInt(val)) && parseInt(val) > 0,
    { message: "数量必须是正整数" }
  ),
  distributionDate: z.date({
    required_error: "请选择日期",
  }),
  notes: z.string().optional(),
})

export function ChannelDistributionForm({ channels, selectedChannelId, onSuccess }) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [products, setProducts] = useState([])
  const [channelInventory, setChannelInventory] = useState([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  // 初始化表单
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      channelId: selectedChannelId || "",
      channelInventoryId: "",
      quantity: "",
      distributionDate: new Date(),
      notes: "",
    },
  })

  // 监听渠道ID变化，加载该渠道的库存产品
  const watchChannelId = form.watch("channelId")

  // 加载产品数据
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoadingProducts(true)
        const data = await getProducts()
        setProducts(data)
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

  // 当渠道ID变化时，获取该渠道的库存产品
  useEffect(() => {
    const loadChannelInventory = async () => {
      if (!watchChannelId) return
      
      try {
        // 这里应该调用API获取渠道库存，但为了简化，我们直接使用产品数据
        // 在实际应用中，应该调用getChannelInventory(parseInt(watchChannelId))
        setChannelInventory(products.map(product => ({
          id: product.id,
          productId: product.id,
          product: product,
        })))
      } catch (error) {
        toast({
          title: "加载失败",
          description: error.message || "无法加载渠道库存数据",
          variant: "destructive",
        })
      }
    }
    
    if (watchChannelId) {
      loadChannelInventory()
    }
  }, [watchChannelId, products, toast])

  // 提交表单
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)
      
      // 创建配货记录
      await createChannelDistribution(data)
      
      toast({
        title: "创建成功",
        description: "配货记录已成功创建",
      })
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: "创建失败",
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
                disabled={!!selectedChannelId}
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
          name="channelInventoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>产品 *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!watchChannelId || isLoadingProducts}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!watchChannelId ? "请先选择渠道" : isLoadingProducts ? "加载中..." : "请选择产品"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {channelInventory.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.product.name} ({item.product.code || "无编码"})
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
              <FormLabel>数量 *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="请输入数量"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                配货数量必须大于0
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="distributionDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>配货日期 *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                    >
                      {field.value ? (
                        format(field.value, "yyyy-MM-dd")
                      ) : (
                        <span>请选择日期</span>
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
            {isSubmitting ? "提交中..." : "创建"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
