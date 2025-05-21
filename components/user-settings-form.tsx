"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
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
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Moon, Sun, Laptop } from "lucide-react"
import { getCurrentUser, enableTwoFactorAuth, disableTwoFactorAuth } from "@/lib/actions/auth-actions";
import { updateUserSettings } from "@/lib/actions/user-actions";
import { useTheme } from "next-themes"

// 定义表单验证模式
const settingsFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"], {
    required_error: "请选择主题",
  }),
  language: z.enum(["zh-CN", "en-US"], {
    required_error: "请选择语言",
  }),
  enableNotifications: z.boolean().default(true),
  enableTwoFactorAuth: z.boolean().default(false),
})

type SettingsFormValues = z.infer<typeof settingsFormSchema>

// 默认值
const defaultValues: Partial<SettingsFormValues> = {
  theme: "light",
  language: "zh-CN",
  enableNotifications: true,
  enableTwoFactorAuth: false,
}

export default function UserSettingsForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const { setTheme } = useTheme()

  // 初始化表单
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues,
    mode: "onChange",
  })

  // 监听主题变化
  useEffect(() => {
    const theme = form.watch("theme")
    if (theme) {
      setTheme(theme)
    }
  }, [form.watch("theme"), setTheme])

  // 加载用户数据
  useEffect(() => {
    async function loadUserData() {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserId(user.id);
          
          // 如果用户有设置，使用用户设置
          if (user.userSettings) {
            form.reset({
              theme: user.userSettings.theme as "light" | "dark" | "system",
              language: user.userSettings.language as "zh-CN" | "en-US",
              enableNotifications: user.userSettings.enableNotifications,
              enableTwoFactorAuth: user.userSettings.enableTwoFactorAuth,
            });
          }
        }
      } catch (error) {
        console.error("加载用户数据失败:", error);
        toast({
          title: "加载失败",
          description: "无法加载用户设置，请刷新页面重试",
          variant: "destructive",
        });
      } finally {
        setIsDataLoading(false);
      }
    }

    loadUserData();
  }, [form]);

  // 处理表单提交
  async function onSubmit(data: SettingsFormValues) {
    if (!userId) {
      toast({
        title: "更新失败",
        description: "用户ID不存在",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 检查两步验证状态是否改变
      const currentTwoFactorAuth = form.getValues("enableTwoFactorAuth");
      
      // 如果两步验证状态改变，需要特殊处理
      if (data.enableTwoFactorAuth !== currentTwoFactorAuth) {
        if (data.enableTwoFactorAuth) {
          // 启用两步验证
          await enableTwoFactorAuth(userId);
          toast({
            title: "两步验证已启用",
            description: "请使用身份验证器应用扫描二维码",
          });
        } else {
          // 禁用两步验证
          await disableTwoFactorAuth(userId);
          toast({
            title: "两步验证已禁用",
            description: "您的账号不再需要两步验证",
          });
        }
      }
      
      // 更新用户设置
      await updateUserSettings(userId, data);
      
      toast({
        title: "设置已更新",
        description: "您的账号设置已成功更新",
      });
    } catch (error) {
      console.error("更新设置失败:", error);
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "无法更新您的账号设置，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {isDataLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">加载用户设置...</span>
        </div>
      ) : (
        <>
          {/* 外观设置卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>外观设置</CardTitle>
              <CardDescription>
                自定义系统的外观和语言
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>主题</FormLabel>
                        <FormDescription>
                          选择系统的显示主题
                        </FormDescription>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-3 gap-4 pt-2"
                          >
                            <FormItem>
                              <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                                <FormControl>
                                  <RadioGroupItem value="light" className="sr-only" />
                                </FormControl>
                                <div className="items-center rounded-md border-2 border-muted p-4 hover:border-accent flex flex-col gap-2">
                                  <Sun className="h-6 w-6" />
                                  <span className="text-center text-sm font-medium">浅色</span>
                                </div>
                              </FormLabel>
                            </FormItem>
                            <FormItem>
                              <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                                <FormControl>
                                  <RadioGroupItem value="dark" className="sr-only" />
                                </FormControl>
                                <div className="items-center rounded-md border-2 border-muted p-4 hover:border-accent flex flex-col gap-2">
                                  <Moon className="h-6 w-6" />
                                  <span className="text-center text-sm font-medium">深色</span>
                                </div>
                              </FormLabel>
                            </FormItem>
                            <FormItem>
                              <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                                <FormControl>
                                  <RadioGroupItem value="system" className="sr-only" />
                                </FormControl>
                                <div className="items-center rounded-md border-2 border-muted p-4 hover:border-accent flex flex-col gap-2">
                                  <Laptop className="h-6 w-6" />
                                  <span className="text-center text-sm font-medium">跟随系统</span>
                                </div>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>语言</FormLabel>
                        <FormDescription>
                          选择系统的显示语言
                        </FormDescription>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-4 pt-2"
                          >
                            <FormItem>
                              <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                                <FormControl>
                                  <RadioGroupItem value="zh-CN" className="sr-only" />
                                </FormControl>
                                <div className="items-center rounded-md border-2 border-muted p-4 hover:border-accent">
                                  <span className="text-center text-sm font-medium">简体中文</span>
                                </div>
                              </FormLabel>
                            </FormItem>
                            <FormItem>
                              <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                                <FormControl>
                                  <RadioGroupItem value="en-US" className="sr-only" />
                                </FormControl>
                                <div className="items-center rounded-md border-2 border-muted p-4 hover:border-accent">
                                  <span className="text-center text-sm font-medium">English</span>
                                </div>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        "保存更改"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* 通知设置卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>通知设置</CardTitle>
              <CardDescription>
                配置系统通知和提醒
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="enableNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">启用通知</FormLabel>
                          <FormDescription>
                            接收系统通知和提醒
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
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        "保存更改"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* 安全设置卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>安全设置</CardTitle>
              <CardDescription>
                管理账号安全和登录选项
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="enableTwoFactorAuth"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">两步验证</FormLabel>
                          <FormDescription>
                            启用两步验证以增强账号安全性
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
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        "保存更改"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
