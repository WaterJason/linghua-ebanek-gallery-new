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
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { 
  BuildingIcon, 
  MapPinIcon, 
  PhoneIcon, 
  MailIcon, 
  GlobeIcon,
  FileTextIcon
} from "lucide-react"

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

interface CompanySettingsProps {
  parameters: SystemParameter[]
  isLoading: boolean
  onUpdate: (key: string, value: string) => void
}

/**
 * 公司信息设置组件
 */
export function CompanySettings({ 
  parameters, 
  isLoading, 
  onUpdate 
}: CompanySettingsProps) {
  // 获取参数值
  const getParameterValue = (key: string) => {
    const param = parameters.find(p => p.key === key)
    return param ? param.value : ""
  }
  
  // 获取参数描述
  const getParameterDescription = (key: string) => {
    const param = parameters.find(p => p.key === key)
    return param ? param.description : ""
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
          <p className="text-muted-foreground">您没有权限查看公司信息设置</p>
        </div>
      }
    >
      <Form>
        <div className="space-y-6">
          {parameters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">暂无公司信息参数</p>
            </div>
          ) : (
            <PermissionGuard
              permission="settings.edit"
              fallback={
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <BuildingIcon className="h-4 w-4" />
                        <h3 className="text-lg font-medium">公司名称</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{getParameterDescription("company_name")}</p>
                      <p className="font-medium">{getParameterValue("company_name")}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileTextIcon className="h-4 w-4" />
                        <h3 className="text-lg font-medium">营业执照号</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{getParameterDescription("company_license")}</p>
                      <p className="font-medium">{getParameterValue("company_license")}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-4 w-4" />
                        <h3 className="text-lg font-medium">联系电话</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{getParameterDescription("company_phone")}</p>
                      <p className="font-medium">{getParameterValue("company_phone")}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MailIcon className="h-4 w-4" />
                        <h3 className="text-lg font-medium">电子邮箱</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{getParameterDescription("company_email")}</p>
                      <p className="font-medium">{getParameterValue("company_email")}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4" />
                      <h3 className="text-lg font-medium">公司地址</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{getParameterDescription("company_address")}</p>
                    <p className="font-medium">{getParameterValue("company_address")}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <GlobeIcon className="h-4 w-4" />
                      <h3 className="text-lg font-medium">公司网站</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{getParameterDescription("company_website")}</p>
                    <p className="font-medium">{getParameterValue("company_website")}</p>
                  </div>
                </div>
              }
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <BuildingIcon className="h-4 w-4" />
                      公司名称
                    </FormLabel>
                    <FormControl>
                      <Input
                        value={getParameterValue("company_name")}
                        onChange={(e) => onUpdate("company_name", e.target.value)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>{getParameterDescription("company_name")}</FormDescription>
                  </FormItem>
                  
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileTextIcon className="h-4 w-4" />
                      营业执照号
                    </FormLabel>
                    <FormControl>
                      <Input
                        value={getParameterValue("company_license")}
                        onChange={(e) => onUpdate("company_license", e.target.value)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>{getParameterDescription("company_license")}</FormDescription>
                  </FormItem>
                  
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4" />
                      联系电话
                    </FormLabel>
                    <FormControl>
                      <Input
                        value={getParameterValue("company_phone")}
                        onChange={(e) => onUpdate("company_phone", e.target.value)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>{getParameterDescription("company_phone")}</FormDescription>
                  </FormItem>
                  
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MailIcon className="h-4 w-4" />
                      电子邮箱
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        value={getParameterValue("company_email")}
                        onChange={(e) => onUpdate("company_email", e.target.value)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>{getParameterDescription("company_email")}</FormDescription>
                  </FormItem>
                </div>
                
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4" />
                    公司地址
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      value={getParameterValue("company_address")}
                      onChange={(e) => onUpdate("company_address", e.target.value)}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>{getParameterDescription("company_address")}</FormDescription>
                </FormItem>
                
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <GlobeIcon className="h-4 w-4" />
                    公司网站
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      value={getParameterValue("company_website")}
                      onChange={(e) => onUpdate("company_website", e.target.value)}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>{getParameterDescription("company_website")}</FormDescription>
                </FormItem>
              </div>
            </PermissionGuard>
          )}
        </div>
      </Form>
    </PermissionGuard>
  )
}
