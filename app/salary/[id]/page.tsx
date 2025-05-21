"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import {
  FileTextIcon, UserIcon, ArrowLeftIcon, PrinterIcon,
  DownloadIcon, CheckIcon, BanknoteIcon, CalendarIcon,
  ClockIcon, DollarSignIcon, PencilIcon, TrashIcon
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { SalaryRecordDialog } from "@/components/salary-record-dialog"
import { exportSalarySlipToPDF } from "@/lib/export-utils"

// 客户端组件不能导出metadata
// 已移至metadata.ts文件

export default function SalaryRecordPage() {
  const params = useParams()
  const router = useRouter()
  const [record, setRecord] = useState(null)
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isPaidDialogOpen, setIsPaidDialogOpen] = useState(false)
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    async function fetchData() {
      try {
        // 获取薪资记录
        const response = await fetch(`/api/salary-records/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch salary record")
        }
        const data = await response.json()
        setRecord(data)
        setEmployee(data.employee)

        // 获取所有员工（用于编辑对话框）
        const employeesResponse = await fetch('/api/employees')
        if (employeesResponse.ok) {
          const employeesData = await employeesResponse.json()
          setEmployees(employeesData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "获取数据失败",
          description: "请稍后再试",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchData()
    }
  }, [params.id])

  // 处理编辑薪资记录
  const handleEditRecord = () => {
    setIsEditDialogOpen(true)
  }

  // 处理薪资记录更新
  const handleRecordSaved = (updatedRecord) => {
    setIsEditDialogOpen(false)
    setRecord(updatedRecord)
    toast({
      title: "更新成功",
      description: "薪资记录已更新",
    })
  }

  // 处理删除薪资记录
  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteRecord = async () => {
    try {
      const response = await fetch(`/api/salary-records/${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error("Failed to delete salary record")
      }

      toast({
        title: "删除成功",
        description: "薪资记录已删除",
      })

      router.push("/salary")
    } catch (error) {
      console.error("Error deleting salary record:", error)
      toast({
        title: "删除失败",
        description: error.message || "无法删除薪资记录",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  // 处理确认薪资记录
  const handleConfirmClick = () => {
    setIsConfirmDialogOpen(true)
  }

  const handleConfirmRecord = async () => {
    try {
      const response = await fetch(`/api/salary-records/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...record,
          status: "confirmed",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to confirm salary record")
      }

      const updatedRecord = await response.json()
      setRecord(updatedRecord)

      toast({
        title: "确认成功",
        description: "薪资记录已确认",
      })
    } catch (error) {
      console.error("Error confirming salary record:", error)
      toast({
        title: "确认失败",
        description: "无法确认薪资记录",
        variant: "destructive",
      })
    } finally {
      setIsConfirmDialogOpen(false)
    }
  }

  // 处理发放薪资
  const handlePaidClick = () => {
    setIsPaidDialogOpen(true)
  }

  const handlePaidRecord = async () => {
    try {
      const response = await fetch(`/api/salary-records/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...record,
          status: "paid",
          paymentDate: new Date(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to mark salary record as paid")
      }

      const updatedRecord = await response.json()
      setRecord(updatedRecord)

      toast({
        title: "发放成功",
        description: "薪资已标记为已发放",
      })
    } catch (error) {
      console.error("Error marking salary record as paid:", error)
      toast({
        title: "发放失败",
        description: "无法标记薪资为已发放",
        variant: "destructive",
      })
    } finally {
      setIsPaidDialogOpen(false)
    }
  }

  // 处理打印薪资单
  const handlePrintSalarySlip = () => {
    toast({
      title: "打印功能开发中",
      description: "薪资单打印功能正在开发中",
    })
  }

  // 处理下载薪资单
  const handleDownloadSalarySlip = () => {
    try {
      if (!record || !employee) {
        toast({
          title: "无法导出",
          description: "缺少薪资记录或员工信息",
          variant: "destructive",
        })
        return
      }

      const fileName = exportSalarySlipToPDF(record, employee)

      toast({
        title: "导出成功",
        description: `薪资单已导出为 ${fileName}`,
      })
    } catch (error) {
      console.error("Error exporting salary slip:", error)
      toast({
        title: "导出失败",
        description: error.message || "请稍后再试",
        variant: "destructive",
      })
    }
  }

  // 获取状态标签
  const getStatusBadge = (status) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">草稿</Badge>
      case "confirmed":
        return <Badge variant="secondary">已确认</Badge>
      case "paid":
        return <Badge variant="default">已发放</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
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

  if (!record) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center py-8">
          <FileTextIcon className="h-16 w-16 mb-4 text-muted-foreground opacity-20" />
          <h2 className="text-xl font-semibold mb-2">未找到薪资记录</h2>
          <p className="text-muted-foreground mb-4">无法找到ID为 {params.id} 的薪资记录</p>
          <Button asChild>
            <Link href="/salary">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              返回薪资管理
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
              <Link href="/salary">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                返回列表
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">薪资单详情</h1>
            {getStatusBadge(record.status)}
          </div>
          <div className="flex gap-2">
            {record.status === "draft" && (
              <>
                <Button variant="outline" onClick={handleEditRecord}>
                  <PencilIcon className="mr-2 h-4 w-4" />
                  编辑
                </Button>
                <Button variant="outline" onClick={handleConfirmClick}>
                  <CheckIcon className="mr-2 h-4 w-4" />
                  确认
                </Button>
                <Button variant="destructive" onClick={handleDeleteClick}>
                  <TrashIcon className="mr-2 h-4 w-4" />
                  删除
                </Button>
              </>
            )}
            {record.status === "confirmed" && (
              <Button variant="default" onClick={handlePaidClick}>
                <BanknoteIcon className="mr-2 h-4 w-4" />
                标记为已发放
              </Button>
            )}
            <Button variant="outline" onClick={handlePrintSalarySlip}>
              <PrinterIcon className="mr-2 h-4 w-4" />
              打印
            </Button>
            <Button variant="outline" onClick={handleDownloadSalarySlip}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              下载
            </Button>
          </div>
        </div>

        {/* 薪资单卡片 */}
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">薪资单</CardTitle>
                <CardDescription>
                  {record.year}年{record.month}月 薪资单
                </CardDescription>
              </div>
              <div className="text-right">
                <h3 className="font-semibold">聆花掐丝珐琅馆</h3>
                <p className="text-sm text-muted-foreground">薪资发放单位</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* 员工信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">员工姓名:</span>
                  <span>{employee?.name || "未知员工"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">职位:</span>
                  <span>{employee?.position || "未知"}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">薪资期间:</span>
                  <span>{record.year}年{record.month}月</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">日薪标准:</span>
                  <span>¥{employee?.dailySalary.toFixed(2) || "未知"}</span>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* 薪资明细 */}
            <div className="space-y-4">
              <h3 className="font-semibold">收入明细</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">基本工资:</span>
                    <span>¥{record.baseSalary.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">排班工资:</span>
                    <span>¥{record.scheduleSalary.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">销售提成:</span>
                    <span>¥{record.salesCommission.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">计件收入:</span>
                    <span>¥{record.pieceWorkIncome.toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">工作坊收入:</span>
                    <span>¥{record.workshopIncome.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">咖啡店提成:</span>
                    <span>¥{record.coffeeShiftCommission.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">加班费:</span>
                    <span>¥{record.overtimePay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">奖金:</span>
                    <span>¥{record.bonus.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 font-medium">
                <span>收入合计:</span>
                <span>¥{record.totalIncome.toFixed(2)}</span>
              </div>

              <Separator className="my-4" />

              <h3 className="font-semibold">扣除项目</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">扣款:</span>
                    <span>¥{record.deductions.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">社保:</span>
                    <span>¥{record.socialInsurance.toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">个税:</span>
                    <span>¥{record.tax.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 font-medium">
                <span>扣除合计:</span>
                <span>¥{(record.deductions + record.socialInsurance + record.tax).toFixed(2)}</span>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center pt-2 text-lg font-bold">
                <span>实发工资:</span>
                <span>¥{record.netIncome.toFixed(2)}</span>
              </div>
            </div>

            {/* 备注 */}
            {record.notes && (
              <div className="mt-6 p-4 bg-muted rounded-md">
                <h3 className="font-semibold mb-2">备注</h3>
                <p className="text-sm">{record.notes}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              {record.status === "paid" && record.paymentDate && (
                <span>发放日期: {format(new Date(record.paymentDate), "yyyy-MM-dd", { locale: zhCN })}</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              创建日期: {format(new Date(record.createdAt), "yyyy-MM-dd", { locale: zhCN })}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* 编辑薪资记录对话框 */}
      <SalaryRecordDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        record={record}
        employees={employees}
        onSaved={handleRecordSaved}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除这条薪资记录吗？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销，删除后该薪资记录将无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecord} className="bg-destructive text-destructive-foreground">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 确认薪资记录对话框 */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认薪资记录</AlertDialogTitle>
            <AlertDialogDescription>
              确认后，薪资记录将不能再编辑或删除。确定要确认这条薪资记录吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRecord}>
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 标记为已发放对话框 */}
      <AlertDialog open={isPaidDialogOpen} onOpenChange={setIsPaidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>标记为已发放</AlertDialogTitle>
            <AlertDialogDescription>
              确定要将这条薪资记录标记为已发放吗？此操作将记录当前日期为发放日期。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handlePaidRecord}>
              确认发放
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
