"use client"

import { useState, useEffect } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ChevronsLeftIcon, 
  ChevronsRightIcon,
  SearchIcon,
  FilterIcon,
  MoreHorizontalIcon,
  ArrowUpDownIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Column<T> {
  key: string
  title: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  hideOnMobile?: boolean
  hideOnTablet?: boolean
  width?: string
}

interface Action<T> {
  label: string
  icon?: React.ReactNode
  onClick: (item: T) => void
  hideOnMobile?: boolean
}

interface ResponsiveDataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  actions?: Action<T>[]
  keyField: keyof T
  searchable?: boolean
  searchFields?: string[]
  pagination?: boolean
  pageSize?: number
  onRowClick?: (item: T) => void
  isLoading?: boolean
  emptyMessage?: string
  className?: string
}

/**
 * 响应式数据表格组件
 * 
 * 自动适应不同屏幕尺寸的数据表格
 */
export function ResponsiveDataTable<T>({
  data,
  columns,
  actions,
  keyField,
  searchable = false,
  searchFields = [],
  pagination = true,
  pageSize = 10,
  onRowClick,
  isLoading = false,
  emptyMessage = "暂无数据",
  className
}: ResponsiveDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  
  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024)
    }
    
    handleResize()
    window.addEventListener("resize", handleResize)
    
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])
  
  // 过滤数据
  const filteredData = searchTerm && searchable
    ? data.filter(item => {
        const searchValue = searchTerm.toLowerCase()
        return searchFields.length > 0
          ? searchFields.some(field => {
              const value = item[field as keyof T]
              return value !== undefined && 
                String(value).toLowerCase().includes(searchValue)
            })
          : Object.values(item).some(
              value => value !== undefined && 
                String(value).toLowerCase().includes(searchValue)
            )
      })
    : data
  
  // 排序数据
  const sortedData = sortField
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortField as keyof T]
        const bValue = b[sortField as keyof T]
        
        if (aValue === bValue) return 0
        
        const result = aValue < bValue ? -1 : 1
        return sortDirection === "asc" ? result : -result
      })
    : filteredData
  
  // 分页数据
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData
  
  // 处理排序
  const handleSort = (key: string) => {
    if (sortField === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(key)
      setSortDirection("asc")
    }
  }
  
  // 渲染移动端卡片视图
  const renderMobileView = () => {
    return (
      <div className="space-y-4">
        {paginatedData.map(item => (
          <Card 
            key={String(item[keyField])} 
            className={cn(
              "overflow-hidden transition-all hover:bg-muted/50",
              onRowClick && "cursor-pointer"
            )}
            onClick={() => onRowClick && onRowClick(item)}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                {columns
                  .filter(col => !col.hideOnMobile)
                  .map(column => (
                    <div key={column.key} className="flex justify-between items-start">
                      <div className="text-sm font-medium text-muted-foreground">
                        {column.title}
                      </div>
                      <div className="text-right">
                        {column.render 
                          ? column.render(item) 
                          : String(item[column.key as keyof T] || "-")
                        }
                      </div>
                    </div>
                  ))
                }
                
                {actions && actions.length > 0 && (
                  <div className="flex justify-end mt-2 pt-2 border-t">
                    {actions
                      .filter(action => !action.hideOnMobile)
                      .map((action, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            action.onClick(item)
                          }}
                        >
                          {action.icon}
                          {!action.icon && action.label}
                        </Button>
                      ))
                    }
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  
  // 渲染平板视图
  const renderTabletView = () => {
    return (
      <div className="space-y-4">
        {paginatedData.map(item => (
          <Card 
            key={String(item[keyField])} 
            className={cn(
              "overflow-hidden transition-all hover:bg-muted/50",
              onRowClick && "cursor-pointer"
            )}
            onClick={() => onRowClick && onRowClick(item)}
          >
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                {columns
                  .filter(col => !col.hideOnTablet)
                  .map(column => (
                    <div key={column.key} className="space-y-1">
                      <div className="text-sm font-medium text-muted-foreground">
                        {column.title}
                      </div>
                      <div>
                        {column.render 
                          ? column.render(item) 
                          : String(item[column.key as keyof T] || "-")
                        }
                      </div>
                    </div>
                  ))
                }
              </div>
              
              {actions && actions.length > 0 && (
                <div className="flex justify-end mt-4 pt-2 border-t">
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        action.onClick(item)
                      }}
                    >
                      {action.icon && <span className="mr-2">{action.icon}</span>}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  
  // 渲染桌面视图
  const renderDesktopView = () => {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(column => (
                <TableHead 
                  key={column.key}
                  className={cn(column.width)}
                >
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => handleSort(column.key)}
                    >
                      <span>{column.title}</span>
                      <ArrowUpDownIcon className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    column.title
                  )}
                </TableHead>
              ))}
              
              {actions && actions.length > 0 && (
                <TableHead className="w-[100px]">操作</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions && actions.length > 0 ? 1 : 0)}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map(item => (
                <TableRow 
                  key={String(item[keyField])}
                  className={onRowClick ? "cursor-pointer" : ""}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {columns.map(column => (
                    <TableCell key={column.key}>
                      {column.render 
                        ? column.render(item) 
                        : String(item[column.key as keyof T] || "-")
                      }
                    </TableCell>
                  ))}
                  
                  {actions && actions.length > 0 && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action, index) => (
                            <DropdownMenuItem
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation()
                                action.onClick(item)
                              }}
                            >
                              {action.icon && <span className="mr-2">{action.icon}</span>}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* 搜索和过滤 */}
      {searchable && (
        <div className="flex items-center">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-8"
            />
          </div>
        </div>
      )}
      
      {/* 数据表格 */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">加载中...</span>
        </div>
      ) : isMobile ? (
        renderMobileView()
      ) : isTablet ? (
        renderTabletView()
      ) : (
        renderDesktopView()
      )}
      
      {/* 分页 */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            显示 {paginatedData.length} 条，共 {sortedData.length} 条
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              第 {currentPage} 页，共 {totalPages} 页
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
