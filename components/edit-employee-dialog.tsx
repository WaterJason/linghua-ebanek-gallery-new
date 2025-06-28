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
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SmartInput } from "@/components/ui/smart-input"
import { SmartTooltip } from "@/components/ui/tooltip"
import { TooltipProvider } from "@/components/ui/tooltip"
import { updateEmployee } from "@/lib/actions/employee-actions";

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
})

export function EditEmployeeDialog({ open, onOpenChange, employee, onEmployeeUpdated }) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 增强操作系统
  const enhancedOps = useEnhancedOperations('employees')

  // 智能建议数据（与添加员工相同）
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
      name: employee.name,
      position: employee.position,
      phone: employee.phone || "",
      email: employee.email || "",
      dailySalary: employee.dailySalary,
      status: employee.status,
    },
  })

  // 当employee变化时更新表单默认值
  useEffect(() => {
    form.reset({
      name: employee.name,
      position: employee.position,
      phone: employee.phone || "",
      email: employee.email || "",
      dailySalary: employee.dailySalary,
      status: employee.status,
    })
  }, [employee, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const beforeData = {
        name: employee.name,
        position: employee.position,
        phone: employee.phone,
        email: employee.email,
        dailySalary: employee.dailySalary,
        status: employee.status,
      }

      const updatedEmployee = await enhancedOps.update('员工').form(
        async () => {
          return await updateEmployee(employee.id, values)
        },
        beforeData,
        values,
        { canUndo: true }
      )

      onEmployeeUpdated(updatedEmployee)
    } catch (error) {
      console.error("Failed to update employee:", error)
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
            <DialogTitle>编辑员工</DialogTitle>
            <DialogDescription>修改员工信息，点击保存完成更新。</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <SmartTooltip
                      content="修改员工姓名，系统会根据历史数据提供常用姓名建议"
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
                      content="修改员工职位，系统会根据公司常用职位提供建议"
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
                          // 根据职位自动调整建议日薪
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
                        content="修改员工联系电话，建议使用手机号码便于联系"
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
                        content="修改员工邮箱地址，用于系统通知和工作沟通"
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
                        content="调整员工日薪，系统会根据职位变化自动建议合适的薪资范围"
                        type="help"
                        title="日薪调整"
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
                        content="修改员工状态，注意离职状态会影响排班和薪资计算"
                        type="warning"
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

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  取消
                </Button>
                <SmartTooltip
                  content="保存员工信息修改，确保所有字段已正确填写"
                  type="success"
                  title="保存修改"
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
