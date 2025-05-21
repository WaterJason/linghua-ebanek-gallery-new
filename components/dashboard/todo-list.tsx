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

  // 加载待办事项
  useEffect(() => {
    const loadTodos = async () => {
      setIsLoading(true)
      try {
        // 从服务器获取待办事项
        const data = await getTodoList(limit, activeTab)

        // 由于目前没有待办事项表，我们创建一些模拟数据
        // 这部分代码在实际实现待办事项功能后应该删除
        const mockData: TodoItem[] = [
          {
            id: '1',
            title: '处理待发货订单',
            description: '有3个订单等待发货',
            type: 'order',
            priority: 'high',
            dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
            completed: false,
            link: '/sales'
          },
          {
            id: '2',
            title: '库存预警',
            description: '5个产品库存不足',
            type: 'inventory',
            priority: 'high',
            completed: false,
            link: '/inventory'
          },
          {
            id: '3',
            title: '确认明日排班',
            description: '需要确认明日员工排班',
            type: 'schedule',
            priority: 'medium',
            dueDate: new Date(new Date().setDate(new Date().getDate())),
            completed: false,
            link: '/schedule'
          },
          {
            id: '4',
            title: '准备手作团建材料',
            description: '明日有2场手作团建活动',
            type: 'workshop',
            priority: 'medium',
            dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
            completed: false,
            link: '/workshop'
          },
          {
            id: '5',
            title: '完成月度报表',
            description: '需要完成本月销售报表',
            type: 'other',
            priority: 'low',
            dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
            completed: false,
            link: '/reports'
          }
        ];

        // 如果服务器返回的数据为空，使用模拟数据
        // 这是临时解决方案，直到待办事项功能完全实现
        setTodos(data.length > 0 ? data : mockData)
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
  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
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
          <Button variant="ghost" size="sm" asChild>
            <Link href="/todos">
              查看全部
              <ChevronRightIcon className="ml-1 h-4 w-4" />
            </Link>
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
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/todos/new">
            <PlusIcon className="h-4 w-4 mr-2" />
            添加待办事项
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
