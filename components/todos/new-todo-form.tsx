"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"
import { CalendarIcon, SaveIcon, XIcon } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface TodoFormData {
  title: string
  description: string
  type: string
  priority: string
  dueDate: Date | undefined
  link: string
}

export function NewTodoForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<TodoFormData>({
    title: "",
    description: "",
    type: "other",
    priority: "medium",
    dueDate: undefined,
    link: ""
  })

  const todoTypes = [
    { value: "order", label: "订单相关" },
    { value: "inventory", label: "库存管理" },
    { value: "schedule", label: "排班安排" },
    { value: "workshop", label: "团建活动" },
    { value: "other", label: "其他事项" }
  ]

  const priorities = [
    { value: "high", label: "高优先级", color: "text-red-600" },
    { value: "medium", label: "中优先级", color: "text-yellow-600" },
    { value: "low", label: "低优先级", color: "text-green-600" }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast({
        title: "验证错误",
        description: "请输入待办事项标题",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          type: formData.type,
          priority: formData.priority,
          dueDate: formData.dueDate?.toISOString() || null,
          link: formData.link.trim() || null,
        }),
      })

      if (!response.ok) {
        throw new Error("创建待办事项失败")
      }

      const todo = await response.json()

      toast({
        title: "创建成功",
        description: `待办事项"${todo.title}"已创建`,
      })

      router.push("/todos")
    } catch (error) {
      console.error("Error creating todo:", error)
      toast({
        title: "创建失败",
        description: "无法创建待办事项，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>新建待办事项</CardTitle>
        <CardDescription>
          创建新的待办任务，设置优先级和截止日期
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="输入待办事项标题"
              required
            />
          </div>

          {/* 类型和优先级 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">类型</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  {todoTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">优先级</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择优先级" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <span className={priority.color}>{priority.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 截止日期 */}
          <div className="space-y-2">
            <Label>截止日期</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dueDate ? (
                    format(formData.dueDate, "PPP", { locale: zhCN })
                  ) : (
                    "选择截止日期"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dueDate}
                  onSelect={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 相关链接 */}
          <div className="space-y-2">
            <Label htmlFor="link">相关链接</Label>
            <Input
              id="link"
              value={formData.link}
              onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
              placeholder="输入相关页面链接（可选）"
            />
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="输入详细描述（可选）"
              rows={4}
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              <XIcon className="w-4 h-4 mr-2" />
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              <SaveIcon className="w-4 h-4 mr-2" />
              {loading ? "创建中..." : "创建待办事项"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
