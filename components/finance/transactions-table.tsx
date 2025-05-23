"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Plus, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { TransactionDialog } from "@/components/finance/transaction-dialog"
import { TransactionFilterDialog } from "@/components/finance/transaction-filter-dialog"
import { FinanceTransactionAuditLog } from "@/components/finance/finance-transaction-audit-log"
import { formatCurrency, formatDate } from "@/lib/utils"
import { PrismaFinancialTransaction, PrismaFinancialAccount, PrismaFinancialCategory } from "@/types/prisma-models"

interface TransactionsTableProps {
  transactions: PrismaFinancialTransaction[]
  total: number
  accounts: PrismaFinancialAccount[]
  categories: PrismaFinancialCategory[]
}

export function TransactionsTable({ transactions: initialTransactions, total: initialTotal, accounts, categories }: TransactionsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [transactions, setTransactions] = useState<PrismaFinancialTransaction[]>(initialTransactions)
  const [total, setTotal] = useState<number>(initialTotal)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<PrismaFinancialTransaction | null>(null)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [filters, setFilters] = useState({
    accountId: searchParams.get("accountId") ? parseInt(searchParams.get("accountId")!) : undefined,
    categoryId: searchParams.get("categoryId") ? parseInt(searchParams.get("categoryId")!) : undefined,
    type: searchParams.get("type") || undefined,
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
  })

  // 加载交易记录
  const loadTransactions = async () => {
    try {
      // 构建查询参数
      const queryParams = new URLSearchParams()
      if (filters.accountId) queryParams.append("accountId", filters.accountId.toString())
      if (filters.categoryId) queryParams.append("categoryId", filters.categoryId.toString())
      if (filters.type) queryParams.append("type", filters.type)
      if (filters.startDate) queryParams.append("startDate", filters.startDate)
      if (filters.endDate) queryParams.append("endDate", filters.endDate)

      queryParams.append("limit", pagination.pageSize.toString())
      queryParams.append("offset", (pagination.pageIndex * pagination.pageSize).toString())

      const response = await fetch(`/api/finance/transactions?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error("获取交易记录失败")
      }

      const data = await response.json()
      setTransactions(data.data)
      setTotal(data.total)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "加载失败",
        description: error instanceof Error ? error.message : "获取交易记录失败",
      })
    }
  }

  // 当筛选条件或分页变化时重新加载数据
  useEffect(() => {
    loadTransactions()
  }, [filters, pagination.pageIndex, pagination.pageSize])

  // 定义表格列
  const columns: ColumnDef<PrismaFinancialTransaction>[] = [
    {
      accessorKey: "transactionDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            交易日期
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("transactionDate"))
        return <div>{formatDate(date)}</div>
      },
    },
    {
      accessorKey: "type",
      header: "类型",
      cell: ({ row }) => {
        const type = row.getValue("type") as string
        return (
          <Badge variant={type === "income" ? "default" : type === "expense" ? "destructive" : "secondary"}>
            {type === "income" && "收入"}
            {type === "expense" && "支出"}
            {type === "transfer" && "转账"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            金额
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"))
        const type = row.getValue("type") as string

        return (
          <div className={`text-right font-medium ${type === "income" ? "text-green-600" : type === "expense" ? "text-red-600" : ""}`}>
            {formatCurrency(amount)}
          </div>
        )
      },
    },
    {
      accessorKey: "account.name",
      header: "账户",
      cell: ({ row }) => {
        const account = row.original.account
        return <div>{account?.name || "-"}</div>
      },
    },
    {
      accessorKey: "category.name",
      header: "分类",
      cell: ({ row }) => {
        const category = row.original.category
        return <div>{category?.name || "-"}</div>
      },
    },
    {
      accessorKey: "counterparty",
      header: "交易对方",
      cell: ({ row }) => <div>{row.getValue("counterparty") || "-"}</div>,
    },
    {
      accessorKey: "notes",
      header: "备注",
      cell: ({ row }) => <div>{row.getValue("notes") || "-"}</div>,
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={status === "completed" ? "default" : status === "pending" ? "outline" : "secondary"}>
            {status === "completed" && "已完成"}
            {status === "pending" && "待处理"}
            {status === "cancelled" && "已取消"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const transaction = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">打开菜单</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedTransaction(transaction)
                  setIsEditDialogOpen(true)
                }}
              >
                编辑交易
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedTransaction(transaction)
                  setIsAuditLogOpen(true)
                }}
              >
                查看日志
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/finance/transactions/${transaction.id}`, {
                      method: "DELETE",
                    })

                    if (!response.ok) {
                      const error = await response.json()
                      throw new Error(error.error || "删除交易记录失败")
                    }

                    toast({
                      title: "删除成功",
                      description: "交易记录已成功删除",
                    })

                    loadTransactions()
                  } catch (error) {
                    toast({
                      variant: "destructive",
                      title: "删除失败",
                      description: error instanceof Error ? error.message : "删除交易记录失败",
                    })
                  }
                }}
              >
                删除交易
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: transactions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    pageCount: Math.ceil(total / pagination.pageSize),
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="搜索交易对方..."
          value={(table.getColumn("counterparty")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("counterparty")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterDialogOpen(true)}
          >
            <Filter className="mr-2 h-4 w-4" />
            筛选
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadTransactions()
            }}
          >
            刷新
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                显示列 <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id === "transactionDate" && "交易日期"}
                      {column.id === "type" && "类型"}
                      {column.id === "amount" && "金额"}
                      {column.id === "account.name" && "账户"}
                      {column.id === "category.name" && "分类"}
                      {column.id === "counterparty" && "交易对方"}
                      {column.id === "notes" && "备注"}
                      {column.id === "status" && "状态"}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新增交易
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          共 {total} 条记录，当前显示第 {pagination.pageIndex * pagination.pageSize + 1}
          至 {Math.min((pagination.pageIndex + 1) * pagination.pageSize, total)} 条
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            下一页
          </Button>
        </div>
      </div>

      {/* 创建交易对话框 */}
      <TransactionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        accounts={accounts}
        categories={categories}
        onSuccess={() => {
          loadTransactions()
        }}
      />

      {/* 编辑交易对话框 */}
      {selectedTransaction && (
        <TransactionDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          transaction={selectedTransaction}
          accounts={accounts}
          categories={categories}
          onSuccess={() => {
            loadTransactions()
          }}
        />
      )}

      {/* 筛选对话框 */}
      <TransactionFilterDialog
        open={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        filters={filters}
        accounts={accounts}
        categories={categories}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters)
          setPagination({
            ...pagination,
            pageIndex: 0, // 重置到第一页
          })
        }}
      />

      {/* 审计日志对话框 */}
      {selectedTransaction && (
        <FinanceTransactionAuditLog
          open={isAuditLogOpen}
          onOpenChange={setIsAuditLogOpen}
          transaction={selectedTransaction}
        />
      )}
    </div>
  )
}
