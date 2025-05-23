"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { 
  UserIcon, 
  ClockIcon, 
  GlobeIcon, 
  MonitorIcon,
  FileIcon,
  FileTextIcon
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

// 审计日志类型
interface AuditLog {
  id: number
  userId: string | null
  userName?: string
  action: string
  entityType: string
  entityId: string
  oldValues: string | null
  newValues: string | null
  ipAddress: string | null
  userAgent: string | null
  timestamp: Date
  details: string | null
}

interface AuditLogDetailProps {
  log: AuditLog
  open: boolean
  onOpenChange: (open: boolean) => void
}

// 获取操作标签
const getActionLabel = (action: string) => {
  switch (action) {
    case "create":
      return "创建";
    case "update":
      return "更新";
    case "delete":
      return "删除";
    case "view":
      return "查看";
    case "export":
      return "导出";
    case "import":
      return "导入";
    case "login":
      return "登录";
    case "logout":
      return "登出";
    case "approve":
      return "审批";
    case "reject":
      return "拒绝";
    default:
      return action;
  }
};

// 获取实体类型标签
const getEntityTypeLabel = (entityType: string) => {
  switch (entityType) {
    case "product":
      return "产品";
    case "order":
      return "订单";
    case "customer":
      return "客户";
    case "supplier":
      return "供应商";
    case "inventory":
      return "库存";
    case "user":
      return "用户";
    case "system":
      return "系统";
    default:
      return entityType;
  }
};

// 获取操作颜色
const getActionColor = (action: string) => {
  switch (action) {
    case "create":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "update":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "delete":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "view":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    case "export":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "import":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    case "login":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "logout":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    case "approve":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "reject":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

export function AuditLogDetail({ log, open, onOpenChange }: AuditLogDetailProps) {
  // 解析JSON字符串
  const parseJsonSafely = (jsonString: string | null) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      return jsonString;
    }
  };

  const oldValues = parseJsonSafely(log.oldValues);
  const newValues = parseJsonSafely(log.newValues);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>审计日志详情</DialogTitle>
          <DialogDescription>
            查看操作详细信息
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">操作类型</div>
              <Badge className={cn("text-xs", getActionColor(log.action))}>
                {getActionLabel(log.action)}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">实体类型</div>
              <div className="text-sm">
                {getEntityTypeLabel(log.entityType)}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">实体ID</div>
              <div className="text-sm font-mono">
                {log.entityId}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">操作时间</div>
              <div className="text-sm flex items-center">
                <ClockIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss", { locale: zhCN })}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">操作人</div>
              <div className="text-sm flex items-center">
                <UserIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                {log.userName || log.userId || "系统"}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">IP地址</div>
              <div className="text-sm flex items-center">
                <GlobeIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                {log.ipAddress || "-"}
              </div>
            </div>
          </div>
          
          {/* 详情 */}
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">操作详情</div>
            <div className="text-sm p-2 bg-muted rounded-md">
              {log.details || "-"}
            </div>
          </div>
          
          {/* 数据变更 */}
          <Tabs defaultValue="changes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="changes">数据变更</TabsTrigger>
              <TabsTrigger value="old">变更前</TabsTrigger>
              <TabsTrigger value="new">变更后</TabsTrigger>
            </TabsList>
            
            {/* 数据变更对比 */}
            <TabsContent value="changes">
              {(oldValues || newValues) ? (
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <div className="space-y-2">
                    {oldValues && newValues ? (
                      // 更新操作，显示变更对比
                      Object.keys({ ...oldValues, ...newValues }).map((key) => (
                        <div key={key} className="grid grid-cols-3 gap-2">
                          <div className="text-sm font-medium">{key}</div>
                          <div className={cn(
                            "text-sm p-1 rounded",
                            oldValues[key] !== newValues[key] && "bg-red-50 dark:bg-red-900/20"
                          )}>
                            {oldValues[key] !== undefined ? 
                              (typeof oldValues[key] === 'object' ? 
                                JSON.stringify(oldValues[key]) : 
                                String(oldValues[key])
                              ) : 
                              "-"
                            }
                          </div>
                          <div className={cn(
                            "text-sm p-1 rounded",
                            oldValues[key] !== newValues[key] && "bg-green-50 dark:bg-green-900/20"
                          )}>
                            {newValues[key] !== undefined ? 
                              (typeof newValues[key] === 'object' ? 
                                JSON.stringify(newValues[key]) : 
                                String(newValues[key])
                              ) : 
                              "-"
                            }
                          </div>
                        </div>
                      ))
                    ) : oldValues ? (
                      // 删除操作，只显示旧值
                      <div className="text-sm text-muted-foreground">
                        数据已被删除
                      </div>
                    ) : (
                      // 创建操作，只显示新值
                      <div className="text-sm text-muted-foreground">
                        数据已被创建
                      </div>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                  无数据变更记录
                </div>
              )}
            </TabsContent>
            
            {/* 变更前数据 */}
            <TabsContent value="old">
              {oldValues ? (
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <pre className="text-xs">
                    {typeof oldValues === 'object' ? 
                      JSON.stringify(oldValues, null, 2) : 
                      oldValues
                    }
                  </pre>
                </ScrollArea>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                  无变更前数据
                </div>
              )}
            </TabsContent>
            
            {/* 变更后数据 */}
            <TabsContent value="new">
              {newValues ? (
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <pre className="text-xs">
                    {typeof newValues === 'object' ? 
                      JSON.stringify(newValues, null, 2) : 
                      newValues
                    }
                  </pre>
                </ScrollArea>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                  无变更后数据
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* 用户代理 */}
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">用户代理</div>
            <div className="text-xs flex items-start">
              <MonitorIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground shrink-0 mt-0.5" />
              <div className="break-all">
                {log.userAgent || "-"}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
