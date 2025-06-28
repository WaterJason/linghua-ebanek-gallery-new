"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  MenuIcon, XIcon, ChevronDownIcon, ChevronRightIcon,
} from "lucide-react"
import { navigationGroups, NavGroup, NavItem } from "@/config/navigation"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// 移除了重复的功能组件导入，这些功能现在在顶部导航栏中

interface EnhancedSidebarProps {
  isCollapsed?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function EnhancedSidebar({
  isCollapsed = false,
  isOpen = false,
  onOpenChange
}: EnhancedSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  // 使用外部传入的状态，移除内部状态管理
  const setIsOpen = onOpenChange || (() => {})

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

    // 检查当前路径所在的组和子项
    let activeGroupFound = false

    navigationGroups.forEach(group => {
      // 检查当前路径是否在该组中
      let isActiveGroup = false

      // 检查组内的直接项
      for (const item of group.items) {
        const isDirectMatch = pathname === item.href || pathname.startsWith(`${item.href}/`)

        // 检查子项
        let hasActiveChild = false
        if (item.children) {
          hasActiveChild = item.children.some(child =>
            pathname === child.href || pathname.startsWith(`${child.href}/`)
          )

          // 如果有活跃的子项，也设置该子项的父项为展开状态
          if (hasActiveChild) {
            initialExpandedState[item.title] = true
          }
        }

        if (isDirectMatch || hasActiveChild) {
          isActiveGroup = true
          activeGroupFound = true
          break
        }
      }

      // 如果有保存的状态，使用保存的状态；否则，如果是当前路径所在的组，则展开
      initialExpandedState[group.title] =
        savedExpandedGroups[group.title] !== undefined
          ? savedExpandedGroups[group.title]
          : isActiveGroup
    })

    // 智能展开逻辑：根据当前页面路径确定需要展开的模块
    const pathModuleMapping: Record<string, string> = {
      '/products': '供应链与生产',
      '/inventory': '供应链与生产',
      '/purchase': '供应链与生产',
      '/production': '供应链与生产',
      '/artworks': '供应链与生产',
      '/sales': '销售与渠道',
      '/customers': '销售与渠道',
      '/channels': '销售与渠道',
      '/finance': '财务与人事',
      '/employees': '财务与人事',
      '/payroll': '财务与人事',
      '/schedules': '财务与人事',
      '/coffee-shop': '运营与服务',
      '/workshops': '运营与服务',
      '/reports': '报表中心',
      '/settings': '系统管理',
      '/workflows': '系统管理',
      '/notifications': '系统管理',
    }

    // 根据当前路径智能展开对应模块
    for (const [path, module] of Object.entries(pathModuleMapping)) {
      if (pathname.startsWith(path)) {
        initialExpandedState[module] = true
        break
      }
    }

    // 如果没有找到匹配的模块，默认展开第一个组
    if (!activeGroupFound && Object.keys(initialExpandedState).length === 0 && navigationGroups.length > 0) {
      initialExpandedState[navigationGroups[0].title] = true
    }

    setExpandedGroups(initialExpandedState)
  }, [pathname])

  // 保存展开状态到本地存储
  useEffect(() => {
    try {
      localStorage.setItem("sidebarExpandedGroups", JSON.stringify(expandedGroups))
    } catch (error) {
      console.error("Error saving sidebar state:", error)
    }
  }, [expandedGroups])

  // 移除了本地存储的折叠状态管理，现在由顶部导航栏控制

  // 切换组的展开/折叠状态
  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }))
  }

  // 检查组是否有活动项
  const hasActiveItem = (group: NavGroup) => {
    return group.items.some(item => {
      // 检查当前项是否活动
      const isItemActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

      // 如果当前项有子项，检查子项是否活动
      if (item.children && item.children.length > 0) {
        return isItemActive || item.children.some(child =>
          pathname === child.href || pathname.startsWith(`${child.href}/`)
        )
      }

      return isItemActive
    })
  }

  return (
    <>
      {/* 移动设备菜单按钮 - 移动到顶部导航栏下方 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 rounded-md bg-background shadow-md"
        aria-label={isOpen ? "关闭菜单" : "打开菜单"}
      >
        {isOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
      </button>

      {/* 侧边栏 */}
      <div
        className={cn(
          "fixed left-0 z-30 bg-background shadow-lg transform transition-all duration-300 ease-in-out lg:translate-x-0 sidebar-modern",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-[70px]" : "w-64",
          "top-16 h-[calc(100vh-4rem)]" // 从顶部导航栏下方开始，高度自适应
        )}
      >
        <div className="flex flex-col h-full">
          {/* 顶部区域 - 移除了收缩按钮，现在由顶部导航栏控制 */}
          <div className="border-b h-2"></div>

          {/* 导航菜单 - 优化滚动和高度 */}
          <ScrollArea className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <nav className={cn(
              "py-4 space-y-1 min-h-full",
              isCollapsed ? "px-2" : "px-4"
            )}>
              {navigationGroups.map((group, index) => {
                const GroupIcon = group.icon
                const isExpanded = expandedGroups[group.title]
                const isActive = hasActiveItem(group)

                return (
                  <div key={group.title} className={cn(
                    "mb-4",
                    index > 0 && "mt-2"
                  )}>
                    {/* 组标题 */}
                    {isCollapsed ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={cn(
                              "flex items-center justify-center h-8 mb-2 rounded-md",
                              isActive ? "text-primary" : "text-muted-foreground"
                            )}>
                              <GroupIcon className="h-5 w-5" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {group.title}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <button
                        onClick={() => toggleGroup(group.title)}
                        className={cn(
                          "flex items-center justify-between w-full px-3 py-2 rounded-md transition-colors",
                          isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent"
                        )}
                      >
                        <div className="flex items-center">
                          <GroupIcon className={cn(
                            "mr-3 h-5 w-5",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )} />
                          <span className="font-medium">{group.title}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDownIcon className="h-4 w-4" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4" />
                        )}
                      </button>
                    )}

                    {/* 组内导航项 */}
                    {!isCollapsed && (
                      <div
                        className={cn(
                          "overflow-hidden transition-all duration-300 ease-in-out space-y-1 mt-1",
                          isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                        )}
                      >
                        {group.items.map(item => {
                          const ItemIcon = item.icon
                          const isItemActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                          const hasChildren = item.children && item.children.length > 0

                          // 如果有子项，渲染为可折叠的子菜单
                          if (hasChildren) {
                            return (
                              <div key={item.href} className="space-y-1">
                                <button
                                  onClick={() => {
                                    if (!expandedGroups[item.title]) {
                                      router.push(item.href)
                                    }
                                    toggleGroup(item.title)
                                  }}
                                  className={cn(
                                    "flex items-center justify-between w-full pl-10 pr-3 py-2 text-sm rounded-md transition-colors",
                                    isItemActive
                                      ? "bg-primary/10 text-primary font-medium"
                                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                  )}
                                >
                                  <div className="flex items-center">
                                    <ItemIcon className="mr-3 h-4 w-4" />
                                    <span>{item.title}</span>
                                  </div>
                                  {expandedGroups[item.title] ? (
                                    <ChevronDownIcon className="h-3 w-3" />
                                  ) : (
                                    <ChevronRightIcon className="h-3 w-3" />
                                  )}
                                </button>

                                {/* 子菜单项 - 支持三级菜单 */}
                                <div
                                  className={cn(
                                    "overflow-hidden transition-all duration-300 ease-in-out",
                                    expandedGroups[item.title] ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                  )}
                                >
                                  <div className="space-y-1 max-h-96 overflow-y-auto bg-muted/30 rounded-md p-2 mt-1">
                                    {item.children.map(child => {
                                      const ChildIcon = child.icon
                                      const isChildActive = pathname === child.href || pathname.startsWith(`${child.href}/`)
                                      const hasGrandChildren = child.children && child.children.length > 0

                                      if (hasGrandChildren) {
                                        // 三级菜单组
                                        return (
                                          <div key={child.href} className="space-y-1">
                                            <button
                                              onClick={() => {
                                                if (!expandedGroups[child.title]) {
                                                  router.push(child.href)
                                                }
                                                toggleGroup(child.title)
                                              }}
                                              className={cn(
                                                "flex items-center justify-between w-full pl-4 pr-3 py-1.5 text-sm rounded-md transition-colors",
                                                isChildActive
                                                  ? "bg-primary/10 text-primary font-medium"
                                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                              )}
                                            >
                                              <div className="flex items-center">
                                                <ChildIcon className="mr-2 h-3 w-3 flex-shrink-0" />
                                                <span className="truncate">{child.title}</span>
                                              </div>
                                              {expandedGroups[child.title] ? (
                                                <ChevronDownIcon className="h-3 w-3 flex-shrink-0" />
                                              ) : (
                                                <ChevronRightIcon className="h-3 w-3 flex-shrink-0" />
                                              )}
                                            </button>

                                            {/* 三级子菜单 */}
                                            <div
                                              className={cn(
                                                "overflow-hidden transition-all duration-300 ease-in-out",
                                                expandedGroups[child.title] ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
                                              )}
                                            >
                                              <div className="space-y-1 ml-4 pl-2 border-l border-border">
                                                {child.children.map(grandChild => {
                                                  const GrandChildIcon = grandChild.icon
                                                  const isGrandChildActive = pathname === grandChild.href || pathname.startsWith(`${grandChild.href}/`)

                                                  return (
                                                    <Link
                                                      key={grandChild.href}
                                                      href={grandChild.href}
                                                      className={cn(
                                                        "flex items-center pl-2 pr-3 py-1 text-xs rounded-md transition-colors",
                                                        isGrandChildActive
                                                          ? "bg-primary/10 text-primary font-medium"
                                                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                                      )}
                                                      onClick={() => setIsOpen(false)}
                                                    >
                                                      <GrandChildIcon className="mr-2 h-3 w-3 flex-shrink-0" />
                                                      <span className="truncate">{grandChild.title}</span>
                                                    </Link>
                                                  )
                                                })}
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      }

                                      // 二级菜单项（无子菜单）
                                      return (
                                        <Link
                                          key={child.href}
                                          href={child.href}
                                          className={cn(
                                            "flex items-center pl-4 pr-3 py-1.5 text-sm rounded-md transition-colors",
                                            isChildActive
                                              ? "bg-primary/10 text-primary font-medium"
                                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                          )}
                                          onClick={() => setIsOpen(false)}
                                        >
                                          <ChildIcon className="mr-2 h-3 w-3 flex-shrink-0" />
                                          <span className="truncate">{child.title}</span>
                                        </Link>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            )
                          }

                          // 没有子项，渲染为普通链接
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                "flex items-center pl-10 pr-3 py-2 text-sm rounded-md transition-colors",
                                isItemActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              )}
                              onClick={() => setIsOpen(false)}
                            >
                              <ItemIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{item.title}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}

                    {/* 折叠模式下的导航项 */}
                    {isCollapsed && (
                      <div className="space-y-1">
                        {group.items.map(item => {
                          const ItemIcon = item.icon
                          const isItemActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                          const hasChildren = item.children && item.children.length > 0

                          // 在折叠模式下，即使有子项也只显示父项
                          return (
                            <TooltipProvider key={item.href}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link
                                    href={item.href}
                                    className={cn(
                                      "flex items-center justify-center h-10 w-10 rounded-md mx-auto",
                                      isItemActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                    onClick={() => setIsOpen(false)}
                                  >
                                    <ItemIcon className="h-5 w-5" />
                                    {hasChildren && (
                                      <div className="absolute -right-1 -bottom-1 h-2 w-2 rounded-full bg-primary" />
                                    )}
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  {item.title}
                                  {hasChildren && " (包含子菜单)"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
          </ScrollArea>

          {/* 底部留空 - 所有功能已移至顶部导航栏 */}
        </div>
      </div>
    </>
  )
}
