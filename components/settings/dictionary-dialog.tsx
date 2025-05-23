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
import { createDictionary, updateDictionary } from "@/lib/actions/dictionary-actions"

// 数据字典类型
interface Dictionary {
  id: number
  code: string
  name: string
  description?: string
  isSystem: boolean
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
  isSystem: z.boolean().default(false),
})

interface DictionaryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dictionary: Dictionary | null
  onSuccess: (dictionary: Dictionary) => void
}

export function DictionaryDialog({
  open,
  onOpenChange,
  dictionary,
  onSuccess,
}: DictionaryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!dictionary

  // 表单定义
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      isSystem: false,
    },
  })

  // 当字典数据变化时，重置表单
  useEffect(() => {
    if (open) {
      if (dictionary) {
        form.reset({
          code: dictionary.code,
          name: dictionary.name,
          description: dictionary.description || "",
          isSystem: dictionary.isSystem,
        })
      } else {
        form.reset({
          code: "",
          name: "",
          description: "",
          isSystem: false,
        })
      }
    }
  }, [open, dictionary, form])

  // 提交表单
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      let result
      if (isEditing) {
        // 更新字典
        result = await updateDictionary({
          id: dictionary.id,
          name: values.name,
          description: values.description,
          isSystem: values.isSystem,
        })
        toast({
          title: "更新成功",
          description: "数据字典已成功更新",
        })
      } else {
        // 创建字典
        result = await createDictionary({
          code: values.code,
          name: values.name,
          description: values.description,
          isSystem: values.isSystem,
        })
        toast({
          title: "创建成功",
          description: "数据字典已成功创建",
        })
      }
      
      onSuccess(result)
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving dictionary:", error)
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "无法保存数据字典，请稍后再试",
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
          <DialogTitle>{isEditing ? "编辑数据字典" : "新建数据字典"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "修改数据字典的信息"
              : "创建一个新的数据字典，用于系统中的下拉选项等"}
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
                      placeholder="输入字典代码"
                      {...field}
                      disabled={isEditing} // 编辑时不允许修改代码
                    />
                  </FormControl>
                  <FormDescription>
                    字典的唯一标识，用于系统内部引用
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
                    <Input placeholder="输入字典名称" {...field} />
                  </FormControl>
                  <FormDescription>
                    字典的显示名称
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
                      placeholder="输入字典描述（可选）"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    字典的用途说明
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isSystem"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isEditing && dictionary?.isSystem}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>系统字典</FormLabel>
                    <FormDescription>
                      系统字典由系统自动创建和维护，不能被删除
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
