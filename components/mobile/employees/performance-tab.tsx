"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUpIcon, 
  StarIcon, 
  TargetIcon,
  AwardIcon,
  PlusIcon
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"

// 模拟绩效数据
const mockPerformanceData = [
  {
    id: 1,
    employeeId: 1,
    employeeName: "张三",
    position: "销售员",
    month: "2024-05",
    salesTarget: 50000,
    salesActual: 45000,
    customerSatisfaction: 4.5,
    attendanceRate: 95,
    rating: "良好",
    bonus: 1000
  },
  {
    id: 2,
    employeeId: 2,
    employeeName: "李四",
    position: "工艺师",
    month: "2024-05",
    salesTarget: 30000,
    salesActual: 35000,
    customerSatisfaction: 4.8,
    attendanceRate: 98,
    rating: "优秀",
    bonus: 1500
  }
]

export function PerformanceTab() {
  const [performanceData, setPerformanceData] = useState(mockPerformanceData)
  const [isLoading, setIsLoading] = useState(false)

  const stats = {
    totalEmployees: performanceData.length,
    avgSatisfaction: performanceData.reduce((sum, p) => sum + p.customerSatisfaction, 0) / performanceData.length,
    avgAttendance: performanceData.reduce((sum, p) => sum + p.attendanceRate, 0) / performanceData.length,
    excellentCount: performanceData.filter(p => p.rating === "优秀").length
  }

  const getRatingColor = (rating) => {
    switch (rating) {
      case "优秀":
        return "bg-green-100 text-green-800"
      case "良好":
        return "bg-blue-100 text-blue-800"
      case "一般":
        return "bg-yellow-100 text-yellow-800"
      case "待改进":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSalesProgress = (actual, target) => {
    return Math.min((actual / target) * 100, 100)
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
      {/* 绩效统计 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <StarIcon className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">平均满意度</p>
                <p className="text-lg font-bold">{stats.avgSatisfaction.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TargetIcon className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">平均出勤率</p>
                <p className="text-lg font-bold">{stats.avgAttendance.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AwardIcon className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">优秀员工</p>
                <p className="text-lg font-bold">{stats.excellentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUpIcon className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">考核人数</p>
                <p className="text-lg font-bold">{stats.totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 绩效记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">绩效考核</CardTitle>
          <CardDescription>
            员工绩效考核记录
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {performanceData.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUpIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无绩效记录</p>
            </div>
          ) : (
            performanceData.map((performance) => (
              <Card key={performance.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{performance.employeeName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {performance.position} • {performance.month}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={getRatingColor(performance.rating)}>
                        {performance.rating}
                      </Badge>
                      <p className="text-sm text-green-600 mt-1">
                        奖金: ¥{performance.bonus}
                      </p>
                    </div>
                  </div>
                  
                  {/* 销售目标进度 */}
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span>销售目标完成度</span>
                      <span>{getSalesProgress(performance.salesActual, performance.salesTarget).toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={getSalesProgress(performance.salesActual, performance.salesTarget)} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>实际: ¥{performance.salesActual.toLocaleString()}</span>
                      <span>目标: ¥{performance.salesTarget.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {/* 其他指标 */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <StarIcon className="h-4 w-4 text-yellow-500" />
                      <span>满意度: {performance.customerSatisfaction}/5.0</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TargetIcon className="h-4 w-4 text-blue-500" />
                      <span>出勤率: {performance.attendanceRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* 添加绩效记录按钮 */}
      <Button className="w-full" size="lg">
        <PlusIcon className="h-4 w-4 mr-2" />
        添加绩效记录
      </Button>
    </div>
  )
}
