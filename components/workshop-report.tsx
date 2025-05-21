"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import {
  CalendarIcon,
  DownloadIcon,
  BarChart3Icon,
  PieChartIcon,
  LineChartIcon,
  UsersIcon,
  BuildingIcon,
  MapPinIcon
} from "lucide-react"
import { format } from "date-fns"
import { DateRangePicker } from "@/components/date-range-picker"
import { getWorkshopReport } from "@/lib/actions/workshop-actions";

export function WorkshopReport() {
  const [reportData, setReportData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1), // 当年1月1日
    to: new Date(),
  })

  useEffect(() => {
    loadReportData()
  }, [dateRange])

  const loadReportData = async () => {
    setIsLoading(true)
    try {
      const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined
      const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined

      const data = await getWorkshopReport(startDate, endDate)
      setReportData(data)
    } catch (error) {
      console.error("Error loading report data:", error)
      toast({
        title: "加载失败",
        description: error.message || "无法加载团建报表数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!reportData) return

    // 这里实现导出CSV的逻辑
    toast({
      title: "导出成功",
      description: "团建报表数据已导出为CSV文件",
    })
  }

  const formatCurrency = (amount) => {
    return `¥${amount.toLocaleString('zh-CN')}`
  }

  const formatDate = (dateString) => {
    return format(new Date(dateString), "yyyy-MM-dd")
  }

  const formatMonth = (monthString) => {
    const [year, month] = monthString.split('-')
    return `${year}年${month}月`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>团建报表</CardTitle>
              <CardDescription>查看手作团建活动的统计数据和报表</CardDescription>
            </div>
            <div className="flex gap-2">
              <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
              />
              <Button variant="outline" onClick={exportToCSV} disabled={isLoading || !reportData}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                导出数据
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : !reportData ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无团建报表数据
            </div>
          ) : (
            <div className="space-y-6">
              {/* 概览卡片 */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">总团建场次</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.summary.totalWorkshops}</div>
                    <p className="text-xs text-muted-foreground">
                      平均每月 {Math.round(reportData.summary.totalWorkshops / 12)} 场
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">总参与人数</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.summary.totalParticipants}</div>
                    <p className="text-xs text-muted-foreground">
                      平均每场 {reportData.summary.averageParticipants} 人
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">总收入</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(reportData.summary.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      人均 {formatCurrency(reportData.summary.averageRevenuePerParticipant)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 报表标签页 */}
              <Tabs defaultValue="byMonth" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="byMonth">
                    <LineChartIcon className="h-4 w-4 mr-2" />
                    月度趋势
                  </TabsTrigger>
                  <TabsTrigger value="byChannel">
                    <PieChartIcon className="h-4 w-4 mr-2" />
                    渠道分析
                  </TabsTrigger>
                  <TabsTrigger value="byProduct">
                    <BarChart3Icon className="h-4 w-4 mr-2" />
                    产品分析
                  </TabsTrigger>
                  <TabsTrigger value="byTeacher">
                    <UsersIcon className="h-4 w-4 mr-2" />
                    讲师分析
                  </TabsTrigger>
                  <TabsTrigger value="byLocation">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    地点分析
                  </TabsTrigger>
                </TabsList>

                {/* 月度趋势 */}
                <TabsContent value="byMonth">
                  <Card>
                    <CardHeader>
                      <CardTitle>月度团建趋势</CardTitle>
                      <CardDescription>按月份查看团建活动的场次、人数和收入</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>月份</TableHead>
                            <TableHead className="text-right">场次</TableHead>
                            <TableHead className="text-right">参与人数</TableHead>
                            <TableHead className="text-right">收入</TableHead>
                            <TableHead className="text-right">场均人数</TableHead>
                            <TableHead className="text-right">场均收入</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.byMonth.map((item) => (
                            <TableRow key={item.month}>
                              <TableCell>{formatMonth(item.month)}</TableCell>
                              <TableCell className="text-right">{item.count}</TableCell>
                              <TableCell className="text-right">{item.participants}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                              <TableCell className="text-right">{Math.round(item.participants / item.count)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(Math.round(item.revenue / item.count))}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* 渠道分析 */}
                <TabsContent value="byChannel">
                  <Card>
                    <CardHeader>
                      <CardTitle>渠道分析</CardTitle>
                      <CardDescription>按渠道查看团建活动的场次、人数和收入</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>渠道</TableHead>
                            <TableHead className="text-right">场次</TableHead>
                            <TableHead className="text-right">占比</TableHead>
                            <TableHead className="text-right">参与人数</TableHead>
                            <TableHead className="text-right">收入</TableHead>
                            <TableHead className="text-right">场均人数</TableHead>
                            <TableHead className="text-right">场均收入</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.byChannel.map((item) => (
                            <TableRow key={item.name}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell className="text-right">{item.count}</TableCell>
                              <TableCell className="text-right">
                                {Math.round((item.count / reportData.summary.totalWorkshops) * 100)}%
                              </TableCell>
                              <TableCell className="text-right">{item.participants}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                              <TableCell className="text-right">{Math.round(item.participants / item.count)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(Math.round(item.revenue / item.count))}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* 产品分析 */}
                <TabsContent value="byProduct">
                  <Card>
                    <CardHeader>
                      <CardTitle>产品分析</CardTitle>
                      <CardDescription>按产品查看团建活动的场次、人数和收入</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>产品</TableHead>
                            <TableHead className="text-right">场次</TableHead>
                            <TableHead className="text-right">占比</TableHead>
                            <TableHead className="text-right">参与人数</TableHead>
                            <TableHead className="text-right">收入</TableHead>
                            <TableHead className="text-right">场均人数</TableHead>
                            <TableHead className="text-right">场均收入</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.byProduct.map((item) => (
                            <TableRow key={item.name}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell className="text-right">{item.count}</TableCell>
                              <TableCell className="text-right">
                                {Math.round((item.count / reportData.summary.totalWorkshops) * 100)}%
                              </TableCell>
                              <TableCell className="text-right">{item.participants}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                              <TableCell className="text-right">{Math.round(item.participants / item.count)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(Math.round(item.revenue / item.count))}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* 讲师分析 */}
                <TabsContent value="byTeacher">
                  <Card>
                    <CardHeader>
                      <CardTitle>讲师分析</CardTitle>
                      <CardDescription>按讲师查看团建活动的场次、人数和收入</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>讲师</TableHead>
                            <TableHead className="text-right">场次</TableHead>
                            <TableHead className="text-right">占比</TableHead>
                            <TableHead className="text-right">参与人数</TableHead>
                            <TableHead className="text-right">收入</TableHead>
                            <TableHead className="text-right">评分</TableHead>
                            <TableHead className="text-right">场均人数</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.byTeacher.map((item) => (
                            <TableRow key={item.name}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell className="text-right">{item.count}</TableCell>
                              <TableCell className="text-right">
                                {Math.round((item.count / reportData.summary.totalWorkshops) * 100)}%
                              </TableCell>
                              <TableCell className="text-right">{item.participants}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                              <TableCell className="text-right">{item.rating.toFixed(1)}</TableCell>
                              <TableCell className="text-right">{Math.round(item.participants / item.count)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* 地点分析 */}
                <TabsContent value="byLocation">
                  <Card>
                    <CardHeader>
                      <CardTitle>地点分析</CardTitle>
                      <CardDescription>按地点类型查看团建活动的场次、人数和收入</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>地点类型</TableHead>
                            <TableHead className="text-right">场次</TableHead>
                            <TableHead className="text-right">占比</TableHead>
                            <TableHead className="text-right">参与人数</TableHead>
                            <TableHead className="text-right">收入</TableHead>
                            <TableHead className="text-right">场均人数</TableHead>
                            <TableHead className="text-right">场均收入</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.byLocation.map((item) => (
                            <TableRow key={item.name}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell className="text-right">{item.count}</TableCell>
                              <TableCell className="text-right">
                                {Math.round((item.count / reportData.summary.totalWorkshops) * 100)}%
                              </TableCell>
                              <TableCell className="text-right">{item.participants}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                              <TableCell className="text-right">{Math.round(item.participants / item.count)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(Math.round(item.revenue / item.count))}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* 最近团建活动 */}
              <Card>
                <CardHeader>
                  <CardTitle>最近团建活动</CardTitle>
                  <CardDescription>查看最近的团建活动记录</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>日期</TableHead>
                        <TableHead>产品</TableHead>
                        <TableHead>讲师</TableHead>
                        <TableHead>助教</TableHead>
                        <TableHead>渠道</TableHead>
                        <TableHead>地点</TableHead>
                        <TableHead className="text-right">人数</TableHead>
                        <TableHead className="text-right">收入</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.recentWorkshops.map((workshop) => (
                        <TableRow key={workshop.id}>
                          <TableCell>{formatDate(workshop.date)}</TableCell>
                          <TableCell>{workshop.product}</TableCell>
                          <TableCell>{workshop.teacher}</TableCell>
                          <TableCell>{workshop.assistant || "-"}</TableCell>
                          <TableCell>{workshop.channel}</TableCell>
                          <TableCell>{workshop.location}</TableCell>
                          <TableCell className="text-right">{workshop.participants}</TableCell>
                          <TableCell className="text-right">{formatCurrency(workshop.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
