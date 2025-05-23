"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { 
  SearchIcon, 
  FileIcon, 
  UserIcon, 
  PlusIcon, 
  Pencil2Icon, 
  TrashIcon, 
  EyeIcon,
  CheckIcon,
  XIcon,
  DownloadIcon,
  UploadIcon,
  LogInIcon,
  LogOutIcon,
  ClockIcon,
  ArrowRightIcon
} from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { getEntityAuditLogs } from "@/lib/actions/audit-actions"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

// 获取操作图标
const getActionIcon = (action: string) => {
  switch (action) {
    case "create":
      return <PlusIcon className="h-4 w-4 text-green-500" />;
    case "update":
      return <Pencil2Icon className="h-4 w-4 text-blue-500" />;
    case "delete":
      return <TrashIcon className="h-4 w-4 text-red-500" />;
    case "view":
      return <EyeIcon className="h-4 w-4 text-gray-500" />;
    case "export":
      return <DownloadIcon className="h-4 w-4 text-purple-500" />;
    case "import":
      return <UploadIcon className="h-4 w-4 text-orange-500" />;
    case "login":
      return <LogInIcon className="h-4 w-4 text-green-500" />;
    case "logout":
      return <LogOutIcon className="h-4 w-4 text-gray-500" />;
    case "approve":
      return <CheckIcon className="h-4 w-4 text-green-500" />;
    case "reject":
      return <XIcon className="h-4 w-4 text-red-500" />;
    default:
      return <FileIcon className="h-4 w-4 text-gray-500" />;
  }
};

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

interface EntityAuditLogProps {
  entityType: string
  entityId: string
  limit?: number
  showHeader?: boolean
  className?: string
}

export function EntityAuditLog({
  entityType,
  entityId,
  limit = 5,
  showHeader = true,
  className
}: EntityAuditLogProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  // 加载审计日志
  useEffect(() => {
    const loadLogs = async () => {
      setIsLoading(true)
      try {
        const data = await getEntityAuditLogs(entityType, entityId, limit)
        setLogs(data)
      } catch (error) {
        console.error("Error loading audit logs:", error)
        toast({
          title: "加载失败",
          description: "无法加载审计日志，请稍后再试",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadLogs()
  }, [entityType, entityId, limit])

  // 查看日志详情
  const handleViewLogDetail = (log: AuditLog) => {
    setSelectedLog(log)
    setShowDetailDialog(true)
  }

  // 查看所有日志
  const handleViewAllLogs = () => {
    window.open(`/settings/audit-logs?entityType=${entityType}&entityId=${entityId}`, "_blank")
  }

  // 解析JSON字符串
  const parseJsonSafely = (jsonString: string | null) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      return jsonString;
    }
  };

  return (
    <>
      <Card className={className}>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="text-base">操作日志</CardTitle>
            <CardDescription>记录对此实体的所有操作</CardDescription>
          </CardHeader>
        )}
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2">加载中...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">暂无操作日志</p>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-3 p-3 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleViewLogDetail(log)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{getActionLabel(log.action)}</span>
                        <Badge variant="outline" className={cn("text-xs", getActionColor(log.action))}>
                          {log.action}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 truncate">
                      {log.details || "无详细信息"}
                    </div>
                    <div className="flex items-center mt-1 text-xs text-muted-foreground">
                      <UserIcon className="h-3 w-3 mr-1" />
                      <span>{log.userName || log.userId || "系统"}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {logs.length >= limit && (
                <Button
                  variant="ghost"
                  className="w-full mt-2"
                  onClick={handleViewAllLogs}
                >
                  查看所有日志
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 审计日志详情对话框 */}
      {selectedLog && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>操作日志详情</DialogTitle>
              <DialogDescription>
                查看操作详细信息
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">操作类型</div>
                  <Badge className={cn("text-xs", getActionColor(selectedLog.action))}>
                    {getActionLabel(selectedLog.action)}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">操作时间</div>
                  <div className="text-sm flex items-center">
                    <ClockIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    {format(new Date(selectedLog.timestamp), "yyyy-MM-dd HH:mm:ss", { locale: zhCN })}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">操作人</div>
                  <div className="text-sm flex items-center">
                    <UserIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    {selectedLog.userName || selectedLog.userId || "系统"}
                  </div>
                </div>
              </div>
              
              {/* 详情 */}
              {selectedLog.details && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">操作详情</div>
                  <div className="text-sm p-2 bg-muted rounded-md">
                    {selectedLog.details}
                  </div>
                </div>
              )}
              
              {/* 数据变更 */}
              <Tabs defaultValue="changes" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="changes">数据变更</TabsTrigger>
                  <TabsTrigger value="old">变更前</TabsTrigger>
                  <TabsTrigger value="new">变更后</TabsTrigger>
                </TabsList>
                
                {/* 数据变更对比 */}
                <TabsContent value="changes">
                  {(selectedLog.oldValues || selectedLog.newValues) ? (
                    <ScrollArea className="h-[200px] rounded-md border p-4">
                      <div className="space-y-2">
                        {selectedLog.oldValues && selectedLog.newValues ? (
                          // 更新操作，显示变更对比
                          Object.keys({ ...parseJsonSafely(selectedLog.oldValues), ...parseJsonSafely(selectedLog.newValues) }).map((key) => (
                            <div key={key} className="grid grid-cols-3 gap-2">
                              <div className="text-sm font-medium">{key}</div>
                              <div className={cn(
                                "text-sm p-1 rounded",
                                parseJsonSafely(selectedLog.oldValues)[key] !== parseJsonSafely(selectedLog.newValues)[key] && "bg-red-50 dark:bg-red-900/20"
                              )}>
                                {parseJsonSafely(selectedLog.oldValues)[key] !== undefined ? 
                                  (typeof parseJsonSafely(selectedLog.oldValues)[key] === 'object' ? 
                                    JSON.stringify(parseJsonSafely(selectedLog.oldValues)[key]) : 
                                    String(parseJsonSafely(selectedLog.oldValues)[key])
                                  ) : 
                                  "-"
                                }
                              </div>
                              <div className={cn(
                                "text-sm p-1 rounded",
                                parseJsonSafely(selectedLog.oldValues)[key] !== parseJsonSafely(selectedLog.newValues)[key] && "bg-green-50 dark:bg-green-900/20"
                              )}>
                                {parseJsonSafely(selectedLog.newValues)[key] !== undefined ? 
                                  (typeof parseJsonSafely(selectedLog.newValues)[key] === 'object' ? 
                                    JSON.stringify(parseJsonSafely(selectedLog.newValues)[key]) : 
                                    String(parseJsonSafely(selectedLog.newValues)[key])
                                  ) : 
                                  "-"
                                }
                              </div>
                            </div>
                          ))
                        ) : selectedLog.oldValues ? (
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
                  {selectedLog.oldValues ? (
                    <ScrollArea className="h-[200px] rounded-md border p-4">
                      <pre className="text-xs">
                        {typeof parseJsonSafely(selectedLog.oldValues) === 'object' ? 
                          JSON.stringify(parseJsonSafely(selectedLog.oldValues), null, 2) : 
                          selectedLog.oldValues
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
                  {selectedLog.newValues ? (
                    <ScrollArea className="h-[200px] rounded-md border p-4">
                      <pre className="text-xs">
                        {typeof parseJsonSafely(selectedLog.newValues) === 'object' ? 
                          JSON.stringify(parseJsonSafely(selectedLog.newValues), null, 2) : 
                          selectedLog.newValues
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
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
