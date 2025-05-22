"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/user-avatar"
import { NotificationTodoPopover } from "@/components/notification-todo-popover"

interface UserAccountNavProps extends React.HTMLAttributes<HTMLDivElement> {
  user: {
    name?: string | null
    image?: string | null
    email?: string | null
  }
}

export function UserAccountNav({ user }: UserAccountNavProps) {
  return (
    <div className="flex items-center gap-2">
      {/* 通知和待办事项弹出窗口 */}
      <NotificationTodoPopover />
      
      {/* 用户账号下拉菜单 */}
      <DropdownMenu>
        <DropdownMenuTrigger>
          <UserAvatar
            user={{ name: user.name || null, image: user.image || null }}
            className="h-8 w-8"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              {user.name && <p className="font-medium">{user.name}</p>}
              {user.email && (
                <p className="w-[200px] truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/">返回主页</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">设置</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/notifications">通知中心</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/todos">待办事项</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={(event) => {
              event.preventDefault()
              signOut({
                callbackUrl: `${window.location.origin}/login`,
              })
            }}
          >
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}