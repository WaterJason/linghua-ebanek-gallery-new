"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  PencilIcon, TrashIcon, MoreHorizontalIcon, SearchIcon,
  UserIcon, PhoneIcon, MailIcon, EyeIcon, ArrowUpDownIcon,
  FileTextIcon, BarChart3Icon
} from "lucide-react"
import { getEmployees, deleteEmployee } from "@/lib/actions/employee-actions";
import { AddEmployeeDialog } from "./add-employee-dialog"
import { EditEmployeeDialog } from "./edit-employee-dialog"
import { toast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import Link from "next/link"

export function EmployeeList({ onAddEmployee }) {
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentEmployee, setCurrentEmployee] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [positionFilter, setPositionFilter] = useState("all")
  const [sortField, setSortField] = useState("name")
  const [sortDirection, setSortDirection] = useState("asc")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const [uniquePositions, setUniquePositions] = useState([])

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const data = await getEmployees()
        setEmployees(data)

        // 提取所有不重复的职位
        const positions = [...new Set(data.map(emp => emp.position))]
        setUniquePositions(positions)
      } catch (error) {
        console.error("Failed to fetch employees:", error)
        toast({
          title: "获取员工数据失败",
          description: "请稍后再试",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  // 当筛选条件或排序条件变化时，更新过滤后的员工列表
  useEffect(() => {
    let result = [...employees]

    // 应用搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        emp =>
          emp.name.toLowerCase().includes(query) ||
          emp.phone?.toLowerCase().includes(query) ||
          emp.email?.toLowerCase().includes(query)
      )
    }

    // 应用状态筛选
    if (statusFilter !== "all") {
      result = result.filter(emp => emp.status === statusFilter)
    }

    // 应用职位筛选
    if (positionFilter !== "all") {
      result = result.filter(emp => emp.position === positionFilter)
    }

    // 应用排序
    result.sort((a, b) => {
      let valueA = a[sortField]
      let valueB = b[sortField]

      // 处理数字字段
      if (sortField === "dailySalary") {
        valueA = Number(valueA)
        valueB = Number(valueB)
      } else {
        // 处理字符串字段
        valueA = String(valueA || "").toLowerCase()
        valueB = String(valueB || "").toLowerCase()
      }

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    setFilteredEmployees(result)
  }, [employees, searchQuery, statusFilter, positionFilter, sortField, sortDirection])

  const handleAddEmployee = () => {
    if (onAddEmployee) {
      onAddEmployee()
    } else {
      setIsAddDialogOpen(true)
    }
  }

  const handleEditEmployee = (employee) => {
    setCurrentEmployee(employee)
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return

    try {
      await deleteEmployee(employeeToDelete.id)
      setEmployees(employees.filter((employee) => employee.id !== employeeToDelete.id))
      toast({
        title: "删除成功",
        description: `员工 ${employeeToDelete.name} 已被删除`,
      })
    } catch (error) {
      console.error("Failed to delete employee:", error)
      toast({
        title: "删除失败",
        description: "无法删除员工，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setEmployeeToDelete(null)
    }
  }

  const handleEmployeeAdded = (newEmployee) => {
    setEmployees([...employees, newEmployee])
    setIsAddDialogOpen(false)
    toast({
      title: "添加成功",
      description: `员工 ${newEmployee.name} 已添加`,
    })
  }

  const handleEmployeeUpdated = (updatedEmployee) => {
    setEmployees(employees.map((employee) => (employee.id === updatedEmployee.id ? updatedEmployee : employee)))
    setIsEditDialogOpen(false)
    toast({
      title: "更新成功",
      description: `员工 ${updatedEmployee.name} 信息已更新`,
    })
  }

  const handleSort = (field) => {
    if (sortField === field) {
      // 如果已经按这个字段排序，则切换排序方向
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // 否则，设置新的排序字段，默认升序
      setSortField(field)
      setSortDirection("asc")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">加载中...</span>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* 筛选和搜索工具栏 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索员工姓名、电话或邮箱..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有状态</SelectItem>
              <SelectItem value="active">在职</SelectItem>
              <SelectItem value="inactive">离职</SelectItem>
            </SelectContent>
          </Select>

          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="职位筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有职位</SelectItem>
              {uniquePositions.map(position => (
                <SelectItem key={position} value={position}>{position}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 员工表格 */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                  <div className="flex items-center">
                    姓名
                    {sortField === "name" && (
                      <ArrowUpDownIcon className="ml-1 h-4 w-4" data-direction={sortDirection} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("position")}>
                  <div className="flex items-center">
                    职位
                    {sortField === "position" && (
                      <ArrowUpDownIcon className="ml-1 h-4 w-4" data-direction={sortDirection} />
                    )}
                  </div>
                </TableHead>
                <TableHead>联系电话</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("dailySalary")}>
                  <div className="flex items-center">
                    日薪
                    {sortField === "dailySalary" && (
                      <ArrowUpDownIcon className="ml-1 h-4 w-4" data-direction={sortDirection} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                  <div className="flex items-center">
                    状态
                    {sortField === "status" && (
                      <ArrowUpDownIcon className="ml-1 h-4 w-4" data-direction={sortDirection} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <UserIcon className="h-12 w-12 mb-2 opacity-20" />
                      <p>暂无符合条件的员工数据</p>
                      <Button variant="link" onClick={handleAddEmployee} className="mt-2">
                        添加员工
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <Link href={`/employees/${employee.id}`} className="hover:underline text-primary">
                          {employee.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>
                      {employee.phone ? (
                        <div className="flex items-center">
                          <PhoneIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                          {employee.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">未设置</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {employee.email ? (
                        <div className="flex items-center">
                          <MailIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                          {employee.email}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">未设置</span>
                      )}
                    </TableCell>
                    <TableCell>¥{employee.dailySalary.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                        {employee.status === "active" ? "在职" : "离职"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/employees/${employee.id}`}>
                              <EyeIcon className="mr-2 h-4 w-4" />
                              查看详情
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                            <PencilIcon className="mr-2 h-4 w-4" />
                            编辑信息
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/employees/${employee.id}/performance`}>
                              <BarChart3Icon className="mr-2 h-4 w-4" />
                              查看绩效
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/employees/${employee.id}/salary`}>
                              <FileTextIcon className="mr-2 h-4 w-4" />
                              薪资记录
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteClick(employee)}
                          >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 分页信息 */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {filteredEmployees.length} 名员工
            {filteredEmployees.length !== employees.length && ` (筛选自 ${employees.length} 名员工)`}
          </p>

          {!onAddEmployee && (
            <Button onClick={handleAddEmployee}>
              <PlusIcon className="mr-2 h-4 w-4" />
              添加员工
            </Button>
          )}
        </div>
      </div>

      {/* 添加员工对话框 */}
      <AddEmployeeDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onEmployeeAdded={handleEmployeeAdded}
      />

      {/* 编辑员工对话框 */}
      {currentEmployee && (
        <EditEmployeeDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          employee={currentEmployee}
          onEmployeeUpdated={handleEmployeeUpdated}
        />
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除这名员工吗？</AlertDialogTitle>
            <AlertDialogDescription>
              {employeeToDelete && (
                <>
                  您即将删除员工 <strong>{employeeToDelete.name}</strong>。此操作不可撤销，
                  删除后该员工的所有相关数据将无法恢复。
                </>
              )}
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
    </>
  )
}
