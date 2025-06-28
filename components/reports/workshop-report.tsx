"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DownloadIcon,
  RefreshCwIcon,
  UsersIcon,
  CalendarIcon,
  DollarSignIcon,
  TrendingUpIcon,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { DateRangePicker } from "@/components/date-range-picker"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts"

export function WorkshopReport() {
  const [activeTab, setActiveTab] = useState("overview")
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  })
  const [isLoading, setIsLoading] = useState(true)
  const [reportData, setReportData] = useState(null)

  useEffect(() => {
    loadReportData()
  }, [dateRange])

  const loadReportData = async () => {
    setIsLoading(true)
    try {
      // 这里应该调用实际的API
      // const response = await fetch(`/api/reports/workshops?from=${dateRange.from}&to=${dateRange.to}`)
      // const data = await response.json()
      // setReportData(data)

      // 演示数据
      setTimeout(() => {
        setReportData({
          summary: {
            totalWorkshops: 45,
            totalParticipants: 680,
            totalRevenue: 156800,
            avgParticipants: 15
          },
          monthlyTrend: [
            { month: "1月", workshops: 8, participants: 120, revenue: 28800 },
            { month: "2月", workshops: 6, participants: 90, revenue: 21600 },
            { month: "3月", workshops: 9, participants: 135, revenue: 32400 },
            { month: "4月", workshops: 7, participants: 105, revenue: 25200 },
            { month: "5月", workshops: 8, participants: 120, revenue: 28800 },
            { month: "6月", workshops: 7, participants: 110, revenue: 20000 }
          ],
          activityTypes: [
            { name: "饰品点蓝手作", count: 25, participants: 375, revenue: 90000 },
            { name: "掐丝珐琅手作", count: 20, participants: 305, revenue: 66800 }
          ],
          topClients: [
            { name: "ABC公司", workshops: 8, participants: 120, revenue: 28800 },
            { name: "XYZ集团", workshops: 6, participants: 90, revenue: 21600 },
            { name: "DEF企业", workshops: 5, participants: 75, revenue: 18000 },
            { name: "GHI公司", workshops: 4, participants: 60, revenue: 14400 }
          ],
          recentWorkshops: [
            {
              id: "1",
              date: "2024-06-15",
              client: "ABC公司",
              type: "饰品点蓝手作",
              participants: 25,
              revenue: 6000,
              status: "已完成"
            },
            {
              id: "2",
              date: "2024-06-12",
              client: "XYZ集团",
              type: "掐丝珐琅手作",
              participants: 20,
              revenue: 5600,
              status: "已完成"
            },
            {
              id: "3",
              date: "2024-06-10",
              client: "DEF企业",
              type: "饰品点蓝手作",
              participants: 15,
              revenue: 3600,
              status: "已完成"
            }
          ]
        })
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error("Error loading workshop report:", error)
      toast({
        title: "加载失败",
        description: "无法加载团建报表数据",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const exportReport = () => {
    toast({
      title: "导出成功",
      description: "团建报表已开始下载",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      "已完成": "success",
      "进行中": "default",
      "已取消": "destructive"
    }
    return <Badge variant={statusMap[status] || "secondary"}>{status}</Badge>
  }

  const COLORS = ['#0088FE', '#00C49F']

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">团建报表</h2>
          <p className="text-muted-foreground">查看团建活动数据分析和统计报表</p>
        </div>
        <div className="flex items-center space-x-2">
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
          />
          <Button variant="outline" onClick={exportReport}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            导出报表
          </Button>
          <Button variant="outline" onClick={loadReportData}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">加载中...</div>
      ) : !reportData ? (
        <div className="text-center py-8 text-muted-foreground">暂无数据</div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="trend">趋势分析</TabsTrigger>
            <TabsTrigger value="activities">活动分析</TabsTrigger>
            <TabsTrigger value="clients">客户分析</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* 概览卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">团建活动总数</p>
                      <p className="text-2xl font-bold">{reportData.summary.totalWorkshops}</p>
                    </div>
                    <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">参与人数</p>
                      <p className="text-2xl font-bold">{reportData.summary.totalParticipants}</p>
                    </div>
                    <UsersIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">总收入</p>
                      <p className="text-2xl font-bold">¥{reportData.summary.totalRevenue.toLocaleString()}</p>
                    </div>
                    <DollarSignIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">平均参与人数</p>
                      <p className="text-2xl font-bold">{reportData.summary.avgParticipants}</p>
                    </div>
                    <TrendingUpIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 最近活动 */}
            <Card>
              <CardHeader>
                <CardTitle>最近团建活动</CardTitle>
                <CardDescription>查看最近完成的团建活动</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>客户</TableHead>
                      <TableHead>活动类型</TableHead>
                      <TableHead>参与人数</TableHead>
                      <TableHead>收入</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.recentWorkshops.map((workshop) => (
                      <TableRow key={workshop.id}>
                        <TableCell>{workshop.date}</TableCell>
                        <TableCell className="font-medium">{workshop.client}</TableCell>
                        <TableCell>{workshop.type}</TableCell>
                        <TableCell>{workshop.participants}</TableCell>
                        <TableCell>¥{workshop.revenue.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(workshop.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trend" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>月度趋势</CardTitle>
                <CardDescription>查看每月团建活动趋势</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.monthlyTrend}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="workshops" fill="#8884d8" name="活动数量" />
                    <Bar dataKey="participants" fill="#82ca9d" name="参与人数" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>活动类型分析</CardTitle>
                <CardDescription>不同活动类型的统计数据</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={reportData.activityTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, count }) => `${name} (${count})`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {reportData.activityTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>活动类型</TableHead>
                        <TableHead>活动次数</TableHead>
                        <TableHead>参与人数</TableHead>
                        <TableHead>收入</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.activityTypes.map((activity, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{activity.name}</TableCell>
                          <TableCell>{activity.count}</TableCell>
                          <TableCell>{activity.participants}</TableCell>
                          <TableCell>¥{activity.revenue.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>客户分析</CardTitle>
                <CardDescription>主要客户的团建活动统计</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>客户名称</TableHead>
                      <TableHead>活动次数</TableHead>
                      <TableHead>参与人数</TableHead>
                      <TableHead>总收入</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.topClients.map((client, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.workshops}</TableCell>
                        <TableCell>{client.participants}</TableCell>
                        <TableCell>¥{client.revenue.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
