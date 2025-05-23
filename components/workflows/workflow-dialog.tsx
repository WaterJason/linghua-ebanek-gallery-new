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
import { createWorkflow, updateWorkflow } from "@/lib/actions/workflow-actions"

// 工作流类型
interface Workflow {
  id: number
  code: string
  name: string
  description?: string
  entityType: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  steps: WorkflowStep[]
}

// 工作流步骤类型
interface WorkflowStep {
  id: number
  workflowId: number
  name: string
  description?: string
  stepNumber: number
  approverType: string
  approverId?: string
  isRequired: boolean
  createdAt: Date
  updatedAt: Date
}

// 表单验证模式
const formSchema = z.object({
  code: z.string()
    .min(2, { message: "代码至少需要2个字符" })
    .max(50, { message: "代码不能超过50个字符" })
    .regex(/^[a-z0-9_]+$/, { message: "代码只能包含小写字母、数字和下划线" }),
  name: z.string()
    .min(2, { message: "名称至少需要2个字符" })
    .max(100, { message: "名称不能超过100个字符" }),
  description: z.string().max(500, { message: "描述不能超过500个字符" }).optional(),
  entityType: z.string()
    .min(1, { message: "请选择实体类型" }),
  isActive: z.boolean().default(true),
})

interface WorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflow: Workflow | null
  onSuccess: (workflow: Workflow) => void
}

export function WorkflowDialog({
  open,
  onOpenChange,
  workflow,
  onSuccess,
}: WorkflowDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!workflow

  // 实体类型选项
  const entityTypeOptions = [
    { value: "order", label: "订单" },
    { value: "purchase", label: "采购" },
    { value: "expense", label: "费用" },
    { value: "product", label: "产品" },
    { value: "customer", label: "客户" },
    { value: "supplier", label: "供应商" },
    { value: "inventory", label: "库存" },
    { value: "user", label: "用户" },
    { value: "system", label: "系统" },
  ]

  // 表单定义
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      entityType: "",
      isActive: true,
    },
  })

  // 当工作流数据变化时，重置表单
  useEffect(() => {
    if (open) {
      if (workflow) {
        form.reset({
          code: workflow.code,
          name: workflow.name,
          description: workflow.description || "",
          entityType: workflow.entityType,
          isActive: workflow.isActive,
        })
      } else {
        form.reset({
          code: "",
          name: "",
          description: "",
          entityType: "",
          isActive: true,
        })
      }
    }
  }, [open, workflow, form])

  // 提交表单
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      let result
      if (isEditing) {
        // 更新工作流
        result = await updateWorkflow({
          id: workflow.id,
          name: values.name,
          description: values.description,
          isActive: values.isActive,
        })
        toast({
          title: "更新成功",
          description: "工作流已成功更新",
        })
      } else {
        // 创建工作流
        result = await createWorkflow({
          code: values.code,
          name: values.name,
          description: values.description,
          entityType: values.entityType,
          isActive: values.isActive,
          steps: [], // 初始创建时没有步骤，后续在详情页添加
        })
        toast({
          title: "创建成功",
          description: "工作流已成功创建",
        })
      }
      
      onSuccess(result)
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving workflow:", error)
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "无法保存工作流，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "编辑工作流" : "新建工作流"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "修改工作流的基本信息"
              : "创建一个新的工作流，用于系统中的审批流程"}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>代码</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="输入工作流代码"
                      {...field}
                      disabled={isEditing} // 编辑时不允许修改代码
                    />
                  </FormControl>
                  <FormDescription>
                    工作流的唯一标识，用于系统内部引用
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名称</FormLabel>
                  <FormControl>
                    <Input placeholder="输入工作流名称" {...field} />
                  </FormControl>
                  <FormDescription>
                    工作流的显示名称
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
                      placeholder="输入工作流描述（可选）"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    工作流的用途说明
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="entityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>实体类型</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isEditing} // 编辑时不允许修改实体类型
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择实体类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {entityTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    工作流适用的实体类型
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>启用</FormLabel>
                    <FormDescription>
                      是否在系统中启用此工作流
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
