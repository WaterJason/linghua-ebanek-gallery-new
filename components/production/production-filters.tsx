'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DateRange } from 'react-day-picker'
import {
  X,
  Search,
  Filter,
  RotateCcw
} from 'lucide-react'

interface ProductionFilters {
  search?: string
  status?: string[]
  stage?: string[]
  priority?: string[]
  location?: string[]
  assignedTo?: string[]
  dateRange?: DateRange
  productCategory?: string
}

interface ProductionFiltersProps {
  onFiltersChange: (filters: ProductionFilters) => void
}

const statusOptions = [
  { value: 'PENDING', label: '待处理' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
  { value: 'ON_HOLD', label: '暂停' },
  { value: 'DELAYED', label: '延期' },
  { value: 'EXCEPTION', label: '异常' }
]

const stageOptions = [
  { value: 'DESIGN', label: '产品设计' },
  { value: 'MATERIAL_PROCUREMENT', label: '底胎采购' },
  { value: 'SHIPPING_TO_PRODUCTION', label: '物流发送' },
  { value: 'IN_PRODUCTION', label: '工艺制作' },
  { value: 'QUALITY_CHECK', label: '质量检验' },
  { value: 'SHIPPING_BACK', label: '物流返回' },
  { value: 'PACKAGING', label: '包装装裱' },
  { value: 'SALES_READY', label: '渠道销售' }
]

const priorityOptions = [
  { value: 'LOW', label: '低' },
  { value: 'NORMAL', label: '普通' },
  { value: 'HIGH', label: '高' },
  { value: 'URGENT', label: '紧急' }
]

const locationOptions = [
  { value: '广州设计中心', label: '广州设计中心' },
  { value: '广西生产基地', label: '广西生产基地' },
  { value: '广州包装中心', label: '广州包装中心' },
  { value: '物流运输中', label: '物流运输中' }
]

export function ProductionFilters({ onFiltersChange }: ProductionFiltersProps) {
  const [filters, setFilters] = useState<ProductionFilters>({})
  const [isExpanded, setIsExpanded] = useState(false)

  // 更新筛选器
  const updateFilters = (newFilters: Partial<ProductionFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFiltersChange(updatedFilters)
  }

  // 重置筛选器
  const resetFilters = () => {
    setFilters({})
    onFiltersChange({})
  }

  // 处理多选筛选器
  const handleMultiSelectChange = (
    key: keyof ProductionFilters,
    value: string,
    checked: boolean
  ) => {
    const currentValues = (filters[key] as string[]) || []
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value)
    
    updateFilters({ [key]: newValues.length > 0 ? newValues : undefined })
  }

  // 获取活跃筛选器数量
  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.status?.length) count++
    if (filters.stage?.length) count++
    if (filters.priority?.length) count++
    if (filters.location?.length) count++
    if (filters.assignedTo?.length) count++
    if (filters.dateRange) count++
    if (filters.productCategory) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">筛选器</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              disabled={activeFiltersCount === 0}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              重置
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {isExpanded ? '收起' : '展开'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 搜索框 - 始终显示 */}
        <div className="space-y-2">
          <Label htmlFor="search">搜索</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="搜索订单号、产品名称..."
              value={filters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value || undefined })}
              className="pl-8"
            />
          </div>
        </div>

        {/* 展开的筛选器 */}
        {isExpanded && (
          <>
            {/* 状态筛选 */}
            <div className="space-y-2">
              <Label>状态</Label>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={filters.status?.includes(option.value) || false}
                      onCheckedChange={(checked) =>
                        handleMultiSelectChange('status', option.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={`status-${option.value}`} className="text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* 阶段筛选 */}
            <div className="space-y-2">
              <Label>生产阶段</Label>
              <div className="grid grid-cols-2 gap-2">
                {stageOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`stage-${option.value}`}
                      checked={filters.stage?.includes(option.value) || false}
                      onCheckedChange={(checked) =>
                        handleMultiSelectChange('stage', option.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={`stage-${option.value}`} className="text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* 优先级筛选 */}
            <div className="space-y-2">
              <Label>优先级</Label>
              <div className="grid grid-cols-2 gap-2">
                {priorityOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${option.value}`}
                      checked={filters.priority?.includes(option.value) || false}
                      onCheckedChange={(checked) =>
                        handleMultiSelectChange('priority', option.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={`priority-${option.value}`} className="text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* 地点筛选 */}
            <div className="space-y-2">
              <Label>地点</Label>
              <div className="grid grid-cols-2 gap-2">
                {locationOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`location-${option.value}`}
                      checked={filters.location?.includes(option.value) || false}
                      onCheckedChange={(checked) =>
                        handleMultiSelectChange('location', option.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={`location-${option.value}`} className="text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* 日期范围 */}
            <div className="space-y-2">
              <Label>日期范围</Label>
              <DatePickerWithRange
                date={filters.dateRange}
                onDateChange={(dateRange) => updateFilters({ dateRange })}
              />
            </div>

            {/* 产品类别 */}
            <div className="space-y-2">
              <Label htmlFor="product-category">产品类别</Label>
              <Select
                value={filters.productCategory || ''}
                onValueChange={(value) => updateFilters({ productCategory: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择产品类别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部类别</SelectItem>
                  <SelectItem value="vase">花瓶</SelectItem>
                  <SelectItem value="plate">盘子</SelectItem>
                  <SelectItem value="bowl">碗</SelectItem>
                  <SelectItem value="ornament">装饰品</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* 活跃筛选器标签 */}
        {activeFiltersCount > 0 && (
          <div className="space-y-2">
            <Label>活跃筛选器</Label>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  搜索: {filters.search}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilters({ search: undefined })}
                  />
                </Badge>
              )}
              
              {filters.status?.map((status) => (
                <Badge key={status} variant="secondary" className="flex items-center gap-1">
                  状态: {statusOptions.find(o => o.value === status)?.label}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleMultiSelectChange('status', status, false)}
                  />
                </Badge>
              ))}

              {filters.stage?.map((stage) => (
                <Badge key={stage} variant="secondary" className="flex items-center gap-1">
                  阶段: {stageOptions.find(o => o.value === stage)?.label}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleMultiSelectChange('stage', stage, false)}
                  />
                </Badge>
              ))}

              {filters.priority?.map((priority) => (
                <Badge key={priority} variant="secondary" className="flex items-center gap-1">
                  优先级: {priorityOptions.find(o => o.value === priority)?.label}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleMultiSelectChange('priority', priority, false)}
                  />
                </Badge>
              ))}

              {filters.location?.map((location) => (
                <Badge key={location} variant="secondary" className="flex items-center gap-1">
                  地点: {location}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleMultiSelectChange('location', location, false)}
                  />
                </Badge>
              ))}

              {filters.dateRange && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  日期范围
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilters({ dateRange: undefined })}
                  />
                </Badge>
              )}

              {filters.productCategory && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  类别: {filters.productCategory}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilters({ productCategory: undefined })}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
