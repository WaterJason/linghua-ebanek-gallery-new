"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { SearchIcon, FileTextIcon, RefreshCwIcon, DownloadIcon } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export default function LogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/logs")
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      } else {
        toast({
          title: "错误",
          description: "获取日志失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("获取日志失败:", error)
      toast({
        title: "错误",
        description: "获取日志失败",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setLoading(true)
    fetchLogs()
  }

  const handleExportLogs = async () => {
    try {
      const response = await fetch("/api/logs/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filters: {
            search: searchTerm,
            level: levelFilter,
            action: actionFilter,
          }
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `system-logs-${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "导出成功",
          description: "日志文件已导出",
        })
      } else {
        toast({
          title: "导出失败",
          description: "导出日志时发生错误",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("导出失败:", error)
      toast({
        title: "导出失败",
        description: "导出日志时发生错误",
        variant: "destructive",
      })
    }
  }

  // 过滤日志
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = levelFilter === "all" || log.level === levelFilter
    const matchesAction = actionFilter === "all" || log.action === actionFilter
    
    return matchesSearch && matchesLevel && matchesAction
  })

  const getLevelBadge = (level) => {
    switch (level) {
      case "info":
        return <Badge variant="default">信息</Badge>
      case "warning":
        return <Badge variant="secondary">警告</Badge>
      case "error":
        return <Badge variant="destructive">错误</Badge>
      case "success":
        return <Badge variant="success">成功</Badge>
      default:
        return <Badge variant="outline">{level}</Badge>
    }
  }

  const getActionBadge = (action) => {
    const actionMap = {
      "CREATE": "创建",
      "UPDATE": "更新", 
      "DELETE": "删除",
      "LOGIN": "登录",
      "LOGOUT": "登出",
      "EXPORT": "导出",
      "IMPORT": "导入",
    }
    return <Badge variant="outline">{actionMap[action] || action}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">系统日志</h1>
          <p className="text-muted-foreground">查看系统操作日志和审计记录</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCwIcon className="mr-2 h-4 w-4" />
            刷新
          </Button>
          <Button onClick={handleExportLogs}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            导出日志
          </Button>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索操作、详情或用户..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="级别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有级别</SelectItem>
                <SelectItem value="info">信息</SelectItem>
                <SelectItem value="warning">警告</SelectItem>
                <SelectItem value="error">错误</SelectItem>
                <SelectItem value="success">成功</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="操作" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有操作</SelectItem>
                <SelectItem value="CREATE">创建</SelectItem>
                <SelectItem value="UPDATE">更新</SelectItem>
                <SelectItem value="DELETE">删除</SelectItem>
                <SelectItem value="LOGIN">登录</SelectItem>
                <SelectItem value="LOGOUT">登出</SelectItem>
                <SelectItem value="EXPORT">导出</SelectItem>
                <SelectItem value="IMPORT">导入</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 日志列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            操作日志
          </CardTitle>
          <CardDescription>
            共 {filteredLogs.length} 条日志记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>用户</TableHead>
                <TableHead>操作</TableHead>
                <TableHead>级别</TableHead>
                <TableHead>详情</TableHead>
                <TableHead>IP地址</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    暂无日志记录
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {log.createdAt ? format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss", { locale: zhCN }) : "-"}
                    </TableCell>
                    <TableCell>
                      {log.user?.name || "系统"}
                    </TableCell>
                    <TableCell>
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell>
                      {getLevelBadge(log.level)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.details}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.ipAddress || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
