"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { LockIcon, UserIcon, EyeIcon, EyeOffIcon } from "lucide-react"

const formSchema = z.object({
  identifier: z.string().min(2, {
    message: "用户名或邮箱至少需要2个字符",
  }),
  password: z.string().min(6, {
    message: "密码至少需要6个字符",
  }),
  rememberMe: z.boolean().optional(),
})

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)

  // 防止水合不匹配
  useEffect(() => {
    setMounted(true)
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: false,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)

    try {
      console.log("开始登录:", values.identifier)

      const result = await signIn("credentials", {
        identifier: values.identifier,
        password: values.password,
        redirect: false,
      })

      console.log("登录结果:", result)

      if (result?.error) {
        console.error("登录错误:", result.error)
        // 提供更友好的错误消息
        let errorMessage = "登录失败，请检查用户名和密码"
        if (result.error === "CredentialsSignin") {
          errorMessage = "用户名/邮箱或密码错误，请重试"
        } else if (result.error === "Configuration") {
          errorMessage = "系统配置错误，请联系管理员"
        } else if (result.error === "AccessDenied") {
          errorMessage = "访问被拒绝，请联系管理员"
        }
        setError(errorMessage)
      } else if (result?.ok) {
        console.log("登录成功，重定向到:", callbackUrl)
        // 使用 window.location.href 强制重定向
        window.location.href = callbackUrl
      } else {
        console.error("登录失败，未知错误")
        setError("登录失败，请检查用户名和密码")
      }
    } catch (error) {
      console.error("登录异常:", error)
      setError("登录失败，请稍后再试")
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <>
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
            <img
              src="/placeholder-logo.png"
              alt="聆花掐丝珐琅馆"
              className="w-16 h-16 object-contain"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg"
              }}
            />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          聆花掐丝珐琅馆
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          企业管理系统
        </p>
      </div>

      <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold text-center">登录系统</CardTitle>
          <CardDescription className="text-center">
            请输入您的账号和密码
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>用户名或邮箱</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="请输入用户名或邮箱"
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                      <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>密码</FormLabel>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-primary hover:underline"
                      >
                        忘记密码?
                      </Link>
                    </div>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="请输入密码"
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                      <LockIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      记住我
                    </FormLabel>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    登录中...
                  </div>
                ) : "登录"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pb-6">
          <div className="text-sm text-center text-gray-500 dark:text-gray-400">
            还没有账号？{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              注册
            </Link>
          </div>
        </CardFooter>
      </Card>

      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} 聆花掐丝珐琅馆 · 版权所有
      </div>
    </>
  )
}
