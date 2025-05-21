"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { SearchIcon, RefreshCwIcon, DownloadIcon, FilterIcon, XIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { getSystemLogs, createSystemLog } from "@/lib/actions/system-actions";

// 日志类型定义
type LogLevel = "info" | "warning" | "error" | "debug"

interface SystemLog {
  id: number
  timestamp: string
  level: LogLevel
  module: string
  message: string
  details?: string
  userId?: string
  userName?: string
}

export function SystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [moduleFilter, setModuleFilter] = useState<string>("all")
  const [modules, setModules] = useState<string[]>([])

  // 获取系统日志
  const fetchLogs = async () => {
    setLoading(true)
    try {
      console.log("组件: 正在获取系统日志...")

      // 使用服务器端操作获取日志
      const data = await getSystemLogs()
      console.log("组件: 获取到系统日志数据:", data?.length || 0, "条记录")

      if (!data || data.length === 0) {
        console.log("组件: 没有找到系统日志记录")
        // 创建一条测试日志
        await createSystemLog({
          module: "系统日志",
          level: "info",
          message: "系统日志组件已加载",
          details: "这是一条由系统日志组件自动创建的测试记录"
        })

        // 重新获取日志
        const newData = await getSystemLogs()
        setLogs(newData || [])
        setFilteredLogs(newData || [])

        // 提取所有模块名称
        if (newData && newData.length > 0) {
          const uniqueModules = Array.from(new Set(newData.map((log: SystemLog) => log.module)))
          setModules(uniqueModules as string[])
        }
      } else {
        setLogs(data)
        setFilteredLogs(data)

        // 提取所有模块名称
        const uniqueModules = Array.from(new Set(data.map((log: SystemLog) => log.module)))
        setModules(uniqueModules as string[])
      }
    } catch (error) {
      console.error("获取日志失败:", error)
      toast({
        title: "获取日志失败",
        description: "无法获取系统日志，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    fetchLogs()
  }, [])

  // 应用筛选
  useEffect(() => {
    let result = logs

    // 应用搜索词筛选
    if (searchTerm) {
      result = result.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.userName && log.userName.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // 应用日志级别筛选
    if (levelFilter !== "all") {
      result = result.filter(log => log.level === levelFilter)
    }

    // 应用模块筛选
    if (moduleFilter !== "all") {
      result = result.filter(log => log.module === moduleFilter)
    }

    setFilteredLogs(result)
  }, [logs, searchTerm, levelFilter, moduleFilter])

  // 清除筛选
  const clearFilters = () => {
    setSearchTerm("")
    setLevelFilter("all")
    setModuleFilter("all")
  }

  // 导出日志
  const handleExportLogs = () => {
    try {
      // 创建CSV内容
      const headers = ["ID", "时间", "级别", "模块", "消息", "详情", "用户ID", "用户名"]
      const csvContent = [
        headers.join(","),
        ...filteredLogs.map(log => [
          log.id,
          log.timestamp,
          log.level,
          log.module,
          `"${log.message.replace(/"/g, '""')}"`,
          log.details ? `"${log.details.replace(/"/g, '""')}"` : "",
          log.userId || "",
          log.userName || ""
        ].join(","))
      ].join("\n")

      // 创建下载链接
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `system_logs_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
      document.body.appendChild(a)
      a.click()

      // 清理
      URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "导出成功",
        description: "系统日志已成功导出为CSV文件",
      })
    } catch (error) {
      console.error("导出日志失败:", error)
      toast({
        title: "导出失败",
        description: "无法导出系统日志，请稍后再试",
        variant: "destructive",
      })
    }
  }

  // 获取日志级别对应的徽章变体
  const getLevelBadgeVariant = (level: LogLevel) => {
    switch (level) {
      case "info": return "default"
      case "warning": return "warning"
      case "error": return "destructive"
      case "debug": return "outline"
      default: return "default"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>系统日志</CardTitle>
        <CardDescription>查看系统操作日志记录</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 筛选工具栏 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex flex-1 items-center space-x-2">
              <Input
                placeholder="搜索日志..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="日志级别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有级别</SelectItem>
                  <SelectItem value="info">信息</SelectItem>
                  <SelectItem value="warning">警告</SelectItem>
                  <SelectItem value="error">错误</SelectItem>
                  <SelectItem value="debug">调试</SelectItem>
                </SelectContent>
              </Select>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="模块" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有模块</SelectItem>
                  {modules.map((module) => (
                    <SelectItem key={module} value={module}>{module}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={clearFilters}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={fetchLogs}>
                <RefreshCwIcon className="mr-2 h-4 w-4" />
                刷新
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportLogs}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                导出
              </Button>
            </div>
          </div>

          {/* 日志表格 */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">加载中...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              没有找到匹配的日志记录
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">时间</TableHead>
                    <TableHead className="w-[80px]">级别</TableHead>
                    <TableHead className="w-[100px]">模块</TableHead>
                    <TableHead>消息</TableHead>
                    <TableHead className="w-[100px]">用户</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getLevelBadgeVariant(log.level)}>
                          {log.level === "info" && "信息"}
                          {log.level === "warning" && "警告"}
                          {log.level === "error" && "错误"}
                          {log.level === "debug" && "调试"}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.module}</TableCell>
                      <TableCell>
                        <div className="font-medium">{log.message}</div>
                        {log.details && (
                          <div className="text-xs text-muted-foreground mt-1">{log.details}</div>
                        )}
                      </TableCell>
                      <TableCell>{log.userName || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
