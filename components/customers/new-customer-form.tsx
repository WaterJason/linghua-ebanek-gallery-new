"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/hooks/use-toast"
import { Loader2, Save, ArrowLeft } from "lucide-react"

// 表单验证模式
const customerSchema = z.object({
  name: z.string().min(1, "客户名称不能为空").max(100, "客户名称不能超过100个字符"),
  phone: z.string().optional().refine((val) => {
    if (!val) return true
    return /^1[3-9]\d{9}$/.test(val)
  }, "请输入有效的手机号码"),
  email: z.string().optional().refine((val) => {
    if (!val) return true
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
  }, "请输入有效的邮箱地址"),
  address: z.string().optional(),
  type: z.enum(["individual", "business"], {
    required_error: "请选择客户类型",
  }),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
})

type CustomerFormData = z.infer<typeof customerSchema>

export function NewCustomerForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      type: "individual",
      notes: "",
      isActive: true,
    },
  })

  const onSubmit = async (data: CustomerFormData) => {
    setIsLoading(true)
    try {
      console.log("🔍 提交新客户数据:", data)
      
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      console.log("🔍 新客户创建响应状态:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ 新客户创建失败:", errorData)
        throw new Error(errorData.error || "创建客户失败")
      }

      const newCustomer = await response.json()
      console.log("✅ 新客户创建成功:", newCustomer)

      toast({
        title: "创建成功",
        description: `客户 "${data.name}" 已成功创建`,
      })

      // 重定向到客户列表页面
      router.push("/customers")
    } catch (error) {
      console.error("创建客户失败:", error)
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "创建客户时发生错误，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/customers")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>客户信息</CardTitle>
        <CardDescription>
          请填写客户的基本信息。标有 * 的字段为必填项。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>客户名称 *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="请输入客户名称"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>客户类型 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择客户类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="individual">个人客户</SelectItem>
                        <SelectItem value="business">企业客户</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 联系信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>手机号码</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="请输入手机号码"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱地址</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="请输入邮箱地址"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 地址 */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>地址</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="请输入客户地址"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 备注 */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>备注</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入备注信息"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 状态 */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      启用状态
                    </FormLabel>
                    <FormDescription>
                      启用后客户将显示在客户列表中
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

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                取消
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    创建客户
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
