"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
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
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Role, Permission } from "@/types/user"

// 表单验证模式
const roleFormSchema = z.object({
  name: z.string().min(2, "角色名称至少需要2个字符"),
  code: z.string().min(2, "角色代码至少需要2个字符").regex(/^[a-z0-9_]+$/, "角色代码只能包含小写字母、数字和下划线"),
  description: z.string().optional(),
  permissionIds: z.array(z.number()),
})

interface RoleFormProps {
  role: Role | null
  permissions: Permission[]
  onSubmit: (data: z.infer<typeof roleFormSchema>) => void
  onCancel: () => void
}

/**
 * 角色表单组件
 */
export function RoleForm({ 
  role, 
  permissions, 
  onSubmit, 
  onCancel 
}: RoleFormProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  
  // 初始化表单
  const form = useForm<z.infer<typeof roleFormSchema>>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: role?.name || "",
      code: role?.code || "",
      description: role?.description || "",
      permissionIds: role?.permissions?.map(p => p.id) || [],
    },
  })
  
  // 处理表单提交
  const handleSubmit = async (data: z.infer<typeof roleFormSchema>) => {
    setIsLoading(true)
    
    try {
      await onSubmit(data)
      setIsOpen(false)
    } catch (error) {
      console.error("提交表单失败:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // 处理取消
  const handleCancel = () => {
    setIsOpen(false)
    onCancel()
  }
  
  // 对话框关闭时调用取消函数
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      onCancel()
    }
  }
  
  // 获取所有模块
  const getModules = () => {
    const modules = new Set<string>()
    permissions.forEach(p => modules.add(p.module))
    return Array.from(modules).sort()
  }
  
  // 获取模块权限
  const getModulePermissions = (module: string) => {
    return permissions.filter(p => p.module === module)
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{role ? "编辑角色" : "创建角色"}</DialogTitle>
          <DialogDescription>
            {role 
              ? "编辑角色信息和权限分配" 
              : "创建新角色并分配权限"
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>角色名称</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入角色名称" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>角色代码</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="请输入角色代码" 
                        {...field} 
                        disabled={!!role}
                      />
                    </FormControl>
                    <FormDescription>
                      角色代码只能包含小写字母、数字和下划线
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色描述</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="请输入角色描述" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="permissionIds"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>角色权限</FormLabel>
                    <FormDescription>
                      选择角色拥有的权限
                    </FormDescription>
                  </div>
                  
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {getModules().map((module) => (
                      <div key={module} className="space-y-2">
                        <h4 className="text-sm font-medium">{module}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {getModulePermissions(module).map((permission) => (
                            <FormField
                              key={permission.id}
                              control={form.control}
                              name="permissionIds"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={permission.id}
                                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-2"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(permission.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, permission.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (id) => id !== permission.id
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="text-sm font-medium">
                                        {permission.name}
                                      </FormLabel>
                                      <FormDescription className="text-xs">
                                        {permission.description || permission.code}
                                      </FormDescription>
                                    </div>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isLoading}
              >
                取消
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
