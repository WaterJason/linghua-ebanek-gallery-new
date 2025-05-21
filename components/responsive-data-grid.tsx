"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, FilterIcon } from "lucide-react"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { cn } from "@/lib/utils"

interface Column<T> {
  key: string
  title: string
  render?: (value: any, record: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  hideOnMobile?: boolean
  width?: number | string
}

interface DataGridProps<T> {
  data: T[]
  columns: Column<T>[]
  title?: string
  pageSize?: number
  searchable?: boolean
  searchPlaceholder?: string
  searchKeys?: string[]
  loading?: boolean
  onRowClick?: (record: T) => void
  className?: string
  emptyText?: string
}

export function ResponsiveDataGrid<T>({
  data,
  columns,
  title,
  pageSize = 10,
  searchable = false,
  searchPlaceholder = "搜索...",
  searchKeys = [],
  loading = false,
  onRowClick,
  className,
  emptyText = "暂无数据"
}: DataGridProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const isMobile = useIsMobile()

  // 过滤列，在移动设备上隐藏某些列
  const visibleColumns = columns.filter(col => !isMobile || !col.hideOnMobile)

  // 搜索和排序数据
  const filteredData = data.filter(record => {
    if (!searchTerm || !searchable || searchKeys.length === 0) return true

    return searchKeys.some(key => {
      const value = record[key as keyof T]
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(searchTerm.toLowerCase())
    })
  })

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortKey) return 0

    const aValue = a[sortKey as keyof T]
    const bValue = b[sortKey as keyof T]

    if (aValue === bValue) return 0

    if (aValue === null || aValue === undefined) return sortDirection === "asc" ? -1 : 1
    if (bValue === null || bValue === undefined) return sortDirection === "asc" ? 1 : -1

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    return sortDirection === "asc"
      ? (aValue < bValue ? -1 : 1)
      : (bValue < aValue ? -1 : 1)
  })

  // 分页
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // 处理排序
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  // 重置分页
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // 移动设备上的卡片视图
  const renderMobileCard = (record: T) => {
    return (
      <Card
        key={JSON.stringify(record)}
        className={cn("mb-4 cursor-pointer hover:bg-accent/50 transition-colors",
          onRowClick && "cursor-pointer"
        )}
        onClick={() => onRowClick && onRowClick(record)}
      >
        <CardContent className="p-4">
          {visibleColumns.map((column, index) => (
            <div key={column.key} className={cn(
              "flex justify-between py-1",
              index !== 0 && "border-t border-border/30"
            )}>
              <span className="font-medium text-sm text-muted-foreground">{column.title}</span>
              <span className="text-sm">
                {column.render
                  ? column.render(record[column.key as keyof T], record)
                  : String(record[column.key as keyof T] || "-")
                }
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">{title}</h3>

          {searchable && (
            <div className="relative w-full max-w-sm">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={searchPlaceholder}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {isMobile ? (
        // 移动设备卡片视图
        <div>
          {loading ? (
            <div className="flex justify-center py-8">加载中...</div>
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{emptyText}</div>
          ) : (
            paginatedData.map(renderMobileCard)
          )}
        </div>
      ) : (
        // 桌面表格视图
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      column.sortable && "cursor-pointer hover:bg-accent/50",
                      column.width && typeof column.width === "number" ? `w-[${column.width}px]` : `w-[${column.width}]`
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center">
                      {column.title}
                      {sortKey === column.key && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                    {emptyText}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((record, index) => (
                  <TableRow
                    key={index}
                    className={cn(onRowClick && "cursor-pointer hover:bg-accent/50")}
                    onClick={() => onRowClick && onRowClick(record)}
                  >
                    {visibleColumns.map((column) => (
                      <TableCell key={column.key}>
                        {column.render
                          ? column.render(record[column.key as keyof T], record)
                          : String(record[column.key as keyof T] || "-")
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            显示 {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, filteredData.length)} 条，
            共 {filteredData.length} 条
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
