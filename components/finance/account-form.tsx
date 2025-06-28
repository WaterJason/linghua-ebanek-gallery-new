"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
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
import { Switch } from "@/components/ui/switch"
import { createFinancialAccount, updateFinancialAccount } from "@/lib/actions/finance-actions"

// 导入增强操作系统
import { useEnhancedOperations } from "@/lib/enhanced-operations"

// 表单验证模式
const accountFormSchema = z.object({
  name: z.string().min(1, "账户名称不能为空").max(100, "账户名称不能超过100个字符"),
  type: z.string().min(1, "请选择账户类型"),
  accountNumber: z.string().optional(),
  description: z.string().optional(),
  currentBalance: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
})

interface AccountFormProps {
  account?: any
  isEditing?: boolean
  onSuccess?: (account: any) => void
  onCancel?: () => void
}

export function AccountForm({ account, isEditing = false, onSuccess, onCancel }: AccountFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 增强操作系统
  const enhancedOps = useEnhancedOperations('finance')

  // 初始化表单
  const form = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: account?.name || "",
      type: account?.type || "",
      accountNumber: account?.accountNumber || "",
      description: account?.description || "",
      currentBalance: account?.currentBalance || 0,
      isActive: account?.isActive !== undefined ? account.isActive : true,
    },
  })

  // 提交表单
  const onSubmit = async (values: z.infer<typeof accountFormSchema>) => {
    setIsSubmitting(true)
    try {
      const beforeData = isEditing && account ? {
        name: account.name,
        type: account.type,
        accountNumber: account.accountNumber,
        description: account.description,
        currentBalance: account.currentBalance,
        isActive: account.isActive,
      } : null

      let result

      if (isEditing && account) {
        // 更新账户
        result = await enhancedOps.update('财务账户').form(
          async () => {
            return await updateFinancialAccount(account.id, values)
          },
          beforeData,
          values,
          { canUndo: true }
        )
      } else {
        // 创建账户
        result = await enhancedOps.create('财务账户').form(
          async () => {
            return await createFinancialAccount(values)
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
      console.error("保存账户失败:", error)
      // 错误已由增强操作系统处理
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>账户名称</FormLabel>
              <FormControl>
                <Input placeholder="输入账户名称" {...field} />
              </FormControl>
              <FormDescription>
                账户的显示名称，如"现金账户"、"工商银行"等
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>账户类型</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择账户类型" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bank">银行账户</SelectItem>
                  <SelectItem value="cash">现金账户</SelectItem>
                  <SelectItem value="alipay">支付宝</SelectItem>
                  <SelectItem value="wechat">微信支付</SelectItem>
                  <SelectItem value="other">其他账户</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                账户的类型，用于分类和报表统计
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>账号</FormLabel>
              <FormControl>
                <Input placeholder="输入账号（可选）" {...field} />
              </FormControl>
              <FormDescription>
                银行卡号、支付宝账号等（可选）
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currentBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>当前余额</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormDescription>
                账户的当前余额
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>描述</FormLabel>
              <FormControl>
                <Textarea placeholder="输入账户描述（可选）" {...field} />
              </FormControl>
              <FormDescription>
                账户的详细描述（可选）
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">账户状态</FormLabel>
                <FormDescription>
                  设置账户是否处于活跃状态
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : isEditing ? "更新账户" : "创建账户"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
