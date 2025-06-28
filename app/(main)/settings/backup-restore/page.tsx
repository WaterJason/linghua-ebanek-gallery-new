"use client"

import { useState, useEffect } from "react"
import { ModernPageContainer } from "@/components/modern-page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  DatabaseIcon, 
  DownloadIcon, 
  UploadIcon, 
  ShieldCheckIcon,
  AlertTriangleIcon,
  ClockIcon,
  HardDriveIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  TrashIcon
} from "lucide-react"
import { useEnhancedOperations } from "@/lib/enhanced-operations-integration"
import { 
  getBackups, 
  getBackupStats, 
  createBackup, 
  deleteBackup, 
  validateBackup,
  restoreBackup 
} from "@/lib/actions/backup-actions"
import { formatBytes, formatDuration } from "@/lib/utils"
import { CreateBackupDialog } from "@/components/settings/create-backup-dialog"
import { RestoreBackupDialog } from "@/components/settings/restore-backup-dialog"

interface Backup {
  id: number
  name: string
  description?: string
  type: string
  status: string
  fileSize?: number
  modules: string[]
  startTime: Date
  endTime?: Date
  duration?: number
  errorMessage?: string
  createdBy: string
  isEncrypted: boolean
  createdAt: Date
}

interface BackupStats {
  totalBackups: number
  completedBackups: number
  failedBackups: number
  runningBackups: number
  totalSize: number
  lastBackup?: {
    name: string
    createdAt: Date
    fileSize?: number
    type: string
  }
  successRate: number
}

export default function BackupRestorePage() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [stats, setStats] = useState<BackupStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null)

  const { executeOperation } = useEnhancedOperations()

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true)
      const [backupsResult, statsResult] = await Promise.all([
        getBackups(1, 20),
        getBackupStats()
      ])
      setBackups(backupsResult.data)
      setStats(statsResult)
    } catch (error) {
      console.error('加载备份数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // 设置定时刷新
    const interval = setInterval(loadData, 30000) // 30秒刷新一次
    return () => clearInterval(interval)
  }, [])

  // 创建备份
  const handleCreateBackup = async (config: any) => {
    await executeOperation(
      async () => {
        await createBackup(config)
        await loadData()
      },
      {
        playSound: true,
        soundType: 'success',
        showProgress: true,
        progressTitle: '创建备份中...',
        showFeedback: true,
        feedbackMessage: '备份任务已启动'
      }
    )
    setCreateDialogOpen(false)
  }

  // 删除备份
  const handleDeleteBackup = async (backup: Backup) => {
    await executeOperation(
      async () => {
        await deleteBackup(backup.id)
        await loadData()
      },
      {
        playSound: true,
        soundType: 'success',
        showFeedback: true,
        feedbackMessage: `备份 "${backup.name}" 已删除`
      }
    )
  }

  // 验证备份
  const handleValidateBackup = async (backup: Backup) => {
    await executeOperation(
      async () => {
        const result = await validateBackup(backup.id)
        return result
      },
      {
        playSound: true,
        soundType: 'info',
        showProgress: true,
        progressTitle: '验证备份文件中...',
        showFeedback: true,
        feedbackMessage: '备份文件验证完成'
      }
    )
  }

  // 恢复备份
  const handleRestoreBackup = async (backup: Backup, options: any) => {
    await executeOperation(
      async () => {
        await restoreBackup(backup.id, options)
        await loadData()
      },
      {
        playSound: true,
        soundType: 'warning',
        showProgress: true,
        progressTitle: '恢复数据中...',
        showFeedback: true,
        feedbackMessage: '数据恢复操作已启动'
      }
    )
    setRestoreDialogOpen(false)
    setSelectedBackup(null)
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />
      case 'running': return <ClockIcon className="h-4 w-4 animate-spin" />
      case 'failed': return <XCircleIcon className="h-4 w-4" />
      case 'pending': return <ClockIcon className="h-4 w-4" />
      default: return <ClockIcon className="h-4 w-4" />
    }
  }

  return (
    <ModernPageContainer
      title="数据备份与恢复"
      description="管理系统数据备份，确保数据安全"
      breadcrumbs={[
        { label: "首页", href: "/" },
        { label: "系统设置", href: "/settings" },
        { label: "数据备份与恢复" }
      ]}
      actions={
        <Button onClick={() => setCreateDialogOpen(true)}>
          <DatabaseIcon className="mr-2 h-4 w-4" />
          创建备份
        </Button>
      }
      onRefresh={loadData}
      isLoading={loading}
    >
      {/* 统计概览 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总备份数</CardTitle>
              <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBackups}</div>
              <p className="text-xs text-muted-foreground">
                成功率: {stats.successRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已完成</CardTitle>
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedBackups}</div>
              <p className="text-xs text-muted-foreground">
                运行中: {stats.runningBackups}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">存储占用</CardTitle>
              <HardDriveIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats.totalSize)}</div>
              <p className="text-xs text-muted-foreground">
                失败: {stats.failedBackups}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最近备份</CardTitle>
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {stats.lastBackup ? stats.lastBackup.name : '暂无备份'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.lastBackup 
                  ? new Date(stats.lastBackup.createdAt).toLocaleDateString()
                  : '---'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 备份列表 */}
      <Card>
        <CardHeader>
          <CardTitle>备份记录</CardTitle>
          <CardDescription>
            查看和管理所有数据备份记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {backups.map((backup) => (
              <div key={backup.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{backup.name}</h3>
                      <Badge className={getStatusColor(backup.status)}>
                        {getStatusIcon(backup.status)}
                        <span className="ml-1">
                          {backup.status === 'completed' ? '已完成' :
                           backup.status === 'running' ? '运行中' :
                           backup.status === 'failed' ? '失败' : '等待中'}
                        </span>
                      </Badge>
                      <Badge variant="outline">{backup.type}</Badge>
                      {backup.isEncrypted && (
                        <Badge variant="outline">
                          <ShieldCheckIcon className="mr-1 h-3 w-3" />
                          已加密
                        </Badge>
                      )}
                    </div>
                    
                    {backup.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {backup.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>创建时间: {new Date(backup.startTime).toLocaleString()}</span>
                      {backup.fileSize && (
                        <span>大小: {formatBytes(backup.fileSize)}</span>
                      )}
                      {backup.duration && (
                        <span>耗时: {formatDuration(backup.duration)}</span>
                      )}
                    </div>

                    {backup.modules.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm text-muted-foreground">模块: </span>
                        {backup.modules.map((module, index) => (
                          <Badge key={index} variant="secondary" className="mr-1">
                            {module}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {backup.errorMessage && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <AlertTriangleIcon className="inline mr-1 h-4 w-4" />
                        {backup.errorMessage}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {backup.status === 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleValidateBackup(backup)}
                        >
                          <ShieldCheckIcon className="mr-1 h-4 w-4" />
                          验证
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBackup(backup)
                            setRestoreDialogOpen(true)
                          }}
                        >
                          <UploadIcon className="mr-1 h-4 w-4" />
                          恢复
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBackup(backup)}
                    >
                      <TrashIcon className="mr-1 h-4 w-4" />
                      删除
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {backups.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                <DatabaseIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>暂无备份记录</p>
                <p className="text-sm">点击"创建备份"开始备份数据</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 对话框 */}
      <CreateBackupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onConfirm={handleCreateBackup}
      />

      {selectedBackup && (
        <RestoreBackupDialog
          open={restoreDialogOpen}
          onOpenChange={setRestoreDialogOpen}
          backup={selectedBackup}
          onConfirm={handleRestoreBackup}
        />
      )}
    </ModernPageContainer>
  )
}
