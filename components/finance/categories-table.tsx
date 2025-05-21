"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Plus } from "lucide-react"

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
import { CategoryDialog } from "@/components/finance/category-dialog"
import { PrismaFinancialCategory } from "@/types/prisma-models"

interface CategoriesTableProps {
  categories: PrismaFinancialCategory[]
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<PrismaFinancialCategory | null>(null)

  // 定义表格列
  const columns: ColumnDef<PrismaFinancialCategory>[] = [
    {
      accessorKey: "name",
      header: "分类名称",
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "type",
      header: "分类类型",
      cell: ({ row }) => {
        const type = row.getValue("type") as string
        return (
          <Badge variant={type === "income" ? "default" : "destructive"}>
            {type === "income" ? "收入" : "支出"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "code",
      header: "分类编码",
      cell: ({ row }) => <div>{row.getValue("code")}</div>,
    },
    {
      accessorKey: "parentId",
      header: "父分类",
      cell: ({ row }) => {
        const parentId = row.getValue("parentId") as number | null
        if (!parentId) return <div>-</div>
        
        const parentCategory = categories.find(c => c.id === parentId)
        return <div>{parentCategory?.name || "-"}</div>
      },
    },
    {
      accessorKey: "description",
      header: "描述",
      cell: ({ row }) => <div>{row.getValue("description") || "-"}</div>,
    },
    {
      accessorKey: "isSystem",
      header: "系统预设",
      cell: ({ row }) => {
        const isSystem = row.getValue("isSystem") as boolean
        return isSystem ? <Badge>系统</Badge> : <div>-</div>
      },
    },
    {
      accessorKey: "isActive",
      header: "状态",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "启用" : "禁用"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const category = row.original

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
                  setSelectedCategory(category)
                  setIsEditDialogOpen(true)
                }}
                disabled={category.isSystem}
              >
                编辑分类
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  // 跳转到分类交易记录页面
                  router.push(`/finance/transactions?categoryId=${category.id}`)
                }}
              >
                查看交易记录
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    if (category.isSystem) {
                      throw new Error("系统预设分类不能删除")
                    }
                    
                    const response = await fetch(`/api/finance/categories/${category.id}`, {
                      method: "DELETE",
                    })
                    
                    if (!response.ok) {
                      const error = await response.json()
                      throw new Error(error.error || "删除分类失败")
                    }
                    
                    toast({
                      title: "删除成功",
                      description: "分类已成功删除",
                    })
                    
                    router.refresh()
                  } catch (error) {
                    toast({
                      variant: "destructive",
                      title: "删除失败",
                      description: error instanceof Error ? error.message : "删除分类失败",
                    })
                  }
                }}
                disabled={category.isSystem}
              >
                删除分类
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: categories,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="搜索分类名称..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const response = await fetch("/api/finance/categories?initialize=true")
                
                if (!response.ok) {
                  const error = await response.json()
                  throw new Error(error.error || "初始化分类失败")
                }
                
                toast({
                  title: "初始化成功",
                  description: "系统预设分类已成功初始化",
                })
                
                router.refresh()
              } catch (error) {
                toast({
                  variant: "destructive",
                  title: "初始化失败",
                  description: error instanceof Error ? error.message : "初始化分类失败",
                })
              }
            }}
          >
            初始化系统分类
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              router.refresh()
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
                      {column.id === "name" && "分类名称"}
                      {column.id === "type" && "分类类型"}
                      {column.id === "code" && "分类编码"}
                      {column.id === "parentId" && "父分类"}
                      {column.id === "description" && "描述"}
                      {column.id === "isSystem" && "系统预设"}
                      {column.id === "isActive" && "状态"}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新增分类
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
        <div className="text-muted-foreground text-sm">
          共 {table.getFilteredRowModel().rows.length} 条记录
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

      {/* 创建分类对话框 */}
      <CategoryDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        categories={categories}
        onSuccess={() => {
          router.refresh()
        }}
      />

      {/* 编辑分类对话框 */}
      {selectedCategory && (
        <CategoryDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          category={selectedCategory}
          categories={categories}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
