"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  PencilIcon, TrashIcon, EyeIcon,
  UserIcon, PhoneIcon, MailIcon,
  FileTextIcon, BarChart3Icon, PlusIcon,
  CheckCircleIcon, AlertCircleIcon, LinkIcon, UnlinkIcon,
  UserPlusIcon
} from "lucide-react"
import { getEmployees, deleteEmployee } from "@/lib/actions/employee-actions";
import { AddEmployeeDialog } from "./add-employee-dialog"
import { EditEmployeeDialog } from "./edit-employee-dialog"
import { ModernTable } from "@/components/modern-table"
import { toast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useSmartOperation } from "@/hooks/use-feedback"
import { AnimatedButton } from "@/components/ui/micro-animations"
import { SpinLoader } from "@/components/ui/micro-animations"
import Link from "next/link"

interface EmployeeListProps {
  onAddEmployee?: () => void
}

export function EmployeeList({ onAddEmployee }: EmployeeListProps) {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentEmployee, setCurrentEmployee] = useState<any>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<any>(null)

  // 智能操作系统
  const {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    deleteData,
    executeOperation
  } = useSmartOperation()

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const data = await executeOperation(
          {
            module: '员工管理',
            action: '获取员工列表',
            target: '员工数据'
          },
          () => getEmployees(),
          {
            showProgress: true,
            showFeedback: false, // 不显示成功反馈，避免过多提示
            enableUndo: false,
            progressTitle: '正在加载员工数据'
          }
        )
        setEmployees(data)
      } catch (error) {
        console.error("Failed to fetch employees:", error)
        showError('获取员工数据失败，请稍后再试')
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  // 定义表格列
  const columns = [
    {
      key: "name",
      title: "姓名",
      sortable: true,
      render: (value: string, record: any) => (
        <div className="flex items-center">
          <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
          <Link href={`/employees/${record.id}`} className="hover:underline text-primary font-medium">
            {value}
          </Link>
        </div>
      )
    },
    {
      key: "position",
      title: "职位",
      sortable: true,
    },
    {
      key: "phone",
      title: "联系电话",
      render: (value: string) => value ? (
        <div className="flex items-center">
          <PhoneIcon className="h-3 w-3 mr-1 text-muted-foreground" />
          {value}
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">未设置</span>
      )
    },
    {
      key: "email",
      title: "邮箱",
      render: (value: string) => value ? (
        <div className="flex items-center">
          <MailIcon className="h-3 w-3 mr-1 text-muted-foreground" />
          {value}
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">未设置</span>
      )
    },
    {
      key: "dailySalary",
      title: "日薪",
      sortable: true,
      render: (value: number) => `¥${value?.toFixed(2) || '0.00'}`
    },
    {
      key: "status",
      title: "状态",
      sortable: true,
      render: (value: string) => (
        <Badge variant={value === "active" ? "default" : "secondary"}>
          {value === "active" ? "在职" : "离职"}
        </Badge>
      )
    },
    {
      key: "user",
      title: "用户账号",
      render: (value: any, record: any) => {
        if (record.user) {
          return (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <div className="text-sm">
                  <div className="font-medium">{record.user.email}</div>
                  <div className="text-muted-foreground">{record.user.role}</div>
                </div>
              </div>
              <button
                className="p-1 hover:bg-muted rounded"
                onClick={() => handleUnlinkUser(record.id)}
                title="解除关联"
              >
                <UnlinkIcon className="h-3 w-3" />
              </button>
            </div>
          )
        } else {
          return (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <AlertCircleIcon className="h-4 w-4 text-orange-500" />
                <span className="text-muted-foreground text-sm">未关联用户</span>
              </div>
              <button
                className="p-1 hover:bg-muted rounded"
                onClick={() => handleCreateUser(record)}
                title="创建用户账号"
              >
                <UserPlusIcon className="h-3 w-3" />
              </button>
            </div>
          )
        }
      }
    }
  ]

  // 定义表格操作
  const actions = [
    {
      key: "view",
      label: "查看详情",
      icon: <EyeIcon className="mr-2 h-4 w-4" />,
      onClick: (record: any) => {
        window.location.href = `/employees/${record.id}`
      }
    },
    {
      key: "edit",
      label: "编辑信息",
      icon: <PencilIcon className="mr-2 h-4 w-4" />,
      onClick: (record: any) => {
        setCurrentEmployee(record)
        setIsEditDialogOpen(true)
      }
    },
    {
      key: "delete",
      label: "删除",
      icon: <TrashIcon className="mr-2 h-4 w-4" />,
      variant: "destructive" as const,
      onClick: (record: any) => {
        setEmployeeToDelete(record)
        setIsDeleteDialogOpen(true)
      }
    }
  ]

  const handleAddEmployee = () => {
    if (onAddEmployee) {
      onAddEmployee()
    } else {
      setIsAddDialogOpen(true)
    }
  }

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return

    try {
      const result = await deleteData(
        () => deleteEmployee(employeeToDelete.id),
        {
          module: '员工管理',
          itemName: `员工 ${employeeToDelete.name}`,
          confirmMessage: `确定要删除员工 ${employeeToDelete.name} 吗？此操作可以撤销。`,
          successMessage: `员工 ${employeeToDelete.name} 已成功删除`,
          enableUndo: true
        }
      )

      if (result !== null) {
        setEmployees(employees.filter((employee) => employee.id !== employeeToDelete.id))
      }
    } catch (error) {
      console.error("Failed to delete employee:", error)
      showError(`删除员工 ${employeeToDelete.name} 失败，请稍后再试`)
    } finally {
      setIsDeleteDialogOpen(false)
      setEmployeeToDelete(null)
    }
  }

  const handleEmployeeAdded = (newEmployee: any) => {
    setEmployees([...employees, newEmployee])
    setIsAddDialogOpen(false)
    showSuccess(`员工 ${newEmployee.name} 已成功添加到系统中`)
  }

  const handleEmployeeUpdated = (updatedEmployee: any) => {
    setEmployees(employees.map((employee) => (employee.id === updatedEmployee.id ? updatedEmployee : employee)))
    setIsEditDialogOpen(false)
    showSuccess(`员工 ${updatedEmployee.name} 的信息已成功更新`)
  }

  // 创建用户账号
  const handleCreateUser = async (employee: any) => {
    try {
      const result = await executeOperation(
        {
          module: '员工管理',
          action: '创建用户账号',
          target: `员工 ${employee.name}`
        },
        async () => {
          const response = await fetch('/api/employees/unified-create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeData: {
                id: employee.id,
                name: employee.name,
                position: employee.position,
                phone: employee.phone,
                email: employee.email,
              },
              userData: {
                name: employee.name,
                email: employee.email || `${employee.name.toLowerCase()}@company.com`,
                role: 'employee',
                phone: employee.phone,
              },
              creationMode: 'user-only'
            })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || '创建用户账号失败')
          }

          return await response.json()
        },
        {
          showProgress: true,
          progressTitle: '创建用户账号',
          successMessage: `已为员工 ${employee.name} 创建用户账号`,
          enableUndo: true
        }
      )

      // 刷新员工列表
      const updatedEmployees = await getEmployees()
      setEmployees(updatedEmployees)
    } catch (error) {
      console.error('创建用户账号失败:', error)
      showError(`为员工 ${employee.name} 创建用户账号失败`)
    }
  }

  // 解除用户关联
  const handleUnlinkUser = async (employeeId: number) => {
    const employee = employees.find(emp => emp.id === employeeId)
    if (!employee || !employee.user) return

    try {
      await executeOperation(
        {
          module: '员工管理',
          action: '解除用户关联',
          target: `员工 ${employee.name}`
        },
        async () => {
          const response = await fetch('/api/employees/batch-link', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              unlinkPairs: [{
                employeeId: employee.id,
                userId: employee.user.id
              }]
            })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || '解除关联失败')
          }

          return await response.json()
        },
        {
          showProgress: true,
          progressTitle: '解除用户关联',
          successMessage: `已解除员工 ${employee.name} 与用户账号的关联`,
          enableUndo: true
        }
      )

      // 刷新员工列表
      const updatedEmployees = await getEmployees()
      setEmployees(updatedEmployees)
    } catch (error) {
      console.error('解除用户关联失败:', error)
      showError(`解除员工 ${employee.name} 的用户关联失败`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <SpinLoader size="lg" />
        <span className="ml-3 text-muted-foreground">正在加载员工数据...</span>
      </div>
    )
  }

  return (
    <>
      <ModernTable
        title="员工列表"
        description="管理所有员工信息"
        columns={columns}
        data={employees}
        actions={actions}
        searchable={true}
        searchPlaceholder="搜索员工姓名、电话或邮箱..."
        addButton={!onAddEmployee ? {
          label: "添加员工",
          onClick: handleAddEmployee
        } : undefined}
        emptyState={{
          icon: <UserIcon className="w-12 h-12" />,
          title: "暂无员工数据",
          description: "还没有添加任何员工，点击下方按钮开始添加",
          action: !onAddEmployee ? (
            <AnimatedButton
              onClick={handleAddEmployee}
              className="mt-4"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              添加员工
            </AnimatedButton>
          ) : undefined
        }}
        loading={loading}
        className="mt-6"
      />



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
