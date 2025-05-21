"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import {
  DatabaseIcon,
  DownloadIcon,
  UploadIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon
} from "lucide-react"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBackup, getBackupsList, restoreBackup, deleteBackup } from "@/lib/actions/system-actions";
import { useCallback } from "react"

interface BackupFile {
  filename: string
  path: string
  timestamp: string
  reason: string
  size: number
  date: Date
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<BackupFile | null>(null)
  const [restoreReason, setRestoreReason] = useState("")
  const [isRestoring, setIsRestoring] = useState(false)

  // 加载备份列表
  const loadBackups = useCallback(async () => {
    setIsLoading(true)
    try {
      console.log("正在获取备份列表...");

      // 使用服务器端操作获取备份列表
      const data = await getBackupsList();

      // 检查数据是否为数组
      if (!Array.isArray(data)) {
        console.error("备份列表数据格式错误:", data);
        toast({
          title: "数据格式错误",
          description: "备份列表数据格式不正确",
          variant: "destructive",
        });
        setBackups([]);
        return;
      }

      console.log("成功获取备份列表:", data.length, "个备份");

      // 转换时间戳为日期对象
      const formattedBackups = data.map((backup: any) => ({
        ...backup,
        date: new Date(backup.timestamp.replace("_", "T").replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, "$1-$2-$3T$4:$5:$6"))
      }));

      setBackups(formattedBackups);
    } catch (error) {
      console.error("加载备份列表失败:", error);
      toast({
        title: "加载失败",
        description: "无法加载备份列表",
        variant: "destructive",
      });
      setBackups([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadBackups()
  }, [])

  // 创建备份
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true)
    try {
      const reason = prompt("请输入备份原因", "手动备份")
      if (!reason) return

      await createBackup(reason)

      toast({
        title: "备份成功",
        description: "数据库备份已成功创建",
      })

      // 重新加载备份列表
      loadBackups()
    } catch (error) {
      console.error("创建备份失败:", error)
      toast({
        title: "备份失败",
        description: "无法创建数据库备份",
        variant: "destructive",
      })
    } finally {
      setIsCreatingBackup(false)
    }
  }

  // 下载备份
  const handleDownloadBackup = async (backup: BackupFile) => {
    try {
      // 使用fetch API下载文件
      const response = await fetch(`/api/backup/download?filename=${backup.filename}`)

      if (!response.ok) {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob()

      // 创建下载链接
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = backup.filename
      document.body.appendChild(a)
      a.click()

      // 清理
      URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "下载成功",
        description: "备份文件已成功下载",
      })
    } catch (error) {
      console.error("下载备份失败:", error)
      toast({
        title: "下载失败",
        description: error instanceof Error ? error.message : "无法下载备份文件",
        variant: "destructive",
      })
    }
  }

  // 打开恢复对话框
  const handleOpenRestoreDialog = (backup: BackupFile) => {
    setSelectedBackup(backup)
    setRestoreReason("")
    setIsRestoreDialogOpen(true)
  }

  // 恢复备份
  const handleRestoreBackup = async () => {
    if (!selectedBackup || !restoreReason) return

    setIsRestoring(true)
    try {
      const result = await restoreBackup(selectedBackup.path)

      if (result.success) {
        toast({
          title: "恢复成功",
          description: "数据库已成功从备份恢复",
        })
      } else {
        toast({
          title: "恢复失败",
          description: result.message,
          variant: "destructive",
        })
      }

      setIsRestoreDialogOpen(false)

      // 重新加载备份列表
      loadBackups()
    } catch (error) {
      console.error("恢复备份失败:", error)
      toast({
        title: "恢复失败",
        description: "无法恢复数据库备份",
        variant: "destructive",
      })
    } finally {
      setIsRestoring(false)
    }
  }

  // 删除备份
  const handleDeleteBackup = async (backup: BackupFile) => {
    if (!confirm(`确定要删除备份 "${backup.filename}" 吗？此操作不可恢复。`)) {
      return
    }

    try {
      const result = await deleteBackup(backup.path)

      if (result.success) {
        toast({
          title: "删除成功",
          description: "备份文件已成功删除",
        })

        // 重新加载备份列表
        loadBackups()
      } else {
        toast({
          title: "删除失败",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("删除备份失败:", error)
      toast({
        title: "删除失败",
        description: "无法删除备份文件",
        variant: "destructive",
      })
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB"
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>数据库备份与恢复</CardTitle>
          <CardDescription>管理系统数据库的备份和恢复</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <DatabaseIcon className="h-5 w-5 text-muted-foreground" />
                <span>数据库备份列表</span>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={loadBackups} disabled={isLoading}>
                  <RefreshCwIcon className="mr-2 h-4 w-4" />
                  刷新
                </Button>
                <Button onClick={handleCreateBackup} disabled={isCreatingBackup}>
                  <DatabaseIcon className="mr-2 h-4 w-4" />
                  {isCreatingBackup ? "创建中..." : "创建备份"}
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">加载中...</span>
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无备份数据
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>备份时间</TableHead>
                      <TableHead>备份原因</TableHead>
                      <TableHead>文件大小</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup) => (
                      <TableRow key={backup.filename}>
                        <TableCell>
                          {format(backup.date, "yyyy-MM-dd HH:mm:ss")}
                        </TableCell>
                        <TableCell>{backup.reason}</TableCell>
                        <TableCell>{formatFileSize(backup.size)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDownloadBackup(backup)}>
                            <DownloadIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenRestoreDialog(backup)}>
                            <UploadIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteBackup(backup)}>
                            <TrashIcon className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 恢复确认对话框 */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>确认恢复数据库</DialogTitle>
            <DialogDescription>
              您确定要从备份 "{selectedBackup?.filename}" 恢复数据库吗？此操作将覆盖当前数据库中的所有数据。
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 py-4 text-amber-600">
            <AlertTriangleIcon className="h-5 w-5" />
            <p>恢复操作不可逆，请确保已备份当前数据。</p>
          </div>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                恢复原因
              </Label>
              <Input
                id="reason"
                value={restoreReason}
                onChange={(e) => setRestoreReason(e.target.value)}
                className="col-span-3"
                placeholder="请输入恢复原因"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)} disabled={isRestoring}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleRestoreBackup}
              disabled={isRestoring || !restoreReason}
            >
              {isRestoring ? "恢复中..." : "确认恢复"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
