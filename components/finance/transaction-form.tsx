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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getFinancialAccounts,
  getFinancialCategories,
  createFinancialTransaction,
  updateFinancialTransaction
} from "@/lib/actions/finance-actions"

// 导入增强操作系统
import { useEnhancedOperations } from "@/lib/enhanced-operations"

// 表单验证模式
const transactionFormSchema = z.object({
  type: z.string().min(1, "请选择交易类型"),
  amount: z.coerce.number().min(0.01, "金额必须大于0"),
  transactionDate: z.date({
    required_error: "请选择交易日期",
  }),
  accountId: z.string().min(1, "请选择账户"),
  categoryId: z.string().optional(),
  counterparty: z.string().optional(),
  notes: z.string().optional(),
})

interface TransactionFormProps {
  transaction?: any
  isEditing?: boolean
  onSuccess?: (transaction: any) => void
  onCancel?: () => void
}

export function TransactionForm({ transaction, isEditing = false, onSuccess, onCancel }: TransactionFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedType, setSelectedType] = useState(transaction?.type || "expense")

  // 增强操作系统
  const enhancedOps = useEnhancedOperations('finance')

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
  const form = useForm<z.infer<typeof transactionFormSchema>>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: transaction?.type || "expense",
      amount: transaction?.amount || 0,
      transactionDate: transaction?.transactionDate ? new Date(transaction.transactionDate) : new Date(),
      accountId: transaction?.accountId || "",
      categoryId: transaction?.categoryId || "",
      counterparty: transaction?.counterparty || "",
      notes: transaction?.notes || "",
    },
  })

  // 监听类型变化
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "type") {
        setSelectedType(value.type as string)
        // 当类型变化时，清空分类选择
        form.setValue("categoryId", "")
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  // 提交表单
  const onSubmit = async (values: z.infer<typeof transactionFormSchema>) => {
    setIsSubmitting(true)
    try {
      const beforeData = isEditing && transaction ? {
        type: transaction.type,
        amount: transaction.amount,
        transactionDate: transaction.transactionDate,
        accountId: transaction.accountId,
        categoryId: transaction.categoryId,
        counterparty: transaction.counterparty,
        notes: transaction.notes,
      } : null

      let result

      if (isEditing && transaction) {
        // 更新交易
        result = await enhancedOps.update('财务交易').form(
          async () => {
            return await updateFinancialTransaction(transaction.id, values)
          },
          beforeData,
          values,
          { canUndo: true }
        )
      } else {
        // 创建交易
        result = await enhancedOps.create('财务交易').form(
          async () => {
            return await createFinancialTransaction(values)
          },
          null,
          values,
          { canUndo: true }
        )
      }

      if (onSuccess) {
        onSuccess(result)
      }
    } catch (error) {
      console.error("保存交易记录失败:", error)
      // 错误已由增强操作系统处理
    } finally {
      setIsSubmitting(false)
    }
  }

  // 获取当前类型的分类列表
  const getFilteredCategories = () => {
    return categories.filter(category => category.type === selectedType)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <SelectItem value="income">收入</SelectItem>
                  <SelectItem value="expense">支出</SelectItem>
                  <SelectItem value="transfer">转账</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                交易的类型，用于区分收入、支出和转账
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>金额</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min="0" {...field} />
              </FormControl>
              <FormDescription>
                交易的金额
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="transactionDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>交易日期</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
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
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                交易发生的日期
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
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                交易关联的账户
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
                  <SelectItem value="">无分类</SelectItem>
                  {getFilteredCategories().map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                交易的分类，用于报表统计
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="counterparty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>交易对象</FormLabel>
              <FormControl>
                <Input placeholder="输入交易对象（可选）" {...field} />
              </FormControl>
              <FormDescription>
                交易的对方，如供应商、客户等（可选）
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
                <Textarea placeholder="输入交易备注（可选）" {...field} />
              </FormControl>
              <FormDescription>
                交易的详细备注（可选）
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : isEditing ? "更新交易" : "创建交易"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
