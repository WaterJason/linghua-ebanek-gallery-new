"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
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
import { createChannelSettlement } from "@/lib/actions/channel-actions"

// 表单验证模式
const formSchema = z.object({
  channelId: z.string().min(1, "请选择渠道"),
  startDate: z.date({
    required_error: "请选择开始日期",
  }),
  endDate: z.date({
    required_error: "请选择结束日期",
  }),
  notes: z.string().optional(),
}).refine(
  (data) => data.startDate < data.endDate,
  {
    message: "结束日期必须晚于开始日期",
    path: ["endDate"],
  }
)

export function ChannelSettlementForm({ channels, selectedChannelId, onSuccess }) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 初始化表单
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      channelId: selectedChannelId || "",
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
      notes: "",
    },
  })

  // 监听渠道ID变化，自动设置结算周期
  const watchChannelId = form.watch("channelId")

  // 设置上个月的结算周期
  const setPreviousMonth = () => {
    const prevMonth = addMonths(new Date(), -1)
    form.setValue("startDate", startOfMonth(prevMonth))
    form.setValue("endDate", endOfMonth(prevMonth))
  }

  // 设置当月的结算周期
  const setCurrentMonth = () => {
    form.setValue("startDate", startOfMonth(new Date()))
    form.setValue("endDate", endOfMonth(new Date()))
  }

  // 提交表单
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)
      
      // 创建结算单
      await createChannelSettlement(data)
      
      toast({
        title: "创建成功",
        description: "结算单已成功创建",
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
        
        <div className="flex justify-between mb-2">
          <Button type="button" variant="outline" size="sm" onClick={setPreviousMonth}>
            设置为上个月
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={setCurrentMonth}>
            设置为当月
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>开始日期 *</FormLabel>
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
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>结束日期 *</FormLabel>
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
        </div>
        
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
          <Button type="submit" disabled={isSubmitting || !watchChannelId}>
            {isSubmitting ? "创建中..." : "创建结算单"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
