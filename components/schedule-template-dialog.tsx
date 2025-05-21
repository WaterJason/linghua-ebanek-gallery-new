"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { createScheduleTemplate, deleteScheduleTemplate, getScheduleTemplates } from "@/lib/actions/schedule-actions";
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  name: z.string().min(1, {
    message: "请输入模板名称",
  }),
  startTime: z.string().min(1, {
    message: "请输入开始时间",
  }),
  endTime: z.string().min(1, {
    message: "请输入结束时间",
  }),
  weekdays: z.array(z.string()).min(1, {
    message: "请至少选择一天",
  }),
  employeeIds: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
})

export function ScheduleTemplateDialog({ open, onOpenChange, templates = [], employees = [], onTemplateAdded }) {
  const [activeTab, setActiveTab] = useState("create")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      startTime: "09:00",
      endTime: "17:00",
      weekdays: ["1", "2", "3", "4", "5"], // 默认选择工作日（周一至周五）
      employeeIds: [],
      isDefault: false,
    },
  })

  // 处理模板选择
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template)
    setActiveTab("edit")

    form.reset({
      name: template.name,
      startTime: template.startTime,
      endTime: template.endTime,
      weekdays: template.weekdays.map(day => day.toString()),
      employeeIds: template.employeeIds?.map(id => id.toString()) || [],
      isDefault: template.isDefault || false,
    })
  }

  // 处理创建新模板
  const handleCreateNew = () => {
    setSelectedTemplate(null)
    setActiveTab("create")

    form.reset({
      name: "",
      startTime: "09:00",
      endTime: "17:00",
      weekdays: ["1", "2", "3", "4", "5"],
      employeeIds: [],
      isDefault: false,
    })
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const templateData = {
        ...values,
        id: selectedTemplate?.id,
      }

      const newTemplate = await createScheduleTemplate(templateData)

      onTemplateAdded(newTemplate)

      toast({
        title: selectedTemplate ? "模板已更新" : "模板已创建",
        description: `排班模板 "${values.name}" 已${selectedTemplate ? "更新" : "创建"}`,
      })

      if (!selectedTemplate) {
        form.reset({
          name: "",
          startTime: "09:00",
          endTime: "17:00",
          weekdays: ["1", "2", "3", "4", "5"],
          employeeIds: [],
          isDefault: false,
        })
      }
    } catch (error) {
      console.error("Failed to save schedule template:", error)
      toast({
        title: "保存失败",
        description: "无法保存排班模板",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理删除模板
  const handleDeleteTemplate = async (template) => {
    if (!confirm(`确定要删除模板 "${template.name}" 吗？`)) return

    try {
      await deleteScheduleTemplate(template.id)

      toast({
        title: "模板已删除",
        description: `排班模板 "${template.name}" 已删除`,
      })

      if (selectedTemplate?.id === template.id) {
        handleCreateNew()
      }

      onTemplateAdded(null) // 触发模板列表刷新
    } catch (error) {
      console.error("Failed to delete schedule template:", error)
      toast({
        title: "删除失败",
        description: "无法删除排班模板",
        variant: "destructive",
      })
    }
  }

  const weekdayOptions = [
    { value: "1", label: "周一" },
    { value: "2", label: "周二" },
    { value: "3", label: "周三" },
    { value: "4", label: "周四" },
    { value: "5", label: "周五" },
    { value: "6", label: "周六" },
    { value: "0", label: "周日" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>排班模板管理</DialogTitle>
          <DialogDescription>创建和管理排班模板，方便批量排班。</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">模板列表</TabsTrigger>
            <TabsTrigger value="create">{selectedTemplate ? "编辑模板" : "创建模板"}</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4 py-4">
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">暂无排班模板</p>
                <Button onClick={handleCreateNew}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  创建新模板
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className={cn(
                    template.isDefault && "border-blue-200 bg-blue-50/50"
                  )}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{template.name}</span>
                        {template.isDefault && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">默认</span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {template.startTime} - {template.endTime}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="text-sm">
                        <div className="mb-1">
                          <span className="font-medium">工作日: </span>
                          <span>
                            {template.weekdays.map(day =>
                              weekdayOptions.find(opt => opt.value === day.toString())?.label
                            ).join(", ")}
                          </span>
                        </div>
                        {template.employeeIds && template.employeeIds.length > 0 && (
                          <div>
                            <span className="font-medium">员工: </span>
                            <span>
                              {template.employeeIds.map(id =>
                                employees.find(e => e.id === id)?.name
                              ).filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                    </CardFooter>
                  </Card>
                ))}

                <Card className="border-dashed flex items-center justify-center h-[160px]">
                  <Button variant="ghost" onClick={handleCreateNew}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    创建新模板
                  </Button>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>模板名称</FormLabel>
                      <FormControl>
                        <Input placeholder="输入模板名称" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>开始时间</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>结束时间</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 星期选择 */}
                <FormField
                  control={form.control}
                  name="weekdays"
                  render={() => (
                    <FormItem>
                      <div className="mb-2">
                        <FormLabel>选择星期</FormLabel>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {weekdayOptions.map((option) => (
                          <FormField
                            key={option.value}
                            control={form.control}
                            name="weekdays"
                            render={({ field }) => {
                              return (
                                <FormItem key={option.value} className="flex items-center space-x-1 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(option.value)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, option.value])
                                          : field.onChange(field.value?.filter((val) => val !== option.value))
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{option.label}</FormLabel>
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

                {/* 员工选择（可选） */}
                <FormField
                  control={form.control}
                  name="employeeIds"
                  render={() => (
                    <FormItem>
                      <div className="mb-2">
                        <FormLabel>选择员工（可选）</FormLabel>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {employees.map((employee) => (
                          <FormField
                            key={employee.id}
                            control={form.control}
                            name="employeeIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={employee.id}
                                  className="flex flex-row items-center space-x-2 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(employee.id.toString())}
                                      onCheckedChange={(checked) => {
                                        const value = employee.id.toString()
                                        return checked
                                          ? field.onChange([...field.value || [], value])
                                          : field.onChange(field.value?.filter((val) => val !== value))
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {employee.name} ({employee.position})
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                {/* 设为默认模板 */}
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">设为默认模板</FormLabel>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    if (selectedTemplate) {
                      setActiveTab("templates")
                    } else {
                      onOpenChange(false)
                    }
                  }}>
                    {selectedTemplate ? "返回" : "取消"}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "保存中..." : (selectedTemplate ? "更新模板" : "创建模板")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
