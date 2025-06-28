"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { PlusIcon, SearchIcon, EditIcon, TrashIcon, EyeIcon } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import Link from "next/link"

export default function PayrollRecordsPage() {
  const [records, setRecords] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [employeeFilter, setEmployeeFilter] = useState("all")

  useEffect(() => {
    fetchRecords()
    fetchEmployees()
  }, [])

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/salary-records")
      if (response.ok) {
        const data = await response.json()
        setRecords(data)
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

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees")
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error("获取员工列表失败:", error)
    }
  }

  const handleDeleteRecord = async (recordId) => {
    if (!confirm("确定要删除这条薪资记录吗？")) {
      return
    }

    try {
      const response = await fetch(`/api/salary-records/${recordId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setRecords(records.filter(record => record.id !== recordId))
        toast({
          title: "删除成功",
          description: "薪资记录已删除",
        })
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

  // 过滤记录
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.period?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || record.status === statusFilter
    const matchesEmployee = employeeFilter === "all" || record.employeeId === employeeFilter
    
    return matchesSearch && matchesStatus && matchesEmployee
  })

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">薪资记录</h1>
          <p className="text-muted-foreground">管理员工薪资记录</p>
        </div>
        <Button asChild>
          <Link href="/salary/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            新建薪资记录
          </Link>
        </Button>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索员工姓名或薪资期间..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="选择员工" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有员工</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="confirmed">已确认</SelectItem>
                <SelectItem value="paid">已发放</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 薪资记录表格 */}
      <Card>
        <CardHeader>
          <CardTitle>薪资记录列表</CardTitle>
          <CardDescription>
            共 {filteredRecords.length} 条记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>员工姓名</TableHead>
                <TableHead>薪资期间</TableHead>
                <TableHead>基础工资</TableHead>
                <TableHead>绩效工资</TableHead>
                <TableHead>总工资</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    暂无薪资记录
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.employee?.name || "未知员工"}
                    </TableCell>
                    <TableCell>{record.period}</TableCell>
                    <TableCell>¥{record.baseSalary?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell>¥{record.performanceSalary?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell className="font-medium">
                      ¥{record.totalSalary?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      {record.createdAt ? format(new Date(record.createdAt), "yyyy-MM-dd", { locale: zhCN }) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/salary/${record.id}`}>
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/salary/${record.id}/edit`}>
                            <EditIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteRecord(record.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
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
