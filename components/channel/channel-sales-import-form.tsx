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
import { CalendarIcon, FileUpIcon, Loader2Icon } from "lucide-react"
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
import { importChannelSalesFromExcel } from "@/lib/actions/channel-actions"
import { getProducts } from "@/lib/actions/product-actions"

// 表单验证模式
const formSchema = z.object({
  channelId: z.string().min(1, "请选择渠道"),
  saleDate: z.date({
    required_error: "请选择销售日期",
  }),
  importSource: z.string().optional(),
  notes: z.string().optional(),
  // 这里不验证文件，因为文件上传需要特殊处理
})

export function ChannelSalesImportForm({ channels, selectedChannelId, onSuccess }) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [products, setProducts] = useState([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [excelFile, setExcelFile] = useState(null)
  const [parsedData, setParsedData] = useState([])
  const [isParsingFile, setIsParsingFile] = useState(false)

  // 初始化表单
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      channelId: selectedChannelId || "",
      saleDate: new Date(),
      importSource: "",
      notes: "",
    },
  })

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

  // 处理文件上传
  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setExcelFile(file)
    setIsParsingFile(true)
    
    try {
      // 在实际应用中，这里应该使用Excel解析库（如SheetJS）解析Excel文件
      // 为了演示，我们模拟解析过程，生成一些示例数据
      
      // 模拟解析延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟解析结果
      const mockParsedData = [
        {
          productId: products[0]?.id || 1,
          productName: products[0]?.name || "产品1",
          quantity: 5,
          price: 100,
        },
        {
          productId: products[1]?.id || 2,
          productName: products[1]?.name || "产品2",
          quantity: 3,
          price: 200,
        },
      ]
      
      setParsedData(mockParsedData)
      
      // 设置导入来源为文件名
      form.setValue("importSource", file.name)
      
      toast({
        title: "解析成功",
        description: `成功解析 ${mockParsedData.length} 条销售记录`,
      })
    } catch (error) {
      toast({
        title: "解析失败",
        description: error.message || "无法解析Excel文件",
        variant: "destructive",
      })
    } finally {
      setIsParsingFile(false)
    }
  }

  // 提交表单
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)
      
      if (parsedData.length === 0) {
        throw new Error("没有可导入的销售数据")
      }
      
      // 导入销售数据
      await importChannelSalesFromExcel(parseInt(data.channelId), {
        ...data,
        items: parsedData,
      })
      
      toast({
        title: "导入成功",
        description: "销售数据已成功导入",
      })
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: "导入失败",
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
          name="saleDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>销售日期 *</FormLabel>
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
        
        <FormItem>
          <FormLabel>Excel文件 *</FormLabel>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isParsingFile}
            />
            {isParsingFile && (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            )}
          </div>
          <FormDescription>
            请上传包含销售数据的Excel文件
          </FormDescription>
        </FormItem>
        
        {parsedData.length > 0 && (
          <div className="border rounded-md p-4">
            <h3 className="text-sm font-medium mb-2">解析结果预览</h3>
            <div className="text-sm text-muted-foreground">
              共 {parsedData.length} 条销售记录
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {parsedData.map((item, index) => (
                <li key={index}>
                  {item.productName} × {item.quantity} = ¥{(item.price * item.quantity).toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <FormField
          control={form.control}
          name="importSource"
          render={({ field }) => (
            <FormItem>
              <FormLabel>导入来源</FormLabel>
              <FormControl>
                <Input placeholder="请输入导入来源" {...field} />
              </FormControl>
              <FormDescription>
                记录数据来源，默认为文件名
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
          <Button 
            type="submit" 
            disabled={isSubmitting || parsedData.length === 0}
          >
            {isSubmitting ? "导入中..." : "导入"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
