"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { DownloadIcon, BarChart3Icon } from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { getEmployees } from "@/lib/actions/employee-actions";

export function ProductionReports() {
  const [employees, setEmployees] = useState([])
  const [pieceWorks, setPieceWorks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  
  const [reportData, setReportData] = useState({
    accessoryTotal: 0,
    enamellingTotal: 0,
    grandTotal: 0,
    employeeStats: [],
    itemStats: []
  })

  // 加载员工数据
  useEffect(() => {
    async function loadEmployees() {
      try {
        const data = await getEmployees()
        setEmployees(data.filter(emp => emp.status === "active"))
      } catch (error) {
        console.error("Error loading employees:", error)
        toast({
          title: "加载失败",
          description: "无法加载员工数据",
          variant: "destructive",
        })
      }
    }
    
    loadEmployees()
  }, [])

  // 加载计件工作数据
  useEffect(() => {
    loadPieceWorks()
  }, [selectedMonth, selectedEmployee])

  const loadPieceWorks = async () => {
    setIsLoading(true)
    try {
      // 解析选择的月份
      const [year, month] = selectedMonth.split('-').map(Number)
      const startDate = startOfMonth(new Date(year, month - 1))
      const endDate = endOfMonth(new Date(year, month - 1))
      
      // 构建查询参数
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      
      if (selectedEmployee !== "all") {
        params.append('employeeId', selectedEmployee)
      }
      
      const response = await fetch(`/api/piece-works?${params}`)
      if (!response.ok) throw new Error("Failed to fetch piece works")
      
      const data = await response.json()
      setPieceWorks(data)
      generateReport(data)
    } catch (error) {
      console.error("Error loading piece works:", error)
      toast({
        title: "加载失败",
        description: "无法加载制作工单数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateReport = (data) => {
    // 初始化报表数据
    let accessoryTotal = 0
    let enamellingTotal = 0
    const employeeMap = new Map()
    const itemMap = new Map()
    
    // 处理每个工单
    data.forEach(pieceWork => {
      // 累计总金额
      if (pieceWork.workType === "accessory") {
        accessoryTotal += pieceWork.totalAmount
      } else if (pieceWork.workType === "enamelling") {
        enamellingTotal += pieceWork.totalAmount
      }
      
      // 按员工统计
      const empKey = pieceWork.employee.id
      if (!employeeMap.has(empKey)) {
        employeeMap.set(empKey, {
          id: pieceWork.employee.id,
          name: pieceWork.employee.name,
          accessoryAmount: 0,
          enamellingAmount: 0,
          totalAmount: 0,
          workCount: 0
        })
      }
      
      const empStats = employeeMap.get(empKey)
      if (pieceWork.workType === "accessory") {
        empStats.accessoryAmount += pieceWork.totalAmount
      } else if (pieceWork.workType === "enamelling") {
        empStats.enamellingAmount += pieceWork.totalAmount
      }
      empStats.totalAmount += pieceWork.totalAmount
      empStats.workCount += 1
      
      // 按工作项统计
      pieceWork.details.forEach(detail => {
        const itemKey = detail.pieceWorkItem.id
        if (!itemMap.has(itemKey)) {
          itemMap.set(itemKey, {
            id: detail.pieceWorkItem.id,
            name: detail.pieceWorkItem.name,
            type: detail.pieceWorkItem.type,
            totalQuantity: 0,
            totalAmount: 0
          })
        }
        
        const itemStats = itemMap.get(itemKey)
        itemStats.totalQuantity += detail.quantity
        itemStats.totalAmount += detail.price * detail.quantity
      })
    })
    
    // 设置报表数据
    setReportData({
      accessoryTotal,
      enamellingTotal,
      grandTotal: accessoryTotal + enamellingTotal,
      employeeStats: Array.from(employeeMap.values()),
      itemStats: Array.from(itemMap.values())
    })
  }

  const handleExportReport = async () => {
    try {
      // 解析选择的月份
      const [year, month] = selectedMonth.split('-').map(Number)
      const startDate = startOfMonth(new Date(year, month - 1))
      const endDate = endOfMonth(new Date(year, month - 1))
      
      // 构建查询参数
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        format: 'excel'
      })
      
      if (selectedEmployee !== "all") {
        params.append('employeeId', selectedEmployee)
      }
      
      // 下载报表
      window.location.href = `/api/export/production?${params}`
      
      toast({
        title: "导出成功",
        description: "制作报表已开始下载",
      })
    } catch (error) {
      console.error("Error exporting report:", error)
      toast({
        title: "导出失败",
        description: "无法导出制作报表",
        variant: "destructive",
      })
    }
  }

  // 生成月份选项
  const generateMonthOptions = () => {
    const options = []
    const now = new Date()
    
    for (let i = 0; i < 12; i++) {
      const date = subMonths(now, i)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = format(date, "yyyy年MM月")
      options.push({ value, label })
    }
    
    return options
  }

  const monthOptions = generateMonthOptions()

  return (
    <div className="space-y-6">
      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle>制作报表</CardTitle>
          <CardDescription>查看和导出制作工单统计报表</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="month">选择月份</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month" className="w-[180px]">
                  <SelectValue placeholder="选择月份" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="employee">选择员工</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger id="employee" className="w-[180px]">
                  <SelectValue placeholder="选择员工" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部员工</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" onClick={handleExportReport}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              导出报表
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 报表摘要 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">配饰制作总金额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{reportData.accessoryTotal.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">点蓝制作总金额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{reportData.enamellingTotal.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">制作总金额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{reportData.grandTotal.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* 员工统计 */}
      <Card>
        <CardHeader>
          <CardTitle>员工制作统计</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">加载中...</div>
          ) : reportData.employeeStats.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">暂无数据</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>员工</TableHead>
                  <TableHead className="text-right">工单数</TableHead>
                  <TableHead className="text-right">配饰金额</TableHead>
                  <TableHead className="text-right">点蓝金额</TableHead>
                  <TableHead className="text-right">总金额</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.employeeStats.map(stat => (
                  <TableRow key={stat.id}>
                    <TableCell>{stat.name}</TableCell>
                    <TableCell className="text-right">{stat.workCount}</TableCell>
                    <TableCell className="text-right">¥{stat.accessoryAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">¥{stat.enamellingAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">¥{stat.totalAmount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
