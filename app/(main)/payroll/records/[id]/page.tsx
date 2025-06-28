"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { ArrowLeftIcon, EditIcon, TrashIcon, PrinterIcon, DollarSignIcon, CalendarIcon, UserIcon } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export default function PayrollRecordDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [record, setRecord] = useState(null)
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchRecord()
    }
  }, [params.id])

  const fetchRecord = async () => {
    try {
      const response = await fetch(`/api/salary-records/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setRecord(data)
        if (data.employee) {
          setEmployee(data.employee)
        }
      } else {
        toast({
          title: "错误",
          description: "获取薪资记录失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("获取薪资记录失败:", error)
      toast({
        title: "错误",
        description: "获取薪资记录失败",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("确定要删除这条薪资记录吗？")) {
      return
    }

    try {
      const response = await fetch(`/api/salary-records/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "删除成功",
          description: "薪资记录已删除",
        })
        router.push("/payroll/records")
      } else {
        toast({
          title: "删除失败",
          description: "删除薪资记录时发生错误",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("删除薪资记录失败:", error)
      toast({
        title: "删除失败",
        description: "删除薪资记录时发生错误",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">草稿</Badge>
      case "confirmed":
        return <Badge variant="default">已确认</Badge>
      case "paid":
        return <Badge variant="success">已发放</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-semibold">薪资记录不存在</h1>
        <p className="text-muted-foreground mt-2">未找到指定的薪资记录</p>
        <Button asChild className="mt-4">
          <Link href="/payroll/records">返回薪资记录列表</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 顶部导航和操作按钮 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/payroll/records">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              返回列表
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">薪资记录详情</h1>
          {getStatusBadge(record.status)}
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <PrinterIcon className="mr-2 h-4 w-4" />
            打印
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/payroll/records/${record.id}/edit`}>
              <EditIcon className="mr-2 h-4 w-4" />
              编辑
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <TrashIcon className="mr-2 h-4 w-4" />
            删除
          </Button>
        </div>
      </div>

      {/* 基本信息卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{employee?.name || "未知员工"}</CardTitle>
              <CardDescription className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  薪资期间: {record.period}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSignIcon className="w-4 h-4" />
                  总薪资: ¥{record.totalSalary?.toFixed(2) || "0.00"}
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">员工信息</h3>
              <div className="space-y-1 text-sm">
                <p>姓名: {employee?.name || "未知"}</p>
                <p>职位: {employee?.position || "未设置"}</p>
                <p>联系电话: {employee?.phone || "未设置"}</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">记录信息</h3>
              <div className="space-y-1 text-sm">
                <p>创建时间: {record.createdAt ? format(new Date(record.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN }) : "-"}</p>
                <p>更新时间: {record.updatedAt ? format(new Date(record.updatedAt), "yyyy-MM-dd HH:mm", { locale: zhCN }) : "-"}</p>
                <p>状态: {getStatusBadge(record.status)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 薪资明细卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>薪资明细</CardTitle>
          <CardDescription>详细的薪资构成和计算</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">基础薪资</h4>
                <div className="bg-muted/50 p-3 rounded">
                  <div className="flex justify-between">
                    <span>基础工资</span>
                    <span>¥{record.baseSalary?.toFixed(2) || "0.00"}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">绩效薪资</h4>
                <div className="bg-muted/50 p-3 rounded">
                  <div className="flex justify-between">
                    <span>绩效工资</span>
                    <span>¥{record.performanceSalary?.toFixed(2) || "0.00"}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>总薪资</span>
              <span className="text-primary">¥{record.totalSalary?.toFixed(2) || "0.00"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 备注信息 */}
      {record.notes && (
        <Card>
          <CardHeader>
            <CardTitle>备注信息</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{record.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
