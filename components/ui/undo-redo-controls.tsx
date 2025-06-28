// 阶段4操作反馈增强 - 撤销重做控制组件
// 提供撤销重做功能的UI控制

'use client'

import React, { useState } from 'react'
import { Undo2, Redo2, History, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useUndoRedo } from '@/hooks/use-feedback'
import { UndoRedoAction } from '@/lib/types/feedback-types'
import { cn } from '@/lib/utils'

interface UndoRedoControlsProps {
  className?: string
  showHistory?: boolean
  compact?: boolean
}

export function UndoRedoControls({ 
  className, 
  showHistory = true, 
  compact = false 
}: UndoRedoControlsProps) {
  const { canUndo, canRedo, undo, redo, clear, history } = useUndoRedo()
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const handleUndo = async () => {
    const success = await undo()
    if (!success) {
      console.warn('撤销操作失败')
    }
  }

  const handleRedo = async () => {
    const success = await redo()
    if (!success) {
      console.warn('重做操作失败')
    }
  }

  const handleClear = () => {
    if (window.confirm('确定要清空所有操作历史吗？此操作不可撤销。')) {
      clear()
      setIsHistoryOpen(false)
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) { // 1分钟内
      return '刚刚'
    } else if (diff < 3600000) { // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`
    } else if (diff < 86400000) { // 24小时内
      return `${Math.floor(diff / 3600000)}小时前`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getActionIcon = (type: string) => {
    if (type.includes('create') || type.includes('新增')) return '➕'
    if (type.includes('update') || type.includes('修改')) return '✏️'
    if (type.includes('delete') || type.includes('删除')) return '🗑️'
    if (type.includes('import') || type.includes('导入')) return '📥'
    if (type.includes('export') || type.includes('导出')) return '📤'
    return '⚡'
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={!canUndo}
                className="h-8 w-8 p-0"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>撤销 (Ctrl+Z)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRedo}
                disabled={!canRedo}
                className="h-8 w-8 p-0"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>重做 (Ctrl+Y)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <TooltipProvider>
        {/* 撤销按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo}
              className="flex items-center gap-2"
            >
              <Undo2 className="h-4 w-4" />
              撤销
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>撤销上一个操作 (Ctrl+Z)</p>
          </TooltipContent>
        </Tooltip>

        {/* 重做按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo}
              className="flex items-center gap-2"
            >
              <Redo2 className="h-4 w-4" />
              重做
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>重做下一个操作 (Ctrl+Y)</p>
          </TooltipContent>
        </Tooltip>

        {/* 历史记录 */}
        {showHistory && (
          <Popover open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                历史
                {history.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {history.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">操作历史</h4>
                  {history.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                      className="h-6 px-2 text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      清空
                    </Button>
                  )}
                </div>
              </div>

              <ScrollArea className="h-64">
                {history.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    暂无操作历史
                  </div>
                ) : (
                  <div className="p-2">
                    {history.map((action, index) => (
                      <div key={action.id}>
                        <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                          <div className="text-lg leading-none mt-0.5">
                            {getActionIcon(action.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {action.description}
                              </span>
                              <Badge 
                                variant="outline" 
                                className="text-xs px-1.5 py-0"
                              >
                                {action.module || action.type}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatTimestamp(action.timestamp)}
                            </div>
                            {action.data.target && (
                              <div className="text-xs text-muted-foreground">
                                目标: {action.data.target}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {action.canUndo && (
                              <Badge variant="secondary" className="text-xs">
                                可撤销
                              </Badge>
                            )}
                          </div>
                        </div>
                        {index < history.length - 1 && (
                          <Separator className="my-1" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}
      </TooltipProvider>
    </div>
  )
}

/**
 * 键盘快捷键支持
 */
export function UndoRedoKeyboardShortcuts() {
  const { undo, redo } = useUndoRedo()

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z' && !event.shiftKey) {
          event.preventDefault()
          undo()
        } else if ((event.key === 'y') || (event.key === 'z' && event.shiftKey)) {
          event.preventDefault()
          redo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  return null
}

/**
 * 浮动撤销重做控制器
 */
export function FloatingUndoRedoControls() {
  const { canUndo, canRedo } = useUndoRedo()
  const [isVisible, setIsVisible] = useState(false)

  React.useEffect(() => {
    setIsVisible(canUndo || canRedo)
  }, [canUndo, canRedo])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-40 transition-all duration-300">
      <div className="bg-background border rounded-lg shadow-lg p-2">
        <UndoRedoControls compact showHistory={false} />
      </div>
    </div>
  )
}
