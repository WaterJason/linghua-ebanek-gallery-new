"use client"

import { useState, useEffect } from "react"
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { User, Role } from "@/types/user"

// 表单验证模式
const userFormSchema = z.object({
  name: z.string().min(2, "姓名至少需要2个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少需要6个字符").optional().or(z.literal("")),
  role: z.string(),
  employeeId: z.number().optional().nullable(),
  roleIds: z.array(z.number()),
})

interface UserFormProps {
  user: User | null
  roles: Role[]
  employees?: any[] // 员工列表，可选
  onSubmit: (data: z.infer<typeof userFormSchema>) => void
  onCancel: () => void
}

/**
 * 用户表单组件
 */
export function UserForm({ 
  user, 
  roles, 
  employees = [], 
  onSubmit, 
  onCancel 
}: UserFormProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([])
  
  // 初始化表单
  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      role: user?.role || "user",
      employeeId: user?.employeeId || null,
      roleIds: user?.roles?.map(r => r.roleId) || [],
    },
  })
  
  // 加载员工数据
  useEffect(() => {
    const loadEmployees = async () => {
      if (employees.length > 0) {
        setAvailableEmployees(employees)
        return
      }
      
      try {
        const response = await fetch("/api/employees?unassigned=true")
        if (response.ok) {
          const data = await response.json()
          setAvailableEmployees(data)
        }
      } catch (error) {
        console.error("加载员工数据失败:", error)
      }
    }
    
    loadEmployees()
  }, [employees])
  
  // 处理表单提交
  const handleSubmit = async (data: z.infer<typeof userFormSchema>) => {
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
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{user ? "编辑用户" : "创建用户"}</DialogTitle>
          <DialogDescription>
            {user 
              ? "编辑用户信息和角色分配" 
              : "创建新用户并分配角色"
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>姓名</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入姓名" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入邮箱" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{user ? "新密码" : "密码"}</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder={user ? "留空保持不变" : "请输入密码"} 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    {user ? "如果不需要修改密码，请留空" : "密码至少需要6个字符"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>关联员工</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择关联员工" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">不关联员工</SelectItem>
                      {availableEmployees.map((employee) => (
                        <SelectItem 
                          key={employee.id} 
                          value={employee.id.toString()}
                        >
                          {employee.name} ({employee.position})
                        </SelectItem>
                      ))}
                      {user?.employeeId && (
                        <SelectItem value={user.employeeId.toString()}>
                          {user.employeeName} ({user.employeePosition})
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    关联员工后，用户可以查看和管理该员工的相关信息
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="roleIds"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>用户角色</FormLabel>
                    <FormDescription>
                      选择用户拥有的角色，可以多选
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {roles.map((role) => (
                      <FormField
                        key={role.id}
                        control={form.control}
                        name="roleIds"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={role.id}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(role.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, role.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (id) => id !== role.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-medium">
                                  {role.name}
                                </FormLabel>
                                <FormDescription className="text-xs">
                                  {role.description || role.code}
                                </FormDescription>
                              </div>
                            </FormItem>
                          )
                        }}
                      />
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
