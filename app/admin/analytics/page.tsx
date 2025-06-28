"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts"
import {
  BarChart3Icon,
  PieChartIcon,
  LineChartIcon,
  UsersIcon,
  MousePointerClickIcon,
  SearchIcon,
  PackageIcon,
  DownloadIcon,
  FileIcon,
  RefreshCwIcon
} from "lucide-react"
import { getAllLogs, exportLogsAsJson, exportLogsAsCsv, ActivityData } from "@/lib/user-activity-logger"
import { usePageViewLogger } from "@/lib/user-activity-logger"

export default function UserAnalyticsPage() {
  usePageViewLogger("user_analytics")

  const [activeTab, setActiveTab] = useState("overview")
  const [logs, setLogs] = useState<ActivityData[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ActivityData[]>([])
  const [filter, setFilter] = useState({
    type: "",
    userId: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
    searchQuery: ""
  })

  // 加载日志数据
  useEffect(() => {
    const loadLogs = () => {
      const allLogs = getAllLogs()
      setLogs(allLogs)
      setFilteredLogs(allLogs)
    }

    loadLogs()

    // 每分钟刷新一次数据
    const intervalId = setInterval(loadLogs, 60000)

    return () => clearInterval(intervalId)
  }, [])

  // 应用过滤器
  useEffect(() => {
    let result = [...logs]

    if (filter.type) {
      result = result.filter(log => log.type === filter.type)
    }

    if (filter.userId) {
      result = result.filter(log => log.userId === filter.userId)
    }

    if (filter.startDate) {
      result = result.filter(log => new Date(log.timestamp) >= filter.startDate!)
    }

    if (filter.endDate) {
      const endDate = new Date(filter.endDate)
      endDate.setHours(23, 59, 59, 999)
      result = result.filter(log => new Date(log.timestamp) <= endDate)
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase()
      result = result.filter(log =>
        (log.userId && log.userId.toLowerCase().includes(query)) ||
        (log.userName && log.userName.toLowerCase().includes(query)) ||
        (log.userEmail && log.userEmail.toLowerCase().includes(query)) ||
        (log.path && log.path.toLowerCase().includes(query)) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(query))
      )
    }

    setFilteredLogs(result)
  }, [logs, filter])

  // 处理导出JSON
  const handleExportJson = () => {
    const jsonData = exportLogsAsJson()
    const blob = new Blob([jsonData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `user_activity_logs_${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 处理导出CSV
  const handleExportCsv = () => {
    const csvData = exportLogsAsCsv()
    const blob = new Blob([csvData], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `user_activity_logs_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 计算活动类型统计
  const activityTypeStats = logs.reduce((acc, log) => {
    acc[log.type] = (acc[log.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const activityTypeData = Object.entries(activityTypeStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // 计算用户活动统计
  const userActivityStats = logs.reduce((acc, log) => {
    if (log.userId) {
      const userName = log.userName || log.userId
      acc[userName] = (acc[userName] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const userActivityData = Object.entries(userActivityStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10) // 只显示前10个用户

  // 计算每日活动统计
  const dailyActivityStats = logs.reduce((acc, log) => {
    const date = new Date(log.timestamp).toISOString().split("T")[0]
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const dailyActivityData = Object.entries(dailyActivityStats)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30) // 只显示最近30天

  // 计算页面浏览统计
  const pageViewStats = logs
    .filter(log => log.type === "page_view")
    .reduce((acc, log) => {
      acc[log.path] = (acc[log.path] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  const pageViewData = Object.entries(pageViewStats)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // 只显示前10个页面

  // 饼图颜色
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1', '#A4DE6C', '#D0ED57']

  // 格式化时间戳
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  // 获取唯一用户列表
  const uniqueUsers = Array.from(new Set(logs.filter(log => log.userId).map(log => log.userId)))

  // 获取活动类型列表
  const activityTypes = Array.from(new Set(logs.map(log => log.type)))

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">用户行为分析</h1>
          <p className="text-muted-foreground">
            分析用户活动和行为模式
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportJson}>
            <FileIcon className="h-4 w-4 mr-2" />
            导出JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            导出CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总活动数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">唯一用户数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">页面浏览数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(log => log.type === "page_view").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">搜索次数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(log => log.type === "search").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BarChart3Icon className="h-4 w-4" />
            <span className="hidden sm:inline">概览</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1">
            <UsersIcon className="h-4 w-4" />
            <span className="hidden sm:inline">用户活动</span>
          </TabsTrigger>
          <TabsTrigger value="pages" className="flex items-center gap-1">
            <MousePointerClickIcon className="h-4 w-4" />
            <span className="hidden sm:inline">页面浏览</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-1">
            <PackageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">产品交互</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-1">
            <FileIcon className="h-4 w-4" />
            <span className="hidden sm:inline">日志详情</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>活动类型分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {activityTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} 次活动`, "数量"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>每日活动趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dailyActivityData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} 次活动`, "数量"]} />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#8884d8" name="活动数" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>用户活动排行</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={userActivityData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value) => [`${value} 次活动`, "数量"]} />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="活动数" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>页面浏览排行</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pageViewData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="path" type="category" width={100} />
                    <Tooltip formatter={(value) => [`${value} 次浏览`, "数量"]} />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" name="浏览数" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>产品交互分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">产品浏览排行</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>产品ID</TableHead>
                        <TableHead>产品名称</TableHead>
                        <TableHead className="text-right">浏览次数</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.values(logs
                        .filter(log => log.type === "product_view" && log.details?.productId)
                        .reduce((acc, log) => {
                          const productId = log.details!.productId
                          const productName = log.details!.productName || `产品 ${productId}`

                          if (!acc[productId]) {
                            acc[productId] = { productId, productName, count: 0 }
                          }

                          acc[productId].count++
                          return acc
                        }, {} as Record<string, { productId: string, productName: string, count: number }>))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 10)
                        .map(item => (
                          <TableRow key={item.productId}>
                            <TableCell>{item.productId}</TableCell>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell className="text-right">{item.count}</TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">产品操作统计</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "浏览", value: logs.filter(log => log.type === "product_view").length },
                            { name: "创建", value: logs.filter(log => log.type === "product_create").length },
                            { name: "更新", value: logs.filter(log => log.type === "product_update").length },
                            { name: "删除", value: logs.filter(log => log.type === "product_delete").length }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} 次操作`, "数量"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>活动日志详情</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>活动类型</Label>
                    <Select
                      value={filter.type}
                      onValueChange={(value) => setFilter(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="所有类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">所有类型</SelectItem>
                        {activityTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>用户</Label>
                    <Select
                      value={filter.userId || ""}
                      onValueChange={(value) => setFilter(prev => ({ ...prev, userId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="所有用户" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">所有用户</SelectItem>
                        {uniqueUsers.map(userId => (
                          <SelectItem key={userId} value={userId!}>{userId}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>开始日期</Label>
                    <DatePicker
                      date={filter.startDate}
                      setDate={(date) => setFilter(prev => ({ ...prev, startDate: date }))}
                    />
                  </div>

                  <div>
                    <Label>结束日期</Label>
                    <DatePicker
                      date={filter.endDate}
                      setDate={(date) => setFilter(prev => ({ ...prev, endDate: date }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>搜索</Label>
                  <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索日志..."
                      className="pl-8"
                      value={filter.searchQuery}
                      onChange={(e) => setFilter(prev => ({ ...prev, searchQuery: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>时间</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>用户</TableHead>
                        <TableHead>路径</TableHead>
                        <TableHead>详情</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            没有找到匹配的日志记录
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .slice(0, 100) // 限制显示数量
                          .map((log, index) => (
                            <TableRow key={index}>
                              <TableCell className="whitespace-nowrap">
                                {formatTimestamp(log.timestamp)}
                              </TableCell>
                              <TableCell>{log.type}</TableCell>
                              <TableCell>
                                {log.userName || log.userId || "匿名"}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {log.path}
                              </TableCell>
                              <TableCell className="max-w-[300px] truncate">
                                {log.details ? JSON.stringify(log.details) : "-"}
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {filteredLogs.length > 100 && (
                  <div className="text-center text-sm text-muted-foreground">
                    显示前 100 条记录，共 {filteredLogs.length} 条
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilter({
                  type: "",
                  userId: "",
                  startDate: null,
                  endDate: null,
                  searchQuery: ""
                })}
              >
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                重置筛选器
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
