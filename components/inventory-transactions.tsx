"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeftIcon, ArrowRightIcon, ArrowDownIcon, ArrowUpIcon, CalendarIcon } from "lucide-react"
import { getWarehouses, getInventoryTransactions } from "@/lib/actions/inventory-actions";
import { getProducts } from "@/lib/actions/product-actions";
import { toast } from "@/components/ui/use-toast"

export function InventoryTransactions() {
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [filters, setFilters] = useState({
    warehouseId: "all",
    productId: "all",
    type: "all",
    startDate: "",
    endDate: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(0)
  const limit = 10

  useEffect(() => {
    loadWarehouses()
    loadProducts()
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [filters, page])

  const loadWarehouses = async () => {
    try {
      const data = await getWarehouses()
      setWarehouses(data)
    } catch (error) {
      console.error("Error loading warehouses:", error)
      toast({
        title: "错误",
        description: "加载仓库列表失败",
        variant: "destructive",
      })
    }
  }

  const loadProducts = async () => {
    try {
      const data = await getProducts()
      setProducts(data)
    } catch (error) {
      console.error("Error loading products:", error)
      toast({
        title: "错误",
        description: "加载产品列表失败",
        variant: "destructive",
      })
    }
  }

  const loadTransactions = async () => {
    setIsLoading(true)
    try {
      const data = await getInventoryTransactions(
        filters.warehouseId && filters.warehouseId !== "all" ? Number(filters.warehouseId) : undefined,
        filters.productId && filters.productId !== "all" ? Number(filters.productId) : undefined,
        filters.type && filters.type !== "all" ? filters.type : undefined,
        limit,
        page * limit,
        filters.startDate || undefined,
        filters.endDate || undefined
      )
      setTransactions(data.data)
      setTotalTransactions(data.total)
    } catch (error) {
      console.error("Error loading transactions:", error)
      toast({
        title: "错误",
        description: error.message || "加载交易记录失败",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value })
    setPage(0) // 重置页码
  }

  const handleClearFilters = () => {
    setFilters({
      warehouseId: "all",
      productId: "all",
      type: "all",
      startDate: "",
      endDate: ""
    })
    setPage(0)
  }

  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case "initial":
        return <ArrowDownIcon className="h-4 w-4 text-blue-500" />
      case "import":
        return <ArrowDownIcon className="h-4 w-4 text-green-500" />
      case "adjustment":
        return <ArrowUpIcon className="h-4 w-4 text-yellow-500" />
      case "batch_adjustment":
        return <ArrowUpIcon className="h-4 w-4 text-orange-500" />
      case "transfer_in":
        return <ArrowDownIcon className="h-4 w-4 text-green-500" />
      case "transfer_out":
        return <ArrowUpIcon className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getTransactionTypeText = (type) => {
    switch (type) {
      case "initial":
        return "初始库存"
      case "import":
        return "导入"
      case "adjustment":
        return "调整"
      case "batch_adjustment":
        return "批量调整"
      case "transfer_in":
        return "转入"
      case "transfer_out":
        return "转出"
      default:
        return type
    }
  }

  const getWarehouseName = (id) => {
    const warehouse = warehouses.find((w) => w.id === id)
    return warehouse ? warehouse.name : "-"
  }

  const getProductName = (id) => {
    const product = products.find((p) => p.id === id)
    return product ? product.name : "-"
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const totalPages = Math.ceil(totalTransactions / limit)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>库存交易记录</CardTitle>
          <CardDescription>查看所有库存变动记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="warehouse-filter">仓库</Label>
              <Select value={filters.warehouseId} onValueChange={(value) => handleFilterChange("warehouseId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="所有仓库" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有仓库</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="product-filter">产品</Label>
              <Select value={filters.productId} onValueChange={(value) => handleFilterChange("productId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="所有产品" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有产品</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type-filter">类型</Label>
              <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="所有类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有类型</SelectItem>
                  <SelectItem value="initial">初始库存</SelectItem>
                  <SelectItem value="import">导入</SelectItem>
                  <SelectItem value="adjustment">调整</SelectItem>
                  <SelectItem value="batch_adjustment">批量调整</SelectItem>
                  <SelectItem value="transfer_in">转入</SelectItem>
                  <SelectItem value="transfer_out">转出</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={handleClearFilters}>
                清除筛选
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="start-date">开始日期</Label>
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                <Input
                  id="start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="end-date">结束日期</Label>
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                <Input
                  id="end-date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>产品</TableHead>
                  <TableHead>源仓库</TableHead>
                  <TableHead>目标仓库</TableHead>
                  <TableHead className="text-right">数量</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      暂无交易记录
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionTypeIcon(transaction.type)}
                          {getTransactionTypeText(transaction.type)}
                        </div>
                      </TableCell>
                      <TableCell>{getProductName(transaction.productId)}</TableCell>
                      <TableCell>
                        {transaction.sourceWarehouseId ? getWarehouseName(transaction.sourceWarehouseId) : "-"}
                      </TableCell>
                      <TableCell>
                        {transaction.targetWarehouseId ? getWarehouseName(transaction.targetWarehouseId) : "-"}
                      </TableCell>
                      <TableCell className="text-right">{transaction.quantity}</TableCell>
                      <TableCell>{transaction.notes || "-"}</TableCell>
                      <TableCell>{formatDateTime(transaction.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div>
                显示 {page * limit + 1} - {Math.min((page + 1) * limit, totalTransactions)} 条，共 {totalTransactions} 条
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                >
                  下一页
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
