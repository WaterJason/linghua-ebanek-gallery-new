"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { UndoIcon, RedoIcon, HistoryIcon, ClockIcon } from "lucide-react"
import { undoRedoManager, UndoRedoAction } from "@/lib/undo-redo-system"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

interface UndoRedoControlsProps {
  className?: string
  showHistory?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function UndoRedoControls({ 
  className, 
  showHistory = true, 
  size = 'md' 
}: UndoRedoControlsProps) {
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [undoStack, setUndoStack] = useState<UndoRedoAction[]>([])
  const [redoStack, setRedoStack] = useState<UndoRedoAction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 更新状态
  const updateState = () => {
    setCanUndo(undoRedoManager.canUndo())
    setCanRedo(undoRedoManager.canRedo())
    setUndoStack(undoRedoManager.getUndoStack())
    setRedoStack(undoRedoManager.getRedoStack())
  }

  useEffect(() => {
    updateState()
    undoRedoManager.addListener(updateState)
    
    return () => {
      undoRedoManager.removeListener(updateState)
    }
  }, [])

  const handleUndo = async () => {
    setIsLoading(true)
    try {
      await undoRedoManager.undo()
    } finally {
      setIsLoading(false)
    }
  }

  const handleRedo = async () => {
    setIsLoading(true)
    try {
      await undoRedoManager.redo()
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'sm'
      case 'lg': return 'lg'
      default: return 'default'
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3'
      case 'lg': return 'h-5 w-5'
      default: return 'h-4 w-4'
    }
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <TooltipProvider>
        {/* 撤销按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={getButtonSize()}
              onClick={handleUndo}
              disabled={!canUndo || isLoading}
              className="relative"
            >
              <UndoIcon className={getIconSize()} />
              {canUndo && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs"
                >
                  {undoStack.length}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>撤销 (Ctrl+Z)</p>
            {undoStack.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {undoStack[undoStack.length - 1].description}
              </p>
            )}
          </TooltipContent>
        </Tooltip>

        {/* 重做按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={getButtonSize()}
              onClick={handleRedo}
              disabled={!canRedo || isLoading}
              className="relative"
            >
              <RedoIcon className={getIconSize()} />
              {canRedo && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs"
                >
                  {redoStack.length}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>重做 (Ctrl+Y)</p>
            {redoStack.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {redoStack[redoStack.length - 1].description}
              </p>
            )}
          </TooltipContent>
        </Tooltip>

        {/* 历史记录按钮 */}
        {showHistory && (undoStack.length > 0 || redoStack.length > 0) && (
          <Popover>
            <PopoverTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size={getButtonSize()}>
                    <HistoryIcon className={getIconSize()} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>操作历史</p>
                </TooltipContent>
              </Tooltip>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4">
                <h4 className="font-medium text-sm mb-3">操作历史</h4>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {/* 重做栈（倒序显示） */}
                    {redoStack.slice().reverse().map((action, index) => (
                      <ActionHistoryItem
                        key={`redo-${action.id}`}
                        action={action}
                        type="redo"
                        onClick={() => handleRedo()}
                      />
                    ))}
                    
                    {/* 当前状态指示器 */}
                    {(undoStack.length > 0 || redoStack.length > 0) && (
                      <div className="flex items-center gap-2 py-2">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-muted-foreground">当前状态</span>
                      </div>
                    )}
                    
                    {/* 撤销栈（倒序显示） */}
                    {undoStack.slice().reverse().map((action, index) => (
                      <ActionHistoryItem
                        key={`undo-${action.id}`}
                        action={action}
                        type="undo"
                        onClick={() => handleUndo()}
                      />
                    ))}
                  </div>
                </ScrollArea>
                
                {(undoStack.length > 0 || redoStack.length > 0) && (
                  <>
                    <Separator className="my-3" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => undoRedoManager.clear()}
                      className="w-full"
                    >
                      清空历史记录
                    </Button>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </TooltipProvider>
    </div>
  )
}

// 历史记录项组件
function ActionHistoryItem({ 
  action, 
  type, 
  onClick 
}: { 
  action: UndoRedoAction
  type: 'undo' | 'redo'
  onClick: () => void 
}) {
  const getTypeIcon = () => {
    switch (action.type) {
      case 'form': return '📝'
      case 'batch': return '📦'
      case 'status': return '🔄'
      case 'create': return '➕'
      case 'update': return '✏️'
      case 'delete': return '🗑️'
      default: return '⚡'
    }
  }

  const getModuleColor = () => {
    switch (action.module) {
      case 'products': return 'bg-blue-100 text-blue-800'
      case 'orders': return 'bg-green-100 text-green-800'
      case 'employees': return 'bg-purple-100 text-purple-800'
      case 'inventory': return 'bg-orange-100 text-orange-800'
      case 'finance': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors",
        type === 'redo' ? "opacity-60 hover:opacity-80" : "hover:bg-gray-50",
        type === 'redo' && "border-l-2 border-l-blue-200"
      )}
      onClick={onClick}
    >
      <div className="text-sm mt-0.5">{getTypeIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium truncate">
            {action.description}
          </span>
          <Badge variant="outline" className={cn("text-xs", getModuleColor())}>
            {action.module}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ClockIcon className="h-3 w-3" />
          <span>{format(action.timestamp, "HH:mm:ss", { locale: zhCN })}</span>
          {action.requiresConfirmation && (
            <Badge variant="outline" className="text-xs">
              需确认
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
