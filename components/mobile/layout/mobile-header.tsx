"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SyncStatus } from "@/components/mobile/layout/sync-status"

interface MobileHeaderProps {
  title: string
}

export function MobileHeader({ title }: MobileHeaderProps) {
  const router = useRouter()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0">
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center">
          {/* 返回按钮 - 仅在非首页显示 */}
          {title !== '首页' && (
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={() => router.back()}
            >
              <Icons.chevronLeft className="h-5 w-5" />
              <span className="sr-only">返回</span>
            </Button>
          )}
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* 搜索按钮 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(true)}
          >
            <Icons.search className="h-5 w-5" />
            <span className="sr-only">搜索</span>
          </Button>

          {/* 同步状态 */}
          <SyncStatus />

          {/* 通知按钮 */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Icons.bell className="h-5 w-5" />
                <span className="sr-only">通知</span>
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>通知</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-blue-100 p-2">
                        <Icons.info className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">系统更新</p>
                        <p className="text-sm text-muted-foreground">
                          系统已更新到最新版本
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          2小时前
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-b pb-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-yellow-100 p-2">
                        <Icons.alert className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">库存预警</p>
                        <p className="text-sm text-muted-foreground">
                          产品A库存不足，请及时补充
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          昨天
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* 用户头像 */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://randomuser.me/api/portraits/men/32.jpg" alt="用户头像" />
                  <AvatarFallback>管理</AvatarFallback>
                </Avatar>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>用户信息</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <div className="flex items-center gap-4 pb-4 border-b">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="https://randomuser.me/api/portraits/men/32.jpg" alt="用户头像" />
                    <AvatarFallback>管理</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-lg">张经理</p>
                    <p className="text-sm text-muted-foreground">超级管理员</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/settings/profile">
                      <Icons.user className="mr-2 h-4 w-4" />
                      个人信息
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/settings">
                      <Icons.settings className="mr-2 h-4 w-4" />
                      系统设置
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Icons.logout className="mr-2 h-4 w-4" />
                    退出登录
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* 搜索面板 */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-background p-4">
          <div className="flex items-center gap-2 border-b pb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(false)}
            >
              <Icons.chevronLeft className="h-5 w-5" />
              <span className="sr-only">关闭</span>
            </Button>
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索..."
                className="w-full border-none bg-transparent text-base focus:outline-none"
                autoFocus
              />
            </div>
            <Button variant="ghost" size="icon">
              <Icons.search className="h-5 w-5" />
              <span className="sr-only">搜索</span>
            </Button>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">最近搜索</p>
            <div className="mt-2 space-y-2">
              <Button variant="ghost" className="w-full justify-start text-sm">
                <Icons.history className="mr-2 h-4 w-4" />
                库存状态
              </Button>
              <Button variant="ghost" className="w-full justify-start text-sm">
                <Icons.history className="mr-2 h-4 w-4" />
                销售报表
              </Button>
              <Button variant="ghost" className="w-full justify-start text-sm">
                <Icons.history className="mr-2 h-4 w-4" />
                员工排班
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
