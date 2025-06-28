"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  PlusIcon, 
  SearchIcon, 
  CreditCardIcon, 
  BanknoteIcon,
  WalletIcon,
  TrendingUpIcon,
  EditIcon,
  TrashIcon
} from "lucide-react"
import { getFinancialAccounts } from "@/lib/actions/finance-actions"
import { toast } from "@/components/ui/use-toast"

export function FinanceAccountManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [accountData, setAccountData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAccountData()
  }, [])

  const loadAccountData = async () => {
    try {
      setIsLoading(true)
      const accounts = await getFinancialAccounts()
      setAccountData(accounts)
    } catch (error) {
      console.error("Error loading account data:", error)
      toast({
        title: "加载失败",
        description: "无法加载账户数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const stats = {
    totalBalance: accountData.reduce((sum, account) => sum + account.currentBalance, 0),
    activeAccounts: accountData.filter(account => account.isActive).length,
    bankAccounts: accountData.filter(account => account.accountType === "bank").length,
    cashAccounts: accountData.filter(account => account.accountType === "cash").length
  }

  const filteredAccounts = accountData.filter(account => 
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.bankName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getAccountTypeIcon = (type) => {
    switch (type) {
      case "bank":
        return <CreditCardIcon className="h-4 w-4" />
      case "cash":
        return <BanknoteIcon className="h-4 w-4" />
      default:
        return <WalletIcon className="h-4 w-4" />
    }
  }

  const getAccountTypeName = (type) => {
    switch (type) {
      case "bank":
        return "银行账户"
      case "cash":
        return "现金账户"
      case "alipay":
        return "支付宝"
      case "wechat":
        return "微信支付"
      default:
        return "其他"
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总余额</CardTitle>
            <WalletIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.totalBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">所有账户总余额</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃账户</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAccounts}</div>
            <p className="text-xs text-muted-foreground">正在使用的账户</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">银行账户</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bankAccounts}</div>
            <p className="text-xs text-muted-foreground">银行账户数量</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">现金账户</CardTitle>
            <BanknoteIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cashAccounts}</div>
            <p className="text-xs text-muted-foreground">现金账户数量</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>资金账户管理</CardTitle>
              <CardDescription>管理银行账户、现金账户和资金流水</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索账户..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                新增账户
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>加载中...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>账户名称</TableHead>
                  <TableHead>账户类型</TableHead>
                  <TableHead>账户号码</TableHead>
                  <TableHead>银行名称</TableHead>
                  <TableHead>当前余额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      暂无账户记录
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          {getAccountTypeIcon(account.accountType)}
                          <span>{account.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getAccountTypeName(account.accountType)}
                        </Badge>
                      </TableCell>
                      <TableCell>{account.accountNumber || "-"}</TableCell>
                      <TableCell>{account.bankName || "-"}</TableCell>
                      <TableCell className="font-medium">
                        ¥{account.currentBalance.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.isActive ? "default" : "secondary"}>
                          {account.isActive ? "活跃" : "停用"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
