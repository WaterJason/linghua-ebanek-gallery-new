"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ResponsiveDataGrid } from "@/components/ui/responsive-data-grid"
import { PlusIcon, EditIcon, TrashIcon, FilterIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TransactionForm } from "@/components/finance/transaction-form"
import { TransactionFilterForm } from "@/components/finance/transaction-filter-form"
import { getFinancialTransactions, deleteFinancialTransaction } from "@/lib/actions/finance-actions"
import { useMediaQuery } from "@/hooks/use-media-query"
import { TransactionManagementMobile } from "@/components/finance/transaction-management-mobile"
import { useEnhancedOperations } from "@/lib/enhanced-operations-integration"

export function TransactionManagement() {
  const isMobile = useMediaQuery("(max-width: 768px)")

  // 如果是移动设备，使用移动端优化版本
  if (isMobile) {
    return <TransactionManagementMobile />
  }

  // 桌面端版本
  const { toast } = useToast()
  const { executeOperation } = useEnhancedOperations()
  const [transactions, setTransactions] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [filter, setFilter] = useState({
    type: "all",
    startDate: null,
    endDate: null,
    accountId: null,
    categoryId: null,
    searchTerm: "",
  })
  const [sort, setSort] = useState({
    field: "transactionDate",
    direction: "desc",
  })
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
  })

  // 加载交易数据
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setIsLoading(true)
        const { data, total } = await getFinancialTransactions(
          filter.type === "all" ? undefined : filter.type,
          filter.startDate,
          filter.endDate,
          filter.accountId,
          filter.categoryId,
          pagination.pageSize,
          (pagination.page - 1) * pagination.pageSize,
          sort.field,
          sort.direction,
          filter.searchTerm
        )
        setTransactions(data)
        setTotal(total)
        setIsLoading(false)
      } catch (error) {
        console.error("加载交易数据失败:", error)
        toast({
          variant: "destructive",
          title: "加载失败",
          description: error.message || "无法加载交易数据",
        })
        setIsLoading(false)
      }
    }

    loadTransactions()
  }, [toast, filter, sort, pagination])

  // 处理添加交易
  const handleAddTransaction = (type = "expense") => {
    setSelectedTransaction(null)
    setIsEditing(false)
    setIsFormOpen(true)
  }

  // 处理编辑交易
  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction)
    setIsEditing(true)
    setIsFormOpen(true)
  }

  // 处理删除交易
  const handleDeleteTransaction = (transaction) => {
    setSelectedTransaction(transaction)
    setIsDeleteDialogOpen(true)
  }

  // 确认删除交易
  const confirmDeleteTransaction = async () => {
    if (!selectedTransaction) return

    try {
      await executeOperation(
        async () => {
          await deleteFinancialTransaction(selectedTransaction.id)
          return selectedTransaction
        },
        {
          playSound: true,
          soundType: 'warning',
          feedbackMessage: `交易记录 "${selectedTransaction.counterparty || '未知'}" 已删除`,
          enableUndo: true,
          undoTags: ['delete', 'transaction'],
          undoPriority: 8
        }
      )

      setTransactions(transactions.filter(transaction => transaction.id !== selectedTransaction.id))
      setTotal(prev => prev - 1)
      setIsDeleteDialogOpen(false)
      setSelectedTransaction(null)
    } catch (error) {
      console.error("删除交易记录失败:", error)
      // 错误已由增强操作系统处理
    }
  }

  // 处理表单提交成功
  const handleFormSuccess = (newTransaction) => {
    if (isEditing) {
      setTransactions(transactions.map(transaction =>
        transaction.id === newTransaction.id ? newTransaction : transaction
      ))
    } else {
      setTransactions([newTransaction, ...transactions])
      setTotal(prev => prev + 1)
    }

    setIsFormOpen(false)
  }

  // 处理筛选
  const handleFilter = () => {
    setIsFilterOpen(true)
  }

  // 处理筛选提交
  const handleFilterSubmit = (newFilter) => {
    setFilter(newFilter)
    setPagination({ ...pagination, page: 1 }) // 重置到第一页
    setIsFilterOpen(false)
  }

  // 处理排序
  const handleSort = (field) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }))
  }

  // 处理分页
  const handlePageChange = (page) => {
    setPagination({ ...pagination, page })
  }

  // 表格列定义
  const columns = [
    {
      header: "日期",
      accessorKey: "transactionDate",
      cell: (info) => {
        const date = info.getValue()
        return date ? format(new Date(date), 'yyyy-MM-dd', { locale: zhCN }) : '-'
      },
      sortable: true,
      sortField: "transactionDate",
    },
    {
      header: "类型",
      accessorKey: "type",
      cell: (info) => {
        const type = info.getValue()
        return (
          <div className={
            type === "income" ? "text-green-600" :
            type === "expense" ? "text-red-600" :
            "text-blue-600"
          }>
            {type === "income" ? "收入" :
             type === "expense" ? "支出" :
             type === "transfer" ? "转账" : type}
          </div>
        )
      },
      sortable: true,
      sortField: "type",
    },
    {
      header: "分类",
      accessorKey: "category.name",
      cell: (info) => {
        const category = info.row.original.category
        return category?.name || '-'
      },
    },
    {
      header: "账户",
      accessorKey: "account.name",
      cell: (info) => {
        const account = info.row.original.account
        return account?.name || '-'
      },
    },
    {
      header: "交易对象",
      accessorKey: "counterparty",
      cell: (info) => info.getValue() || "-",
    },
    {
      header: "金额",
      accessorKey: "amount",
      cell: (info) => {
        const amount = parseFloat(info.getValue())
        const type = info.row.original.type

        return (
          <div className={`text-right font-medium ${
            type === "income" ? "text-green-600" :
            type === "expense" ? "text-red-600" :
            "text-blue-600"
          }`}>
            {type === "expense" ? "-" : type === "income" ? "+" : ""}
            {new Intl.NumberFormat('zh-CN', {
              style: 'currency',
              currency: 'CNY',
            }).format(amount)}
          </div>
        )
      },
      sortable: true,
      sortField: "amount",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const transaction = row.original
        return (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={(e) => {
              e.stopPropagation()
              handleEditTransaction(transaction)
            }}>
              <EditIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => {
              e.stopPropagation()
              handleDeleteTransaction(transaction)
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
              <CardTitle>交易记录管理</CardTitle>
              <CardDescription>管理所有财务交易记录</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleFilter}>
                <FilterIcon className="mr-2 h-4 w-4" />
                筛选
              </Button>
              <Button onClick={handleAddTransaction}>
                <PlusIcon className="mr-2 h-4 w-4" />
                添加交易
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="flex gap-4">
              <div className="w-40">
                <Select value={filter.type} onValueChange={(value) => setFilter({ ...filter, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="交易类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有类型</SelectItem>
                    <SelectItem value="income">收入</SelectItem>
                    <SelectItem value="expense">支出</SelectItem>
                    <SelectItem value="transfer">转账</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              共 {total} 条记录
            </div>
          </div>

          <ResponsiveDataGrid
            data={transactions}
            columns={columns}
            searchable={true}
            searchKeys={["counterparty", "notes"]}
            loading={isLoading}
            emptyText="暂无交易数据"
            onRowClick={(transaction) => handleEditTransaction(transaction)}
            pagination={{
              page: pagination.page,
              pageSize: pagination.pageSize,
              total,
              onPageChange: handlePageChange,
            }}
            sorting={{
              field: sort.field,
              direction: sort.direction,
              onSort: handleSort,
            }}
          />
        </CardContent>
      </Card>

      {/* 交易表单对话框 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "编辑交易" : "添加交易"}</DialogTitle>
          </DialogHeader>
          <TransactionForm
            transaction={selectedTransaction}
            isEditing={isEditing}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 筛选对话框 */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>筛选交易记录</DialogTitle>
          </DialogHeader>
          <TransactionFilterForm
            initialFilter={filter}
            onSubmit={handleFilterSubmit}
            onCancel={() => setIsFilterOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="确认删除"
        description="您确定要删除这条交易记录吗？此操作无法撤销。"
        onConfirm={confirmDeleteTransaction}
      />
    </div>
  )
}
