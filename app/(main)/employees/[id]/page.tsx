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
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">加载中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">员工不存在</h1>
          <p className="text-muted-foreground mt-2">未找到指定的员工信息</p>
          <Button asChild className="mt-4">
            <Link href="/employees">返回员工列表</Link>
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
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{employee.name}</CardTitle>
                <CardDescription className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1">
                    <BriefcaseIcon className="w-4 h-4" />
                    {employee.position}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSignIcon className="w-4 h-4" />
                    基础工资: ¥{employee.baseSalary}
                  </span>
                  {employee.dailySalary && (
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      日薪: ¥{employee.dailySalary}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                <span>{employee.phone || "未设置"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MailIcon className="w-4 h-4 text-muted-foreground" />
                <span>{employee.email || "未设置"}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <span>入职时间: {employee.hireDate ? format(new Date(employee.hireDate), "yyyy年MM月dd日", { locale: zhCN }) : "未设置"}</span>
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

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 最近排班 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5" />
                    最近排班
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentSchedules.length > 0 ? (
                    <div className="space-y-2">
                      {recentSchedules.map((schedule) => (
                        <div key={schedule.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                          <span>{format(new Date(schedule.date), "MM月dd日", { locale: zhCN })}</span>
                          <span className="text-sm text-muted-foreground">{schedule.shift}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">暂无排班记录</p>
                  )}
                </CardContent>
              </Card>

              {/* 最近活动 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileTextIcon className="h-5 w-5" />
                    最近活动
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivities.length > 0 ? (
                    <div className="space-y-2">
                      {recentActivities.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                          <span className="text-sm">{activity.action}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(activity.createdAt), "MM-dd HH:mm", { locale: zhCN })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">暂无活动记录</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedules">
            <Card>
              <CardHeader>
                <CardTitle>排班记录</CardTitle>
                <CardDescription>查看员工的详细排班记录</CardDescription>
              </CardHeader>
              <CardContent>
                {/* 这里可以添加更详细的排班记录组件 */}
                <p className="text-muted-foreground">排班记录功能开发中...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <EmployeePerformance employeeId={employee.id} />
          </TabsContent>

          <TabsContent value="salary">
            <EmployeeSalary employeeId={employee.id} />
          </TabsContent>

          <TabsContent value="account">
            <EmployeeUserRole employeeId={employee.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* 编辑对话框 */}
      <EmployeeEditDialog
        employee={employee}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onEmployeeUpdated={handleEmployeeUpdated}
      />

      {/* 删除确认对话框 */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>确认删除</CardTitle>
              <CardDescription>
                确定要删除员工 "{employee.name}" 吗？此操作不可撤销。
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleDeleteEmployee}>
                删除
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
