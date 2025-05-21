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
import { Checkbox } from "@/components/ui/checkbox"
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
import { createChannel, updateChannel } from "@/lib/actions/channel-actions"

// 表单验证模式
const formSchema = z.object({
  name: z.string().min(1, "渠道名称不能为空"),
  code: z.string().min(1, "渠道编码不能为空"),
  description: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("请输入有效的邮箱地址").optional().or(z.literal("")),
  address: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  settlementCycle: z.string().default("1"),
  cooperationStart: z.date().optional(),
  status: z.string().default("active"),
  isActive: z.boolean().default(true),
})

export function ChannelForm({ channel, onSuccess }) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 初始化表单
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      address: "",
      bankName: "",
      bankAccount: "",
      settlementCycle: "1",
      cooperationStart: undefined,
      status: "active",
      isActive: true,
    },
  })

  // 如果有渠道数据，填充表单
  useEffect(() => {
    if (channel) {
      form.reset({
        name: channel.name || "",
        code: channel.code || "",
        description: channel.description || "",
        contactName: channel.contactName || "",
        contactPhone: channel.contactPhone || "",
        contactEmail: channel.contactEmail || "",
        address: channel.address || "",
        bankName: channel.bankName || "",
        bankAccount: channel.bankAccount || "",
        settlementCycle: channel.settlementCycle?.toString() || "1",
        cooperationStart: channel.cooperationStart ? new Date(channel.cooperationStart) : undefined,
        status: channel.status || "active",
        isActive: channel.isActive !== undefined ? channel.isActive : true,
      })
    }
  }, [channel, form])

  // 提交表单
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)
      
      if (channel) {
        // 更新渠道
        await updateChannel(channel.id, data)
        toast({
          title: "更新成功",
          description: `渠道 ${data.name} 已成功更新`,
        })
      } else {
        // 创建渠道
        await createChannel(data)
        toast({
          title: "创建成功",
          description: `渠道 ${data.name} 已成功创建`,
        })
      }
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: channel ? "更新失败" : "创建失败",
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>渠道名称 *</FormLabel>
                <FormControl>
                  <Input placeholder="请输入渠道名称" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>渠道编码 *</FormLabel>
                <FormControl>
                  <Input placeholder="请输入渠道编码" {...field} />
                </FormControl>
                <FormDescription>
                  唯一标识符，用于系统内部识别
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>联系人</FormLabel>
                <FormControl>
                  <Input placeholder="请输入联系人姓名" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>联系电话</FormLabel>
                <FormControl>
                  <Input placeholder="请输入联系电话" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>联系邮箱</FormLabel>
                <FormControl>
                  <Input placeholder="请输入联系邮箱" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>联系地址</FormLabel>
                <FormControl>
                  <Input placeholder="请输入联系地址" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>开户银行</FormLabel>
                <FormControl>
                  <Input placeholder="请输入开户银行" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="bankAccount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>银行账号</FormLabel>
                <FormControl>
                  <Input placeholder="请输入银行账号" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="settlementCycle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>结算周期</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择结算周期" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">月结</SelectItem>
                    <SelectItem value="2">双月结</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="cooperationStart"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>合作开始日期</FormLabel>
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>合作状态</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择合作状态" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">合作中</SelectItem>
                    <SelectItem value="paused">暂停合作</SelectItem>
                    <SelectItem value="terminated">终止合作</SelectItem>
                  </SelectContent>
                </Select>
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
              <FormLabel>描述</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="请输入渠道描述"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
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
                  禁用后，该渠道将不会在系统中显示
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
            {isSubmitting ? "提交中..." : channel ? "更新" : "创建"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
