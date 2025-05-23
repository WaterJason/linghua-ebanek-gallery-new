"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { EditEmployeeDialog } from "@/components/edit-employee-dialog"
import { EmployeeUserRole } from "@/components/employee-user-role"
import { EmployeeAuditLog } from "@/components/employee/employee-audit-log"
import {
  UserIcon, PhoneIcon, MailIcon, CalendarIcon, BriefcaseIcon,
  DollarSignIcon, ArrowLeftIcon, PencilIcon, TrashIcon,
  BarChart3Icon, FileTextIcon, ClockIcon, CalendarDaysIcon, KeyIcon
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { deleteEmployee } from "@/lib/actions/employee-actions";

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [recentSchedules, setRecentSchedules] = useState([])
  const [recentActivities, setRecentActivities] = useState([])

  useEffect(() => {
    async function fetchEmployeeData() {
      try {
        // 获取员工详情
        const response = await fetch(`/api/employees/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch employee")
        }
        const data = await response.json()
        setEmployee(data)

        // 获取最近排班
        const schedulesResponse = await fetch(`/api/employees/${params.id}/schedules?limit=5`)
        if (schedulesResponse.ok) {
          const schedulesData = await schedulesResponse.json()
          setRecentSchedules(schedulesData)
        }

        // 获取最近活动
        const activitiesResponse = await fetch(`/api/employees/${params.id}/activities?limit=10`)
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json()
          setRecentActivities(activitiesData)
        }
      } catch (error) {
        console.error("Error fetching employee data:", error)
        toast({
          title: "获取员工数据失败",
          description: "请稍后再试",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchEmployeeData()
    }
  }, [params.id])

  const handleEditEmployee = () => {
    setIsEditDialogOpen(true)
  }

  const handleEmployeeUpdated = (updatedEmployee) => {
    setEmployee(updatedEmployee)
    setIsEditDialogOpen(false)
    toast({
      title: "更新成功",
      description: `员工 ${updatedEmployee.name} 信息已更新`,
    })
  }

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteEmployee = async () => {
    try {
      await deleteEmployee(Number(params.id))
      toast({
        title: "删除成功",
        description: `员工 ${employee.name} 已被删除`,
      })
      router.push("/employees")
    } catch (error) {
      console.error("Failed to delete employee:", error)
      toast({
        title: "删除失败",
        description: "无法删除员工，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">加载中...</span>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center py-8">
          <UserIcon className="h-16 w-16 mb-4 text-muted-foreground opacity-20" />
          <h2 className="text-xl font-semibold mb-2">未找到员工</h2>
          <p className="text-muted-foreground mb-4">无法找到ID为 {params.id} 的员工</p>
          <Button asChild>
            <Link href="/employees">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              返回员工列表
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        {/* 顶部导航和操作按钮 */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/employees">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                返回列表
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">员工详情</h1>
            <Badge variant={employee.status === "active" ? "default" : "secondary"}>
              {employee.status === "active" ? "在职" : "离职"}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEditEmployee}>
              <PencilIcon className="mr-2 h-4 w-4" />
              编辑
            </Button>
            <Button variant="destructive" onClick={handleDeleteClick}>
              <TrashIcon className="mr-2 h-4 w-4" />
              删除
            </Button>
          </div>
        </div>

        {/* 员工基本信息卡片 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                <UserIcon className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl">{employee.name}</CardTitle>
                <CardDescription>{employee.position}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">联系电话:</span>
                <span>{employee.phone || "未设置"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MailIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">邮箱:</span>
                <span>{employee.email || "未设置"}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">日薪:</span>
                <span>¥{employee.dailySalary.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">入职时间:</span>
                <span>{format(new Date(employee.createdAt), "yyyy-MM-dd", { locale: zhCN })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 选项卡内容 */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <UserIcon className="h-4 w-4 mr-2" />
              概览
            </TabsTrigger>
            <TabsTrigger value="schedules">
              <CalendarDaysIcon className="h-4 w-4 mr-2" />
              排班记录
            </TabsTrigger>
            <TabsTrigger value="performance">
              <BarChart3Icon className="h-4 w-4 mr-2" />
              绩效统计
            </TabsTrigger>
            <TabsTrigger value="salary">
              <FileTextIcon className="h-4 w-4 mr-2" />
              薪资记录
            </TabsTrigger>
            <TabsTrigger value="account">
              <KeyIcon className="h-4 w-4 mr-2" />
              系统账号
            </TabsTrigger>
          </TabsList>

          {/* 概览选项卡 */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 最近排班 */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">最近排班</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentSchedules.length > 0 ? (
                    <div className="space-y-2">
                      {recentSchedules.map((schedule) => (
                        <div key={schedule.id} className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(schedule.date), "yyyy-MM-dd", { locale: zhCN })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{schedule.startTime} - {schedule.endTime}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      暂无排班记录
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/schedule?employeeId=${employee.id}`}>
                      查看全部排班
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* 最近活动 */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">最近活动</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivities.length > 0 ? (
                    <div className="space-y-2">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
                          <div className="flex items-center gap-2">
                            <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{activity.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(activity.date), "yyyy-MM-dd", { locale: zhCN })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      暂无活动记录
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/daily-log?employeeId=${employee.id}`}>
                      查看全部活动
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* 操作日志 */}
              <Card className="md:col-span-1">
                <EmployeeAuditLog
                  employeeId={employee.id}
                  showHeader={true}
                  limit={5}
                />
              </Card>
            </div>
          </TabsContent>

          {/* 其他选项卡内容 */}
          <TabsContent value="schedules" className="space-y-4">
            <Card>
              <CardHeader className="flex justify-between items-start">
                <div>
                  <CardTitle>排班记录</CardTitle>
                  <CardDescription>查看员工的所有排班记录</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/schedule?employeeId=${employee.id}`}>
                    查看完整排班
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentSchedules.length > 0 ? (
                  <div className="space-y-2">
                    {recentSchedules.map((schedule) => (
                      <div key={schedule.id} className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(schedule.date), "yyyy-MM-dd", { locale: zhCN })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{schedule.startTime} - {schedule.endTime}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无排班记录
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader className="flex justify-between items-start">
                <div>
                  <CardTitle>绩效统计</CardTitle>
                  <CardDescription>查看员工的绩效数据和统计</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/employees/${employee.id}/performance`}>
                    查看详细绩效
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col p-4 border rounded-md">
                    <span className="text-sm text-muted-foreground">最近活动数</span>
                    <span className="text-2xl font-bold">{recentActivities.length}</span>
                  </div>
                  <div className="flex flex-col p-4 border rounded-md">
                    <span className="text-sm text-muted-foreground">最近排班数</span>
                    <span className="text-2xl font-bold">{recentSchedules.length}</span>
                  </div>
                  <div className="flex flex-col p-4 border rounded-md">
                    <span className="text-sm text-muted-foreground">查看更多</span>
                    <Button variant="link" className="p-0 h-auto" asChild>
                      <Link href={`/employees/${employee.id}/performance`}>
                        详细绩效分析
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salary" className="space-y-4">
            <Card>
              <CardHeader className="flex justify-between items-start">
                <div>
                  <CardTitle>薪资记录</CardTitle>
                  <CardDescription>查看员工的薪资记录和明细</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/employees/${employee.id}/salary`}>
                    查看薪资详情
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col p-4 border rounded-md">
                    <span className="text-sm text-muted-foreground">日薪标准</span>
                    <span className="text-2xl font-bold">¥{employee.dailySalary.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col p-4 border rounded-md">
                    <span className="text-sm text-muted-foreground">月薪估算 (22天)</span>
                    <span className="text-2xl font-bold">¥{(employee.dailySalary * 22).toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col p-4 border rounded-md">
                    <span className="text-sm text-muted-foreground">查看更多</span>
                    <Button variant="link" className="p-0 h-auto" asChild>
                      <Link href={`/employees/${employee.id}/salary`}>
                        详细薪资记录
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 系统账号选项卡 */}
          <TabsContent value="account" className="space-y-4">
            <EmployeeUserRole employeeId={employee.id} employeeName={employee.name} />
          </TabsContent>
        </Tabs>
      </div>

      {/* 编辑员工对话框 */}
      {employee && (
        <EditEmployeeDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          employee={employee}
          onEmployeeUpdated={handleEmployeeUpdated}
        />
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除这名员工吗？</AlertDialogTitle>
            <AlertDialogDescription>
              您即将删除员工 <strong>{employee.name}</strong>。此操作不可撤销，
              删除后该员工的所有相关数据将无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee} className="bg-destructive text-destructive-foreground">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
