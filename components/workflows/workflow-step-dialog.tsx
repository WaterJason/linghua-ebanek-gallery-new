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
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createWorkflowStep, updateWorkflowStep } from "@/lib/actions/workflow-actions"
import { getUsers } from "@/lib/actions/user-actions"

// 工作流步骤类型
interface WorkflowStep {
  id: number
  workflowId: number
  name: string
  description?: string
  stepNumber: number
  approverType: string
  approverId?: string
  approverName?: string
  isRequired: boolean
  createdAt: Date
  updatedAt: Date
}

// 用户类型
interface User {
  id: string
  name: string
  email: string
  role: string
}

// 表单验证模式
const formSchema = z.object({
  name: z.string()
    .min(2, { message: "名称至少需要2个字符" })
    .max(100, { message: "名称不能超过100个字符" }),
  description: z.string().max(500, { message: "描述不能超过500个字符" }).optional(),
  approverType: z.string()
    .min(1, { message: "请选择审批人类型" }),
  approverId: z.string().optional(),
  isRequired: z.boolean().default(true),
})

interface WorkflowStepDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowId: number
  step: WorkflowStep | null
  onSuccess: (workflow: any) => void
}

export function WorkflowStepDialog({
  open,
  onOpenChange,
  workflowId,
  step,
  onSuccess,
}: WorkflowStepDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const isEditing = !!step

  // 审批人类型选项
  const approverTypeOptions = [
    { value: "user", label: "指定用户" },
    { value: "role", label: "指定角色" },
    { value: "department", label: "指定部门" },
    { value: "initiator_manager", label: "发起人上级" },
    { value: "dynamic", label: "动态指定" },
  ]

  // 表单定义
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      approverType: "user",
      approverId: "",
      isRequired: true,
    },
  })

  // 当步骤数据变化时，重置表单
  useEffect(() => {
    if (open) {
      if (step) {
        form.reset({
          name: step.name,
          description: step.description || "",
          approverType: step.approverType,
          approverId: step.approverId || "",
          isRequired: step.isRequired,
        })
      } else {
        form.reset({
          name: "",
          description: "",
          approverType: "user",
          approverId: "",
          isRequired: true,
        })
      }
    }
  }, [open, step, form])

  // 加载用户列表
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getUsers()
        setUsers(data)
      } catch (error) {
        console.error("Error loading users:", error)
        toast({
          title: "加载失败",
          description: "无法加载用户列表，请稍后再试",
          variant: "destructive",
        })
      }
    }

    if (open) {
      loadUsers()
    }
  }, [open])

  // 提交表单
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      let result
      if (isEditing) {
        // 更新工作流步骤
        result = await updateWorkflowStep({
          id: step.id,
          name: values.name,
          description: values.description,
          approverType: values.approverType,
          approverId: values.approverId,
          isRequired: values.isRequired,
        })
        toast({
          title: "更新成功",
          description: "工作流步骤已成功更新",
        })
      } else {
        // 创建工作流步骤
        result = await createWorkflowStep({
          workflowId,
          name: values.name,
          description: values.description,
          approverType: values.approverType,
          approverId: values.approverId,
          isRequired: values.isRequired,
        })
        toast({
          title: "创建成功",
          description: "工作流步骤已成功创建",
        })
      }
      
      onSuccess(result)
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving workflow step:", error)
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "无法保存工作流步骤，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 获取当前选择的审批人类型
  const currentApproverType = form.watch("approverType")
  
  // 是否需要选择审批人
  const needsApprover = ["user", "role", "department"].includes(currentApproverType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "编辑工作流步骤" : "新建工作流步骤"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "修改工作流步骤的信息"
              : "创建一个新的工作流步骤"}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名称</FormLabel>
                  <FormControl>
                    <Input placeholder="输入步骤名称" {...field} />
                  </FormControl>
                  <FormDescription>
                    工作流步骤的显示名称
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="输入步骤描述（可选）"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    工作流步骤的用途说明
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="approverType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>审批人类型</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择审批人类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {approverTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    选择审批人的指定方式
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {needsApprover && (
              <FormField
                control={form.control}
                name="approverId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>审批人</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择审批人" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currentApproverType === "user" ? (
                          users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))
                        ) : currentApproverType === "role" ? (
                          [
                            { id: "admin", name: "管理员" },
                            { id: "manager", name: "经理" },
                            { id: "user", name: "普通用户" },
                          ].map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))
                        ) : (
                          [
                            { id: "sales", name: "销售部" },
                            { id: "finance", name: "财务部" },
                            { id: "production", name: "生产部" },
                            { id: "hr", name: "人力资源部" },
                          ].map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {currentApproverType === "user"
                        ? "选择审批此步骤的用户"
                        : currentApproverType === "role"
                        ? "选择审批此步骤的角色"
                        : "选择审批此步骤的部门"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="isRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>必须步骤</FormLabel>
                    <FormDescription>
                      此步骤是否必须通过才能继续下一步
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
