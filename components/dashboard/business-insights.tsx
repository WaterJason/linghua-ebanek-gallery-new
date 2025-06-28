"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LightbulbIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  ArrowRightIcon,
  SparklesIcon,
  TargetIcon
} from "lucide-react"

interface Insight {
  type: "positive" | "negative" | "neutral" | "warning" | "info"
  title: string
  message: string
  suggestion?: string
  priority?: "high" | "medium" | "low"
  category?: string
  actionable?: boolean
}

interface BusinessInsightsProps {
  insights?: Insight[]
  className?: string
}

export function BusinessInsights({ insights = [], className }: BusinessInsightsProps) {
  // 生成模拟洞察数据
  const generateMockInsights = (): Insight[] => {
    return [
      {
        type: "positive",
        title: "销售增长强劲",
        message: "珐琅馆销售额较上月增长25%，表现优异",
        suggestion: "考虑增加热销产品的库存以满足需求",
        priority: "high",
        category: "销售",
        actionable: true
      },
      {
        type: "warning",
        title: "库存周转放缓",
        message: "部分产品库存周转率下降，可能存在滞销风险",
        suggestion: "建议对滞销产品进行促销或调整采购策略",
        priority: "medium",
        category: "库存",
        actionable: true
      },
      {
        type: "positive",
        title: "团建业务火爆",
        message: "手作团建预订量增长40%，客户反响热烈",
        suggestion: "可考虑扩大团建服务规模或增加新的体验项目",
        priority: "high",
        category: "服务",
        actionable: true
      },
      {
        type: "info",
        title: "客户复购率提升",
        message: "老客户复购率达到65%，客户忠诚度良好",
        suggestion: "继续维护客户关系，推出会员专享活动",
        priority: "medium",
        category: "客户",
        actionable: false
      },
      {
        type: "neutral",
        title: "员工效率稳定",
        message: "团队整体工作效率保持稳定，无明显波动",
        priority: "low",
        category: "人事",
        actionable: false
      }
    ]
  }

  const displayInsights = insights.length > 0 ? insights : generateMockInsights()

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "positive":
        return <TrendingUpIcon className="w-4 h-4" />
      case "negative":
        return <TrendingDownIcon className="w-4 h-4" />
      case "warning":
        return <AlertTriangleIcon className="w-4 h-4" />
      case "info":
        return <InfoIcon className="w-4 h-4" />
      default:
        return <LightbulbIcon className="w-4 h-4" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case "positive":
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950/20"
      case "negative":
        return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950/20"
      case "warning":
        return "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/20"
      case "info":
        return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/20"
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-950/20"
    }
  }

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge variant="destructive" className="text-xs">
            高优先级
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/20">
            中优先级
          </Badge>
        )
      case "low":
        return (
          <Badge variant="secondary" className="text-xs">
            低优先级
          </Badge>
        )
      default:
        return null
    }
  }

  const getCategoryBadge = (category?: string) => {
    if (!category) return null
    
    return (
      <Badge variant="outline" className="text-xs">
        {category}
      </Badge>
    )
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5" />
            业务洞察
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            AI 分析
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          基于数据分析的业务建议和洞察
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayInsights.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <LightbulbIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无业务洞察</p>
            <p className="text-xs mt-1">系统正在分析数据，请稍后查看</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {displayInsights.slice(0, 4).map((insight, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0",
                      getInsightColor(insight.type)
                    )}>
                      {getInsightIcon(insight.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {insight.title}
                        </h4>
                        <div className="flex items-center gap-1">
                          {getPriorityBadge(insight.priority)}
                          {getCategoryBadge(insight.category)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {insight.message}
                      </p>
                      
                      {insight.suggestion && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-2">
                            <TargetIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                                建议行动
                              </p>
                              <p className="text-xs text-blue-700 dark:text-blue-300">
                                {insight.suggestion}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {insight.actionable && (
                        <div className="mt-3 flex items-center gap-2">
                          <Button variant="outline" size="sm" className="text-xs">
                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                            采取行动
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                            稍后处理
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {displayInsights.length > 4 && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" size="sm" className="w-full">
                  查看更多洞察
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
            
            {/* 洞察总结 */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-2 mb-2">
                  <SparklesIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="font-medium text-sm text-indigo-800 dark:text-indigo-200">
                    智能总结
                  </h4>
                </div>
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  当前业务整体表现良好，销售和服务增长强劲。建议重点关注库存管理优化，
                  同时继续扩大优势业务规模。
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
