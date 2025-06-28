"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginTestPage() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [result, setResult] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testAccounts = [
    { name: "超级管理员", identifier: "admin@linghua.com", password: "Admin123456" },
    { name: "经理账号", identifier: "simon@linghuaart.com", password: "Manager123456" },
  ]

  const handleLogin = async (testIdentifier?: string, testPassword?: string) => {
    setIsLoading(true)
    setResult(null)
    setSession(null)

    const loginIdentifier = testIdentifier || identifier
    const loginPassword = testPassword || password

    try {
      console.log("🧪 [测试] 开始登录测试:", loginIdentifier)
      
      // 尝试登录
      const loginResult = await signIn("credentials", {
        identifier: loginIdentifier,
        password: loginPassword,
        redirect: false,
      })

      console.log("🧪 [测试] 登录结果:", loginResult)
      setResult(loginResult)

      // 获取会话
      if (loginResult?.ok) {
        const sessionData = await getSession()
        console.log("🧪 [测试] 会话数据:", sessionData)
        setSession(sessionData)
      }

    } catch (error) {
      console.error("🧪 [测试] 登录测试错误:", error)
      setResult({ error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickTest = (account: typeof testAccounts[0]) => {
    setIdentifier(account.identifier)
    setPassword(account.password)
    handleLogin(account.identifier, account.password)
  }

  const handleCheckSession = async () => {
    try {
      const sessionData = await getSession()
      console.log("🧪 [测试] 当前会话:", sessionData)
      setSession(sessionData)
    } catch (error) {
      console.error("🧪 [测试] 获取会话错误:", error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>登录认证测试工具</CardTitle>
            <CardDescription>
              用于测试不同用户账号的登录功能，诊断CredentialsSignin错误
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
                  placeholder="输入邮箱或用户名"
                />
              </div>
              <div>
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => handleLogin()} disabled={isLoading}>
                {isLoading ? "测试中..." : "手动测试登录"}
              </Button>
              <Button variant="outline" onClick={handleCheckSession}>
                检查当前会话
              </Button>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">快速测试账号</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {testAccounts.map((account, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">{account.name}</h4>
                      <p className="text-sm text-gray-600">邮箱: {account.identifier}</p>
                      <p className="text-sm text-gray-600">密码: {account.password}</p>
                      <Button 
                        size="sm" 
                        onClick={() => handleQuickTest(account)}
                        disabled={isLoading}
                        className="w-full"
                      >
                        测试此账号
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>登录结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className={`p-3 rounded ${result.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <strong>状态:</strong> {result.ok ? '成功' : '失败'}
                </div>
                {result.error && (
                  <div className="p-3 rounded bg-red-100 text-red-800">
                    <strong>错误:</strong> {result.error}
                  </div>
                )}
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
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
            <br />1. 使用快速测试按钮测试预设账号
            <br />2. 或手动输入凭证进行测试
            <br />3. 查看浏览器控制台获取详细的NextAuth日志
            <br />4. 检查登录结果和会话数据
            <br />5. 如果出现CredentialsSignin错误，查看服务器日志获取详细信息
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
