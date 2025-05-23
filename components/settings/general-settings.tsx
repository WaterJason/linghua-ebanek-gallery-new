"use client"

import { useState } from "react"
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGuard } from "@/components/auth/permission-guard"

interface SystemParameter {
  id: number
  key: string
  value: string
  description: string
  group: string
  type: string
  options?: string
  createdAt: string
  updatedAt: string
}

interface GeneralSettingsProps {
  parameters: SystemParameter[]
  isLoading: boolean
  onUpdate: (key: string, value: string) => void
}

/**
 * 基本设置组件
 */
export function GeneralSettings({ 
  parameters, 
  isLoading, 
  onUpdate 
}: GeneralSettingsProps) {
  // 渲染参数输入控件
  const renderParameterInput = (parameter: SystemParameter) => {
    const { key, value, type, description, options } = parameter
    
    // 根据参数类型渲染不同的输入控件
    switch (type) {
      case "text":
        return (
          <FormItem key={key}>
            <FormLabel>{key}</FormLabel>
            <FormControl>
              <Input
                value={value}
                onChange={(e) => onUpdate(key, e.target.value)}
                disabled={isLoading}
              />
            </FormControl>
            <FormDescription>{description}</FormDescription>
          </FormItem>
        )
        
      case "number":
        return (
          <FormItem key={key}>
            <FormLabel>{key}</FormLabel>
            <FormControl>
              <Input
                type="number"
                value={value}
                onChange={(e) => onUpdate(key, e.target.value)}
                disabled={isLoading}
              />
            </FormControl>
            <FormDescription>{description}</FormDescription>
          </FormItem>
        )
        
      case "select":
        const selectOptions = options ? JSON.parse(options) : []
        return (
          <FormItem key={key}>
            <FormLabel>{key}</FormLabel>
            <Select
              value={value}
              onValueChange={(val) => onUpdate(key, val)}
              disabled={isLoading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="选择选项" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {selectOptions.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>{description}</FormDescription>
          </FormItem>
        )
        
      case "boolean":
        return (
          <FormItem key={key} className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">{key}</FormLabel>
              <FormDescription>{description}</FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={value === "true"}
                onCheckedChange={(checked) => onUpdate(key, checked ? "true" : "false")}
                disabled={isLoading}
              />
            </FormControl>
          </FormItem>
        )
        
      default:
        return (
          <FormItem key={key}>
            <FormLabel>{key}</FormLabel>
            <FormControl>
              <Input
                value={value}
                onChange={(e) => onUpdate(key, e.target.value)}
                disabled={isLoading}
              />
            </FormControl>
            <FormDescription>{description}</FormDescription>
          </FormItem>
        )
    }
  }
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }
  
  return (
    <PermissionGuard 
      permission="settings.view"
      fallback={
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">您没有权限查看系统设置</p>
        </div>
      }
    >
      <Form>
        <div className="space-y-6">
          {parameters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">暂无系统参数</p>
            </div>
          ) : (
            <PermissionGuard
              permission="settings.edit"
              fallback={
                <div className="space-y-6">
                  {parameters.map(parameter => (
                    <div key={parameter.key} className="space-y-2">
                      <h3 className="text-lg font-medium">{parameter.key}</h3>
                      <p className="text-sm text-muted-foreground">{parameter.description}</p>
                      <p className="font-medium">{parameter.value}</p>
                    </div>
                  ))}
                </div>
              }
            >
              <div className="space-y-6">
                {parameters.map(parameter => renderParameterInput(parameter))}
              </div>
            </PermissionGuard>
          )}
        </div>
      </Form>
    </PermissionGuard>
  )
}
