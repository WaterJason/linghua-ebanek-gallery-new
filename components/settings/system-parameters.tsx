"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { 
  RefreshCwIcon, 
  SettingsIcon, 
  BuildingIcon, 
  MailIcon, 
  BellIcon,
  SaveIcon
} from "lucide-react"
import { GeneralSettings } from "@/components/settings/general-settings"
import { CompanySettings } from "@/components/settings/company-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"

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

/**
 * 系统参数组件
 */
export function SystemParameters() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("general")
  const [parameters, setParameters] = useState<SystemParameter[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 加载系统参数
  const loadParameters = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/settings/parameters")
      if (!response.ok) {
        throw new Error("加载系统参数失败")
      }
      const data = await response.json()
      setParameters(data)
    } catch (error) {
      console.error("加载系统参数失败:", error)
      toast({
        title: "加载失败",
        description: "无法加载系统参数，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 初始加载数据
  useEffect(() => {
    loadParameters()
  }, [])

  // 处理刷新
  const handleRefresh = () => {
    loadParameters()
  }

  // 保存系统参数
  const handleSaveParameters = async (updatedParams: Record<string, string>) => {
    setIsSaving(true)

    try {
      const response = await fetch("/api/settings/parameters", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parameters: updatedParams }),
      })

      if (!response.ok) {
        throw new Error("保存系统参数失败")
      }

      toast({
        title: "保存成功",
        description: "系统参数已成功保存",
      })

      // 重新加载参数
      loadParameters()
    } catch (error) {
      console.error("保存系统参数失败:", error)
      toast({
        title: "保存失败",
        description: "无法保存系统参数，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // 获取分组参数
  const getGroupParameters = (group: string) => {
    return parameters.filter(param => param.group === group)
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              基本设置
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center gap-2">
              <BuildingIcon className="h-4 w-4" />
              公司信息
            </TabsTrigger>
            <TabsTrigger value="notification" className="flex items-center gap-2">
              <BellIcon className="h-4 w-4" />
              通知设置
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading || isSaving}
            >
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              刷新
            </Button>
            
            <PermissionGuard permission="settings.edit">
              <Button
                size="sm"
                onClick={() => {
                  // 保存所有参数
                  const updatedParams: Record<string, string> = {}
                  parameters.forEach(param => {
                    updatedParams[param.key] = param.value
                  })
                  handleSaveParameters(updatedParams)
                }}
                disabled={isLoading || isSaving}
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                {isSaving ? "保存中..." : "保存所有"}
              </Button>
            </PermissionGuard>
          </div>
        </div>
        
        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>基本设置</CardTitle>
              <CardDescription>
                配置系统基本参数
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GeneralSettings
                parameters={getGroupParameters("general")}
                isLoading={isLoading}
                onUpdate={(key, value) => {
                  setParameters(parameters.map(param => 
                    param.key === key ? { ...param, value } : param
                  ))
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="company" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>公司信息</CardTitle>
              <CardDescription>
                配置公司相关信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompanySettings
                parameters={getGroupParameters("company")}
                isLoading={isLoading}
                onUpdate={(key, value) => {
                  setParameters(parameters.map(param => 
                    param.key === key ? { ...param, value } : param
                  ))
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notification" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>通知设置</CardTitle>
              <CardDescription>
                配置系统通知和提醒
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettings
                parameters={getGroupParameters("notification")}
                isLoading={isLoading}
                onUpdate={(key, value) => {
                  setParameters(parameters.map(param => 
                    param.key === key ? { ...param, value } : param
                  ))
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
