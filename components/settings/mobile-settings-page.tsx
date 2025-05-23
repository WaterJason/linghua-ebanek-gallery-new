"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export function MobileSettingsPage() {
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [offlineMode, setOfflineMode] = useState(true)
  
  return (
    <div className="space-y-6">
      {/* 用户信息卡片 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <Avatar className="h-16 w-16 mr-4">
              <AvatarImage src="https://randomuser.me/api/portraits/men/32.jpg" alt="张经理" />
              <AvatarFallback>张经</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">张经理</h2>
              <p className="text-muted-foreground">超级管理员</p>
            </div>
          </div>
          
          <div className="mt-4 flex">
            <Button variant="outline" className="flex-1 mr-2">
              <Icons.user className="h-4 w-4 mr-2" />
              个人信息
            </Button>
            <Button variant="outline" className="flex-1">
              <Icons.lock className="h-4 w-4 mr-2" />
              修改密码
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 应用设置 */}
      <div>
        <h3 className="text-lg font-semibold mb-3">应用设置</h3>
        
        <Card>
          <CardContent className="p-0">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center mr-3">
                  <Icons.moon className="h-4 w-4 text-blue-600" />
                </div>
                <Label htmlFor="dark-mode">深色模式</Label>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
            
            <Separator />
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-md bg-purple-100 flex items-center justify-center mr-3">
                  <Icons.bell className="h-4 w-4 text-purple-600" />
                </div>
                <Label htmlFor="notifications">通知提醒</Label>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
            
            <Separator />
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-md bg-green-100 flex items-center justify-center mr-3">
                  <Icons.wifi className="h-4 w-4 text-green-600" />
                </div>
                <Label htmlFor="offline-mode">离线模式</Label>
              </div>
              <Switch
                id="offline-mode"
                checked={offlineMode}
                onCheckedChange={setOfflineMode}
              />
            </div>
            
            <Separator />
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-md bg-yellow-100 flex items-center justify-center mr-3">
                  <Icons.languages className="h-4 w-4 text-yellow-600" />
                </div>
                <span>语言</span>
              </div>
              <div className="flex items-center">
                <span className="text-muted-foreground mr-2">简体中文</span>
                <Icons.chevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 系统管理 */}
      <div>
        <h3 className="text-lg font-semibold mb-3">系统管理</h3>
        
        <Card>
          <CardContent className="p-0">
            <Link href="/settings/users" className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-md bg-indigo-100 flex items-center justify-center mr-3">
                  <Icons.users className="h-4 w-4 text-indigo-600" />
                </div>
                <span>用户管理</span>
              </div>
              <Icons.chevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            
            <Separator />
            
            <Link href="/settings/roles" className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-md bg-red-100 flex items-center justify-center mr-3">
                  <Icons.shield className="h-4 w-4 text-red-600" />
                </div>
                <span>角色与权限</span>
              </div>
              <Icons.chevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            
            <Separator />
            
            <Link href="/settings/backup" className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-md bg-cyan-100 flex items-center justify-center mr-3">
                  <Icons.database className="h-4 w-4 text-cyan-600" />
                </div>
                <span>数据备份</span>
              </div>
              <Icons.chevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            
            <Separator />
            
            <Link href="/settings/parameters" className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-md bg-orange-100 flex items-center justify-center mr-3">
                  <Icons.settings className="h-4 w-4 text-orange-600" />
                </div>
                <span>系统参数</span>
              </div>
              <Icons.chevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>
      
      {/* 关于 */}
      <div>
        <h3 className="text-lg font-semibold mb-3">关于</h3>
        
        <Card>
          <CardContent className="p-0">
            <Link href="/settings/about" className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center mr-3">
                  <Icons.info className="h-4 w-4 text-gray-600" />
                </div>
                <span>关于我们</span>
              </div>
              <Icons.chevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            
            <Separator />
            
            <Link href="/settings/help" className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center mr-3">
                  <Icons.helpCircle className="h-4 w-4 text-gray-600" />
                </div>
                <span>帮助与反馈</span>
              </div>
              <Icons.chevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            
            <Separator />
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center mr-3">
                  <Icons.code className="h-4 w-4 text-gray-600" />
                </div>
                <span>版本信息</span>
              </div>
              <span className="text-muted-foreground">v1.0.0</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 退出登录 */}
      <Button variant="destructive" className="w-full">
        <Icons.logOut className="h-4 w-4 mr-2" />
        退出登录
      </Button>
    </div>
  )
}
