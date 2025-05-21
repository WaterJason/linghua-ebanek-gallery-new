"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SearchIcon, FilterIcon } from "lucide-react"

interface ResponsiveDataGridProps {
  data: any[]
  columns: {
    header: string
    accessorKey?: string
    id?: string
    cell?: ({ row }: { row: { original: any } }) => React.ReactNode
  }[]
  searchable?: boolean
  searchKeys?: string[]
  loading?: boolean
  emptyText?: string
  onRowClick?: (row: any) => void
  pagination?: boolean
  pageSize?: number
}

export function ResponsiveDataGrid({
  data,
  columns,
  searchable = false,
  searchKeys = [],
  loading = false,
  emptyText = "暂无数据",
  onRowClick,
  pagination = false,
  pageSize = 10,
}: ResponsiveDataGridProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredData, setFilteredData] = useState(data)
  const [currentPage, setCurrentPage] = useState(1)

  // 更新过滤数据
  useEffect(() => {
    if (!searchQuery) {
      setFilteredData(data)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = data.filter((item) => {
      return searchKeys.some((key) => {
        const value = getNestedValue(item, key)
        return value && String(value).toLowerCase().includes(query)
      })
    })

    setFilteredData(filtered)
    setCurrentPage(1)
  }, [searchQuery, data, searchKeys])

  // 获取嵌套对象的值
  const getNestedValue = (obj: any, path: string) => {
    const keys = path.split(".")
    return keys.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj)
  }

  // 获取当前页的数据
  const getCurrentPageData = () => {
    if (!pagination) return filteredData

    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredData.slice(startIndex, endIndex)
  }

  // 获取总页数
  const getTotalPages = () => {
    return Math.ceil(filteredData.length / pageSize)
  }

  // 渲染加载状态
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          {searchable && (
            <div className="w-full max-w-sm">
              <Skeleton className="h-10 w-full" />
            </div>
          )}
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index}>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // 渲染空数据状态
  if (filteredData.length === 0) {
    return (
      <div className="space-y-4">
        {searchable && (
          <div className="flex justify-between">
            <div className="w-full max-w-sm">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜索..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index}>{column.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyText}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // 渲染数据表格
  return (
    <div className="space-y-4">
      {searchable && (
        <div className="flex justify-between">
          <div className="w-full max-w-sm">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          {filteredData.length > 0 && (
            <div className="text-sm text-muted-foreground">
              共 {filteredData.length} 条记录
            </div>
          )}
        </div>
      )}
      <div className="rounded-md border">
        <ScrollArea className="h-[calc(100vh-300px)]">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index}>{column.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {getCurrentPageData().map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className={onRowClick ? "cursor-pointer hover:bg-muted" : ""}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {column.cell
                        ? column.cell({ row: { original: row } })
                        : column.accessorKey
                        ? getNestedValue(row, column.accessorKey)
                        : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {pagination && filteredData.length > pageSize && (
        <div className="flex items-center justify-center space-x-2 py-4">
          <button
            className="rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            上一页
          </button>
          <span className="text-sm">
            第 {currentPage} 页，共 {getTotalPages()} 页
          </span>
          <button
            className="rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50"
            disabled={currentPage === getTotalPages()}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
