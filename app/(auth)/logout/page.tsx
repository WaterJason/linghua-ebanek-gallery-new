"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOutIcon, LoaderIcon } from "lucide-react"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    // 自动执行登出
    const performLogout = async () => {
      try {
        await signOut({ 
          callbackUrl: "/login",
          redirect: true 
        })
      } catch (error) {
        console.error('登出失败:', error)
        // 如果登出失败，手动跳转到登录页
        router.push('/login')
      }
    }

    // 延迟1秒执行，给用户看到登出页面
    const timer = setTimeout(performLogout, 1000)
    
    return () => clearTimeout(timer)
  }, [router])

  const handleManualLogout = async () => {
    try {
      await signOut({ 
        callbackUrl: "/login",
        redirect: true 
      })
    } catch (error) {
      console.error('登出失败:', error)
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
              <LogOutIcon className="w-10 h-10 text-red-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            正在退出登录
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            请稍候，正在为您安全退出系统...
          </p>
        </div>

        <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">退出登录</CardTitle>
            <CardDescription className="text-center">
              感谢您使用聆花掐丝珐琅馆管理系统
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-300">
              <LoaderIcon className="w-5 h-5 animate-spin" />
              <span>正在清除会话数据...</span>
            </div>
            
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={handleManualLogout}
                className="w-full"
              >
                <LogOutIcon className="mr-2 h-4 w-4" />
                手动退出
              </Button>
            </div>
            
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              如果页面没有自动跳转，请点击上方按钮手动退出
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} 聆花掐丝珐琅馆 · 版权所有
      </div>
    </div>
  )
}
