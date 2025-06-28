"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  KeyIcon,
  UserIcon
} from "lucide-react"

// 个人信息表单验证模式
const profileSchema = z.object({
  name: z.string().min(2, "姓名至少需要2个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
})

// 密码表单验证模式
const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, "密码至少需要6个字符"),
    newPassword: z.string().min(6, "密码至少需要6个字符"),
    confirmPassword: z.string().min(6, "密码至少需要6个字符"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "两次输入的新密码不一致",
    path: ["confirmPassword"],
  })

/**
 * 账户设置页面
 */
export default function AccountPage() {
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()
  const [activeTab, setActiveTab] = useState("profile")
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // 初始化个人信息表单
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || "",
      email: session?.user?.email || "",
    },
  })

  // 初始化密码表单
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  // 处理个人信息表单提交
  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    setIsProfileLoading(true)
    setProfileError(null)
    setProfileSuccess(false)

    try {
      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "更新个人信息失败")
      }

      // 更新会话
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
          email: data.email,
        },
      })

      setProfileSuccess(true)
    } catch (error) {
      console.error("更新个人信息失败:", error)
      setProfileError(error instanceof Error ? error.message : "更新个人信息失败，请稍后再试")
    } finally {
      setIsProfileLoading(false)
    }
  }

  // 处理密码表单提交
  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    setIsPasswordLoading(true)
    setPasswordError(null)
    setPasswordSuccess(false)

    try {
      const response = await fetch(`/api/users/${session?.user?.id}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "更新密码失败")
      }

      setPasswordSuccess(true)
      passwordForm.reset()
    } catch (error) {
      console.error("更新密码失败:", error)
      setPasswordError(error instanceof Error ? error.message : "更新密码失败，请稍后再试")
    } finally {
      setIsPasswordLoading(false)
    }
  }

  // 获取用户头像
  const getUserInitials = () => {
    const name = session?.user?.name || ""
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">账户设置</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="font-medium">{session?.user?.name}</h3>
                <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
              </div>
            </CardContent>
          </Card>

          <div className="hidden md:block">
            <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical">
              <TabsList className="flex flex-col h-auto w-full bg-transparent space-y-1">
                <TabsTrigger
                  value="profile"
                  className="justify-start px-4 py-2 data-[state=active]:bg-muted"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  个人信息
                </TabsTrigger>
                <TabsTrigger
                  value="password"
                  className="justify-start px-4 py-2 data-[state=active]:bg-muted"
                >
                  <KeyIcon className="h-4 w-4 mr-2" />
                  修改密码
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 md:hidden mb-4">
              <TabsTrigger value="profile">
                <UserIcon className="h-4 w-4 mr-2" />
                个人信息
              </TabsTrigger>
              <TabsTrigger value="password">
                <KeyIcon className="h-4 w-4 mr-2" />
                修改密码
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>个人信息</CardTitle>
                <CardDescription>
                  更新您的个人信息
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profileSuccess && (
                  <Alert className="mb-4 bg-green-50 border-green-200">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">更新成功</AlertTitle>
                    <AlertDescription className="text-green-700">
                      您的个人信息已成功更新。
                    </AlertDescription>
                  </Alert>
                )}

                {profileError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircleIcon className="h-4 w-4" />
                    <AlertTitle>更新失败</AlertTitle>
                    <AlertDescription>{profileError}</AlertDescription>
                  </Alert>
                )}

                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>姓名</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入姓名" {...field} disabled={isProfileLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>邮箱</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入邮箱" {...field} disabled={isProfileLoading} />
                          </FormControl>
                          <FormDescription>
                            此邮箱将用于登录和接收通知。
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isProfileLoading}>
                      {isProfileLoading ? "保存中..." : "保存更改"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>修改密码</CardTitle>
                <CardDescription>
                  更新您的登录密码
                </CardDescription>
              </CardHeader>
              <CardContent>
                {passwordSuccess && (
                  <Alert className="mb-4 bg-green-50 border-green-200">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">更新成功</AlertTitle>
                    <AlertDescription className="text-green-700">
                      您的密码已成功更新。
                    </AlertDescription>
                  </Alert>
                )}

                {passwordError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircleIcon className="h-4 w-4" />
                    <AlertTitle>更新失败</AlertTitle>
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}

                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>当前密码</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="请输入当前密码"
                              {...field}
                              disabled={isPasswordLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator className="my-4" />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>新密码</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="请输入新密码"
                              {...field}
                              disabled={isPasswordLoading}
                            />
                          </FormControl>
                          <FormDescription>
                            密码至少需要6个字符。
                          </FormDescription>
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
                            <Input
                              type="password"
                              placeholder="请再次输入新密码"
                              {...field}
                              disabled={isPasswordLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isPasswordLoading}>
                      {isPasswordLoading ? "更新中..." : "更新密码"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
