"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
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
import { toast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { PrismaFinancialCategory } from "@/types/prisma-models"

// 表单验证模式
const categoryFormSchema = z.object({
  name: z.string().min(1, "分类名称不能为空"),
  type: z.string().min(1, "请选择分类类型"),
  code: z.string().min(1, "分类编码不能为空"),
  parentId: z.coerce.number().nullable().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

type CategoryFormValues = z.infer<typeof categoryFormSchema>

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: PrismaFinancialCategory
  categories: PrismaFinancialCategory[]
  onSuccess?: () => void
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  categories,
  onSuccess,
}: CategoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!category

  // 默认表单值
  const defaultValues: Partial<CategoryFormValues> = {
    name: category?.name || "",
    type: category?.type || "",
    code: category?.code || "",
    parentId: category?.parentId || null,
    description: category?.description || "",
    isActive: category?.isActive !== undefined ? category.isActive : true,
  }

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues,
  })

  // 监听分类类型变化，自动生成分类编码
  const watchType = form.watch("type")
  const watchName = form.watch("name")

  // 当分类类型或名称变化时，自动生成分类编码
  const generateCode = () => {
    if (!isEditing && watchType && watchName) {
      const prefix = watchType === "income" ? "income-" : "expense-"
      const suffix = watchName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
      
      // 检查编码是否已存在
      const code = `${prefix}${suffix}`
      const existingCategory = categories.find(c => c.code === code && c.id !== category?.id)
      
      if (!existingCategory) {
        form.setValue("code", code)
      }
    }
  }

  // 获取可选的父分类
  const getParentOptions = () => {
    const currentType = form.getValues("type")
    if (!currentType) return []
    
    return categories.filter(c => 
      c.type === currentType && 
      c.id !== category?.id && 
      !c.parentId // 只允许一级父子关系
    )
  }

  async function onSubmit(data: CategoryFormValues) {
    try {
      setIsLoading(true)

      if (isEditing) {
        // 更新分类
        const response = await fetch(`/api/finance/categories/${category.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "更新分类失败")
        }

        toast({
          title: "更新成功",
          description: "分类信息已成功更新",
        })
      } else {
        // 创建分类
        const response = await fetch("/api/finance/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "创建分类失败")
        }

        toast({
          title: "创建成功",
          description: "分类已成功创建",
        })
      }

      // 重置表单
      form.reset()
      
      // 关闭对话框
      onOpenChange(false)
      
      // 回调
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: isEditing ? "更新失败" : "创建失败",
        description: error instanceof Error ? error.message : "操作失败",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "编辑分类" : "新增分类"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "修改收支分类信息"
              : "添加新的收支分类，用于对财务交易记录进行分类"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>分类名称</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="请输入分类名称" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e)
                        generateCode()
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    例如：销售收入、采购付款等
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>分类类型</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      // 清空父分类
                      form.setValue("parentId", null)
                      generateCode()
                    }}
                    defaultValue={field.value}
                    disabled={isEditing} // 编辑时不允许修改分类类型
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择分类类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="income">收入</SelectItem>
                      <SelectItem value="expense">支出</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>分类编码</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="请输入分类编码" 
                      {...field} 
                      disabled={isEditing} // 编辑时不允许修改分类编码
                    />
                  </FormControl>
                  <FormDescription>
                    系统自动生成，用于唯一标识分类
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>父分类</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value === "null" ? null : parseInt(value))
                    }}
                    value={field.value?.toString() || "null"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择父分类" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">无</SelectItem>
                      {getParentOptions().map((parentCategory) => (
                        <SelectItem key={parentCategory.id} value={parentCategory.id.toString()}>
                          {parentCategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    可选，用于构建分类层级关系
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
                      placeholder="请输入分类描述"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">启用状态</FormLabel>
                    <FormDescription>
                      禁用的分类不会在交易记录中显示
                    </FormDescription>
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "处理中..." : isEditing ? "更新" : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
