"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ClipboardListIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  XIcon,
  CalendarIcon,
  AlertCircleIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getUncompletedTodosCount, getTodoList, createTodo, updateTodoStatus } from "@/lib/actions/system-actions"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

interface TodoPopoverProps {
  className?: string
}

interface Todo {
  id: string
  title: string
  description?: string
  type: string
  priority: string
  dueDate?: Date
  completed: boolean
  link?: string
}

export function TodoPopover({ className }: TodoPopoverProps) {
  const { toast } = useToast()
  const [uncompletedTodos, setUncompletedTodos] = useState(0)
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadTodos = async () => {
    setLoading(true)
    try {
      const [todoCount, todoList] = await Promise.all([
        getUncompletedTodosCount(),
        getTodoList(10, "all")
      ])

      setUncompletedTodos(todoCount)
      setTodos(todoList)
    } catch (error) {
      console.error("Error loading todos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTodos()

    // 设置定时刷新（每分钟检查一次）
    const interval = setInterval(loadTodos, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleToggleTodo = async (todoId: string) => {
    const todo = todos.find(t => t.id === todoId)
    if (!todo) return

    try {
      await updateTodoStatus(todoId, !todo.completed)
      await loadTodos() // 重新加载数据

      toast({
        title: todo.completed ? "已取消完成" : "已完成",
        description: `待办事项"${todo.title}"状态已更新`,
      })
    } catch (error) {
      console.error("Error toggling todo:", error)
      toast({
        title: "更新失败",
        description: "无法更新待办事项状态，请稍后再试",
        variant: "destructive",
      })
    }
  }

  const handleAddTodo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      const todoData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string || "",
        type: formData.get("type") as string || "other",
        priority: formData.get("priority") as string || "medium",
        dueDate: formData.get("dueDate") as string || "",
      }

      console.log("Creating todo with data:", todoData)

      // 调用API创建待办事项
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(todoData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "创建失败")
      }

      const newTodo = await response.json()
      console.log("Todo created successfully:", newTodo)

      await loadTodos() // 重新加载数据
      setShowAddForm(false)

      // 重置表单
      e.currentTarget.reset()

      toast({
        title: "待办事项已创建",
        description: `"${todoData.title}"已添加到待办列表`,
      })
    } catch (error) {
      console.error("Error creating todo:", error)
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "无法创建待办事项，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'low':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高'
      case 'medium':
        return '中'
      case 'low':
        return '低'
      default:
        return '普通'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'order':
        return '订单'
      case 'inventory':
        return '库存'
      case 'schedule':
        return '排班'
      case 'workshop':
        return '团建'
      default:
        return '其他'
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200",
            className
          )}
          title="待办事项"
        >
          <ClipboardListIcon className="w-5 h-5" />
          {uncompletedTodos > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {uncompletedTodos > 99 ? '99+' : uncompletedTodos}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-none shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">待办事项</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-xs"
                >
                  <PlusIcon className="w-3 h-3 mr-1" />
                  新增
                </Button>
                <Link href="/todos">
                  <Button variant="ghost" size="sm" className="text-xs">
                    查看全部
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* 新增待办事项表单 */}
            {showAddForm && (
              <div className="px-4 pb-4 border-b">
                <form onSubmit={handleAddTodo} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-xs">标题 *</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="输入待办事项标题"
                      className="text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-xs">类型</Label>
                      <Select name="type" defaultValue="other">
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="order">订单</SelectItem>
                          <SelectItem value="inventory">库存</SelectItem>
                          <SelectItem value="schedule">排班</SelectItem>
                          <SelectItem value="workshop">团建</SelectItem>
                          <SelectItem value="other">其他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-xs">优先级</Label>
                      <Select name="priority" defaultValue="medium">
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">高</SelectItem>
                          <SelectItem value="medium">中</SelectItem>
                          <SelectItem value="low">低</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-xs">截止日期</Label>
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs">描述</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="输入详细描述（可选）"
                      className="text-sm"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddForm(false)}
                      className="text-xs"
                    >
                      取消
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmitting}
                      className="text-xs"
                    >
                      {isSubmitting ? "创建中..." : "创建"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* 待办事项列表 */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : todos.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardListIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">暂无待办事项</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto px-4 pb-4">
                {todos.slice(0, 8).map((todo) => (
                  <div
                    key={todo.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg transition-colors",
                      todo.completed ? "bg-gray-50 opacity-60" : "hover:bg-gray-50"
                    )}
                  >
                    <button
                      onClick={() => handleToggleTodo(todo.id)}
                      className="flex-shrink-0 mt-0.5"
                    >
                      <CheckCircleIcon
                        className={cn(
                          "w-4 h-4 transition-colors",
                          todo.completed
                            ? "text-green-600 fill-green-100"
                            : "text-gray-300 hover:text-green-600"
                        )}
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className={cn(
                            "text-sm font-medium truncate",
                            todo.completed && "line-through text-muted-foreground"
                          )}
                        >
                          {todo.title}
                        </h4>
                        <div className="flex gap-1">
                          <Badge
                            variant="outline"
                            className={cn("text-xs px-1", getPriorityColor(todo.priority))}
                          >
                            {getPriorityText(todo.priority)}
                          </Badge>
                          <Badge variant="secondary" className="text-xs px-1">
                            {getTypeText(todo.type)}
                          </Badge>
                        </div>
                      </div>

                      {todo.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                          {todo.description}
                        </p>
                      )}

                      {todo.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarIcon className="w-3 h-3" />
                          <span>
                            {format(new Date(todo.dueDate), "MM-dd", { locale: zhCN })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {todos.length > 8 && (
                  <div className="text-center py-2">
                    <Link href="/todos">
                      <Button variant="ghost" size="sm" className="text-xs">
                        查看更多 ({todos.length - 8} 项)
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
