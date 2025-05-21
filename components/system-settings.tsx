"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { getSystemSettings, updateSystemSettings } from "@/lib/actions/system-actions";
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  companyName: z.string().min(2, {
    message: "公司名称至少需要2个字符",
  }),
  coffeeSalesCommissionRate: z.number().min(0).max(100, {
    message: "提成比例必须在0-100之间",
  }),
  gallerySalesCommissionRate: z.number().min(0).max(100, {
    message: "提成比例必须在0-100之间",
  }),
  enableImageUpload: z.boolean().default(true),
  enableNotifications: z.boolean().default(true),
})

export function SystemSettings() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "聆花掐丝珐琅馆",
      coffeeSalesCommissionRate: 20,
      gallerySalesCommissionRate: 10,
      enableImageUpload: true,
      enableNotifications: true,
    },
  })

  // 获取系统设置
  useEffect(() => {
    async function fetchSettings() {
      try {
        const settings = await getSystemSettings()
        if (settings) {
          form.reset({
            companyName: settings.companyName,
            coffeeSalesCommissionRate: settings.coffeeSalesCommissionRate,
            gallerySalesCommissionRate: settings.gallerySalesCommissionRate,
            enableImageUpload: settings.enableImageUpload,
            enableNotifications: settings.enableNotifications,
          })
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true)
    try {
      await updateSystemSettings(values)
      toast({
        title: "设置已保存",
        description: "系统设置已成功更新",
      })
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "保存失败",
        description: "更新系统设置时出错",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">加载系统设置中...</div>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">基本设置</h3>

          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>公司名称</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription className="text-xs">显示在系统各处的公司名称</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="coffeeSalesCommissionRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>咖啡店销售提成比例 (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      {...field}
                      onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">咖啡店销售额的提成百分比</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gallerySalesCommissionRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>珐琅馆销售提成比例 (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      {...field}
                      onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">珐琅馆产品销售额的提成百分比</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <h3 className="text-lg font-medium mt-6">系统功能开关</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="enableImageUpload"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">启用图片上传</FormLabel>
                    <FormDescription className="text-xs">允许在销售记录中上传图片凭证</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enableNotifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">启用通知</FormLabel>
                    <FormDescription className="text-xs">启用系统内部通知功能</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={submitting} className="mt-4">
          {submitting ? "保存中..." : "保存设置"}
        </Button>
      </form>
    </Form>
  )
}
