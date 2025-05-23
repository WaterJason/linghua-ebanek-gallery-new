"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, ChevronRightIcon } from "lucide-react"
import { AccountForm } from "@/components/finance/account-form"
import { AccountDetail } from "@/components/finance/account-detail"
import { getFinancialAccounts, deleteFinancialAccount } from "@/lib/actions/finance-actions"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function AccountManagementMobile() {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState([])
  const [filteredAccounts, setFilteredAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")

  // 加载账户数据
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setIsLoading(true)
        const data = await getFinancialAccounts()
        setAccounts(data)
        setFilteredAccounts(data)
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

  // 筛选账户
  useEffect(() => {
    let result = accounts;
    
    // 应用类型筛选
    if (activeFilter !== "all") {
      result = result.filter(account => account.type === activeFilter);
    }
    
    // 应用搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(account => 
        account.name.toLowerCase().includes(query) || 
        (account.accountNumber && account.accountNumber.toLowerCase().includes(query)) ||
        (account.description && account.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredAccounts(result);
  }, [accounts, activeFilter, searchQuery]);

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

  // 获取账户类型标签
  const getAccountTypeInfo = (type) => {
    switch (type) {
      case "bank": return { label: "银行账户", color: "bg-blue-100 text-blue-800", icon: "🏦" }
      case "cash": return { label: "现金账户", color: "bg-green-100 text-green-800", icon: "💵" }
      case "alipay": return { label: "支付宝", color: "bg-blue-100 text-blue-800", icon: "💰" }
      case "wechat": return { label: "微信支付", color: "bg-green-100 text-green-800", icon: "💬" }
      default: return { label: "其他账户", color: "bg-gray-100 text-gray-800", icon: "💼" }
    }
  }

  // 格式化金额
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(amount)
  }

  // 渲染加载状态
  const renderLoading = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="mb-3">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-24" />
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
      <p className="text-muted-foreground">暂无账户数据</p>
      <Button variant="outline" className="mt-4" onClick={handleAddAccount}>
        <PlusIcon className="mr-2 h-4 w-4" />
        添加账户
      </Button>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* 搜索和添加按钮 */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索账户..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button size="icon" onClick={handleAddAccount}>
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* 账户类型筛选 */}
      <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
        <TabsList className="w-full overflow-auto flex whitespace-nowrap p-0 h-9">
          <TabsTrigger value="all" className="flex-1">全部</TabsTrigger>
          <TabsTrigger value="bank" className="flex-1">银行</TabsTrigger>
          <TabsTrigger value="cash" className="flex-1">现金</TabsTrigger>
          <TabsTrigger value="alipay" className="flex-1">支付宝</TabsTrigger>
          <TabsTrigger value="wechat" className="flex-1">微信</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 账户列表 */}
      <div className="space-y-3">
        {isLoading ? (
          renderLoading()
        ) : filteredAccounts.length === 0 ? (
          renderEmpty()
        ) : (
          filteredAccounts.map((account) => {
            const typeInfo = getAccountTypeInfo(account.type)
            return (
              <Card 
                key={account.id} 
                className="mb-3 hover:bg-muted/50 transition-colors"
                onClick={() => handleViewAccount(account)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-medium flex items-center">
                      <span className="mr-2">{typeInfo.icon}</span>
                      {account.name}
                    </div>
                    <Badge variant="outline" className={`${account.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {account.isActive ? '活跃' : '非活跃'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-sm text-muted-foreground">
                      {account.accountNumber || typeInfo.label}
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">{formatAmount(account.currentBalance)}</span>
                      <ChevronRightIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

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
