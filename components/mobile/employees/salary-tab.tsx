"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DollarSignIcon, 
  CalendarIcon, 
  UserIcon,
  TrendingUpIcon,
  PlusIcon
} from "lucide-react"
import { getSalaryRecords } from "@/lib/actions/employee-actions"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export function SalaryTab() {
  const [salaryRecords, setSalaryRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSalaryRecords()
  }, [])

  const loadSalaryRecords = async () => {
    try {
      setIsLoading(true)
      const data = await getSalaryRecords()
      setSalaryRecords(data)
    } catch (error) {
      console.error("Error loading salary records:", error)
      toast({
        title: "加载失败",
        description: "无法加载工资数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 计算统计数据
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const thisMonthRecords = salaryRecords.filter(record => {
    const recordDate = new Date(record.month)
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear
  })

  const stats = {
    totalEmployees: [...new Set(salaryRecords.map(r => r.employeeId))].length,
    thisMonthTotal: thisMonthRecords.reduce((sum, record) => sum + record.totalSalary, 0),
    avgSalary: thisMonthRecords.length > 0 
      ? thisMonthRecords.reduce((sum, record) => sum + record.totalSalary, 0) / thisMonthRecords.length 
      : 0,
    paidCount: thisMonthRecords.filter(record => record.status === "paid").length
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "paid":
        return "已发放"
      case "pending":
        return "待发放"
      case "draft":
        return "草稿"
      default:
        return "未知"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 工资统计 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSignIcon className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">本月总额</p>
                <p className="text-lg font-bold">¥{stats.thisMonthTotal.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUpIcon className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">平均工资</p>
                <p className="text-lg font-bold">¥{stats.avgSalary.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">员工总数</p>
                <p className="text-lg font-bold">{stats.totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">已发放</p>
                <p className="text-lg font-bold">{stats.paidCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 工资记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">工资记录</CardTitle>
          <CardDescription>
            最近的工资发放记录
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {salaryRecords.length === 0 ? (
            <div className="text-center py-8">
              <DollarSignIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无工资记录</p>
            </div>
          ) : (
            salaryRecords.slice(0, 10).map((record) => (
              <Card key={record.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{record.employee?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {record.employee?.position}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(record.month), "yyyy年MM月", { locale: zhCN })}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        ¥{record.totalSalary.toFixed(2)}
                      </p>
                      <Badge className={getStatusColor(record.status)}>
                        {getStatusText(record.status)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">基本工资: </span>
                      <span>¥{record.baseSalary.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">奖金: </span>
                      <span>¥{record.bonus.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">扣除: </span>
                      <span>¥{record.deductions.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">工作天数: </span>
                      <span>{record.workDays}天</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* 添加工资记录按钮 */}
      <Button className="w-full" size="lg">
        <PlusIcon className="h-4 w-4 mr-2" />
        添加工资记录
      </Button>
    </div>
  )
}
