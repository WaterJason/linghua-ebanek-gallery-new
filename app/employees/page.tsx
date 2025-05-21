"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusIcon, UsersIcon, BarChart3Icon, FileTextIcon, DownloadIcon, UploadIcon } from "lucide-react"
import { EmployeeList } from "@/components/employee-list"
import { AddEmployeeDialog } from "@/components/add-employee-dialog"
import Link from "next/link"

// 客户端组件不能导出metadata
// 如果需要设置页面标题，可以使用Head组件或在layout.tsx中设置

export default function EmployeesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("list")

  const handleAddEmployee = () => {
    setIsAddDialogOpen(true)
  }

  const handleEmployeeAdded = (newEmployee) => {
    setIsAddDialogOpen(false)
    // 刷新列表会自动通过EmployeeList组件完成
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">员工管理</h1>
        <div className="flex gap-2">
          <Button onClick={handleAddEmployee}>
            <PlusIcon className="mr-2 h-4 w-4" />
            添加员工
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">
            <UsersIcon className="h-4 w-4 mr-2" />
            员工列表
          </TabsTrigger>
          <TabsTrigger value="performance">
            <BarChart3Icon className="h-4 w-4 mr-2" />
            绩效统计
          </TabsTrigger>
          <TabsTrigger value="salary">
            <FileTextIcon className="h-4 w-4 mr-2" />
            薪资管理
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>员工列表</CardTitle>
                  <CardDescription>管理所有员工信息</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    导出
                  </Button>
                  <Button variant="outline" size="sm">
                    <UploadIcon className="h-4 w-4 mr-2" />
                    导入
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <EmployeeList onAddEmployee={handleAddEmployee} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>员工绩效统计</CardTitle>
              <CardDescription>查看员工工作表现和绩效数据</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                员工绩效统计功能正在开发中...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>员工薪资管理</CardTitle>
                  <CardDescription>计算和管理员工薪资</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/salary">
                      <FileTextIcon className="h-4 w-4 mr-2" />
                      薪资管理
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex flex-col p-4 border rounded-md">
                  <span className="text-sm text-muted-foreground">薪资计算</span>
                  <span className="text-base">根据员工工作记录自动计算薪资</span>
                  <Button variant="link" className="p-0 h-auto mt-2 justify-start" asChild>
                    <Link href="/salary">查看薪资记录</Link>
                  </Button>
                </div>
                <div className="flex flex-col p-4 border rounded-md">
                  <span className="text-sm text-muted-foreground">薪资单生成</span>
                  <span className="text-base">生成员工薪资单并导出</span>
                  <Button variant="link" className="p-0 h-auto mt-2 justify-start" asChild>
                    <Link href="/salary">生成薪资单</Link>
                  </Button>
                </div>
                <div className="flex flex-col p-4 border rounded-md">
                  <span className="text-sm text-muted-foreground">薪资规则设置</span>
                  <span className="text-base">配置薪资计算规则和参数</span>
                  <Button variant="link" className="p-0 h-auto mt-2 justify-start" asChild>
                    <Link href="/settings">设置薪资规则</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddEmployeeDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onEmployeeAdded={handleEmployeeAdded}
      />
    </div>
  )
}
