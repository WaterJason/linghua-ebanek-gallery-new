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
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SmartInput } from "@/components/ui/smart-input"
import { SmartTooltip } from "@/components/ui/tooltip"
import { TooltipProvider } from "@/components/ui/tooltip"
import { createEmployee } from "@/lib/actions/employee-actions";
import { UserPlusIcon, AlertCircleIcon, InfoIcon } from "lucide-react"

// 导入增强操作系统
import { useEnhancedOperations } from "@/lib/enhanced-operations"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "姓名至少需要2个字符",
  }),
  position: z.string().min(2, {
    message: "职位至少需要2个字符",
  }),
  phone: z.string().optional(),
  email: z
    .string()
    .email({
      message: "请输入有效的邮箱地址",
    })
    .optional()
    .or(z.literal("")),
  dailySalary: z.number().min(0, {
    message: "日薪不能为负数",
  }),
  status: z.string(),
  // 用户账号相关字段
  createUserAccount: z.boolean().default(false),
  userEmail: z.string().optional(),
  userPassword: z.string().optional(),
  userRole: z.string().default("employee"),
}).refine((data) => {
  // 如果选择创建用户账号，则邮箱为必填
  if (data.createUserAccount) {
    return data.userEmail && data.userEmail.length > 0 && data.userEmail.includes('@')
  }
  return true
}, {
  message: "创建用户账号时邮箱为必填项",
  path: ["userEmail"]
}).refine((data) => {
  // 如果选择创建用户账号，则密码为必填
  if (data.createUserAccount) {
    return data.userPassword && data.userPassword.length >= 6
  }
  return true
}, {
  message: "创建用户账号时密码至少需要6个字符",
  path: ["userPassword"]
})

