"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  ClipboardListIcon, AlertCircleIcon, ClockIcon, CheckCircleIcon,
  ChevronRightIcon, PlusIcon, PackageIcon, ShoppingCartIcon, CalendarIcon
} from "lucide-react"
import Link from "next/link"
import { getTodoList } from "@/lib/actions/system-actions"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// 待办事项类型
interface TodoItem {
  id: string
  title: string
  description?: string
  type: 'order' | 'inventory' | 'schedule' | 'workshop' | 'other'
  priority: 'high' | 'medium' | 'low'
  dueDate?: Date
  completed: boolean
  link?: string
}



interface TodoListProps {
  className?: string
  limit?: number
  showCompleted?: boolean
}

export function TodoList({
  className,
  limit = 5,
  showCompleted = true
}: TodoListProps) {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [activeTab, setActiveTab] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 加载待办事项
  useEffect(() => {
    const loadTodos = async () => {
      setIsLoading(true)
      try {
        // 从服务器获取待办事项
        const data = await getTodoList(limit, activeTab)

        // 直接使用从数据库获取的真实数据
        setTodos(data)
      } catch (error) {
        console.error("Error loading todos:", error)
        toast({
          title: "加载失败",
          description: "无法加载待办事项，请稍后再试",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadTodos()
  }, [limit, activeTab])

  // 切换待办事项完成状态
  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    try {
      // 调用API更新状态
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !todo.completed
        }),
      })

      if (!response.ok) {
        throw new Error('更新失败')
      }

      // 更新本地状态
      setTodos(todos.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ))

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

  // 添加新待办事项
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement)
      const title = formData.get('title') as string
      const description = formData.get('description') as string
      const type = formData.get('type') as string
      const priority = formData.get('priority') as string
      const dueDate = formData.get('dueDate') as string

      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          type,
          priority,
          dueDate: dueDate ? new Date(dueDate) : undefined
        }),
      })

      if (!response.ok) {
        throw new Error('添加失败')
      }

      const newTodo = await response.json()
      setTodos([newTodo, ...todos])
      setShowAddDialog(false)

      toast({
        title: "添加成功",
        description: `待办事项"${title}"已添加`,
      })

      // 重新加载待办事项
      const data = await getTodoList(limit, activeTab)
      setTodos(data)
    } catch (error) {
      console.error("Error adding todo:", error)
      toast({
        title: "添加失败",
        description: "无法添加待办事项，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 根据标签筛选待办事项
  const filteredTodos = todos.filter(todo => {
    if (activeTab === "all") return !todo.completed
    if (activeTab === "completed") return todo.completed
    if (activeTab === "high") return todo.priority === "high" && !todo.completed
    return todo.type === activeTab && !todo.completed
  }).slice(0, limit)

  // 获取待办事项类型图标
  const getTodoIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCartIcon className="h-4 w-4" />
      case 'inventory':
        return <PackageIcon className="h-4 w-4" />
      case 'schedule':
        return <CalendarIcon className="h-4 w-4" />
      case 'workshop':
        return <ClipboardListIcon className="h-4 w-4" />
      default:
        return <ClipboardListIcon className="h-4 w-4" />
    }
  }

  // 获取优先级标签
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="ml-2">紧急</Badge>
      case 'medium':
        return <Badge variant="secondary" className="ml-2">中等</Badge>
      case 'low':
        return <Badge variant="outline" className="ml-2">普通</Badge>
      default:
        return null
    }
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-medium">待办事项</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // 在弹窗内展开显示更多待办事项
              const data = getTodoList(20, activeTab)
              data.then(setTodos)
            }}
          >
            查看更多
            <ChevronRightIcon className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <CardDescription>需要处理的任务</CardDescription>
      </CardHeader>
      <CardContent className="pb-1">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="high">紧急</TabsTrigger>
            <TabsTrigger value="order">订单</TabsTrigger>
            {showCompleted && <TabsTrigger value="completed">已完成</TabsTrigger>}
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircleIcon className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
                <p className="text-muted-foreground">暂无待办事项</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={cn(
                      "flex items-start p-3 rounded-lg border",
                      todo.completed
                        ? "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50"
                        : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                    )}
                  >
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => toggleTodo(todo.id)}
                      className="mt-1"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center">
                        <span className={cn(
                          "font-medium",
                          todo.completed && "line-through text-muted-foreground"
                        )}>
                          {todo.title}
                        </span>
                        {!todo.completed && getPriorityBadge(todo.priority)}
                      </div>
                      {todo.description && (
                        <p className={cn(
                          "text-sm text-muted-foreground mt-1",
                          todo.completed && "line-through"
                        )}>
                          {todo.description}
                        </p>
                      )}
                      {todo.dueDate && (
                        <div className="flex items-center mt-2 text-xs text-muted-foreground">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          <span>
                            {format(todo.dueDate, "MM月dd日", { locale: zhCN })}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={cn(
                      "p-1 rounded-full",
                      todo.type === 'order' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                      todo.type === 'inventory' && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                      todo.type === 'schedule' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                      todo.type === 'workshop' && "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
                      todo.type === 'other' && "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                    )}>
                      {getTodoIcon(todo.type)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="pt-1">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <PlusIcon className="h-4 w-4 mr-2" />
              添加待办事项
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>添加待办事项</DialogTitle>
              <DialogDescription>
                创建新的待办事项来跟踪重要任务
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTodo} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">标题</Label>
                <Input name="title" placeholder="待办事项标题" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea name="description" placeholder="详细描述（可选）" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">类型</Label>
                  <Select name="type">
                    <SelectTrigger>
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order">订单</SelectItem>
                      <SelectItem value="inventory">库存</SelectItem>
                      <SelectItem value="schedule">日程</SelectItem>
                      <SelectItem value="workshop">团建</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">优先级</Label>
                  <Select name="priority">
                    <SelectTrigger>
                      <SelectValue placeholder="选择优先级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">紧急</SelectItem>
                      <SelectItem value="medium">中等</SelectItem>
                      <SelectItem value="low">普通</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">截止日期</Label>
                <Input name="dueDate" type="date" />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                >
                  取消
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "添加中..." : "添加"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
