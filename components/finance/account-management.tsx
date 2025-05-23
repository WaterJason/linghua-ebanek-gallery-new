"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ResponsiveDataGrid } from "@/components/ui/responsive-data-grid"
import { PlusIcon, EditIcon, TrashIcon, EyeIcon } from "lucide-react"
import { AccountForm } from "@/components/finance/account-form"
import { AccountDetail } from "@/components/finance/account-detail"
import { getFinancialAccounts, deleteFinancialAccount } from "@/lib/actions/finance-actions"
import { useMediaQuery } from "@/hooks/use-media-query"
import { AccountManagementMobile } from "@/components/finance/account-management-mobile"

export function AccountManagement() {
  const isMobile = useMediaQuery("(max-width: 768px)")

  // 如果是移动设备，使用移动端优化版本
  if (isMobile) {
    return <AccountManagementMobile />
  }

  // 桌面端版本
  const { toast } = useToast()
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  // 加载账户数据
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setIsLoading(true)
        const data = await getFinancialAccounts()
        setAccounts(data)
        setIsLoading(false)
      } catch (error) {
        console.error("加载账户数据失败:", error)
        toast({
          variant: "destructive",
          title: "加载失败",
          description: error.message || "无法加载账户数据",
        })
        setIsLoading(false)
      }
    }

    loadAccounts()
  }, [toast])

  // 处理添加账户
  const handleAddAccount = () => {
    setSelectedAccount(null)
    setIsEditing(false)
    setIsFormOpen(true)
  }

  // 处理编辑账户
  const handleEditAccount = (account) => {
    setSelectedAccount(account)
    setIsEditing(true)
    setIsFormOpen(true)
  }

  // 处理查看账户详情
  const handleViewAccount = (account) => {
    setSelectedAccount(account)
    setIsDetailOpen(true)
  }

  // 处理删除账户
  const handleDeleteAccount = (account) => {
    setSelectedAccount(account)
    setIsDeleteDialogOpen(true)
  }

  // 确认删除账户
  const confirmDeleteAccount = async () => {
    if (!selectedAccount) return

    try {
      await deleteFinancialAccount(selectedAccount.id)

      setAccounts(accounts.filter(account => account.id !== selectedAccount.id))

      toast({
        title: "删除成功",
        description: `账户 ${selectedAccount.name} 已删除`,
      })

      setIsDeleteDialogOpen(false)
      setSelectedAccount(null)
    } catch (error) {
      console.error("删除账户失败:", error)
      toast({
        variant: "destructive",
        title: "删除失败",
        description: error.message || "无法删除账户",
      })
    }
  }

  // 处理表单提交成功
  const handleFormSuccess = (newAccount) => {
    if (isEditing) {
      setAccounts(accounts.map(account =>
        account.id === newAccount.id ? newAccount : account
      ))
    } else {
      setAccounts([...accounts, newAccount])
    }

    setIsFormOpen(false)
  }

  // 表格列定义
  const columns = [
    {
      header: "账户名称",
      accessorKey: "name",
      cell: (info) => <div className="font-medium">{info.getValue()}</div>,
    },
    {
      header: "账户类型",
      accessorKey: "type",
      cell: (info) => {
        const type = info.getValue()
        return (
          <div>
            {type === "bank" && "银行账户"}
            {type === "cash" && "现金账户"}
            {type === "alipay" && "支付宝"}
            {type === "wechat" && "微信支付"}
            {type === "other" && "其他账户"}
          </div>
        )
      },
    },
    {
      header: "账号",
      accessorKey: "accountNumber",
      cell: (info) => info.getValue() || "-",
    },
    {
      header: "当前余额",
      accessorKey: "currentBalance",
      cell: (info) => {
        const amount = parseFloat(info.getValue())
        return (
          <div className="text-right font-medium">
            {new Intl.NumberFormat('zh-CN', {
              style: 'currency',
              currency: 'CNY',
            }).format(amount)}
          </div>
        )
      },
    },
    {
      header: "状态",
      accessorKey: "isActive",
      cell: (info) => (
        <div className={info.getValue() ? "text-green-600" : "text-red-600"}>
          {info.getValue() ? "活跃" : "非活跃"}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const account = row.original
        return (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={(e) => {
              e.stopPropagation()
              handleViewAccount(account)
            }}>
              <EyeIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => {
              e.stopPropagation()
              handleEditAccount(account)
            }}>
              <EditIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => {
              e.stopPropagation()
              handleDeleteAccount(account)
            }}>
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>资金账户管理</CardTitle>
              <CardDescription>管理所有资金账户的基本信息</CardDescription>
            </div>
            <Button onClick={handleAddAccount}>
              <PlusIcon className="mr-2 h-4 w-4" />
              添加账户
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveDataGrid
            data={accounts}
            columns={columns}
            searchable={true}
            searchKeys={["name", "accountNumber", "description"]}
            loading={isLoading}
            emptyText="暂无账户数据"
            onRowClick={(account) => handleViewAccount(account)}
          />
        </CardContent>
      </Card>

      {/* 账户表单对话框 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "编辑账户" : "添加账户"}</DialogTitle>
          </DialogHeader>
          <AccountForm
            account={selectedAccount}
            isEditing={isEditing}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 账户详情对话框 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>账户详情</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <AccountDetail
              account={selectedAccount}
              onEdit={() => {
                setIsDetailOpen(false)
                handleEditAccount(selectedAccount)
              }}
              onClose={() => setIsDetailOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="确认删除"
        description={`您确定要删除账户 "${selectedAccount?.name}" 吗？此操作无法撤销，账户相关的所有交易记录将保留。`}
        onConfirm={confirmDeleteAccount}
      />
    </div>
  )
}
