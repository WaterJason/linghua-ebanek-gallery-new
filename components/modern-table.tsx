"use client"

import { ReactNode, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EmptyState } from "@/components/modern-page-container"
import { cn } from "@/lib/utils"
import {
  SearchIcon,
  PlusIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  FilterIcon,
} from "lucide-react"

interface TableColumn {
  key: string
  title: string
  width?: string
  sortable?: boolean
  render?: (value: any, record: any, index: number) => ReactNode
}

interface TableAction {
  key: string
  label: string
  icon?: ReactNode
  onClick: (record: any) => void
  variant?: "default" | "destructive" | "outline"
  disabled?: (record: any) => boolean
}

interface ModernTableProps {
  title?: string
  description?: string
  columns: TableColumn[]
  data: any[]
  actions?: TableAction[]
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  addButton?: {
    label: string
    onClick: () => void
  }
  emptyState?: {
    icon?: ReactNode
    title: string
    description?: string
    action?: ReactNode
  }
  loading?: boolean
  className?: string
}

export function ModernTable({
  title,
  description,
  columns,
  data,
  actions,
  searchable = true,
  searchPlaceholder = "搜索...",
  onSearch,
  addButton,
  emptyState,
  loading = false,
  className
}: ModernTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(columnKey)
      setSortDirection("asc")
    }
  }

  const filteredData = searchQuery
    ? data.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : data

  const sortedData = sortColumn
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortColumn]
        const bValue = b[sortColumn]
        const direction = sortDirection === "asc" ? 1 : -1
        
        if (typeof aValue === "string" && typeof bValue === "string") {
          return aValue.localeCompare(bValue) * direction
        }
        
        return (aValue - bValue) * direction
      })
    : filteredData

  if (loading) {
    return (
      <div className={cn("card-modern p-6", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("card-modern", className)}>
      {/* 表格头部 */}
      {(title || description || searchable || addButton) && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {searchable && (
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              )}
              
              {addButton && (
                <Button onClick={addButton.onClick} className="flex items-center gap-2">
                  <PlusIcon className="w-4 h-4" />
                  {addButton.label}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 表格内容 */}
      <div className="overflow-x-auto">
        {sortedData.length > 0 ? (
          <Table className="table-modern">
            <TableHeader className="table-header-modern">
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      "table-cell-modern font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300",
                      column.width && `w-${column.width}`,
                      column.sortable && "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.title}
                      {column.sortable && sortColumn === column.key && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
                {actions && actions.length > 0 && (
                  <TableHead className="table-cell-modern font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    操作
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((record, index) => (
                <TableRow
                  key={index}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className="table-cell-modern text-gray-800 dark:text-gray-200"
                    >
                      {column.render
                        ? column.render(record[column.key], record, index)
                        : record[column.key]}
                    </TableCell>
                  ))}
                  {actions && actions.length > 0 && (
                    <TableCell className="table-cell-modern">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action) => (
                            <DropdownMenuItem
                              key={action.key}
                              onClick={() => action.onClick(record)}
                              disabled={action.disabled?.(record)}
                              className={cn(
                                "flex items-center gap-2",
                                action.variant === "destructive" && "text-red-600 dark:text-red-400"
                              )}
                            >
                              {action.icon}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12">
            <EmptyState
              icon={emptyState?.icon}
              title={emptyState?.title || "暂无数据"}
              description={emptyState?.description || "当前没有可显示的数据"}
              action={emptyState?.action}
            />
          </div>
        )}
      </div>
    </div>
  )
}
