"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { CalendarIcon, FilterIcon, XIcon } from "lucide-react"

interface AuditLogFilterProps {
  filters: {
    action: string
    entityType: string
    userId: string
    startDate: Date | null
    endDate: Date | null
  }
  setFilters: (filters: any) => void
  resetFilters: () => void
}

export function AuditLogFilter({ filters, setFilters, resetFilters }: AuditLogFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // 操作类型选项
  const actionOptions = [
    { value: "", label: "全部操作" },
    { value: "create", label: "创建" },
    { value: "update", label: "更新" },
    { value: "delete", label: "删除" },
    { value: "view", label: "查看" },
    { value: "export", label: "导出" },
    { value: "import", label: "导入" },
    { value: "login", label: "登录" },
    { value: "logout", label: "登出" },
    { value: "approve", label: "审批" },
    { value: "reject", label: "拒绝" },
  ]

  // 实体类型选项
  const entityTypeOptions = [
    { value: "", label: "全部类型" },
    { value: "product", label: "产品" },
    { value: "order", label: "订单" },
    { value: "customer", label: "客户" },
    { value: "supplier", label: "供应商" },
    { value: "inventory", label: "库存" },
    { value: "user", label: "用户" },
    { value: "system", label: "系统" },
  ]

  // 更新过滤条件
  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value })
  }

  // 判断是否有活动的过滤条件
  const hasActiveFilters = () => {
    return (
      filters.action !== "" ||
      filters.entityType !== "" ||
      filters.userId !== "" ||
      filters.startDate !== null ||
      filters.endDate !== null
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <FilterIcon className="h-4 w-4 mr-2" />
          {isExpanded ? "收起过滤器" : "展开过滤器"}
        </Button>
        
        {hasActiveFilters() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
          >
            <XIcon className="h-4 w-4 mr-2" />
            清除过滤条件
          </Button>
        )}
      </div>
      
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 操作类型过滤器 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">操作类型</label>
            <Select
              value={filters.action}
              onValueChange={(value) => handleFilterChange("action", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择操作类型" />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* 实体类型过滤器 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">实体类型</label>
            <Select
              value={filters.entityType}
              onValueChange={(value) => handleFilterChange("entityType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择实体类型" />
              </SelectTrigger>
              <SelectContent>
                {entityTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* 操作人过滤器 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">操作人</label>
            <Input
              placeholder="输入操作人ID"
              value={filters.userId}
              onChange={(e) => handleFilterChange("userId", e.target.value)}
            />
          </div>
          
          {/* 日期范围过滤器 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">日期范围</label>
            <div className="flex space-x-2">
              {/* 开始日期 */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate ? (
                      format(filters.startDate, "yyyy-MM-dd")
                    ) : (
                      <span>开始日期</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.startDate || undefined}
                    onSelect={(date) => handleFilterChange("startDate", date)}
                    initialFocus
                    locale={zhCN}
                  />
                </PopoverContent>
              </Popover>
              
              {/* 结束日期 */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate ? (
                      format(filters.endDate, "yyyy-MM-dd")
                    ) : (
                      <span>结束日期</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.endDate || undefined}
                    onSelect={(date) => handleFilterChange("endDate", date)}
                    initialFocus
                    locale={zhCN}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
