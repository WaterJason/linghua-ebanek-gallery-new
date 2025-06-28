"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  UploadIcon, 
  AlertTriangleIcon, 
  ShieldCheckIcon,
  DatabaseIcon,
  ClockIcon,
  HardDriveIcon
} from "lucide-react"
import { formatBytes, formatDuration } from "@/lib/utils"

interface RestoreBackupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  backup: {
    id: number
    name: string
    description?: string
    type: string
    fileSize?: number
    modules: string[]
    startTime: Date
    endTime?: Date
    duration?: number
    isEncrypted: boolean
    createdAt: Date
  }
  onConfirm: (backup: any, options: RestoreOptions) => void
}

interface RestoreOptions {
  confirmPassword: string
  dropExisting?: boolean
}

export function RestoreBackupDialog({ open, onOpenChange, backup, onConfirm }: RestoreBackupDialogProps) {
  const [options, setOptions] = useState<RestoreOptions>({
    confirmPassword: '',
    dropExisting: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState<'confirm' | 'options'>('confirm')

  // 验证表单
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!options.confirmPassword.trim()) {
      newErrors.confirmPassword = '请输入确认密码'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理下一步
  const handleNext = () => {
    if (step === 'confirm') {
      setStep('options')
    } else {
      if (!validateForm()) return
      onConfirm(backup, options)
      handleClose()
    }
  }

  // 处理关闭
  const handleClose = () => {
    setOptions({
      confirmPassword: '',
      dropExisting: false
    })
    setErrors({})
    setStep('confirm')
    onOpenChange(false)
  }

  // 获取备份类型标签
  const getBackupTypeLabel = (type: string) => {
    switch (type) {
      case 'full': return '完整备份'
      case 'incremental': return '增量备份'
      case 'selective': return '选择性备份'
      default: return type
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadIcon className="h-5 w-5" />
            恢复数据备份
          </DialogTitle>
          <DialogDescription>
            {step === 'confirm' 
              ? '确认要恢复的备份信息，此操作将影响系统数据'
              : '配置恢复选项，请谨慎操作'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'confirm' ? (
          // 第一步：确认备份信息
          <div className="space-y-4">
            {/* 备份信息卡片 */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{backup.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{getBackupTypeLabel(backup.type)}</Badge>
                      {backup.isEncrypted && (
                        <Badge variant="outline">
                          <ShieldCheckIcon className="mr-1 h-3 w-3" />
                          已加密
                        </Badge>
                      )}
                    </div>
                  </div>

                  {backup.description && (
                    <p className="text-sm text-muted-foreground">
                      {backup.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-muted-foreground" />
                      <span>创建时间</span>
                    </div>
                    <span>{new Date(backup.startTime).toLocaleString()}</span>

                    {backup.fileSize && (
                      <>
                        <div className="flex items-center gap-2">
                          <HardDriveIcon className="h-4 w-4 text-muted-foreground" />
                          <span>文件大小</span>
                        </div>
                        <span>{formatBytes(backup.fileSize)}</span>
                      </>
                    )}

                    {backup.duration && (
                      <>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-muted-foreground" />
                          <span>备份耗时</span>
                        </div>
                        <span>{formatDuration(backup.duration)}</span>
                      </>
                    )}
                  </div>

                  {backup.modules.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">包含模块:</p>
                      <div className="flex flex-wrap gap-1">
                        {backup.modules.map((module, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {module}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 警告提示 */}
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangleIcon className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>重要警告：</strong>
                <ul className="mt-1 space-y-1 text-sm">
                  <li>• 数据恢复将覆盖当前系统数据</li>
                  <li>• 恢复过程中系统将暂时不可用</li>
                  <li>• 建议在恢复前创建当前数据的备份</li>
                  <li>• 此操作不可逆，请确认后再继续</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          // 第二步：恢复选项
          <div className="space-y-4">
            {/* 密码确认 */}
            <div>
              <Label htmlFor="password">确认密码 *</Label>
              <Input
                id="password"
                type="password"
                value={options.confirmPassword}
                onChange={(e) => setOptions({ ...options, confirmPassword: e.target.value })}
                placeholder="请输入您的登录密码以确认操作"
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                为了安全起见，请输入您的登录密码确认此操作
              </p>
            </div>

            {/* 恢复选项 */}
            <div>
              <Label>恢复选项</Label>
              <div className="mt-2 space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="dropExisting"
                    checked={options.dropExisting}
                    onCheckedChange={(checked) => 
                      setOptions({ ...options, dropExisting: checked as boolean })
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="dropExisting" className="text-sm font-medium">
                      清空现有数据后恢复
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      推荐选项：先清空现有数据，然后恢复备份数据，确保数据一致性
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 自动备份提示 */}
            <Alert>
              <DatabaseIcon className="h-4 w-4" />
              <AlertDescription>
                <strong>自动保护：</strong>
                系统将在恢复前自动创建当前数据的备份，以防需要回滚操作。
              </AlertDescription>
            </Alert>

            {/* 最终警告 */}
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangleIcon className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>最后确认：</strong>
                您即将恢复备份 "{backup.name}"，此操作将：
                <ul className="mt-1 space-y-1 text-sm">
                  <li>• 替换当前系统中的相关数据</li>
                  <li>• 可能影响正在进行的业务操作</li>
                  <li>• 需要重新登录系统</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          {step === 'confirm' ? (
            <Button onClick={handleNext}>
              下一步
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              variant="destructive"
            >
              <UploadIcon className="mr-2 h-4 w-4" />
              确认恢复
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
