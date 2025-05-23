"use client"

import { useState } from "react"
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { 
  BellIcon, 
  MailIcon, 
  MessageSquareIcon, 
  ClockIcon,
  AlertCircleIcon
} from "lucide-react"

interface SystemParameter {
  id: number
  key: string
  value: string
  description: string
  group: string
  type: string
  options?: string
  createdAt: string
  updatedAt: string
}

interface NotificationSettingsProps {
  parameters: SystemParameter[]
  isLoading: boolean
  onUpdate: (key: string, value: string) => void
}

/**
 * 通知设置组件
 */
export function NotificationSettings({ 
  parameters, 
  isLoading, 
  onUpdate 
}: NotificationSettingsProps) {
  // 获取参数值
  const getParameterValue = (key: string) => {
    const param = parameters.find(p => p.key === key)
    return param ? param.value : ""
  }
  
  // 获取参数描述
  const getParameterDescription = (key: string) => {
    const param = parameters.find(p => p.key === key)
    return param ? param.description : ""
  }
  
  // 获取参数类型
  const getParameterType = (key: string) => {
    const param = parameters.find(p => p.key === key)
    return param ? param.type : "text"
  }
  
  // 获取参数选项
  const getParameterOptions = (key: string) => {
    const param = parameters.find(p => p.key === key)
    return param && param.options ? JSON.parse(param.options) : []
  }
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }
  
  return (
    <PermissionGuard 
      permission="settings.view"
      fallback={
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">您没有权限查看通知设置</p>
        </div>
      }
    >
      <Form>
        <div className="space-y-6">
          {parameters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">暂无通知设置参数</p>
            </div>
          ) : (
            <PermissionGuard
              permission="settings.edit"
              fallback={
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <BellIcon className="h-4 w-4" />
                      <h3 className="text-lg font-medium">系统通知</h3>
                    </div>
                    
                    <div className="space-y-2 pl-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">启用系统通知</p>
                          <p className="text-sm text-muted-foreground">{getParameterDescription("notification_enabled")}</p>
                        </div>
                        <div className="font-medium">{getParameterValue("notification_enabled") === "true" ? "已启用" : "已禁用"}</div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">通知显示时间</p>
                          <p className="text-sm text-muted-foreground">{getParameterDescription("notification_display_time")}</p>
                        </div>
                        <div className="font-medium">{getParameterValue("notification_display_time")} 秒</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MailIcon className="h-4 w-4" />
                      <h3 className="text-lg font-medium">邮件通知</h3>
                    </div>
                    
                    <div className="space-y-2 pl-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">启用邮件通知</p>
                          <p className="text-sm text-muted-foreground">{getParameterDescription("email_notification_enabled")}</p>
                        </div>
                        <div className="font-medium">{getParameterValue("email_notification_enabled") === "true" ? "已启用" : "已禁用"}</div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">邮件发送频率</p>
                          <p className="text-sm text-muted-foreground">{getParameterDescription("email_notification_frequency")}</p>
                        </div>
                        <div className="font-medium">{getParameterValue("email_notification_frequency")}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <AlertCircleIcon className="h-4 w-4" />
                      <h3 className="text-lg font-medium">提醒设置</h3>
                    </div>
                    
                    <div className="space-y-2 pl-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">库存预警阈值</p>
                          <p className="text-sm text-muted-foreground">{getParameterDescription("inventory_alert_threshold")}</p>
                        </div>
                        <div className="font-medium">{getParameterValue("inventory_alert_threshold")}</div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">订单提醒</p>
                          <p className="text-sm text-muted-foreground">{getParameterDescription("order_reminder_enabled")}</p>
                        </div>
                        <div className="font-medium">{getParameterValue("order_reminder_enabled") === "true" ? "已启用" : "已禁用"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BellIcon className="h-4 w-4" />
                    <h3 className="text-lg font-medium">系统通知</h3>
                  </div>
                  
                  <div className="space-y-4 pl-6">
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">启用系统通知</FormLabel>
                        <FormDescription>{getParameterDescription("notification_enabled")}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={getParameterValue("notification_enabled") === "true"}
                          onCheckedChange={(checked) => onUpdate("notification_enabled", checked ? "true" : "false")}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel>通知显示时间 (秒)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={getParameterValue("notification_display_time")}
                          onChange={(e) => onUpdate("notification_display_time", e.target.value)}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>{getParameterDescription("notification_display_time")}</FormDescription>
                    </FormItem>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MailIcon className="h-4 w-4" />
                    <h3 className="text-lg font-medium">邮件通知</h3>
                  </div>
                  
                  <div className="space-y-4 pl-6">
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">启用邮件通知</FormLabel>
                        <FormDescription>{getParameterDescription("email_notification_enabled")}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={getParameterValue("email_notification_enabled") === "true"}
                          onCheckedChange={(checked) => onUpdate("email_notification_enabled", checked ? "true" : "false")}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel>邮件发送频率</FormLabel>
                      <Select
                        value={getParameterValue("email_notification_frequency")}
                        onValueChange={(val) => onUpdate("email_notification_frequency", val)}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择频率" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getParameterOptions("email_notification_frequency").map((option: string) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>{getParameterDescription("email_notification_frequency")}</FormDescription>
                    </FormItem>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertCircleIcon className="h-4 w-4" />
                    <h3 className="text-lg font-medium">提醒设置</h3>
                  </div>
                  
                  <div className="space-y-4 pl-6">
                    <FormItem>
                      <FormLabel>库存预警阈值</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={getParameterValue("inventory_alert_threshold")}
                          onChange={(e) => onUpdate("inventory_alert_threshold", e.target.value)}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>{getParameterDescription("inventory_alert_threshold")}</FormDescription>
                    </FormItem>
                    
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">订单提醒</FormLabel>
                        <FormDescription>{getParameterDescription("order_reminder_enabled")}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={getParameterValue("order_reminder_enabled") === "true"}
                          onCheckedChange={(checked) => onUpdate("order_reminder_enabled", checked ? "true" : "false")}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  </div>
                </div>
              </div>
            </PermissionGuard>
          )}
        </div>
      </Form>
    </PermissionGuard>
  )
}
