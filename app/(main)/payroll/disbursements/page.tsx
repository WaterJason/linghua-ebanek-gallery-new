"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { PlusIcon, SearchIcon, DollarSignIcon, CheckIcon, XIcon } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export default function PayrollDisbursementsPage() {
  const [disbursements, setDisbursements] = useState([])
  const [pendingRecords, setPendingRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchDisbursements()
    fetchPendingRecords()
  }, [])

  const fetchDisbursements = async () => {
    try {
      const response = await fetch("/api/payroll/disbursements")
      if (response.ok) {
        const data = await response.json()
        setDisbursements(data)
      } else {
        toast({
          title: "错误",
          description: "获取发放记录失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("获取发放记录失败:", error)
      toast({
        title: "错误",
        description: "获取发放记录失败",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingRecords = async () => {
    try {
      const response = await fetch("/api/salary-records?status=confirmed")
      if (response.ok) {
        const data = await response.json()
        setPendingRecords(data)
      }
    } catch (error) {
      console.error("获取待发放记录失败:", error)
    }
  }

  const handleDisburse = async (recordId) => {
    try {
      const response = await fetch(`/api/salary-records/${recordId}/disburse`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "发放成功",
          description: "薪资已成功发放",
        })
        fetchDisbursements()
        fetchPendingRecords()
      } else {
        toast({
          title: "发放失败",
          description: "薪资发放时发生错误",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("薪资发放失败:", error)
      toast({
        title: "发放失败",
        description: "薪资发放时发生错误",
        variant: "destructive",
      })
    }
  }

  const handleBatchDisburse = async () => {
    if (pendingRecords.length === 0) {
      toast({
        title: "提示",
        description: "没有待发放的薪资记录",
      })
      return
    }

    if (!confirm(`确定要批量发放 ${pendingRecords.length} 条薪资记录吗？`)) {
      return
    }

    try {
      const response = await fetch("/api/payroll/batch-disburse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recordIds: pendingRecords.map(record => record.id)
        }),
      })

      if (response.ok) {
        toast({
          title: "批量发放成功",
          description: `已成功发放 ${pendingRecords.length} 条薪资记录`,
        })
        fetchDisbursements()
        fetchPendingRecords()
      } else {
        toast({
          title: "批量发放失败",
          description: "批量发放薪资时发生错误",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("批量发放失败:", error)
      toast({
        title: "批量发放失败",
        description: "批量发放薪资时发生错误",
        variant: "destructive",
      })
    }
  }

  // 过滤发放记录
  const filteredDisbursements = disbursements.filter(disbursement => {
    const matchesSearch = disbursement.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         disbursement.period?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || disbursement.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">待发放</Badge>
      case "disbursed":
        return <Badge variant="success">已发放</Badge>
      case "failed":
        return <Badge variant="destructive">发放失败</Badge>
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">薪资发放</h1>
          <p className="text-muted-foreground">管理薪资发放和发放记录</p>
        </div>
        <Button onClick={handleBatchDisburse} disabled={pendingRecords.length === 0}>
          <DollarSignIcon className="mr-2 h-4 w-4" />
          批量发放 ({pendingRecords.length})
        </Button>
      </div>

      {/* 待发放薪资 */}
      {pendingRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>待发放薪资</CardTitle>
            <CardDescription>
              共 {pendingRecords.length} 条待发放记录
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>员工姓名</TableHead>
                  <TableHead>薪资期间</TableHead>
                  <TableHead>总薪资</TableHead>
                  <TableHead>确认时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.employee?.name || "未知员工"}
                    </TableCell>
                    <TableCell>{record.period}</TableCell>
                    <TableCell className="font-medium">
                      ¥{record.totalSalary?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell>
                      {record.updatedAt ? format(new Date(record.updatedAt), "yyyy-MM-dd", { locale: zhCN }) : "-"}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        onClick={() => handleDisburse(record.id)}
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        发放
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle>发放记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索员工姓名或薪资期间..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="pending">待发放</SelectItem>
                <SelectItem value="disbursed">已发放</SelectItem>
                <SelectItem value="failed">发放失败</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>员工姓名</TableHead>
                <TableHead>薪资期间</TableHead>
                <TableHead>总薪资</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>发放时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDisbursements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    暂无发放记录
                  </TableCell>
                </TableRow>
              ) : (
                filteredDisbursements.map((disbursement) => (
                  <TableRow key={disbursement.id}>
                    <TableCell className="font-medium">
                      {disbursement.employee?.name || "未知员工"}
                    </TableCell>
                    <TableCell>{disbursement.period}</TableCell>
                    <TableCell className="font-medium">
                      ¥{disbursement.totalSalary?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell>{getStatusBadge(disbursement.status)}</TableCell>
                    <TableCell>
                      {disbursement.disbursedAt ? format(new Date(disbursement.disbursedAt), "yyyy-MM-dd HH:mm", { locale: zhCN }) : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
