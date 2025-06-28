"use client"

import { useState } from "react"
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
import { toast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { PrismaFinancialAccount, PrismaFinancialCategory } from "@/types/prisma-models"

// 表单验证模式
const filterFormSchema = z.object({
  accountId: z.coerce.number().optional(),
  categoryId: z.coerce.number().optional(),
  type: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
})

type FilterFormValues = z.infer<typeof filterFormSchema>

interface TransactionFilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: any
  accounts: PrismaFinancialAccount[]
  categories: PrismaFinancialCategory[]
  onApplyFilters: (filters: any) => void
}

export function TransactionFilterDialog({
  open,
  onOpenChange,
  filters,
  accounts,
  categories,
  onApplyFilters,
}: TransactionFilterDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  // 默认表单值
  const defaultValues: Partial<FilterFormValues> = {
    accountId: filters.accountId,
    categoryId: filters.categoryId,
    type: filters.type || "",
    startDate: filters.startDate ? new Date(filters.startDate) : undefined,
    endDate: filters.endDate ? new Date(filters.endDate) : undefined,
  }

  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterFormSchema),
    defaultValues,
  })

  function onSubmit(data: FilterFormValues) {
    try {
      setIsLoading(true)

      // 转换日期格式
      const formattedFilters = {
        ...data,
        startDate: data.startDate ? format(data.startDate, "yyyy-MM-dd") : undefined,
        endDate: data.endDate ? format(data.endDate, "yyyy-MM-dd") : undefined,
      }

      // 应用筛选条件
      onApplyFilters(formattedFilters)

      // 关闭对话框
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "筛选失败",
        description: error instanceof Error ? error.message : "应用筛选条件失败",
      })
    } finally {
      setIsLoading(false)
    }
  }

  function onReset() {
    // 重置表单
    form.reset({
      accountId: undefined,
      categoryId: undefined,
      type: "",
      startDate: undefined,
      endDate: undefined,
    })

    // 应用空筛选条件
    onApplyFilters({
      accountId: undefined,
      categoryId: undefined,
      type: undefined,
      startDate: undefined,
      endDate: undefined,
    })

    // 关闭对话框
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>筛选交易记录</DialogTitle>
          <DialogDescription>
            设置筛选条件，查找符合条件的交易记录
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>账户</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "all" ? undefined : parseInt(value))}
                    value={field.value?.toString() || "all"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="全部账户" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">全部账户</SelectItem>
                      {accounts.map((account) => (
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
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>分类</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "all" ? undefined : parseInt(value))}
                    value={field.value?.toString() || "all"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="全部分类" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">全部分类</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>交易类型</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "all" ? undefined : value)}
                    value={field.value || "all"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="全部类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">全部类型</SelectItem>
                      <SelectItem value="income">收入</SelectItem>
                      <SelectItem value="expense">支出</SelectItem>
                      <SelectItem value="transfer">转账</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>开始日期</FormLabel>
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
                              <span>选择开始日期</span>
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
                    <FormLabel>结束日期</FormLabel>
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
                              <span>选择结束日期</span>
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
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onReset}
              >
                重置筛选
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "处理中..." : "应用筛选"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
