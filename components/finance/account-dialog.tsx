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
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { PrismaFinancialAccount } from "@/types/prisma-models"

// 表单验证模式
const accountFormSchema = z.object({
  name: z.string().min(1, "账户名称不能为空"),
  accountType: z.string().min(1, "请选择账户类型"),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  initialBalance: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
})

type AccountFormValues = z.infer<typeof accountFormSchema>

interface AccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: PrismaFinancialAccount
  onSuccess?: () => void
}

export function AccountDialog({
  open,
  onOpenChange,
  account,
  onSuccess,
}: AccountDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!account

  // 默认表单值
  const defaultValues: Partial<AccountFormValues> = {
    name: account?.name || "",
    accountType: account?.accountType || "",
    accountNumber: account?.accountNumber || "",
    bankName: account?.bankName || "",
    initialBalance: account?.initialBalance || 0,
    isActive: account?.isActive !== undefined ? account.isActive : true,
    notes: account?.notes || "",
  }

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
  })

  async function onSubmit(data: AccountFormValues) {
    try {
      setIsLoading(true)

      if (isEditing) {
        // 更新账户
        const response = await fetch(`/api/finance/accounts/${account.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "更新账户失败")
        }

        toast({
          title: "更新成功",
          description: "账户信息已成功更新",
        })
      } else {
        // 创建账户
        const response = await fetch("/api/finance/accounts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "创建账户失败")
        }

        toast({
          title: "创建成功",
          description: "账户已成功创建",
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "编辑账户" : "新增账户"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "修改资金账户信息"
              : "添加新的资金账户，用于记录资金流水"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>账户名称</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入账户名称" {...field} />
                  </FormControl>
                  <FormDescription>
                    例如：建设银行、现金账户、支付宝等
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>账户类型</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择账户类型" />
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>账号</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入账号" {...field} />
                    </FormControl>
                    <FormDescription>
                      银行卡号或第三方支付账号
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>开户行</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入开户行" {...field} />
                    </FormControl>
                    <FormDescription>
                      银行账户的开户行名称
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="initialBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>期初余额</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="请输入期初余额"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    账户的初始余额，用于计算当前余额
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
                    <FormLabel className="text-base">启用状态</FormLabel>
                    <FormDescription>
                      禁用的账户不会在交易记录中显示
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
