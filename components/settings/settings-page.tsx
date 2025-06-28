"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  UsersIcon,
  ShieldIcon,
  SettingsIcon,
  DatabaseIcon,
  FileTextIcon,
  LineChartIcon,
  BellIcon,
  GlobeIcon,
  PaletteIcon,
  MoonIcon,
  SunIcon,
  DownloadIcon,
  UploadIcon,
  RefreshCwIcon,
  SaveIcon,
  FolderArchiveIcon
} from "lucide-react"
import Link from "next/link"

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">系统设置</h2>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <SaveIcon className="mr-2 h-4 w-4" />
            保存设置
          </Button>
          <Button variant="outline">
            <RefreshCwIcon className="mr-2 h-4 w-4" />
            重置设置
          </Button>
        </div>
      </div>

      {/* 设置导航 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Link href="/settings/users">
          <Card className="h-full hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <UsersIcon className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium text-center">用户管理</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/roles">
          <Card className="h-full hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <ShieldIcon className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium text-center">角色管理</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/permissions">
          <Card className="h-full hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <ShieldIcon className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium text-center">权限分配</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/data-io">
          <Card className="h-full hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <FolderArchiveIcon className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium text-center">数据导入导出</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/logs">
          <Card className="h-full hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <FileTextIcon className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium text-center">系统日志</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/monitoring">
          <Card className="h-full hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <LineChartIcon className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium text-center">系统监控</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">
            <SettingsIcon className="h-4 w-4 mr-2" />
            基本设置
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <PaletteIcon className="h-4 w-4 mr-2" />
            外观设置
          </TabsTrigger>
          <TabsTrigger value="backup">
            <DatabaseIcon className="h-4 w-4 mr-2" />
            备份与恢复
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <BellIcon className="h-4 w-4 mr-2" />
            通知设置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>基本设置</CardTitle>
              <CardDescription>配置系统的基本参数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">系统名称</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md"
                      defaultValue="聆花掐丝珐琅馆管理系统"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">系统版本</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md"
                      defaultValue="2.0.0"
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">管理员邮箱</label>
                    <input
                      type="email"
                      className="w-full p-2 border rounded-md"
                      defaultValue="admin@linghua.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">系统语言</label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="zh-CN">简体中文</option>
                      <option value="en-US">English</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">时区设置</label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="Asia/Shanghai">中国标准时间 (UTC+8)</option>
                      <option value="UTC">协调世界时 (UTC)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">日期格式</label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                      <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                      <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>外观设置</CardTitle>
              <CardDescription>自定义系统的外观和主题</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">主题模式</label>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="light" name="theme" defaultChecked />
                      <label htmlFor="light" className="flex items-center">
                        <SunIcon className="h-4 w-4 mr-1" />
                        浅色
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="dark" name="theme" />
                      <label htmlFor="dark" className="flex items-center">
                        <MoonIcon className="h-4 w-4 mr-1" />
                        深色
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="system" name="theme" />
                      <label htmlFor="system">跟随系统</label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">主题颜色</label>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500 cursor-pointer border-2 border-white"></div>
                    <div className="w-8 h-8 rounded-full bg-green-500 cursor-pointer"></div>
                    <div className="w-8 h-8 rounded-full bg-purple-500 cursor-pointer"></div>
                    <div className="w-8 h-8 rounded-full bg-red-500 cursor-pointer"></div>
                    <div className="w-8 h-8 rounded-full bg-amber-500 cursor-pointer"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">字体大小</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="sm">小</option>
                    <option value="md" selected>中</option>
                    <option value="lg">大</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">导航栏位置</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="left" selected>左侧</option>
                    <option value="top">顶部</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">导航栏默认状态</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="expanded" selected>展开</option>
                    <option value="collapsed">折叠</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>备份与恢复</CardTitle>
              <CardDescription>管理系统数据的备份和恢复</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">数据备份</h3>
                  <p className="text-sm text-muted-foreground">
                    备份系统数据，以便在需要时恢复。
                  </p>
                  <div className="flex gap-4 mt-2">
                    <Button>
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      完整备份
                    </Button>
                    <Button variant="outline">
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      仅备份数据
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <h3 className="text-lg font-medium">数据恢复</h3>
                  <p className="text-sm text-muted-foreground">
                    从备份文件恢复系统数据。
                  </p>
                  <div className="flex gap-4 mt-2">
                    <Button variant="outline">
                      <UploadIcon className="mr-2 h-4 w-4" />
                      从备份恢复
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <h3 className="text-lg font-medium">自动备份设置</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">启用自动备份</label>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="auto-backup" defaultChecked />
                        <label htmlFor="auto-backup">启用</label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">备份频率</label>
                      <select className="w-full p-2 border rounded-md">
                        <option value="daily">每天</option>
                        <option value="weekly" selected>每周</option>
                        <option value="monthly">每月</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">保留备份数量</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded-md"
                        defaultValue="10"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">备份存储位置</label>
                      <select className="w-full p-2 border rounded-md">
                        <option value="local" selected>本地存储</option>
                        <option value="cloud">云存储</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>通知设置</CardTitle>
              <CardDescription>配置系统通知和提醒</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">通知类型</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="notify-inventory" defaultChecked />
                        <label htmlFor="notify-inventory">库存不足提醒</label>
                      </div>
                      <select className="p-1 border rounded-md text-sm">
                        <option value="all">所有用户</option>
                        <option value="admin" selected>仅管理员</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="notify-order" defaultChecked />
                        <label htmlFor="notify-order">新订单通知</label>
                      </div>
                      <select className="p-1 border rounded-md text-sm">
                        <option value="all">所有用户</option>
                        <option value="sales" selected>销售人员</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="notify-payment" defaultChecked />
                        <label htmlFor="notify-payment">付款提醒</label>
                      </div>
                      <select className="p-1 border rounded-md text-sm">
                        <option value="all">所有用户</option>
                        <option value="finance" selected>财务人员</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="notify-system" defaultChecked />
                        <label htmlFor="notify-system">系统更新通知</label>
                      </div>
                      <select className="p-1 border rounded-md text-sm">
                        <option value="all" selected>所有用户</option>
                        <option value="admin">仅管理员</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <h3 className="text-lg font-medium">通知方式</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">系统内通知</label>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="in-app" defaultChecked />
                        <label htmlFor="in-app">启用</label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">邮件通知</label>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="email" defaultChecked />
                        <label htmlFor="email">启用</label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">短信通知</label>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="sms" />
                        <label htmlFor="sms">启用</label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">微信通知</label>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="wechat" />
                        <label htmlFor="wechat">启用</label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <h3 className="text-lg font-medium">通知频率</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">通知发送频率</label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="immediate" selected>立即发送</option>
                      <option value="hourly">每小时汇总</option>
                      <option value="daily">每日汇总</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>