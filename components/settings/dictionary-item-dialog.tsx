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
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { createDictionaryItem, updateDictionaryItem } from "@/lib/actions/dictionary-actions"

// 数据字典项类型
interface DictionaryItem {
  id: number
  dictionaryId: number
  code: string
  value: string
  label: string
  sortOrder: number
  isDefault: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// 表单验证模式
const formSchema = z.object({
  code: z.string()
    .min(1, { message: "代码不能为空" })
    .max(50, { message: "代码不能超过50个字符" })
    .regex(/^[a-z0-9_]+$/, { message: "代码只能包含小写字母、数字和下划线" }),
  value: z.string()
    .min(1, { message: "值不能为空" })
    .max(100, { message: "值不能超过100个字符" }),
  label: z.string()
    .min(1, { message: "标签不能为空" })
    .max(100, { message: "标签不能超过100个字符" }),
  sortOrder: z.coerce.number()
    .int({ message: "排序必须是整数" })
    .min(0, { message: "排序不能小于0" }),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

interface DictionaryItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dictionaryId: number
  item: DictionaryItem | null
  onSuccess: () => void
}

export function DictionaryItemDialog({
  open,
  onOpenChange,
  dictionaryId,
  item,
  onSuccess,
}: DictionaryItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!item

  // 表单定义
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      value: "",
      label: "",
      sortOrder: 0,
      isDefault: false,
      isActive: true,
    },
  })

  // 当字典项数据变化时，重置表单
  useEffect(() => {
    if (open) {
      if (item) {
        form.reset({
          code: item.code,
          value: item.value,
          label: item.label,
          sortOrder: item.sortOrder,
          isDefault: item.isDefault,
          isActive: item.isActive,
        })
      } else {
        form.reset({
          code: "",
          value: "",
          label: "",
          sortOrder: 0,
          isDefault: false,
          isActive: true,
        })
      }
    }
  }, [open, item, form])

  // 提交表单
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      if (isEditing) {
        // 更新字典项
        await updateDictionaryItem({
          id: item.id,
          value: values.value,
          label: values.label,
          sortOrder: values.sortOrder,
          isDefault: values.isDefault,
          isActive: values.isActive,
        })
        toast({
          title: "更新成功",
          description: "字典项已成功更新",
        })
      } else {
        // 创建字典项
        await createDictionaryItem({
          dictionaryId,
          code: values.code,
          value: values.value,
          label: values.label,
          sortOrder: values.sortOrder,
          isDefault: values.isDefault,
          isActive: values.isActive,
        })
        toast({
          title: "创建成功",
          description: "字典项已成功创建",
        })
      }
      
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving dictionary item:", error)
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "无法保存字典项，请稍后再试",
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
          <DialogTitle>{isEditing ? "编辑字典项" : "新建字典项"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "修改字典项的信息"
              : "创建一个新的字典项"}
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
                      placeholder="输入字典项代码"
                      {...field}
                      disabled={isEditing} // 编辑时不允许修改代码
                    />
                  </FormControl>
                  <FormDescription>
                    字典项的唯一标识，用于系统内部引用
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>值</FormLabel>
                  <FormControl>
                    <Input placeholder="输入字典项值" {...field} />
                  </FormControl>
                  <FormDescription>
                    字典项的实际值，用于数据存储
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>标签</FormLabel>
                  <FormControl>
                    <Input placeholder="输入字典项标签" {...field} />
                  </FormControl>
                  <FormDescription>
                    字典项的显示名称
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>排序</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="输入排序值"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    字典项的排序顺序，数值越小越靠前
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>默认值</FormLabel>
                      <FormDescription>
                        设为字典的默认选项
                      </FormDescription>
                    </div>
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
                        是否在系统中启用此选项
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
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
