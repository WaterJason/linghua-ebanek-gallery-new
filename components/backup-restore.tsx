"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { DownloadIcon, UploadIcon, DatabaseIcon, AlertTriangleIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { format } from "date-fns"

export function BackupRestore() {
  const [backupLoading, setBackupLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  // 处理备份数据
  const handleBackup = async () => {
    setBackupLoading(true)
    try {
      // 调用备份API
      const response = await fetch('/api/backup', {
        method: 'GET',
      })
      
      if (!response.ok) {
        throw new Error('备份失败')
      }
      
      // 获取备份数据
      const data = await response.json()
      
      // 创建下载链接
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `linghua_backup_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`
      document.body.appendChild(a)
      a.click()
      
      // 清理
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "备份成功",
        description: "数据已成功备份到本地文件",
      })
    } catch (error) {
      console.error("备份失败:", error)
      toast({
        title: "备份失败",
        description: "无法创建数据备份，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setBackupLoading(false)
    }
  }

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  // 处理恢复数据
  const handleRestore = async () => {
    if (!selectedFile) {
      toast({
        title: "请选择备份文件",
        description: "请先选择一个有效的备份文件",
        variant: "destructive",
      })
      return
    }

    setRestoreLoading(true)
    try {
      // 读取文件内容
      const fileContent = await selectedFile.text()
      let backupData
      
      try {
        backupData = JSON.parse(fileContent)
      } catch (e) {
        throw new Error('无效的备份文件格式')
      }
      
      // 调用恢复API
      const response = await fetch('/api/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backupData),
      })
      
      if (!response.ok) {
        throw new Error('恢复失败')
      }
      
      toast({
        title: "恢复成功",
        description: "数据已成功从备份文件恢复",
      })
      
      // 重置文件选择
      setSelectedFile(null)
      setConfirmDialogOpen(false)
      
      // 刷新页面以显示恢复后的数据
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error("恢复失败:", error)
      toast({
        title: "恢复失败",
        description: error instanceof Error ? error.message : "无法从备份文件恢复数据",
        variant: "destructive",
      })
    } finally {
      setRestoreLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>数据备份与恢复</CardTitle>
        <CardDescription>备份或恢复系统数据</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="backup">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="backup">备份数据</TabsTrigger>
            <TabsTrigger value="restore">恢复数据</TabsTrigger>
          </TabsList>
          
          <TabsContent value="backup" className="space-y-4 pt-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                创建系统数据的完整备份，包括产品、员工、销售记录等所有数据。备份文件将下载到您的设备上。
              </p>
              
              <Alert>
                <DatabaseIcon className="h-4 w-4" />
                <AlertTitle>定期备份</AlertTitle>
                <AlertDescription>
                  建议定期备份数据，以防数据丢失。备份文件包含所有系统数据，请妥善保管。
                </AlertDescription>
              </Alert>
            </div>
            
            <Button 
              onClick={handleBackup} 
              disabled={backupLoading}
              className="w-full"
            >
              {backupLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  备份中...
                </>
              ) : (
                <>
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  创建备份
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="restore" className="space-y-4 pt-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                从备份文件恢复系统数据。此操作将覆盖当前系统中的所有数据，请谨慎操作。
              </p>
              
              <Alert variant="destructive">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertTitle>警告</AlertTitle>
                <AlertDescription>
                  恢复操作将覆盖当前系统中的所有数据，此操作不可撤销。请确保您有最新的备份。
                </AlertDescription>
              </Alert>
            </div>
            
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="backup-file">选择备份文件</Label>
              <Input 
                id="backup-file" 
                type="file" 
                accept=".json"
                onChange={handleFileChange}
              />
            </div>
            
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="destructive"
                  disabled={!selectedFile || restoreLoading}
                  className="w-full"
                >
                  <UploadIcon className="mr-2 h-4 w-4" />
                  恢复数据
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>确认恢复数据</DialogTitle>
                  <DialogDescription>
                    此操作将覆盖当前系统中的所有数据，且不可撤销。确定要继续吗？
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                    取消
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleRestore}
                    disabled={restoreLoading}
                  >
                    {restoreLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        恢复中...
                      </>
                    ) : (
                      "确认恢复"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
