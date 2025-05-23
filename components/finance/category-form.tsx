"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createFinancialCategory, updateFinancialCategory } from "@/lib/actions/finance-actions"

// 表单验证模式
const categoryFormSchema = z.object({
  name: z.string().min(1, "分类名称不能为空").max(100, "分类名称不能超过100个字符"),
  type: z.string().min(1, "请选择分类类型"),
  description: z.string().optional(),
})

interface CategoryFormProps {
  category?: any
  isEditing?: boolean
  onSuccess?: (category: any) => void
  onCancel?: () => void
}

export function CategoryForm({ category, isEditing = false, onSuccess, onCancel }: CategoryFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 初始化表单
  const form = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || "",
      type: category?.type || "",
      description: category?.description || "",
    },
  })

  // 提交表单
  const onSubmit = async (values: z.infer<typeof categoryFormSchema>) => {
    setIsSubmitting(true)
    try {
      let result
      
      if (isEditing && category) {
        // 更新分类
        result = await updateFinancialCategory(category.id, values)
        toast({
          title: "更新成功",
          description: `分类 ${result.name} 已更新`,
        })
      } else {
        // 创建分类
        result = await createFinancialCategory(values)
        toast({
          title: "创建成功",
          description: `分类 ${result.name} 已创建`,
        })
      }
      
      if (onSuccess) {
        onSuccess(result)
      }
    } catch (error) {
      console.error("保存分类失败:", error)
      toast({
        variant: "destructive",
        title: "保存失败",
        description: error.message || "无法保存分类信息",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>分类名称</FormLabel>
              <FormControl>
                <Input placeholder="输入分类名称" {...field} />
              </FormControl>
              <FormDescription>
                分类的显示名称，如"销售收入"、"原材料采购"等
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类类型" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="income">收入</SelectItem>
                  <SelectItem value="expense">支出</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                分类的类型，用于区分收入和支出
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
                <Textarea placeholder="输入分类描述（可选）" {...field} />
              </FormControl>
              <FormDescription>
                分类的详细描述（可选）
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : isEditing ? "更新分类" : "创建分类"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
