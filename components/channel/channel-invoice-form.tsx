"use client"

import { useState } from "react"
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
import { CalendarIcon, ImageIcon } from "lucide-react"
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
import { addChannelInvoice } from "@/lib/actions/channel-actions"

// 表单验证模式
const formSchema = z.object({
  settlementId: z.string().min(1, "结算单ID不能为空"),
  invoiceNo: z.string().optional(),
  invoiceDate: z.date().optional(),
  amount: z.string().min(1, "金额不能为空").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "金额必须是正数" }
  ),
  status: z.string().default("pending"),
  notes: z.string().optional(),
})

export function ChannelInvoiceForm({ settlement, onSuccess }) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState("")

  // 初始化表单
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      settlementId: settlement?.id.toString() || "",
      invoiceNo: "",
      invoiceDate: undefined,
      amount: settlement?.totalAmount.toString() || "",
      status: "pending",
      notes: "",
    },
  })

  // 处理图片上传
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // 在实际应用中，这里应该上传图片到服务器，然后获取URL
    // 为了演示，我们模拟一个本地URL
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    
    toast({
      title: "图片上传成功",
      description: "发票图片已成功上传",
    })
  }

  // 提交表单
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)
      
      // 添加发票记录
      await addChannelInvoice({
        ...data,
        imageUrl,
      })
      
      toast({
        title: "添加成功",
        description: "发票记录已成功添加",
      })
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: "添加失败",
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
        <div>
          <p className="text-sm font-medium">结算单信息</p>
          <p className="text-sm text-muted-foreground">
            {settlement.channel.name} - {settlement.settlementNo}
          </p>
          <p className="text-sm text-muted-foreground">
            结算周期: {format(new Date(settlement.startDate), "yyyy-MM-dd")} 至 {format(new Date(settlement.endDate), "yyyy-MM-dd")}
          </p>
        </div>
        
        <FormField
          control={form.control}
          name="invoiceNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>发票号</FormLabel>
              <FormControl>
                <Input placeholder="请输入发票号" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="invoiceDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>开票日期</FormLabel>
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>金额 (¥) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="请输入金额"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormItem>
          <FormLabel>发票图片</FormLabel>
          <div className="flex flex-col gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
            {imageUrl && (
              <div className="mt-2 border rounded-md p-2">
                <div className="aspect-video relative bg-muted rounded-md overflow-hidden">
                  <img
                    src={imageUrl}
                    alt="发票图片"
                    className="object-contain w-full h-full"
                  />
                </div>
              </div>
            )}
          </div>
          <FormDescription>
            上传发票图片（可选）
          </FormDescription>
        </FormItem>
        
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>状态</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择状态" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">待收到</SelectItem>
                  <SelectItem value="received">已收到</SelectItem>
                </SelectContent>
              </Select>
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
            {isSubmitting ? "添加中..." : "添加发票"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
