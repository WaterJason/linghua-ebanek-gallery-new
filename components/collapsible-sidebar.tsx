"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  MenuIcon, XIcon, ChevronDownIcon, ChevronRightIcon,
  UserIcon, SettingsIcon, LogOutIcon, ShieldIcon,
  ShieldAlertIcon, BellIcon, MoonIcon, SunIcon
} from "lucide-react"
import { navigationGroups, NavGroup, NavItem } from "@/config/navigation"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signOut } from "next-auth/react"
import { getCurrentUser } from "@/lib/actions/auth-actions";

export default function CollapsibleSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [user, setUser] = useState<any>(null)
  const [userSettings, setUserSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 加载用户数据
  useEffect(() => {
    async function loadUserData() {
      try {
        // 使用服务器操作获取当前用户
        const userData = await getCurrentUser();

        // 如果获取到用户数据，设置用户和用户设置
        if (userData) {
          setUser(userData);
          setUserSettings(userData.userSettings || null);
        } else {
          // 如果没有获取到用户数据，可能是未登录
          console.log("未获取到用户数据，可能未登录");
          // 不自动重定向，让中间件处理重定向
        }
      } catch (error) {
        // 记录错误但不抛出
        console.error("加载用户数据失败:", error);
        // 不再根据错误消息重定向，避免客户端错误
      } finally {
        // 无论成功失败都设置加载完成
        setIsLoading(false);
      }
    }

    // 调用加载函数
    loadUserData();
  }, [router]);

  // 处理退出登录
  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/login');
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  }

  // 获取用户头像和名称的首字母
  const getUserInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return "A";
  }

  // 初始化展开状态，当前路径所在的组自动展开
  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {}

    // 从本地存储中获取之前保存的展开状态
    let savedExpandedGroups = {}
    try {
      const savedState = localStorage.getItem("sidebarExpandedGroups")
      savedExpandedGroups = savedState ? JSON.parse(savedState) : {}
    } catch (error) {
      console.error("Error parsing saved sidebar state:", error)
    }

    navigationGroups.forEach(group => {
      // 检查当前路径是否在该组中
      const isActiveGroup = group.items.some(item =>
        pathname === item.href || pathname.startsWith(`${item.href}/`)
      )

      // 如果有保存的状态，使用保存的状态；否则，如果是当前路径所在的组，则展开
      initialExpandedState[group.title] =
        savedExpandedGroups[group.title] !== undefined
          ? savedExpandedGroups[group.title]
          : isActiveGroup
    })

    setExpandedGroups(initialExpandedState)
  }, [pathname])

  // 保存展开状态到本地存储
  useEffect(() => {
    if (Object.keys(expandedGroups).length > 0) {
      try {
        localStorage.setItem("sidebarExpandedGroups", JSON.stringify(expandedGroups))
      } catch (error) {
        console.error("Error saving sidebar state:", error)
      }
    }
  }, [expandedGroups])

  // 切换组的展开/收缩状态
  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }))
  }

  // 检查导航项是否为当前活动项
  const isActiveItem = (item: NavItem) => {
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }

  // 检查组是否有活动项
  const hasActiveItem = (group: NavGroup) => {
    return group.items.some(item => isActiveItem(item))
  }

  return (
    <>
      {/* 移动设备菜单按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-gray-800 shadow-md"
      >
        {isOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
      </button>

      {/* 侧边栏 */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* 标题 */}
          <div className="flex items-center justify-center h-16 border-b dark:border-gray-700">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">聆花掐丝珐琅馆</h1>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            {navigationGroups.map((group, index) => {
              const GroupIcon = group.icon
              const isExpanded = expandedGroups[group.title]
              const isActive = hasActiveItem(group)

              return (
                <div key={group.title} className="mb-2">
                  {index > 0 && <Separator className="my-2 opacity-50" />}
                  {/* 组标题 */}
                  <button
                    onClick={() => toggleGroup(group.title)}
                    className={cn(
                      "flex items-center justify-between w-full px-4 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                    )}
                  >
                    <div className="flex items-center">
                      <GroupIcon className={cn(
                        "mr-3 h-5 w-5",
                        isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                      )} />
                      <span className="font-medium">{group.title}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>

                  {/* 组内导航项 */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    <div className="mt-1 ml-4 space-y-1 py-1">
                      {group.items.map((item) => {
                        const Icon = item.icon
                        const isActive = isActiveItem(item)

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center px-4 py-2 text-sm rounded-md transition-colors",
                              isActive
                                ? "bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/20 dark:text-blue-400"
                                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                            )}
                            onClick={() => setIsOpen(false)}
                          >
                            <Icon className={cn(
                              "mr-3 h-4 w-4",
                              isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                            )} />
                            {item.title}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </nav>

          {/* 用户信息和下拉菜单 */}
          <div className="p-4 border-t dark:border-gray-700">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-md transition-colors">
                  <Avatar className="h-8 w-8 bg-blue-500 text-white">
                    {user?.image ? (
                      <AvatarImage src={user.image} alt={user?.name || "用户头像"} />
                    ) : null}
                    <AvatarFallback>{getUserInitial()}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name || "管理员"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || "admin@linghua.com"}</p>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
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
                    <p className="font-medium">{user?.name || "管理员"}</p>
                    <p className="text-sm text-muted-foreground">{user?.email || "admin@linghua.com"}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>账号</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/accounts/profile" className="flex items-center cursor-pointer">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>个人资料</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/accounts/settings" className="flex items-center cursor-pointer">
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      <span>账号设置</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/accounts/security" className="flex items-center cursor-pointer">
                      <ShieldAlertIcon className="mr-2 h-4 w-4" />
                      <span>安全日志</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>系统</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/accounts" className="flex items-center cursor-pointer">
                      <ShieldIcon className="mr-2 h-4 w-4" />
                      <span>账号管理</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center cursor-pointer">
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      <span>系统设置</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300">
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  <span>退出登录</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  )
}
