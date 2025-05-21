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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { getCurrentUser } from "@/lib/actions/auth-actions";
import { updateUserProfile, updateUserPassword } from "@/lib/actions/user-actions";
import { Loader2 } from "lucide-react"

// 定义表单验证模式
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "用户名至少需要2个字符",
  }),
  email: z.string().email({
    message: "请输入有效的电子邮件地址",
  }),
  bio: z.string().max(500, {
    message: "个人简介不能超过500个字符",
  }).optional().nullable(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, {
    message: "请输入有效的手机号码",
  }).optional().nullable(),
  image: z.string().optional().nullable(),
})

// 密码表单验证模式
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, {
    message: "当前密码不能为空",
  }),
  newPassword: z.string().min(8, {
    message: "新密码至少需要8个字符",
  }),
  confirmPassword: z.string().min(8, {
    message: "确认密码至少需要8个字符",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "新密码和确认密码不匹配",
  path: ["confirmPassword"],
})

type ProfileFormValues = z.infer<typeof profileFormSchema>
type PasswordFormValues = z.infer<typeof passwordFormSchema>

// 默认值
const defaultValues: Partial<ProfileFormValues> = {
  name: "",
  email: "",
  bio: "",
  phone: "",
  image: "",
}

export default function ProfileForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // 初始化个人资料表单
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  })

  // 初始化密码表单
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  })

  // 加载用户数据
  useEffect(() => {
    async function loadUserData() {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserId(user.id);
          form.reset({
            name: user.name || "",
            email: user.email || "",
            bio: user.bio || "",
            phone: user.phone || "",
            image: user.image || "",
          });
        }
      } catch (error) {
        console.error("加载用户数据失败:", error);
        toast({
          title: "加载失败",
          description: "无法加载用户数据，请刷新页面重试",
          variant: "destructive",
        });
      } finally {
        setIsDataLoading(false);
      }
    }

    loadUserData();
  }, [form]);

  // 处理个人资料表单提交
  async function onSubmit(data: ProfileFormValues) {
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
      await updateUserProfile(userId, data);

      toast({
        title: "资料已更新",
        description: "您的个人资料已成功更新",
      });
    } catch (error) {
      console.error("更新资料失败:", error);
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "无法更新您的个人资料，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // 处理密码表单提交
  async function onPasswordSubmit(data: PasswordFormValues) {
    if (!userId) {
      toast({
        title: "更新失败",
        description: "用户ID不存在",
        variant: "destructive",
      });
      return;
    }

    setIsPasswordLoading(true);

    try {
      await updateUserPassword(userId, data);

      toast({
        title: "密码已更新",
        description: "您的密码已成功更新",
      });

      // 重置密码表单
      passwordForm.reset();
    } catch (error) {
      console.error("更新密码失败:", error);
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "无法更新您的密码，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {isDataLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">加载用户数据...</span>
        </div>
      ) : (
        <>
          {/* 个人资料卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>个人资料</CardTitle>
              <CardDescription>
                更新您的个人信息和联系方式
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={form.getValues().image || "/placeholder-avatar.jpg"} alt="用户头像" />
                  <AvatarFallback className="text-2xl">{form.getValues().name?.charAt(0) || "A"}</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    更换头像
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    支持JPG、PNG格式，文件大小不超过2MB
                  </p>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>用户名</FormLabel>
                        <FormControl>
                          <Input placeholder="输入您的用户名" {...field} />
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
                        <FormLabel>电子邮箱</FormLabel>
                        <FormControl>
                          <Input placeholder="输入您的电子邮箱" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>手机号码</FormLabel>
                        <FormControl>
                          <Input placeholder="输入您的手机号码" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>个人简介</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="简单介绍一下自己"
                            className="resize-none"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          您可以添加一些关于自己的介绍，最多500个字符。
                        </FormDescription>
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

          {/* 密码修改卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>修改密码</CardTitle>
              <CardDescription>
                更新您的账号密码
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>当前密码</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="输入当前密码" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>新密码</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="输入新密码" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>确认新密码</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="再次输入新密码" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isPasswordLoading}>
                      {isPasswordLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          更新中...
                        </>
                      ) : (
                        "更新密码"
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
