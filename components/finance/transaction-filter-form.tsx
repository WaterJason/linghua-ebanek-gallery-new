"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { getFinancialAccounts, getFinancialCategories } from "@/lib/actions/finance-actions"

// 表单验证模式
const filterFormSchema = z.object({
  type: z.string().default("all"),
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  searchTerm: z.string().optional(),
})

interface TransactionFilterFormProps {
  initialFilter?: any
  onSubmit?: (filter: any) => void
  onCancel?: () => void
}

export function TransactionFilterForm({ initialFilter = {}, onSubmit, onCancel }: TransactionFilterFormProps) {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedType, setSelectedType] = useState(initialFilter?.type || "all")

  // 加载账户和分类数据
  useEffect(() => {
    const loadData = async () => {
      try {
        // 加载账户
        const accountsData = await getFinancialAccounts()
        setAccounts(accountsData)
        
        // 加载分类
        const categoriesData = await getFinancialCategories("all")
        setCategories(categoriesData)
      } catch (error) {
        console.error("加载数据失败:", error)
        toast({
          variant: "destructive",
          title: "加载失败",
          description: "无法加载账户和分类数据",
        })
      }
    }
    
    loadData()
  }, [toast])

  // 初始化表单
  const form = useForm<z.infer<typeof filterFormSchema>>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: {
      type: initialFilter?.type || "all",
      dateRange: {
        from: initialFilter?.startDate ? new Date(initialFilter.startDate) : undefined,
        to: initialFilter?.endDate ? new Date(initialFilter.endDate) : undefined,
      },
      accountId: initialFilter?.accountId || "",
      categoryId: initialFilter?.categoryId || "",
      searchTerm: initialFilter?.searchTerm || "",
    },
  })

  // 监听类型变化
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "type") {
        setSelectedType(value.type as string)
        // 当类型变化时，清空分类选择
        if (value.type !== initialFilter?.type) {
          form.setValue("categoryId", "")
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [form, initialFilter?.type])

  // 提交表单
  const handleSubmit = (values: z.infer<typeof filterFormSchema>) => {
    const filter = {
      type: values.type,
      startDate: values.dateRange?.from?.toISOString(),
      endDate: values.dateRange?.to?.toISOString(),
      accountId: values.accountId || undefined,
      categoryId: values.categoryId || undefined,
      searchTerm: values.searchTerm || undefined,
    }
    
    if (onSubmit) {
      onSubmit(filter)
    }
  }

  // 重置筛选
  const handleReset = () => {
    form.reset({
      type: "all",
      dateRange: undefined,
      accountId: "",
      categoryId: "",
      searchTerm: "",
    })
  }

  // 获取当前类型的分类列表
  const getFilteredCategories = () => {
    if (selectedType === "all") {
      return categories
    }
    return categories.filter(category => category.type === selectedType)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>交易类型</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择交易类型" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="all">所有类型</SelectItem>
                  <SelectItem value="income">收入</SelectItem>
                  <SelectItem value="expense">支出</SelectItem>
                  <SelectItem value="transfer">转账</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                筛选特定类型的交易
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="dateRange"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>日期范围</FormLabel>
              <DateRangePicker
                value={field.value}
                onChange={field.onChange}
              />
              <FormDescription>
                筛选特定日期范围内的交易
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>账户</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择账户" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">所有账户</SelectItem>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                筛选特定账户的交易
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>分类</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">所有分类</SelectItem>
                  {getFilteredCategories().map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                筛选特定分类的交易
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="searchTerm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>搜索关键词</FormLabel>
              <FormControl>
                <Input placeholder="输入搜索关键词" {...field} />
              </FormControl>
              <FormDescription>
                搜索交易对象、备注等字段
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-between gap-2">
          <Button type="button" variant="outline" onClick={handleReset}>
            重置筛选
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button type="submit">
              应用筛选
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
