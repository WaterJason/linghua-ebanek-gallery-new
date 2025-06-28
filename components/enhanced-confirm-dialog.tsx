"use client"

import React, { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangleIcon, 
  InfoIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ShieldIcon,
  LoaderIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

// 确认对话框类型
export type ConfirmDialogType = 'info' | 'warning' | 'danger' | 'success'

// 确认对话框配置
export interface ConfirmDialogConfig {
  type?: ConfirmDialogType
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  requireConfirmation?: boolean // 需要输入确认文本
  confirmationText?: string // 需要输入的确认文本
  requireCheckbox?: boolean // 需要勾选确认
  checkboxText?: string // 确认勾选的文本
  details?: string[] // 详细信息列表
  consequences?: string[] // 后果说明
  canCancel?: boolean // 是否可以取消
  autoFocus?: 'confirm' | 'cancel' // 自动聚焦的按钮
  countdown?: number // 倒计时秒数（防止误操作）
}

interface EnhancedConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: ConfirmDialogConfig
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

export function EnhancedConfirmDialog({
  open,
  onOpenChange,
  config,
  onConfirm,
  onCancel
}: EnhancedConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [confirmationInput, setConfirmationInput] = useState('')
  const [isChecked, setIsChecked] = useState(false)
  const [countdown, setCountdown] = useState(config.countdown || 0)

  // 重置状态
  React.useEffect(() => {
    if (open) {
      setConfirmationInput('')
      setIsChecked(false)
      setCountdown(config.countdown || 0)
      
      // 倒计时
      if (config.countdown && config.countdown > 0) {
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        
        return () => clearInterval(timer)
      }
    }
  }, [open, config.countdown])

  const getIcon = () => {
    switch (config.type) {
      case 'danger':
        return <XCircleIcon className="h-6 w-6 text-red-500" />
      case 'warning':
        return <AlertTriangleIcon className="h-6 w-6 text-yellow-500" />
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />
      case 'info':
      default:
        return <InfoIcon className="h-6 w-6 text-blue-500" />
    }
  }

  const getTypeColor = () => {
    switch (config.type) {
      case 'danger': return 'border-red-200 bg-red-50'
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      case 'success': return 'border-green-200 bg-green-50'
      case 'info':
      default: return 'border-blue-200 bg-blue-50'
    }
  }

  const canConfirm = () => {
    // 倒计时未结束
    if (countdown > 0) return false
    
    // 需要输入确认文本
    if (config.requireConfirmation && config.confirmationText) {
      if (confirmationInput !== config.confirmationText) return false
    }
    
    // 需要勾选确认
    if (config.requireCheckbox && !isChecked) return false
    
    return true
  }

  const handleConfirm = async () => {
    if (!canConfirm()) return
    
    setIsLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error('Confirm action failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={cn("max-w-md", getTypeColor())}>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <AlertDialogTitle className="text-lg">
              {config.title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base mt-2">
            {config.description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* 详细信息 */}
          {config.details && config.details.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">详细信息：</Label>
              <ul className="text-sm text-muted-foreground space-y-1">
                {config.details.map((detail, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 后果说明 */}
          {config.consequences && config.consequences.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldIcon className="h-4 w-4 text-red-500" />
                <Label className="text-sm font-medium text-red-700">注意事项：</Label>
              </div>
              <ul className="text-sm text-red-600 space-y-1 bg-red-50 p-3 rounded-lg border border-red-200">
                {config.consequences.map((consequence, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">⚠</span>
                    <span>{consequence}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 确认输入 */}
          {config.requireConfirmation && config.confirmationText && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                请输入 <Badge variant="outline">{config.confirmationText}</Badge> 以确认操作：
              </Label>
              <Input
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={config.confirmationText}
                className="font-mono"
              />
            </div>
          )}

          {/* 确认勾选 */}
          {config.requireCheckbox && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirm-checkbox"
                checked={isChecked}
                onCheckedChange={setIsChecked}
              />
              <Label htmlFor="confirm-checkbox" className="text-sm">
                {config.checkboxText || "我已了解此操作的后果并确认继续"}
              </Label>
            </div>
          )}
        </div>

        <AlertDialogFooter className="gap-2">
          {config.canCancel !== false && (
            <AlertDialogCancel 
              onClick={handleCancel}
              disabled={isLoading}
            >
              {config.cancelText || "取消"}
            </AlertDialogCancel>
          )}
          
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canConfirm() || isLoading}
            className={cn(
              config.type === 'danger' && "bg-red-600 hover:bg-red-700",
              config.type === 'warning' && "bg-yellow-600 hover:bg-yellow-700"
            )}
          >
            {isLoading && <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />}
            {countdown > 0 ? (
              `${config.confirmText || "确认"} (${countdown})`
            ) : (
              config.confirmText || "确认"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Hook：使用确认对话框
export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<{
    open: boolean
    config: ConfirmDialogConfig
    onConfirm: () => void | Promise<void>
    onCancel?: () => void
  }>({
    open: false,
    config: { title: '', description: '' },
    onConfirm: () => {},
  })

  const showConfirm = (
    config: ConfirmDialogConfig,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
  ) => {
    setDialogState({
      open: true,
      config,
      onConfirm,
      onCancel,
    })
  }

  const hideConfirm = () => {
    setDialogState(prev => ({ ...prev, open: false }))
  }

  const ConfirmDialog = () => (
    <EnhancedConfirmDialog
      open={dialogState.open}
      onOpenChange={hideConfirm}
      config={dialogState.config}
      onConfirm={dialogState.onConfirm}
      onCancel={dialogState.onCancel}
    />
  )

  return {
    showConfirm,
    hideConfirm,
    ConfirmDialog,
  }
}
