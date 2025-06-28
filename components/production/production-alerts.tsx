'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  AlertTriangle,
  Clock,
  TrendingDown,
  MapPin,
  ChevronDown,
  ChevronUp,
  X,
  Bell,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductionAlert {
  id: string
  type: 'delivery_warning' | 'quality_alert' | 'stage_stagnation' | 'resource_shortage' | 'system_alert'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  orderId?: number
  orderNumber?: string
  location?: string
  timestamp: string
  isRead: boolean
  suggestedActions?: string[]
}

const alertTypeLabels = {
  delivery_warning: '交期预警',
  quality_alert: '质量预警',
  stage_stagnation: '阶段停滞',
  resource_shortage: '资源短缺',
  system_alert: '系统预警'
}

const alertTypeIcons = {
  delivery_warning: Clock,
  quality_alert: AlertTriangle,
  stage_stagnation: TrendingDown,
  resource_shortage: MapPin,
  system_alert: Bell
}

const severityColors = {
  low: 'blue',
  medium: 'yellow',
  high: 'orange',
  critical: 'red'
}

const severityLabels = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '严重'
}

interface ProductionAlertsProps {
  className?: string
}

export function ProductionAlerts({ className }: ProductionAlertsProps) {
  const [alerts, setAlerts] = useState<ProductionAlert[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  // 加载预警数据
  const loadAlerts = async () => {
    try {
      setIsLoading(true)

      // 从API获取真实预警数据
      const response = await fetch('/api/production/alerts')

      if (response.ok) {
        const data = await response.json()
        const apiAlerts = data.alerts || []

        // 转换API数据为组件格式
        const formattedAlerts = apiAlerts.map((alert: any) => ({
          id: alert.id || Math.random().toString(36).substr(2, 9),
          type: alert.type || 'system_alert',
          severity: alert.severity || 'medium',
          title: alert.title || '系统预警',
          message: alert.message || alert.description || '',
          orderId: alert.orderId,
          orderNumber: alert.orderNumber,
          location: alert.location,
          timestamp: alert.timestamp || alert.createdAt || new Date().toISOString(),
          isRead: alert.isRead || false,
          suggestedActions: alert.suggestedActions || alert.suggestions || []
        }))

        setAlerts(formattedAlerts)
      } else {
        // 如果API不可用，基于订单数据生成预警
        await generateAlertsFromOrders()
      }
    } catch (error) {
      console.error('Failed to load alerts:', error)
      // 如果API失败，基于订单数据生成预警
      await generateAlertsFromOrders()
    } finally {
      setIsLoading(false)
    }
  }

  // 基于订单数据生成预警
  const generateAlertsFromOrders = async () => {
    try {
      const response = await fetch('/api/production/orders?page=1&limit=1000')
      if (response.ok) {
        const data = await response.json()
        const orders = data.data || []

        const generatedAlerts: ProductionAlert[] = []
        const now = new Date()

        orders.forEach((order: any) => {
          // 交期预警
          if (order.estimatedCompletionDate) {
            const dueDate = new Date(order.estimatedCompletionDate)
            const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

            if (daysUntilDue <= 2 && order.status !== 'COMPLETED') {
              generatedAlerts.push({
                id: `delivery_${order.id}`,
                type: 'delivery_warning',
                severity: daysUntilDue <= 0 ? 'critical' : daysUntilDue === 1 ? 'high' : 'medium',
                title: '交期预警',
                message: `订单 ${order.orderNumber || order.id} ${daysUntilDue <= 0 ? '已逾期' : `还有${daysUntilDue}天到期`}，当前进度${order.progressPercentage || 0}%`,
                orderId: order.id,
                orderNumber: order.orderNumber,
                location: order.location,
                timestamp: new Date().toISOString(),
                isRead: false,
                suggestedActions: [
                  '检查当前生产进度',
                  '考虑加班或增加人手',
                  daysUntilDue <= 0 ? '联系客户说明情况' : '联系客户协商延期'
                ]
              })
            }
          }

          // 阶段停滞预警
          if (order.updatedAt) {
            const lastUpdate = new Date(order.updatedAt)
            const daysSinceUpdate = Math.ceil((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))

            if (daysSinceUpdate >= 3 && order.status === 'IN_PROGRESS') {
              generatedAlerts.push({
                id: `stagnation_${order.id}`,
                type: 'stage_stagnation',
                severity: daysSinceUpdate >= 7 ? 'high' : 'medium',
                title: '阶段停滞预警',
                message: `订单 ${order.orderNumber || order.id} 在${order.currentStage || '当前'}阶段已停滞${daysSinceUpdate}天`,
                orderId: order.id,
                orderNumber: order.orderNumber,
                location: order.location,
                timestamp: new Date().toISOString(),
                isRead: false,
                suggestedActions: [
                  '联系生产负责人了解情况',
                  '检查是否缺少原材料',
                  '评估是否需要技术支持'
                ]
              })
            }
          }
        })

        setAlerts(generatedAlerts)
      } else {
        setAlerts([])
      }
    } catch (error) {
      console.error('Failed to generate alerts from orders:', error)
      setAlerts([])
    }
  }

  // 标记预警为已读
  const markAsRead = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ))
  }

  // 关闭预警
  const dismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId))
  }

  // 初始加载
  useEffect(() => {
    loadAlerts()
  }, [])

  // 自动刷新
  useEffect(() => {
    const interval = setInterval(loadAlerts, 60000) // 每分钟刷新
    return () => clearInterval(interval)
  }, [])

  const unreadCount = alerts.filter(alert => !alert.isRead).length
  const criticalCount = alerts.filter(alert => alert.severity === 'critical').length

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm">加载预警信息...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">系统运行正常，暂无预警</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle className="text-base">生产预警</CardTitle>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {unreadCount}
                  </Badge>
                )}
                {criticalCount > 0 && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    {criticalCount} 严重
                  </Badge>
                )}
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const IconComponent = alertTypeIcons[alert.type]
                  const severityColor = severityColors[alert.severity]
                  
                  return (
                    <Alert
                      key={alert.id}
                      className={cn(
                        'relative transition-all duration-200',
                        !alert.isRead && 'border-l-4 border-l-primary bg-muted/30',
                        alert.severity === 'critical' && 'border-destructive bg-destructive/5'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <IconComponent className={cn(
                          'h-4 w-4 mt-0.5',
                          `text-${severityColor}-600`
                        )} />
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <AlertTitle className="text-sm font-medium">
                              {alert.title}
                            </AlertTitle>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={severityColor as any}
                                className="text-xs"
                              >
                                {severityLabels[alert.severity]}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => dismissAlert(alert.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <AlertDescription className="text-sm text-muted-foreground">
                            {alert.message}
                          </AlertDescription>

                          {/* 订单和地点信息 */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {alert.orderNumber && (
                              <span>订单: {alert.orderNumber}</span>
                            )}
                            {alert.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{alert.location}</span>
                              </div>
                            )}
                            <span>{new Date(alert.timestamp).toLocaleString()}</span>
                          </div>

                          {/* 建议操作 */}
                          {alert.suggestedActions && alert.suggestedActions.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium text-muted-foreground mb-1">
                                建议操作:
                              </div>
                              <ul className="text-xs text-muted-foreground space-y-0.5">
                                {alert.suggestedActions.map((action, index) => (
                                  <li key={index} className="flex items-start gap-1">
                                    <span className="text-primary">•</span>
                                    <span>{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* 操作按钮 */}
                          <div className="flex items-center gap-2 mt-2">
                            {!alert.isRead && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs"
                                onClick={() => markAsRead(alert.id)}
                              >
                                标记已读
                              </Button>
                            )}
                            {alert.orderId && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs"
                                onClick={() => {
                                  // 跳转到订单详情
                                  console.log('View order:', alert.orderId)
                                }}
                              >
                                查看订单
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Alert>
                  )
                })}
              </div>
            </ScrollArea>

            {/* 底部操作 */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-xs text-muted-foreground">
                共 {alerts.length} 条预警，{unreadCount} 条未读
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs"
                  onClick={() => {
                    setAlerts(alerts.map(alert => ({ ...alert, isRead: true })))
                  }}
                >
                  全部标记已读
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs"
                  onClick={loadAlerts}
                >
                  刷新
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
