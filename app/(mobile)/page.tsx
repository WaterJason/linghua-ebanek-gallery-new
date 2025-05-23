"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { formatCurrency } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface QuickAction {
  title: string
  icon: keyof typeof Icons
  href: string
  color: string
  bgColor: string
}

interface StatCard {
  title: string
  value: string | number
  icon: keyof typeof Icons
  color: string
  bgColor: string
  change?: {
    value: number
    isPositive: boolean
  }
}

export default function MobileHomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [greeting, setGreeting] = useState("你好")
  const [currentDate, setCurrentDate] = useState("")

  useEffect(() => {
    // 设置问候语
    const hour = new Date().getHours()
    if (hour < 6) {
      setGreeting("凌晨好")
    } else if (hour < 9) {
      setGreeting("早上好")
    } else if (hour < 12) {
      setGreeting("上午好")
    } else if (hour < 14) {
      setGreeting("中午好")
    } else if (hour < 17) {
      setGreeting("下午好")
    } else if (hour < 19) {
      setGreeting("傍晚好")
    } else {
      setGreeting("晚上好")
    }

    // 设置当前日期
    const date = new Date()
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }
    setCurrentDate(date.toLocaleDateString('zh-CN', options))

    // 模拟加载
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // 快捷操作
  const quickActions: QuickAction[] = [
    {
      title: "记账",
      icon: "plus",
      href: "/finance",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "库存",
      icon: "package",
      href: "/inventory",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "销售",
      icon: "store",
      href: "/sales",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "员工",
      icon: "users",
      href: "/employees",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ]

  // 统计卡片
  const statCards: StatCard[] = [
    {
      title: "本月销售额",
      value: 36450,
      icon: "trendingUp",
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: {
        value: 12.5,
        isPositive: true,
      },
    },
    {
      title: "本月支出",
      value: 11882,
      icon: "trendingDown",
      color: "text-red-600",
      bgColor: "bg-red-100",
      change: {
        value: 5.2,
        isPositive: false,
      },
    },
    {
      title: "库存总值",
      value: 124580,
      icon: "package",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ]

  return (
    <div className="space-y-6">
      {/* 欢迎信息 */}
      <div>
        <h1 className="text-2xl font-bold">{greeting}，张经理</h1>
        <p className="text-muted-foreground">{currentDate}</p>
      </div>

      {/* 快捷操作 */}
      <div>
        <h2 className="text-lg font-semibold mb-3">快捷操作</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <Link href={action.href} key={index}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                  <div className={`w-10 h-10 rounded-full ${action.bgColor} flex items-center justify-center mb-2`}>
                    {(() => {
                      const Icon = Icons[action.icon]
                      return <Icon className={`h-5 w-5 ${action.color}`} />
                    })()}
                  </div>
                  <span className="text-xs">{action.title}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* 统计卡片 */}
      <div>
        <h2 className="text-lg font-semibold mb-3">业务概览</h2>
        <div className="space-y-3">
          {statCards.map((card, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full ${card.bgColor} flex items-center justify-center mr-3`}>
                      {(() => {
                        const Icon = Icons[card.icon]
                        return <Icon className={`h-5 w-5 ${card.color}`} />
                      })()}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{card.title}</p>
                      {isLoading ? (
                        <Skeleton className="h-6 w-24 mt-1" />
                      ) : (
                        <p className="font-semibold">
                          {typeof card.value === 'number' 
                            ? formatCurrency(card.value) 
                            : card.value}
                        </p>
                      )}
                    </div>
                  </div>
                  {card.change && !isLoading && (
                    <div className={`text-sm ${card.change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {card.change.isPositive ? '+' : '-'}{card.change.value}%
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 待办事项 */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">待办事项</h2>
          <Button variant="ghost" size="sm">
            查看全部
          </Button>
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                      <Icons.alert className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">库存预警</p>
                      <p className="text-sm text-muted-foreground">产品A库存不足，请及时补充</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Icons.chevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <Icons.clipboardCheck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">订单审批</p>
                      <p className="text-sm text-muted-foreground">有3个订单等待审批</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Icons.chevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
