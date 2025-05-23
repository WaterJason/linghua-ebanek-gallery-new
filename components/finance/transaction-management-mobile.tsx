"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { PlusIcon, EditIcon, TrashIcon, FilterIcon, SearchIcon, ChevronRightIcon } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export function TransactionManagementMobile() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
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
    pageSize: 10, // 移动端每页显示更少的记录
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
          searchQuery || filter.searchTerm
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
  }, [toast, filter, sort, pagination, searchQuery])

  // 处理添加交易
  const handleAddTransaction = () => {
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
      await deleteFinancialTransaction(selectedTransaction.id)
      
      setTransactions(transactions.filter(transaction => transaction.id !== selectedTransaction.id))
      setTotal(prev => prev - 1)
      
      toast({
        title: "删除成功",
        description: "交易记录已删除",
      })
      
      setIsDeleteDialogOpen(false)
      setSelectedTransaction(null)
    } catch (error) {
      console.error("删除交易记录失败:", error)
      toast({
        variant: "destructive",
        title: "删除失败",
        description: error.message || "无法删除交易记录",
      })
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

  // 格式化金额
  const formatAmount = (amount, type) => {
    return (
      <span className={`font-medium ${
        type === "income" ? "text-green-600" : 
        type === "expense" ? "text-red-600" : 
        "text-blue-600"
      }`}>
        {type === "expense" ? "-" : type === "income" ? "+" : ""}
        {new Intl.NumberFormat('zh-CN', {
          style: 'currency',
          currency: 'CNY',
        }).format(amount)}
      </span>
    )
  }

  // 获取交易类型标签
  const getTypeLabel = (type) => {
    switch (type) {
      case "income": return { label: "收入", color: "bg-green-100 text-green-800" }
      case "expense": return { label: "支出", color: "bg-red-100 text-red-800" }
      case "transfer": return { label: "转账", color: "bg-blue-100 text-blue-800" }
      default: return { label: type, color: "bg-gray-100 text-gray-800" }
    }
  }

  // 加载更多
  const loadMore = () => {
    if (transactions.length < total) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
    }
  }

  // 渲染加载状态
  const renderLoading = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="mb-3">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // 渲染空数据状态
  const renderEmpty = () => (
    <div className="text-center py-8">
      <p className="text-muted-foreground">暂无交易数据</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* 搜索和筛选栏 */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索交易..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={handleFilter}>
          <FilterIcon className="h-4 w-4" />
        </Button>
        <Button size="icon" onClick={handleAddTransaction}>
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* 类型筛选 */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
        <Button 
          variant={filter.type === "all" ? "default" : "outline"} 
          size="sm"
          className="whitespace-nowrap"
          onClick={() => setFilter({ ...filter, type: "all" })}
        >
          全部
        </Button>
        <Button 
          variant={filter.type === "income" ? "default" : "outline"} 
          size="sm"
          className="whitespace-nowrap"
          onClick={() => setFilter({ ...filter, type: "income" })}
        >
          收入
        </Button>
        <Button 
          variant={filter.type === "expense" ? "default" : "outline"} 
          size="sm"
          className="whitespace-nowrap"
          onClick={() => setFilter({ ...filter, type: "expense" })}
        >
          支出
        </Button>
        <Button 
          variant={filter.type === "transfer" ? "default" : "outline"} 
          size="sm"
          className="whitespace-nowrap"
          onClick={() => setFilter({ ...filter, type: "transfer" })}
        >
          转账
        </Button>
      </div>

      {/* 交易记录列表 */}
      <div className="space-y-3">
        {isLoading && pagination.page === 1 ? (
          renderLoading()
        ) : transactions.length === 0 ? (
          renderEmpty()
        ) : (
          <>
            {transactions.map((transaction) => {
              const typeInfo = getTypeLabel(transaction.type)
              return (
                <Card 
                  key={transaction.id} 
                  className="mb-3 hover:bg-muted/50 transition-colors"
                  onClick={() => handleEditTransaction(transaction)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(transaction.transactionDate), 'yyyy-MM-dd', { locale: zhCN })}
                      </div>
                      <Badge variant="outline" className={typeInfo.color}>
                        {typeInfo.label}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">
                          {transaction.counterparty || (transaction.category?.name || '未分类')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.account?.name || '未指定账户'}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {formatAmount(transaction.amount, transaction.type)}
                        <ChevronRightIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            {/* 加载更多按钮 */}
            {transactions.length < total && (
              <div className="text-center py-4">
                <Button 
                  variant="outline" 
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  {isLoading ? "加载中..." : "加载更多"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

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
