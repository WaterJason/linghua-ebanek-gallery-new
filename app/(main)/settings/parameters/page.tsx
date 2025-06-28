"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import {
  SettingsIcon,
  SaveIcon,
  RefreshCwIcon,
  ClockIcon,
  DollarSignIcon,
  BellIcon,
  ShieldIcon,
  DatabaseIcon
} from "lucide-react"
import { useEnhancedOperations } from "@/lib/enhanced-operations-integration"
import { ModernPageContainer } from "@/components/modern-page-container"

interface SystemParameter {
  id: number
  key: string
  value: string
  description: string
  group: string
  type: string
  options?: string
  isSystem: boolean
  isReadonly: boolean
}

interface ParameterGroup {
  group: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  parameters: SystemParameter[]
}

export default function ParametersPage() {
  const enhancedOps = useEnhancedOperations()
  const [parameters, setParameters] = useState<SystemParameter[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  useEffect(() => {
    fetchParameters()
  }, [])

  const fetchParameters = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/settings/parameters")
      if (response.ok) {
        const data = await response.json()
        setParameters(data)
      } else {
        toast({
          title: "错误",
          description: "获取系统参数失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("获取系统参数失败:", error)
      toast({
        title: "错误",
        description: "获取系统参数失败",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleParameterChange = (key: string, value: string) => {
    setParameters(prev =>
      prev.map(param =>
        param.key === key ? { ...param, value } : param
      )
    )
  }

  const handleSave = async () => {
    try {
      await enhancedOps.executeOperation(
        async () => {
          setSaving(true)

          const parameterUpdates = parameters.reduce((acc, param) => {
            acc[param.key] = param.value
            return acc
          }, {} as Record<string, string>)

          const response = await fetch("/api/settings/parameters", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ parameters: parameterUpdates })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "保存系统参数失败")
          }

          return parameterUpdates
        },
        {
          playSound: true,
          soundType: 'success',
          feedbackMessage: "系统参数保存成功",
          enableUndo: true,
          undoTags: ['save', 'parameters'],
          undoPriority: 7
        }
      )
    } catch (error) {
      console.error("保存系统参数失败:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleRefresh = () => {
    fetchParameters()
  }

  // 按组分类参数
  const parameterGroups: ParameterGroup[] = [
    {
      group: "general",
      title: "基本设置",
      description: "系统基本配置参数",
      icon: SettingsIcon,
      parameters: parameters.filter(p => p.group === "general")
    },
    {
      group: "format",
      title: "格式设置",
      description: "日期、时间、数字和货币格式",
      icon: ClockIcon,
      parameters: parameters.filter(p => p.group === "format")
    },
    {
      group: "currency",
      title: "货币设置",
      description: "货币单位和格式配置",
      icon: DollarSignIcon,
      parameters: parameters.filter(p => p.group === "currency")
    },
    {
      group: "notification",
      title: "通知设置",
      description: "系统通知和邮件配置",
      icon: BellIcon,
      parameters: parameters.filter(p => p.group === "notification")
    },
    {
      group: "security",
      title: "安全设置",
      description: "安全和权限相关配置",
      icon: ShieldIcon,
      parameters: parameters.filter(p => p.group === "security")
    },
    {
      group: "system",
      title: "系统设置",
      description: "系统运行和维护配置",
      icon: DatabaseIcon,
      parameters: parameters.filter(p => p.group === "system")
    }
  ]

  const renderParameterInput = (param: SystemParameter) => {
    if (param.isReadonly) {
      return (
        <Input
          value={param.value}
          disabled
          className="bg-muted"
        />
      )
    }

    switch (param.type) {
      case "boolean":
        return (
          <Switch
            checked={param.value === "true"}
            onCheckedChange={(checked) =>
              handleParameterChange(param.key, checked ? "true" : "false")
            }
          />
        )

      case "number":
        return (
          <Input
            type="number"
            value={param.value}
            onChange={(e) => handleParameterChange(param.key, e.target.value)}
          />
        )

      case "select":
        if (param.options) {
          const options = param.options.split(",")
          return (
            <Select
              value={param.value}
              onValueChange={(value) => handleParameterChange(param.key, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map(option => (
                  <SelectItem key={option.trim()} value={option.trim()}>
                    {option.trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }
        return (
          <Input
            value={param.value}
            onChange={(e) => handleParameterChange(param.key, e.target.value)}
          />
        )

      default:
        return (
          <Input
            value={param.value}
            onChange={(e) => handleParameterChange(param.key, e.target.value)}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <ModernPageContainer
      title="系统参数配置"
      description="配置系统全局参数和设置"
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || saving}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            <SaveIcon className="mr-2 h-4 w-4" />
            {saving ? "保存中..." : "保存所有"}
          </Button>
        </div>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          {parameterGroups.map(group => (
            <TabsTrigger key={group.group} value={group.group} className="flex items-center gap-2">
              <group.icon className="h-4 w-4" />
              {group.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {parameterGroups.map(group => (
          <TabsContent key={group.group} value={group.group}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <group.icon className="h-5 w-5" />
                  {group.title}
                </CardTitle>
                <CardDescription>
                  {group.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {group.parameters.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    该分组暂无参数
                  </p>
                ) : (
                  <div className="space-y-6">
                    {group.parameters.map(param => (
                      <div key={param.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <div>
                          <Label htmlFor={param.key} className="font-medium">
                            {param.description || param.key}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {param.key}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          {renderParameterInput(param)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </ModernPageContainer>
  )
}
