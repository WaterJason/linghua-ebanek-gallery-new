"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginDebugPage() {
  const [identifier, setIdentifier] = useState("admin@linghua.com")
  const [password, setPassword] = useState("Admin123456")
  const [result, setResult] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    setResult(null)
    setSession(null)

    try {
      console.log("开始登录调试...")
      
      // 1. 尝试登录
      const loginResult = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      })

      console.log("登录结果:", loginResult)
      setResult(loginResult)

      // 2. 获取会话
      if (loginResult?.ok) {
        const sessionData = await getSession()
        console.log("会话数据:", sessionData)
        setSession(sessionData)
      }

    } catch (error) {
      console.error("登录调试错误:", error)
      setResult({ error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckSession = async () => {
    try {
      const sessionData = await getSession()
      console.log("当前会话:", sessionData)
      setSession(sessionData)
    } catch (error) {
      console.error("获取会话错误:", error)
    }
  }

  const handleTestAPI = async () => {
    try {
      // 测试CSRF
      const csrfResponse = await fetch("/api/auth/csrf")
      const csrfData = await csrfResponse.json()
      console.log("CSRF数据:", csrfData)

      // 测试Providers
      const providersResponse = await fetch("/api/auth/providers")
      const providersData = await providersResponse.json()
      console.log("Providers数据:", providersData)

      // 测试Session
      const sessionResponse = await fetch("/api/auth/session")
      const sessionData = await sessionResponse.json()
      console.log("Session API数据:", sessionData)

    } catch (error) {
      console.error("API测试错误:", error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>登录调试工具</CardTitle>
            <CardDescription>
              用于诊断登录问题的调试页面
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="identifier">邮箱/用户名</Label>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleLogin} disabled={isLoading}>
                {isLoading ? "登录中..." : "测试登录"}
              </Button>
              <Button variant="outline" onClick={handleCheckSession}>
                检查会话
              </Button>
              <Button variant="outline" onClick={handleTestAPI}>
                测试API
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>登录结果</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {session && (
          <Card>
            <CardHeader>
              <CardTitle>会话数据</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Alert>
          <AlertDescription>
            <strong>使用说明：</strong>
            <br />1. 点击"测试登录"按钮进行登录测试
            <br />2. 查看浏览器控制台获取详细日志
            <br />3. 检查登录结果和会话数据
            <br />4. 如果登录成功但无法重定向，可能是前端路由问题
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
