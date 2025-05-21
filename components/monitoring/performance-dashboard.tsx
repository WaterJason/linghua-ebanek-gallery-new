"use client"

import React, { useState, useEffect } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { 
  getAllMetrics, 
  clearAllMetrics, 
  PerformanceMetric 
} from '@/lib/monitoring/performance-monitor'
import { 
  DownloadIcon, 
  RefreshCwIcon, 
  TrashIcon, 
  FilterIcon, 
  BarChartIcon, 
  LineChartIcon, 
  TableIcon 
} from 'lucide-react'

/**
 * 性能监控仪表板组件
 * 
 * 用于显示收集到的性能数据，包括页面加载时间、组件渲染时间、用户交互时间等。
 */
export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [filteredMetrics, setFilteredMetrics] = useState<PerformanceMetric[]>([])
  const [filter, setFilter] = useState({
    name: '',
    minValue: '',
    maxValue: '',
    startDate: '',
    endDate: '',
    tags: ''
  })
  const [viewMode, setViewMode] = useState<'table' | 'bar' | 'line'>('table')
  const [activeTab, setActiveTab] = useState('all')
  
  // 加载性能指标
  useEffect(() => {
    loadMetrics()
  }, [])
  
  // 应用过滤器
  useEffect(() => {
    applyFilter()
  }, [metrics, filter, activeTab])
  
  // 加载性能指标
  const loadMetrics = () => {
    const allMetrics = getAllMetrics()
    setMetrics(allMetrics)
  }
  
  // 清除所有性能指标
  const handleClearMetrics = () => {
    if (confirm('确定要清除所有性能指标吗？此操作不可撤销。')) {
      clearAllMetrics()
      setMetrics([])
    }
  }
  
  // 导出性能指标
  const handleExportMetrics = () => {
    const data = JSON.stringify(filteredMetrics, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-metrics-${new Date().toISOString()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  // 应用过滤器
  const applyFilter = () => {
    let filtered = [...metrics]
    
    // 按标签页过滤
    if (activeTab !== 'all') {
      filtered = filtered.filter(metric => {
        if (activeTab === 'page_load') {
          return metric.name.startsWith('page_')
        } else if (activeTab === 'component') {
          return metric.name.startsWith('mark_render_')
        } else if (activeTab === 'interaction') {
          return metric.name.startsWith('interaction_')
        } else if (activeTab === 'web_vitals') {
          return ['cls', 'fid', 'lcp'].includes(metric.name)
        }
        return true
      })
    }
    
    // 按名称过滤
    if (filter.name) {
      filtered = filtered.filter(metric => 
        metric.name.toLowerCase().includes(filter.name.toLowerCase())
      )
    }
    
    // 按值范围过滤
    if (filter.minValue) {
      const minValue = parseFloat(filter.minValue)
      if (!isNaN(minValue)) {
        filtered = filtered.filter(metric => metric.value >= minValue)
      }
    }
    
    if (filter.maxValue) {
      const maxValue = parseFloat(filter.maxValue)
      if (!isNaN(maxValue)) {
        filtered = filtered.filter(metric => metric.value <= maxValue)
      }
    }
    
    // 按日期范围过滤
    if (filter.startDate) {
      const startDate = new Date(filter.startDate).getTime()
      if (!isNaN(startDate)) {
        filtered = filtered.filter(metric => metric.timestamp >= startDate)
      }
    }
    
    if (filter.endDate) {
      const endDate = new Date(filter.endDate).getTime()
      if (!isNaN(endDate)) {
        filtered = filtered.filter(metric => metric.timestamp <= endDate)
      }
    }
    
    // 按标签过滤
    if (filter.tags) {
      filtered = filtered.filter(metric => {
        if (!metric.tags) return false
        
        return Object.entries(metric.tags).some(([key, value]) => {
          const tagString = `${key}:${value}`
          return tagString.toLowerCase().includes(filter.tags.toLowerCase())
        })
      })
    }
    
    setFilteredMetrics(filtered)
  }
  
  // 重置过滤器
  const resetFilter = () => {
    setFilter({
      name: '',
      minValue: '',
      maxValue: '',
      startDate: '',
      endDate: '',
      tags: ''
    })
  }
  
  // 格式化时间戳
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }
  
  // 格式化标签
  const formatTags = (tags?: Record<string, string>) => {
    if (!tags) return ''
    
    return Object.entries(tags)
      .map(([key, value]) => `${key}:${value}`)
      .join(', ')
  }
  
  // 准备图表数据
  const prepareChartData = () => {
    // 按名称分组
    const groupedByName: Record<string, PerformanceMetric[]> = {}
    
    filteredMetrics.forEach(metric => {
      if (!groupedByName[metric.name]) {
        groupedByName[metric.name] = []
      }
      groupedByName[metric.name].push(metric)
    })
    
    // 转换为图表数据
    return Object.entries(groupedByName).map(([name, metrics]) => {
      // 计算平均值
      const sum = metrics.reduce((acc, metric) => acc + metric.value, 0)
      const avg = metrics.length > 0 ? sum / metrics.length : 0
      
      return {
        name,
        count: metrics.length,
        avg,
        min: Math.min(...metrics.map(m => m.value)),
        max: Math.max(...metrics.map(m => m.value)),
        latest: metrics[metrics.length - 1]?.value || 0
      }
    })
  }
  
  const chartData = prepareChartData()
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>性能监控仪表板</CardTitle>
        <CardDescription>
          查看和分析系统性能指标，包括页面加载时间、组件渲染时间、用户交互时间等。
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="page_load">页面加载</TabsTrigger>
            <TabsTrigger value="component">组件渲染</TabsTrigger>
            <TabsTrigger value="interaction">用户交互</TabsTrigger>
            <TabsTrigger value="web_vitals">Web Vitals</TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-6">
          {/* 过滤器 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="name">指标名称</Label>
              <Input
                id="name"
                placeholder="输入指标名称"
                value={filter.name}
                onChange={(e) => setFilter({ ...filter, name: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="minValue">最小值</Label>
                <Input
                  id="minValue"
                  type="number"
                  placeholder="最小值"
                  value={filter.minValue}
                  onChange={(e) => setFilter({ ...filter, minValue: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="maxValue">最大值</Label>
                <Input
                  id="maxValue"
                  type="number"
                  placeholder="最大值"
                  value={filter.maxValue}
                  onChange={(e) => setFilter({ ...filter, maxValue: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="tags">标签</Label>
              <Input
                id="tags"
                placeholder="输入标签 (key:value)"
                value={filter.tags}
                onChange={(e) => setFilter({ ...filter, tags: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetFilter}>
                <FilterIcon className="h-4 w-4 mr-2" />
                重置过滤器
              </Button>
              
              <Button variant="outline" size="sm" onClick={loadMetrics}>
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                刷新数据
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none h-8 px-2"
                  onClick={() => setViewMode('table')}
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'bar' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none h-8 px-2"
                  onClick={() => setViewMode('bar')}
                >
                  <BarChartIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'line' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none h-8 px-2"
                  onClick={() => setViewMode('line')}
                >
                  <LineChartIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleExportMetrics}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                导出数据
              </Button>
              
              <Button variant="destructive" size="sm" onClick={handleClearMetrics}>
                <TrashIcon className="h-4 w-4 mr-2" />
                清除数据
              </Button>
            </div>
          </div>
          
          {/* 数据展示 */}
          {viewMode === 'table' && (
            <div className="border rounded-md">
              <Table>
                <TableCaption>共 {filteredMetrics.length} 条性能指标</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>指标名称</TableHead>
                    <TableHead>值</TableHead>
                    <TableHead>单位</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>标签</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMetrics.slice(0, 100).map((metric, index) => (
                    <TableRow key={index}>
                      <TableCell>{metric.name}</TableCell>
                      <TableCell>{metric.value.toFixed(2)}</TableCell>
                      <TableCell>{metric.unit}</TableCell>
                      <TableCell>{formatTimestamp(metric.timestamp)}</TableCell>
                      <TableCell>{formatTags(metric.tags)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {viewMode === 'bar' && (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg" fill="#8884d8" name="平均值" />
                  <Bar dataKey="min" fill="#82ca9d" name="最小值" />
                  <Bar dataKey="max" fill="#ffc658" name="最大值" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {viewMode === 'line' && (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avg" stroke="#8884d8" name="平均值" />
                  <Line type="monotone" dataKey="min" stroke="#82ca9d" name="最小值" />
                  <Line type="monotone" dataKey="max" stroke="#ffc658" name="最大值" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          数据更新时间: {new Date().toLocaleString()}
        </div>
      </CardFooter>
    </Card>
  )
}
