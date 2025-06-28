"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  UserIcon,
  SettingsIcon,
  LogOutIcon,
  ShieldIcon,
  BellIcon,
  ClipboardListIcon,
  DollarSignIcon,
  CalendarIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { getCurrentUser } from "@/lib/actions/auth-actions"
import { getUnreadNotificationCount, getUncompletedTodosCount } from "@/lib/actions/system-actions"
import { Icons } from "@/components/icons"
import { NotificationTodoPopover } from "@/components/notification-todo-popover"

interface UserProfilePanelProps {
  className?: string
  variant?: "dropdown" | "collapsible" | "compact"
  showNotifications?: boolean
}

export function UserProfilePanel({
  className,
  variant = "dropdown",
  showNotifications = true
}: UserProfilePanelProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [uncompletedTodos, setUncompletedTodos] = useState(0)

  // 加载用户数据
  useEffect(() => {
    async function loadUserData() {
      try {
        const userData = await getCurrentUser()
        if (userData) {
          setUser(userData)
        }
      } catch (error) {
        console.error("加载用户数据失败:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [])

  // 加载通知和待办数量
  useEffect(() => {
    if (showNotifications) {
      async function loadCounts() {
        try {
          const notificationCount = await getUnreadNotificationCount()
          const todoCount = await getUncompletedTodosCount()
          setUnreadNotifications(notificationCount)
          setUncompletedTodos(todoCount)
        } catch (error) {
          console.error("加载通知和待办数量失败:", error)
        }
      }

      loadCounts()
      const interval = setInterval(loadCounts, 60000)
      return () => clearInterval(interval)
    }
  }, [showNotifications])

  // 处理退出登录
  const handleSignOut = async () => {
    try {
      await signOut({
        redirect: false,
        callbackUrl: "/login"
      })
      router.push('/login')
    } catch (error) {
      console.error('退出登录失败:', error)
      // 确保即使出错也能跳转到登录页
      router.push('/login')
    }
  }

  // 获取用户头像首字母
  const getUserInitial = () => {
    if (!user?.name) return "U"
    return user.name.charAt(0).toUpperCase()
  }

  // 获取用户角色显示名称
  const getUserRoleName = () => {
    if (!user) return "用户"

    if (user.role === "admin") return "管理员"
    if (user.role === "manager") return "经理"
    if (user.role === "employee") return "员工"

    return user.role || "用户"
  }

  // 获取角色相关链接
  const getRoleLinks = () => {
    const links = [
      {
        href: "/accounts/profile",
        label: "个人资料",
        icon: UserIcon,
      },
      {
        href: "/accounts/settings",
        label: "账号设置",
        icon: SettingsIcon,
      },
    ]

    // 根据用户角色添加特定链接
    if (user?.role === "admin" || user?.role === "manager") {
      links.push({
        href: "/admin/users",
        label: "用户管理",
        icon: ShieldIcon,
      })
    }

    if (user?.employeeId) {
      links.push({
        href: `/salary/employee/${user.employeeId}`,
        label: "我的薪资",
        icon: DollarSignIcon,
      })
      links.push({
        href: `/schedule/employee/${user.employeeId}`,
        label: "我的排班",
        icon: CalendarIcon,
      })
    }

    return links
  }

  // 紧凑模式
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Avatar className="h-8 w-8 cursor-pointer" onClick={() => router.push("/accounts/profile")}>
          {user?.image ? (
            <AvatarImage src={user.image} alt={user?.name || "用户头像"} />
          ) : null}
          <AvatarFallback>{getUserInitial()}</AvatarFallback>
        </Avatar>

        {showNotifications && (
          <NotificationTodoPopover />
        )}
      </div>
    )
  }

  // 下拉菜单模式
  if (variant === "dropdown") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showNotifications && (
          <NotificationTodoPopover />
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center cursor-pointer hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-colors">
              <Avatar className="h-8 w-8">
                {user?.image ? (
                  <AvatarImage src={user.image} alt={user?.name || "用户头像"} />
                ) : null}
                <AvatarFallback>{getUserInitial()}</AvatarFallback>
              </Avatar>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{user?.name || "用户"}</p>
                <p className="text-xs text-muted-foreground">{getUserRoleName()}</p>
              </div>
              <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center justify-start p-2">
              <Avatar className="h-10 w-10 mr-2">
                {user?.image ? (
                  <AvatarImage src={user.image} alt={user?.name || "用户头像"} />
                ) : null}
                <AvatarFallback>{getUserInitial()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">{user?.name || "用户"}</p>
                <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>账号</DropdownMenuLabel>
              {getRoleLinks().map((link) => (
                <DropdownMenuItem key={link.href} asChild>
                  <Link href={link.href} className="flex items-center cursor-pointer">
                    <link.icon className="mr-2 h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>通知</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/notifications" className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <BellIcon className="mr-2 h-4 w-4" />
                    <span>通知中心</span>
                  </div>
                  {unreadNotifications > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadNotifications}
                    </Badge>
                  )}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/todos" className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <ClipboardListIcon className="mr-2 h-4 w-4" />
                    <span>待办事项</span>
                  </div>
                  {uncompletedTodos > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {uncompletedTodos}
                    </Badge>
                  )}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onSelect={(event) => {
                event.preventDefault()
                handleSignOut()
              }}
            >
              <LogOutIcon className="mr-2 h-4 w-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  // 可折叠面板模式
  return (
    <div className={cn("border rounded-lg", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-t-lg transition-colors">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-3">
                {user?.image ? (
                  <AvatarImage src={user.image} alt={user?.name || "用户头像"} />
                ) : null}
                <AvatarFallback>{getUserInitial()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user?.name || "用户"}</p>
                <p className="text-sm text-muted-foreground">{getUserRoleName()}</p>
              </div>
            </div>
            {isOpen ? (
              <ChevronDownIcon className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Separator />
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">账号</h4>
              <div className="grid grid-cols-1 gap-2">
                {getRoleLinks().map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <link.icon className="mr-2 h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {showNotifications && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">通知</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <Link
                      href="/notifications"
                      className="flex items-center justify-between p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <div className="flex items-center">
                        <BellIcon className="mr-2 h-4 w-4" />
                        <span>通知中心</span>
                      </div>
                      {unreadNotifications > 0 && (
                        <Badge variant="destructive">
                          {unreadNotifications}
                        </Badge>
                      )}
                    </Link>
                    <Link
                      href="/todos"
                      className="flex items-center justify-between p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <div className="flex items-center">
                        <ClipboardListIcon className="mr-2 h-4 w-4" />
                        <span>待办事项</span>
                      </div>
                      {uncompletedTodos > 0 && (
                        <Badge variant="secondary">
                          {uncompletedTodos}
                        </Badge>
                      )}
                    </Link>
                  </div>
                </div>
              </>
            )}

            <Separator />
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOutIcon className="mr-2 h-4 w-4" />
              退出登录
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
