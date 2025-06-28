"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  DatabaseIcon, 
  ShieldCheckIcon, 
  ClockIcon,
  HardDriveIcon,
  UsersIcon,
  PackageIcon,
  ShoppingCartIcon,
  BuildingIcon,
  CreditCardIcon,
  SettingsIcon
} from "lucide-react"

interface CreateBackupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (config: BackupConfig) => void
}

interface BackupConfig {
  name: string
  description?: string
  type: 'full' | 'incremental' | 'selective'
  modules?: string[]
  isEncrypted?: boolean
}

const BACKUP_MODULES = [
  { id: 'products', name: '产品管理', icon: PackageIcon, description: '产品信息、分类、标签' },
  { id: 'employees', name: '员工管理', icon: UsersIcon, description: '员工信息、排班、薪资' },
  { id: 'customers', name: '客户管理', icon: UsersIcon, description: '客户信息、订单记录' },
  { id: 'inventory', name: '库存管理', icon: HardDriveIcon, description: '库存记录、出入库' },
  { id: 'sales', name: '销售管理', icon: ShoppingCartIcon, description: 'POS销售、画廊销售' },
  { id: 'channels', name: '渠道管理', icon: BuildingIcon, description: '渠道商、分销记录' },
  { id: 'finance', name: '财务管理', icon: CreditCardIcon, description: '账户、交易记录' },
  { id: 'workshops', name: '工坊管理', icon: SettingsIcon, description: '工坊活动、服务项目' },
  { id: 'users', name: '用户管理', icon: UsersIcon, description: '用户账户、角色权限' },
  { id: 'system', name: '系统设置', icon: SettingsIcon, description: '系统参数、数据字典' }
]

export function CreateBackupDialog({ open, onOpenChange, onConfirm }: CreateBackupDialogProps) {
  const [config, setConfig] = useState<BackupConfig>({
    name: '',
    description: '',
    type: 'full',
    modules: [],
    isEncrypted: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // 验证表单
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!config.name.trim()) {
      newErrors.name = '请输入备份名称'
    }

    if (config.type === 'selective' && (!config.modules || config.modules.length === 0)) {
      newErrors.modules = '选择性备份需要至少选择一个模块'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理提交
  const handleSubmit = () => {
    if (!validateForm()) return

    // 生成默认名称
    const timestamp = new Date().toLocaleString('zh-CN')
    const finalConfig = {
      ...config,
      name: config.name || `系统备份_${timestamp}`
    }

    onConfirm(finalConfig)
    
    // 重置表单
    setConfig({
      name: '',
      description: '',
      type: 'full',
      modules: [],
      isEncrypted: true
    })
    setErrors({})
  }

  // 处理模块选择
  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    const currentModules = config.modules || []
    if (checked) {
      setConfig({
        ...config,
        modules: [...currentModules, moduleId]
      })
    } else {
      setConfig({
        ...config,
        modules: currentModules.filter(id => id !== moduleId)
      })
    }
  }

  // 获取备份类型描述
  const getBackupTypeDescription = (type: string) => {
    switch (type) {
      case 'full':
        return '备份所有系统数据，包括所有模块和配置信息'
      case 'incremental':
        return '仅备份自上次备份以来发生变化的数据'
      case 'selective':
        return '选择特定模块进行备份，适用于部分数据恢复'
      default:
        return ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5" />
            创建数据备份
          </DialogTitle>
          <DialogDescription>
            创建系统数据备份以确保数据安全。请选择备份类型和相关配置。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">备份名称 *</Label>
              <Input
                id="name"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder={`系统备份_${new Date().toLocaleString('zh-CN')}`}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">备份描述</Label>
              <Textarea
                id="description"
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                placeholder="可选：描述此次备份的目的或包含的内容"
                rows={2}
              />
            </div>
          </div>

          {/* 备份类型 */}
          <div>
            <Label>备份类型 *</Label>
            <RadioGroup
              value={config.type}
              onValueChange={(value) => setConfig({ ...config, type: value as any })}
              className="mt-2"
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="flex-1">
                    <div className="flex items-center gap-2">
                      <DatabaseIcon className="h-4 w-4" />
                      <span className="font-medium">完整备份</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getBackupTypeDescription('full')}
                    </p>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="incremental" id="incremental" />
                  <Label htmlFor="incremental" className="flex-1">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4" />
                      <span className="font-medium">增量备份</span>
                      <Badge variant="secondary">开发中</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getBackupTypeDescription('incremental')}
                    </p>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="selective" id="selective" />
                  <Label htmlFor="selective" className="flex-1">
                    <div className="flex items-center gap-2">
                      <PackageIcon className="h-4 w-4" />
                      <span className="font-medium">选择性备份</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getBackupTypeDescription('selective')}
                    </p>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* 模块选择 */}
          {config.type === 'selective' && (
            <div>
              <Label>选择备份模块 *</Label>
              {errors.modules && (
                <p className="text-sm text-red-500 mt-1">{errors.modules}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {BACKUP_MODULES.map((module) => (
                  <Card key={module.id} className="cursor-pointer hover:bg-accent/50">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={module.id}
                          checked={config.modules?.includes(module.id) || false}
                          onCheckedChange={(checked) => 
                            handleModuleToggle(module.id, checked as boolean)
                          }
                        />
                        <Label htmlFor={module.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <module.icon className="h-4 w-4" />
                            <span className="font-medium">{module.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {module.description}
                          </p>
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 安全选项 */}
          <div>
            <Label>安全选项</Label>
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="encrypted"
                  checked={config.isEncrypted}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, isEncrypted: checked as boolean })
                  }
                />
                <Label htmlFor="encrypted" className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4" />
                  <span>加密备份文件</span>
                </Label>
              </div>
              <p className="text-sm text-muted-foreground mt-1 ml-6">
                推荐启用，确保备份文件的安全性
              </p>
            </div>
          </div>

          {/* 警告提示 */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <DatabaseIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">备份注意事项</h4>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    <li>• 备份过程中请勿关闭系统或进行大量数据操作</li>
                    <li>• 完整备份可能需要较长时间，请耐心等待</li>
                    <li>• 备份文件将存储在服务器本地，请定期清理旧备份</li>
                    <li>• 加密备份需要密钥才能恢复，请妥善保管</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            <DatabaseIcon className="mr-2 h-4 w-4" />
            开始备份
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