export function AddEmployeeDialog({ open, onOpenChange, onEmployeeAdded }) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 增强操作系统
  const enhancedOps = useEnhancedOperations('employees')

  // 智能建议数据
  const nameSuggestions = [
    { id: '1', value: '张三', label: '张三', category: '常用姓名', frequency: 5 },
    { id: '2', value: '李四', label: '李四', category: '常用姓名', frequency: 3 },
    { id: '3', value: '王五', label: '王五', category: '常用姓名', frequency: 2 },
    { id: '4', value: '赵六', label: '赵六', category: '常用姓名', frequency: 1 },
  ]

  const positionSuggestions = [
    { id: '1', value: '珐琅工艺师', label: '珐琅工艺师', category: '技术岗位', frequency: 10 },
    { id: '2', value: '销售顾问', label: '销售顾问', category: '销售岗位', frequency: 8 },
    { id: '3', value: '店长', label: '店长', category: '管理岗位', frequency: 5 },
    { id: '4', value: '设计师', label: '设计师', category: '设计岗位', frequency: 4 },
    { id: '5', value: '客服专员', label: '客服专员', category: '服务岗位', frequency: 3 },
    { id: '6', value: '财务专员', label: '财务专员', category: '财务岗位', frequency: 2 },
  ]

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      position: "",
      phone: "",
      email: "",
      dailySalary: 0,
      status: "active",
      createUserAccount: false,
      userEmail: "",
      userPassword: "",
      userRole: "employee",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      if (values.createUserAccount) {
        // 使用统一创建API
        const result = await enhancedOps.create('员工和用户账号').form(
          async () => {
            const response = await fetch('/api/employees/unified-create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                employeeData: {
                  name: values.name,
                  position: values.position,
                  phone: values.phone,
                  email: values.email,
                  dailySalary: values.dailySalary,
                  status: values.status,
                },
                userData: {
                  name: values.name,
                  email: values.userEmail,
                  password: values.userPassword,
                  role: values.userRole,
                  phone: values.phone,
                },
                creationMode: 'unified'
              })
            })

            if (!response.ok) {
              const error = await response.json()
              throw new Error(error.error || '创建失败')
            }

            return await response.json()
          },
          null,
          values,
          { canUndo: true }
        )

        onEmployeeAdded(result.data)
      } else {
        // 仅创建员工
        const newEmployee = await enhancedOps.create('员工').form(
          async () => {
            return await createEmployee(values)
          },
          null,
          values,
          { canUndo: true }
        )

        onEmployeeAdded(newEmployee)
      }

      form.reset()
    } catch (error) {
      console.error("Failed to create employee:", error)
      // 错误已由增强操作系统处理
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加员工</DialogTitle>
            <DialogDescription>填写员工信息，点击保存完成添加。</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <SmartTooltip
                      content="输入员工姓名，系统会根据历史数据提供常用姓名建议"
                      type="help"
                      title="员工姓名"
                    >
                      <FormLabel>姓名</FormLabel>
                    </SmartTooltip>
                    <FormControl>
                      <SmartInput
                        suggestions={nameSuggestions}
                        value={field.value}
                        onChange={field.onChange}
                        onSuggestionSelect={(suggestion) => {
                          field.onChange(suggestion.value)
                        }}
                        placeholder="输入员工姓名"
                        showHistory={true}
                        showFrequent={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <SmartTooltip
                      content="选择或输入员工职位，系统会根据公司常用职位提供建议"
                      type="help"
                      title="员工职位"
                    >
                      <FormLabel>职位</FormLabel>
                    </SmartTooltip>
                    <FormControl>
                      <SmartInput
                        suggestions={positionSuggestions}
                        value={field.value}
                        onChange={field.onChange}
                        onSuggestionSelect={(suggestion) => {
                          field.onChange(suggestion.value)
                          // 根据职位自动设置建议日薪
                          if (suggestion.value === '珐琅工艺师') {
                            form.setValue('dailySalary', 300)
                          } else if (suggestion.value === '销售顾问') {
                            form.setValue('dailySalary', 200)
                          } else if (suggestion.value === '店长') {
                            form.setValue('dailySalary', 400)
                          }
                        }}
                        placeholder="输入或选择职位"
                        showHistory={true}
                        showFrequent={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <SmartTooltip
                        content="输入员工联系电话，建议使用手机号码便于联系"
                        type="info"
                        title="联系电话"
                      >
                        <FormLabel>联系电话</FormLabel>
                      </SmartTooltip>
                      <FormControl>
                        <Input {...field} placeholder="请输入手机号码" />
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
                      <SmartTooltip
                        content="输入员工邮箱地址，用于系统通知和工作沟通"
                        type="info"
                        title="邮箱地址"
                      >
                        <FormLabel>邮箱</FormLabel>
                      </SmartTooltip>
                      <FormControl>
                        <Input {...field} placeholder="请输入邮箱地址" type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dailySalary"
                  render={({ field }) => (
                    <FormItem>
                      <SmartTooltip
                        content="设置员工日薪，系统会根据职位自动建议合适的薪资范围"
                        type="help"
                        title="日薪设置"
                      >
                        <FormLabel>日薪 (元)</FormLabel>
                      </SmartTooltip>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="请输入日薪"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <SmartTooltip
                        content="设置员工状态，新员工默认为在职状态"
                        type="info"
                        title="员工状态"
                      >
                        <FormLabel>状态</FormLabel>
                      </SmartTooltip>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择状态" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">在职</SelectItem>
                          <SelectItem value="inactive">离职</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-6" />

              {/* 用户账号创建部分 */}
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UserPlusIcon className="h-4 w-4" />
                    同时创建用户账号
                  </CardTitle>
                  <CardDescription>
                    为该员工同时创建系统登录账号，便于员工直接使用系统
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="createUserAccount"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <SmartTooltip
                            content="启用后将为员工创建系统登录账号，员工可以使用该账号登录系统查看个人信息"
                            type="help"
                            title="创建用户账号"
                          >
                            <Label className="text-base">创建用户账号</Label>
                          </SmartTooltip>
                          <div className="text-sm text-muted-foreground">
                            为员工创建系统登录账号
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("createUserAccount") && (
                    <>
                      <Alert>
                        <InfoIcon className="h-4 w-4" />
                        <AlertDescription>
                          将为员工创建系统登录账号，员工可以使用该账号登录查看个人工资、排班等信息。
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="userEmail"
                          render={({ field }) => (
                            <FormItem>
                              <SmartTooltip
                                content="用户登录邮箱，建议使用员工的工作邮箱"
                                type="help"
                                title="登录邮箱"
                              >
                                <FormLabel>登录邮箱 *</FormLabel>
                              </SmartTooltip>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="输入登录邮箱"
                                  value={field.value || form.watch("email") || ""}
                                  onChange={(e) => {
                                    field.onChange(e.target.value)
                                    // 如果员工邮箱为空，同步更新
                                    if (!form.watch("email")) {
                                      form.setValue("email", e.target.value)
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="userPassword"
                          render={({ field }) => (
                            <FormItem>
                              <SmartTooltip
                                content="设置用户登录密码，至少6个字符，建议包含字母和数字"
                                type="help"
                                title="登录密码"
                              >
                                <FormLabel>登录密码 *</FormLabel>
                              </SmartTooltip>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  placeholder="输入登录密码"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="userRole"
                        render={({ field }) => (
                          <FormItem>
                            <SmartTooltip
                              content="设置用户在系统中的角色权限，员工角色可以查看个人信息，经理角色可以管理部门"
                              type="help"
                              title="用户角色"
                            >
                              <FormLabel>用户角色</FormLabel>
                            </SmartTooltip>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="选择用户角色" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="employee">员工</SelectItem>
                                <SelectItem value="manager">经理</SelectItem>
                                <SelectItem value="admin">管理员</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </CardContent>
              </Card>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  取消
                </Button>
                <SmartTooltip
                  content="保存员工信息到系统中，确保所有必填字段已正确填写"
                  type="success"
                  title="保存员工"
                >
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "保存中..." : "保存"}
                  </Button>
                </SmartTooltip>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
