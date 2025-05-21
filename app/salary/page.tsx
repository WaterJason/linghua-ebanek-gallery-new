"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import {
  FileTextIcon, UsersIcon, SettingsIcon, PlusIcon,
  SearchIcon, FilterIcon, DownloadIcon, ArrowUpDownIcon,
  CheckIcon, XIcon, ClockIcon, DollarSignIcon, CalendarIcon
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

import { SalaryRecordDialog } from "@/components/salary-record-dialog"
import { SalarySettingsDialog } from "@/components/salary-settings-dialog"
import { SalaryStatistics } from "@/components/salary-statistics"
import { exportSalaryRecordsToExcel } from "@/lib/export-utils"

// 客户端组件不能导出metadata
// 已移至metadata.ts文件

export default function SalaryPage() {
  const [activeTab, setActiveTab] = useState("records")
  const [salaryRecords, setSalaryRecords] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())
  const [monthFilter, setMonthFilter] = useState("all")
  const [sortField, setSortField] = useState("year")
  const [sortDirection, setSortDirection] = useState("desc")
  const [filteredRecords, setFilteredRecords] = useState([])
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [systemSettings, setSystemSettings] = useState(null)

  // 获取薪资记录和员工数据
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // 获取薪资记录
        const recordsResponse = await fetch('/api/salary-records')
        if (!recordsResponse.ok) {
          throw new Error("Failed to fetch salary records")
        }
        const recordsData = await recordsResponse.json()
        setSalaryRecords(recordsData)

        // 获取员工数据
        const employeesResponse = await fetch('/api/employees')
        if (!employeesResponse.ok) {
          throw new Error("Failed to fetch employees")
        }
        const employeesData = await employeesResponse.json()
        setEmployees(employeesData)

        // 获取系统设置
        const settingsResponse = await fetch('/api/settings')
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          setSystemSettings(settingsData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "获取数据失败",
          description: "请稍后再试",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // 筛选和排序薪资记录
  useEffect(() => {
    let result = [...salaryRecords]

    // 应用搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(record =>
        record.employee?.name.toLowerCase().includes(query)
      )
    }

    // 应用状态筛选
    if (statusFilter !== "all") {
      result = result.filter(record => record.status === statusFilter)
    }

    // 应用年份筛选
    if (yearFilter !== "all") {
      result = result.filter(record => record.year.toString() === yearFilter)
    }

    // 应用月份筛选
    if (monthFilter !== "all") {
      result = result.filter(record => record.month.toString() === monthFilter)
    }

    // 应用排序
    result.sort((a, b) => {
      let valueA = a[sortField]
      let valueB = b[sortField]

      // 处理数字字段
      if (["year", "month", "totalIncome", "netIncome"].includes(sortField)) {
        valueA = Number(valueA)
        valueB = Number(valueB)
      } else if (sortField === "employee") {
        // 处理员工名称排序
        valueA = a.employee?.name.toLowerCase() || ""
        valueB = b.employee?.name.toLowerCase() || ""
      } else {
        // 处理字符串字段
        valueA = String(valueA || "").toLowerCase()
        valueB = String(valueB || "").toLowerCase()
      }

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    setFilteredRecords(result)
  }, [salaryRecords, searchQuery, statusFilter, yearFilter, monthFilter, sortField, sortDirection])

  // 处理排序
  const handleSort = (field) => {
    if (sortField === field) {
      // 如果已经按这个字段排序，则切换排序方向
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // 否则，设置新的排序字段，默认降序
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // 导出薪资记录
  const handleExportRecords = () => {
    try {
      if (filteredRecords.length === 0) {
        toast({
          title: "无数据可导出",
          description: "请先添加薪资记录",
          variant: "destructive",
        })
        return
      }

      const fileName = exportSalaryRecordsToExcel(filteredRecords, employees)

      toast({
        title: "导出成功",
        description: `薪资记录已导出为 ${fileName}`,
      })
    } catch (error) {
      console.error("Error exporting salary records:", error)
      toast({
        title: "导出失败",
        description: error.message || "请稍后再试",
        variant: "destructive",
      })
    }
  }

  // 处理添加薪资记录
  const handleAddRecord = () => {
    setCurrentRecord(null)
    setIsRecordDialogOpen(true)
  }

  // 处理编辑薪资记录
  const handleEditRecord = (record) => {
    setCurrentRecord(record)
    setIsRecordDialogOpen(true)
  }

  // 处理薪资记录添加/更新
  const handleRecordSaved = (record) => {
    setIsRecordDialogOpen(false)

    // 更新薪资记录列表
    if (currentRecord) {
      // 更新现有记录
      setSalaryRecords(salaryRecords.map(r => r.id === record.id ? record : r))
      toast({
        title: "更新成功",
        description: `薪资记录已更新`,
      })
    } else {
      // 添加新记录
      setSalaryRecords([...salaryRecords, record])
      toast({
        title: "添加成功",
        description: `薪资记录已添加`,
      })
    }
  }

  // 处理薪资设置更新
  const handleSettingsSaved = (settings) => {
    setIsSettingsDialogOpen(false)
    setSystemSettings(settings)
    toast({
      title: "设置已保存",
      description: "薪资计算规则已更新",
    })
  }

  // 获取状态标签
  const getStatusBadge = (status) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">草稿</Badge>
      case "confirmed":
        return <Badge variant="secondary">已确认</Badge>
      case "paid":
        return <Badge variant="default">已发放</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">薪资管理</h1>
        <div className="flex gap-2">
          <Button onClick={handleAddRecord}>
            <PlusIcon className="mr-2 h-4 w-4" />
            添加薪资记录
          </Button>
          <Button variant="outline" onClick={() => setIsSettingsDialogOpen(true)}>
            <SettingsIcon className="mr-2 h-4 w-4" />
            薪资设置
          </Button>
        </div>
      </div>

      <Tabs defaultValue="records" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="records">
            <FileTextIcon className="h-4 w-4 mr-2" />
            薪资记录
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <DollarSignIcon className="h-4 w-4 mr-2" />
            薪资统计
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          {/* 筛选工具栏 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索员工姓名..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="confirmed">已确认</SelectItem>
                <SelectItem value="paid">已发放</SelectItem>
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="年份筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有年份</SelectItem>
                <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}年</SelectItem>
                <SelectItem value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}年</SelectItem>
                <SelectItem value={(new Date().getFullYear() - 2).toString()}>{new Date().getFullYear() - 2}年</SelectItem>
              </SelectContent>
            </Select>

            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="月份筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有月份</SelectItem>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <SelectItem key={month} value={month.toString()}>{month}月</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleExportRecords}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              导出记录
            </Button>
          </div>

          {/* 薪资记录表格 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>薪资记录</CardTitle>
              <CardDescription>管理员工薪资记录</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">加载中...</span>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("employee")}>
                          <div className="flex items-center">
                            员工
                            {sortField === "employee" && (
                              <ArrowUpDownIcon className="ml-1 h-4 w-4" data-direction={sortDirection} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("year")}>
                          <div className="flex items-center">
                            年份
                            {sortField === "year" && (
                              <ArrowUpDownIcon className="ml-1 h-4 w-4" data-direction={sortDirection} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("month")}>
                          <div className="flex items-center">
                            月份
                            {sortField === "month" && (
                              <ArrowUpDownIcon className="ml-1 h-4 w-4" data-direction={sortDirection} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("totalIncome")}>
                          <div className="flex items-center">
                            总收入
                            {sortField === "totalIncome" && (
                              <ArrowUpDownIcon className="ml-1 h-4 w-4" data-direction={sortDirection} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("netIncome")}>
                          <div className="flex items-center">
                            实发工资
                            {sortField === "netIncome" && (
                              <ArrowUpDownIcon className="ml-1 h-4 w-4" data-direction={sortDirection} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                          <div className="flex items-center">
                            状态
                            {sortField === "status" && (
                              <ArrowUpDownIcon className="ml-1 h-4 w-4" data-direction={sortDirection} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <FileTextIcon className="h-12 w-12 mb-2 opacity-20" />
                              <p>暂无薪资记录</p>
                              <Button variant="link" onClick={handleAddRecord} className="mt-2">
                                添加薪资记录
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <UsersIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                {record.employee?.name || "未知员工"}
                              </div>
                            </TableCell>
                            <TableCell>{record.year}年</TableCell>
                            <TableCell>{record.month}月</TableCell>
                            <TableCell>¥{record.totalIncome.toFixed(2)}</TableCell>
                            <TableCell>¥{record.netIncome.toFixed(2)}</TableCell>
                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEditRecord(record)}>
                                  编辑
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/salary/${record.id}`}>
                                    查看
                                  </Link>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>薪资统计</CardTitle>
              <CardDescription>查看薪资统计数据</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">加载中...</span>
                </div>
              ) : (
                <SalaryStatistics
                  salaryRecords={salaryRecords}
                  employees={employees}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 薪资记录对话框 */}
      <SalaryRecordDialog
        open={isRecordDialogOpen}
        onOpenChange={setIsRecordDialogOpen}
        record={currentRecord}
        employees={employees}
        onSaved={handleRecordSaved}
      />

      {/* 薪资设置对话框 */}
      <SalarySettingsDialog
        open={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
        settings={systemSettings}
        onSaved={handleSettingsSaved}
      />
    </div>
  )
}
