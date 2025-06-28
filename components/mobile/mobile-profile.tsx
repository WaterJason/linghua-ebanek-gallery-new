"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  UserIcon, 
  SettingsIcon, 
  BellIcon, 
  ClipboardListIcon,
  LogOutIcon,
  ChevronRightIcon,
  ShieldIcon,
  CalendarIcon,
  CreditCardIcon,
  MoonIcon,
  SunIcon,
  GlobeIcon
} from "lucide-react"
import { useTheme } from "next-themes"
import { useSession, signOut } from "next-auth/react"
import { Switch } from "@/components/ui/switch"

export function MobileProfile() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [todos, setTodos] = useState<any[]>([])

  useEffect(() => {
    setMounted(true)
    
    // 获取通知和待办事项数据
    // 这里应该调用实际的API
    setNotifications([{ id: 1 }, { id: 2 }])
    setTodos([{ id: 1 }, { id: 2 }, { id: 3 }])
  }, [])

  if (status === "loading" || !mounted) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  return (
    <div className="space-y-6">
      {/* 用户信息 */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "用户头像"} />
          <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold">{session?.user?.name || "用户"}</h2>
          <p className="text-sm text-muted-foreground">{session?.user?.email || ""}</p>
        </div>
      </div>

      {/* 快捷功能 */}
      <div className="grid grid-cols-4 gap-4">
        <Link href="/m/profile/todos" className="flex flex-col items-center">
          <div className="bg-primary/10 p-3 rounded-full mb-1">
            <ClipboardListIcon className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs">待办事项</span>
          {todos.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 mt-1">
              {todos.length}
            </span>
          )}
        </Link>
        
        <Link href="/m/notifications" className="flex flex-col items-center">
          <div className="bg-primary/10 p-3 rounded-full mb-1">
            <BellIcon className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs">通知</span>
          {notifications.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 mt-1">
              {notifications.length}
            </span>
          )}
        </Link>
        
        <Link href="/m/schedules" className="flex flex-col items-center">
          <div className="bg-primary/10 p-3 rounded-full mb-1">
            <CalendarIcon className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs">我的排班</span>
        </Link>
        
        <Link href="/m/payroll" className="flex flex-col items-center">
          <div className="bg-primary/10 p-3 rounded-full mb-1">
            <CreditCardIcon className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs">我的薪资</span>
        </Link>
      </div>

      <Separator />

      {/* 设置列表 */}
      <div className="space-y-2">
        <Link href="/m/profile/account">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 mr-3 text-muted-foreground" />
                <span>账号信息</span>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <MoonIcon className="h-5 w-5 mr-3 text-muted-foreground" />
              <span>深色模式</span>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </CardContent>
        </Card>
        
        <Link href="/m/settings">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <SettingsIcon className="h-5 w-5 mr-3 text-muted-foreground" />
                <span>系统设置</span>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        
        {session?.user?.role === "admin" && (
          <Link href="/m/settings/permissions">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <ShieldIcon className="h-5 w-5 mr-3 text-muted-foreground" />
                  <span>权限管理</span>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      <Button variant="destructive" className="w-full" onClick={handleLogout}>
        <LogOutIcon className="h-4 w-4 mr-2" />
        退出登录
      </Button>
    </div>
  )
}
