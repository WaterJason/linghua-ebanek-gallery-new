"use client"

import { useState, useEffect, useRef, KeyboardEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { CheckIcon, XIcon, EditIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface InlineEditProps {
  value: string | number
  onSave: (value: string | number) => Promise<boolean>
  type?: "text" | "number"
  placeholder?: string
  className?: string
  displayClassName?: string
  inputClassName?: string
  disabled?: boolean
  allowEmpty?: boolean
  validator?: (value: string | number) => string | null // 返回错误信息或null
}

export function InlineEdit({
  value,
  onSave,
  type = "text",
  placeholder,
  className,
  displayClassName,
  inputClassName,
  disabled = false,
  allowEmpty = false,
  validator
}: InlineEditProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value.toString())
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 当外部value变化时更新内部状态
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value.toString())
    }
  }, [value, isEditing])

  // 进入编辑模式
  const startEditing = () => {
    if (disabled) return
    setIsEditing(true)
    setEditValue(value.toString())
    setError(null)
  }

  // 取消编辑
  const cancelEditing = () => {
    setIsEditing(false)
    setEditValue(value.toString())
    setError(null)
  }

  // 保存编辑
  const saveEdit = async () => {
    // 验证输入
    if (!allowEmpty && editValue.trim() === "") {
      setError("值不能为空")
      return
    }

    // 自定义验证
    if (validator) {
      const validationError = validator(type === "number" ? Number(editValue) : editValue)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    // 类型转换和验证
    let finalValue: string | number = editValue
    if (type === "number") {
      const numValue = Number(editValue)
      if (isNaN(numValue)) {
        setError("请输入有效的数字")
        return
      }
      finalValue = numValue
    }

    // 如果值没有变化，直接退出编辑模式
    if (finalValue.toString() === value.toString()) {
      setIsEditing(false)
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      
      const success = await onSave(finalValue)
      
      if (success) {
        setIsEditing(false)
        toast({
          title: "保存成功",
          description: "数据已更新",
        })
      } else {
        setError("保存失败，请重试")
      }
    } catch (error) {
      console.error("保存失败:", error)
      setError("保存失败，请重试")
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // 处理键盘事件
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      saveEdit()
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelEditing()
    }
  }

  // 自动聚焦
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex-1">
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value)
              setError(null)
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              // 延迟执行，避免与按钮点击冲突
              setTimeout(() => {
                if (!isSaving) {
                  cancelEditing()
                }
              }, 150)
            }}
            type={type}
            placeholder={placeholder}
            className={cn(
              "h-8 text-sm",
              error && "border-red-500",
              inputClassName
            )}
            disabled={isSaving}
          />
          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={saveEdit}
            disabled={isSaving}
            className="h-8 w-8 p-0"
          >
            <CheckIcon className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={cancelEditing}
            disabled={isSaving}
            className="h-8 w-8 p-0"
          >
            <XIcon className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      onDoubleClick={startEditing}
      title={disabled ? "不可编辑" : "双击编辑"}
    >
      <span className={cn("flex-1 min-w-0", displayClassName)}>
        {value || placeholder || "-"}
      </span>
      {!disabled && (
        <EditIcon className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  )
}

// 专门用于数字的内联编辑组件
interface InlineNumberEditProps extends Omit<InlineEditProps, "type" | "validator"> {
  min?: number
  max?: number
  step?: number
  precision?: number // 小数位数
}

export function InlineNumberEdit({
  min,
  max,
  step,
  precision,
  ...props
}: InlineNumberEditProps) {
  const validator = (value: string | number) => {
    const numValue = Number(value)
    
    if (isNaN(numValue)) {
      return "请输入有效的数字"
    }
    
    if (min !== undefined && numValue < min) {
      return `值不能小于 ${min}`
    }
    
    if (max !== undefined && numValue > max) {
      return `值不能大于 ${max}`
    }
    
    if (precision !== undefined) {
      const decimalPlaces = (numValue.toString().split('.')[1] || '').length
      if (decimalPlaces > precision) {
        return `小数位数不能超过 ${precision} 位`
      }
    }
    
    return null
  }

  return (
    <InlineEdit
      {...props}
      type="number"
      validator={validator}
    />
  )
}

// 专门用于价格的内联编辑组件
export function InlinePriceEdit(props: Omit<InlineNumberEditProps, "min" | "precision">) {
  return (
    <InlineNumberEdit
      {...props}
      min={0}
      precision={2}
      placeholder="0.00"
    />
  )
}

// 专门用于库存的内联编辑组件
export function InlineInventoryEdit(props: Omit<InlineNumberEditProps, "min" | "precision" | "step">) {
  return (
    <InlineNumberEdit
      {...props}
      min={0}
      precision={0}
      step={1}
      placeholder="0"
    />
  )
}
