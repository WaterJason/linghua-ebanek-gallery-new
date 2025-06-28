"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  ActivityIcon,
  ShoppingCartIcon,
  DollarSignIcon,
  UserIcon,
  PackageIcon,
  ClockIcon,
  ArrowRightIcon,
  TrendingUpIcon
} from "lucide-react"

interface Activity {
  id: string
  type: "sale" | "order" | "customer" | "inventory" | "payment"
  title: string
  description: string
  amount?: number
  time: string
  user?: string
  status?: "success" | "pending" | "warning" | "error"
}

interface RecentActivitiesProps {
  data?: any[]
  className?: string
}

export function RecentActivities({ data = [], className }: RecentActivitiesProps) {
  // 生成模拟活动数据
  const generateMockActivities = (): Activity[] => {
    const mockActivities: Activity[] = [
      {
        id: "1",
        type: "sale",
        title: "新增销售订单",
        description: "张女士购买了祥云如意掐丝珐琅盘",
        amount: 1200,
        time: "2分钟前",
        user: "李销售",
        status: "success"
      },
      {
        id: "2",
        type: "payment",
        title: "收款确认",
        description: "订单 #SO001 收款完成",
        amount: 2800,
        time: "5分钟前",
        user: "财务部",
        status: "success"
      },
      {
        id: "3",
        type: "customer",
        title: "新客户注册",
        description: "王先生通过团建活动成为新客户",
        time: "10分钟前",
        user: "系统",
        status: "success"
      },
      {
        id: "4",
        type: "inventory",
        title: "库存预警",
        description: "莲花香炉库存不足，仅剩5件",
        time: "15分钟前",
        user: "系统",
        status: "warning"
      },
      {
        id: "5",
        type: "order",
        title: "订单状态更新",
        description: "定制订单 #CW002 进入制作阶段",
        time: "20分钟前",
        user: "生产部",
        status: "pending"
      },
      {
        id: "6",
        type: "sale",
        title: "咖啡店销售",
        description: "今日咖啡店销售额达到新高",
        amount: 850,
        time: "30分钟前",
        user: "咖啡店",
        status: "success"
      }
    ]
    
    return mockActivities
  }

  const activities = data.length > 0 ? data.slice(0, 6) : generateMockActivities()

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "sale":
        return <ShoppingCartIcon className="w-4 h-4" />
      case "payment":
        return <DollarSignIcon className="w-4 h-4" />
      case "customer":
        return <UserIcon className="w-4 h-4" />
      case "inventory":
        return <PackageIcon className="w-4 h-4" />
      case "order":
        return <ClockIcon className="w-4 h-4" />
      default:
        return <ActivityIcon className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: string, status?: string) => {
    if (status === "warning") return "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/20"
    if (status === "error") return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950/20"
    if (status === "pending") return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/20"
    
    switch (type) {
      case "sale":
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950/20"
      case "payment":
        return "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/20"
      case "customer":
        return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/20"
      case "inventory":
        return "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-950/20"
      case "order":
        return "text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-950/20"
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-950/20"
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950/20">
            成功
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950/20">
            进行中
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/20">
            警告
          </Badge>
        )
      case "error":
        return (
          <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950/20">
            错误
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="w-5 h-5" />
            最近活动
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            实时更新
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          系统最新的业务活动记录
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <ActivityIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无最近活动</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div
                  key={activity.id || index}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                >
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0",
                    getActivityColor(activity.type, activity.status)
                  )}>
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {activity.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ClockIcon className="w-3 h-3" />
                            {activity.time}
                          </div>
                          
                          {activity.user && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <UserIcon className="w-3 h-3" />
                              {activity.user}
                            </div>
                          )}
                          
                          {activity.amount && (
                            <div className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                              <TrendingUpIcon className="w-3 h-3" />
                              ¥{activity.amount.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(activity.status)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" size="sm" className="w-full">
                查看全部活动
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
