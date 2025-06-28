"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/mode-toggle"
import { FavoritesQuickAccess } from "@/components/personalization/favorites-quick-access"
import { SimpleSearch } from "@/components/ui/simple-search"
import { NotificationTodoPopover } from "@/components/notification-todo-popover"
import { ScheduleQuickAccess } from "@/components/header/schedule-quick-access"
import { MessageCenter } from "@/components/header/message-center"
import { HelpCenter } from "@/components/header/help-center"
import {
  MenuIcon,
  SearchIcon,
  BellIcon,
  PlusIcon,
  UserIcon,
  SettingsIcon,
  LogOutIcon,
  HomeIcon,
  PanelLeftIcon,
  PanelLeftCloseIcon,
  ClipboardListIcon,
  CalendarIcon,
  MessageSquareIcon,
  HelpCircleIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ModernHeaderProps {
  onMenuToggle?: () => void
  onQuickActionOpen?: () => void
  onSidebarToggle?: () => void
  isSidebarCollapsed?: boolean
  className?: string
}

export function ModernHeader({
  onMenuToggle,
  onQuickActionOpen,
  onSidebarToggle,
  isSidebarCollapsed = false,
  className
}: ModernHeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()

  // 处理退出登录
  const handleSignOut = async () => {
    console.log('🔐 开始执行登出操作...')
    try {
      // 使用 redirect: false 避免NextAuth重定向问题
      console.log('📤 调用NextAuth signOut...')
      const result = await signOut({
        redirect: false,
        callbackUrl: "/login"
      })

      console.log('✅ NextAuth signOut成功:', result)

      // 手动处理重定向
      console.log('🔄 手动重定向到登录页...')
      router.push('/login')
    } catch (error) {
      console.error('❌ 退出登录失败:', error)
      // 如果signOut失败，手动跳转到登录页
      console.log('🔄 fallback重定向到登录页...')
      router.push('/login')
    }
  }

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 h-16 bg-white shadow-sm flex items-center justify-between px-6 z-40 dark:bg-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700",
      className
    )}>
      {/* 左侧区域 */}
      <div className="flex items-center">
        {/* 移动端菜单按钮 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="lg:hidden mr-4 p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <MenuIcon className="w-6 h-6" />
        </Button>

        {/* 桌面端侧边栏收缩按钮 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
          className="hidden lg:flex mr-4 p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
          title={isSidebarCollapsed ? "展开侧边栏" : "收缩侧边栏"}
        >
          {isSidebarCollapsed ? (
            <PanelLeftIcon className="w-6 h-6" />
          ) : (
            <PanelLeftCloseIcon className="w-6 h-6" />
          )}
        </Button>

        <Link href="/" className="flex items-center text-xl font-bold text-gray-800 dark:text-gray-100">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-sm font-bold">LH</span>
          </div>
          <span className="hidden md:block">聆花掐丝珐琅馆ERP</span>
        </Link>
      </div>

      {/* 中间搜索区域 */}
      <div className="flex-1 max-w-md mx-8 hidden md:block">
        <SimpleSearch
          placeholder="搜索产品、订单、客户..."
          className="w-full"
        />
      </div>

      {/* 移动端搜索按钮 */}
      <div className="flex-1 flex justify-center md:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
          title="搜索"
        >
          <SearchIcon className="w-5 h-5" />
        </Button>
      </div>

      {/* 右侧区域 */}
      <div className="flex items-center space-x-4">
        {/* 收藏快速访问 */}
        <FavoritesQuickAccess maxItems={6} />

        {/* 通知中心和待办事项 */}
        <NotificationTodoPopover />

        {/* 日程安排 */}
        <ScheduleQuickAccess />

        {/* 消息中心 */}
        <MessageCenter />

        {/* 帮助中心 */}
        <HelpCenter />

        {/* 快速操作按钮 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onQuickActionOpen}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <PlusIcon className="w-6 h-6" />
        </Button>

        {/* 主题切换 */}
        <ModeToggle />

        {/* 用户菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
              <Avatar className="w-8 h-8">
                <AvatarImage src={session?.user?.image || ""} alt="用户头像" />
                <AvatarFallback className="bg-indigo-500 text-white">
                  {session?.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-gray-800 hidden md:block dark:text-gray-100">
                {session?.user?.name || "管理员"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white rounded-lg shadow-lg py-1 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
            <DropdownMenuLabel>我的账户</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center">
                <UserIcon className="mr-2 h-4 w-4" />
                个人设置
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center">
                <SettingsIcon className="mr-2 h-4 w-4" />
                系统设置
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 dark:text-red-400 cursor-pointer"
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
    </header>
  )
}
