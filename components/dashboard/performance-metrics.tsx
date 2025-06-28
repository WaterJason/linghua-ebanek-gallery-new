"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  TrendingUpIcon,
  TrendingDownIcon,
  TargetIcon,
  AwardIcon,
  ZapIcon,
  ActivityIcon,
  StarIcon,
  BarChart3Icon
} from "lucide-react"

interface PerformanceMetric {
  label: string
  value: number
  target?: number
  unit?: string
  trend?: number
  icon: React.ReactNode
  color: string
}

interface PerformanceMetricsProps {
  data?: {
    overallScore: number
    salesEfficiency: number
    inventoryTurnover: number
    customerSatisfaction: number
  }
  className?: string
}

export function PerformanceMetrics({ data, className }: PerformanceMetricsProps) {
  if (!data) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3Icon className="w-5 h-5" />
            绩效指标
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            暂无绩效数据
          </div>
        </CardContent>
      </Card>
    )
  }

  const metrics: PerformanceMetric[] = [
    {
      label: "综合评分",
      value: data.overallScore,
      target: 90,
      unit: "分",
      trend: 5.2,
      icon: <AwardIcon className="w-4 h-4" />,
      color: "text-indigo-600"
    },
    {
      label: "销售效率",
      value: data.salesEfficiency,
      target: 50000,
      unit: "元/人",
      trend: 8.1,
      icon: <ZapIcon className="w-4 h-4" />,
      color: "text-green-600"
    },
    {
      label: "库存周转",
      value: data.inventoryTurnover,
      target: 2.0,
      unit: "次",
      trend: -2.3,
      icon: <ActivityIcon className="w-4 h-4" />,
      color: "text-orange-600"
    },
    {
      label: "客户满意度",
      value: data.customerSatisfaction,
      target: 95,
      unit: "%",
      trend: 3.7,
      icon: <StarIcon className="w-4 h-4" />,
      color: "text-pink-600"
    }
  ]

  const getPerformanceLevel = (value: number, target?: number) => {
    if (!target) return "good"
    const percentage = (value / target) * 100
    if (percentage >= 90) return "excellent"
    if (percentage >= 75) return "good"
    if (percentage >= 60) return "average"
    return "poor"
  }

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case "excellent":
        return "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/20 dark:border-green-800"
      case "good":
        return "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-800"
      case "average":
        return "text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/20 dark:border-yellow-800"
      case "poor":
        return "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/20 dark:border-red-800"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950/20 dark:border-gray-800"
    }
  }

  const getPerformanceLabel = (level: string) => {
    switch (level) {
      case "excellent":
        return "优秀"
      case "good":
        return "良好"
      case "average":
        return "一般"
      case "poor":
        return "待改进"
      default:
        return "未知"
    }
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3Icon className="w-5 h-5" />
          绩效指标
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          关键业务指标的表现情况
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics.map((metric, index) => {
          const level = getPerformanceLevel(metric.value, metric.target)
          const percentage = metric.target ? Math.min(100, (metric.value / metric.target) * 100) : metric.value
          
          return (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800", metric.color)}>
                    {metric.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{metric.label}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {metric.value.toLocaleString()}{metric.unit}
                      </span>
                      {metric.target && (
                        <span>/ 目标 {metric.target.toLocaleString()}{metric.unit}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {metric.trend && (
                    <Badge
                      variant={metric.trend > 0 ? "default" : "destructive"}
                      className={cn(
                        "text-xs",
                        metric.trend > 0
                          ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
                      )}
                    >
                      {metric.trend > 0 ? (
                        <TrendingUpIcon className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDownIcon className="w-3 h-3 mr-1" />
                      )}
                      {Math.abs(metric.trend)}%
                    </Badge>
                  )}
                  
                  <Badge
                    variant="outline"
                    className={cn("text-xs", getPerformanceColor(level))}
                  >
                    {getPerformanceLabel(level)}
                  </Badge>
                </div>
              </div>
              
              {metric.target && (
                <div className="space-y-1">
                  <Progress value={percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>完成度</span>
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        
        {/* 总体评估 */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm">总体评估</h4>
              <p className="text-xs text-muted-foreground">基于所有指标的综合评分</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {data.overallScore.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">/ 100分</div>
            </div>
          </div>
          
          <div className="mt-3">
            <Progress value={data.overallScore} className="h-3" />
          </div>
          
          <div className="mt-2 flex justify-center">
            <Badge
              variant="outline"
              className={cn(
                "text-sm",
                getPerformanceColor(getPerformanceLevel(data.overallScore, 100))
              )}
            >
              <TargetIcon className="w-3 h-3 mr-1" />
              {getPerformanceLabel(getPerformanceLevel(data.overallScore, 100))}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
