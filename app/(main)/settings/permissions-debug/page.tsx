"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { ModernPageContainer } from "@/components/modern-page-container"

export default function PermissionsDebugPage() {
  const { data: session, status } = useSession()
  const [permissions, setPermissions] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState({})

  useEffect(() => {
    fetchDebugData()
  }, [])

  const fetchDebugData = async () => {
    try {
      setLoading(true)
      
      // 获取会话信息
      const sessionInfo = {
        status,
        user: session?.user,
        expires: session?.expires
      }
      
      // 尝试直接调用数据库
      const response = await fetch("/api/debug/permissions-data")
      
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.permissions || [])
        setRoles(data.roles || [])
        setDebugInfo({
          session: sessionInfo,
          apiResponse: data,
          timestamp: new Date().toISOString()
        })
      } else {
        const errorData = await response.json()
        setDebugInfo({
          session: sessionInfo,
          error: errorData,
          timestamp: new Date().toISOString()
        })
        
        toast({
          title: "API调用失败",
          description: `状态码: ${response.status}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("获取调试数据失败:", error)
      setDebugInfo({
        session: { status, user: session?.user },
        error: error.message,
        timestamp: new Date().toISOString()
      })
      
      toast({
        title: "错误",
        description: "获取调试数据失败",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const testPermissionAPI = async () => {
    try {
      const response = await fetch("/api/permissions")
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "权限API测试成功",
          description: `获取到 ${data.length} 个权限`,
          variant: "default",
        })
        setPermissions(data)
      } else {
        toast({
          title: "权限API测试失败",
          description: data.error || "未知错误",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "权限API测试失败",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const testRoleAPI = async () => {
    try {
      const response = await fetch("/api/roles")
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "角色API测试成功",
          description: `获取到 ${data.length} 个角色`,
          variant: "default",
        })
        setRoles(data)
      } else {
        toast({
          title: "角色API测试失败",
          description: data.error || "未知错误",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "角色API测试失败",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载调试数据...</p>
        </div>
      </div>
    )
  }

  return (
    <ModernPageContainer
      title="权限管理调试页面"
      description="用于调试权限管理系统的问题"
      actions={
        <div className="flex gap-2">
          <Button onClick={testPermissionAPI} variant="outline">
            测试权限API
          </Button>
          <Button onClick={testRoleAPI} variant="outline">
            测试角色API
          </Button>
          <Button onClick={fetchDebugData}>
            刷新调试数据
          </Button>
        </div>
      }
    >
      {/* 会话信息 */}
      <Card>
        <CardHeader>
          <CardTitle>会话信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <strong>状态:</strong> 
              <Badge variant={status === "authenticated" ? "default" : "destructive"} className="ml-2">
                {status}
              </Badge>
            </div>
            {session?.user && (
              <>
                <div><strong>用户:</strong> {session.user.name} ({session.user.email})</div>
                <div><strong>角色:</strong> {session.user.role || "未设置"}</div>
                <div><strong>过期时间:</strong> {session.expires}</div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 权限数据 */}
      <Card>
        <CardHeader>
          <CardTitle>权限数据 ({permissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {permissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>代码</TableHead>
                  <TableHead>模块</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.slice(0, 10).map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>{permission.id}</TableCell>
                    <TableCell>{permission.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{permission.code}</Badge>
                    </TableCell>
                    <TableCell>{permission.module}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">暂无权限数据</p>
          )}
        </CardContent>
      </Card>

      {/* 角色数据 */}
      <Card>
        <CardHeader>
          <CardTitle>角色数据 ({roles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {roles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>代码</TableHead>
                  <TableHead>权限数量</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>{role.id}</TableCell>
                    <TableCell>{role.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{role.code}</Badge>
                    </TableCell>
                    <TableCell>{role.permissions?.length || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">暂无角色数据</p>
          )}
        </CardContent>
      </Card>

      {/* 调试信息 */}
      <Card>
        <CardHeader>
          <CardTitle>调试信息</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </ModernPageContainer>
  )
}
