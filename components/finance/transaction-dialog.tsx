"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { toast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { PrismaFinancialTransaction, PrismaFinancialAccount, PrismaFinancialCategory } from "@/types/prisma-models"

// 表单验证模式
const transactionFormSchema = z.object({
  transactionDate: z.date({
    required_error: "请选择交易日期",
  }),
  type: z.string({
    required_error: "请选择交易类型",
  }),
  amount: z.coerce.number().positive({
    message: "金额必须大于0",
  }),
  accountId: z.coerce.number({
    required_error: "请选择账户",
  }),
  categoryId: z.coerce.number().optional().nullable(),
  paymentMethod: z.string().optional(),
  relatedId: z.coerce.number().optional().nullable(),
  relatedType: z.string().optional(),
  counterparty: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default("completed"),
})

type TransactionFormValues = z.infer<typeof transactionFormSchema>

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: PrismaFinancialTransaction
  accounts: PrismaFinancialAccount[]
  categories: PrismaFinancialCategory[]
  onSuccess?: () => void
}

export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  accounts,
  categories,
  onSuccess,
}: TransactionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!transaction

  // 默认表单值
  const defaultValues: Partial<TransactionFormValues> = {
    transactionDate: transaction ? new Date(transaction.transactionDate) : new Date(),
    type: transaction?.type || "income",
    amount: transaction?.amount || 0,
    accountId: transaction?.accountId || (accounts.length > 0 ? accounts[0].id : 0),
    categoryId: transaction?.categoryId || null,
    paymentMethod: transaction?.paymentMethod || "",
    relatedId: transaction?.relatedId || null,
    relatedType: transaction?.relatedType || "",
    counterparty: transaction?.counterparty || "",
    notes: transaction?.notes || "",
    status: transaction?.status || "completed",
  }

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues,
  })

  // 监听交易类型变化
  const watchType = form.watch("type")

  // 获取当前类型的分类列表
  const getFilteredCategories = () => {
    if (!watchType || (watchType !== "income" && watchType !== "expense")) {
      return []
    }
    
    return categories.filter(c => c.type === watchType && c.isActive)
  }

  // 获取可用的账户列表
  const getActiveAccounts = () => {
    return accounts.filter(a => a.isActive)
  }

  // 当交易类型变化时，清空分类
  useEffect(() => {
    if (watchType === "transfer") {
      form.setValue("categoryId", null)
    }
  }, [watchType, form])

  async function onSubmit(data: TransactionFormValues) {
    try {
      setIsLoading(true)

      if (isEditing) {
        // 更新交易记录
        const response = await fetch(`/api/finance/transactions/${transaction.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "更新交易记录失败")
        }

        toast({
          title: "更新成功",
          description: "交易记录已成功更新",
        })
      } else {
        // 创建交易记录
        const response = await fetch("/api/finance/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "创建交易记录失败")
        }

        toast({
          title: "创建成功",
          description: "交易记录已成功创建",
        })
      }

      // 重置表单
      form.reset()
      
      // 关闭对话框
      onOpenChange(false)
      
      // 回调
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: isEditing ? "更新失败" : "创建失败",
        description: error instanceof Error ? error.message : "操作失败",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "编辑交易记录" : "新增交易记录"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "修改财务交易记录信息"
              : "添加新的财务交易记录，记录收入或支出"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>交易类型</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择交易类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">收入</SelectItem>
                        <SelectItem value="expense">支出</SelectItem>
                        <SelectItem value="transfer">转账</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>金额</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="请输入金额"
                        {...field}
                      />
                    </FormControl>
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
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择账户" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getActiveAccounts().map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>分类</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "null" ? null : parseInt(value))}
                      value={field.value?.toString() || "null"}
                      disabled={watchType === "transfer"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择分类" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">无分类</SelectItem>
                        {getFilteredCategories().map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {watchType === "transfer" ? "转账交易无需选择分类" : "选择适合的收支分类"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>支付方式</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择支付方式" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">无</SelectItem>
                        <SelectItem value="cash">现金</SelectItem>
                        <SelectItem value="bank">银行转账</SelectItem>
                        <SelectItem value="alipay">支付宝</SelectItem>
                        <SelectItem value="wechat">微信支付</SelectItem>
                        <SelectItem value="card">刷卡</SelectItem>
                        <SelectItem value="other">其他</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {watchType === "transfer" && (
              <FormField
                control={form.control}
                name="relatedId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>目标账户</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择目标账户" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getActiveAccounts()
                          .filter(a => a.id !== form.getValues("accountId"))
                          .map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              {account.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      转账的目标账户，不能与源账户相同
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="counterparty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>交易对方</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="请输入交易对方"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {watchType === "income" ? "付款方" : watchType === "expense" ? "收款方" : "可选"}
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
                      <SelectItem value="completed">已完成</SelectItem>
                      <SelectItem value="pending">待处理</SelectItem>
                      <SelectItem value="cancelled">已取消</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "处理中..." : isEditing ? "更新" : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
