"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LockIcon } from "lucide-react"

export default function UnauthorizedPage() {
  const router = useRouter()

  // 5秒后自动重定向到登录页面
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/login")
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center shadow-lg">
            <LockIcon className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          访问受限
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          您没有权限访问此页面，请先登录系统。<br />
          页面将在5秒后自动跳转到登录页面。
        </p>
        <Button 
          onClick={() => router.push("/login")}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
        >
          立即登录
        </Button>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} 聆花掐丝珐琅馆 · 版权所有
      </div>
    </div>
  )
}
