"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, ComposedChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts"

type ChartType = "bar" | "line" | "pie" | "area" | "radar" | "composed"

interface ChartOptions {
  stacked?: boolean
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  showDataLabels?: boolean
  barSize?: number
  lineType?: "linear" | "monotone" | "step" | "stepAfter" | "stepBefore"
  areaType?: "linear" | "monotone" | "step" | "stepAfter" | "stepBefore"
  pieInnerRadius?: number
  pieOuterRadius?: number
  pieLabel?: boolean
  orientation?: "horizontal" | "vertical"
}

interface EnhancedChartProps {
  data: any[]
  title?: string
  description?: string
  type?: ChartType
  xAxisKey?: string
  yAxisKeys?: string[]
  colors?: string[]
  height?: number
  width?: string | number
  options?: ChartOptions
  className?: string
  allowTypeChange?: boolean
  allowDownload?: boolean
  emptyText?: string
  loading?: boolean
  formatters?: {
    [key: string]: (value: any) => string
  }
}

const DEFAULT_COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8",
  "#82CA9D", "#A4DE6C", "#D0ED57", "#F56C42", "#C71585"
]

export function EnhancedChart({
  data,
  title,
  description,
  type = "bar",
  xAxisKey = "name",
  yAxisKeys = ["value"],
  colors = DEFAULT_COLORS,
  height = 350,
  width = "100%",
  options = {},
  className,
  allowTypeChange = false,
  allowDownload = false,
  emptyText = "暂无数据",
  loading = false,
  formatters = {}
}: EnhancedChartProps) {
  const [chartType, setChartType] = useState<ChartType>(type)
  const [activeYAxisKeys, setActiveYAxisKeys] = useState<string[]>(yAxisKeys)
  const isMobile = useIsMobile()

  // 默认选项
  const defaultOptions: ChartOptions = {
    stacked: false,
    showGrid: true,
    showLegend: true,
    showTooltip: true,
    showDataLabels: false,
    barSize: 20,
    lineType: "monotone",
    areaType: "monotone",
    pieInnerRadius: 0,
    pieOuterRadius: 80,
    pieLabel: true,
    orientation: "vertical"
  }

  // 合并选项
  const chartOptions = { ...defaultOptions, ...options }

  // 移动设备上调整高度
  const chartHeight = isMobile ? Math.min(height, 300) : height

  // 格式化工具提示
  const formatTooltipValue = (value: any, name: string) => {
    if (formatters[name]) {
      return formatters[name](value)
    }
    return value
  }

  // 转换Chart.js格式的数据为Recharts格式
  const convertChartJsData = (chartJsData: any) => {
    if (!chartJsData || !chartJsData.datasets || !Array.isArray(chartJsData.datasets)) {
      return []
    }

    // 处理不同格式的Chart.js数据
    if (chartJsData.labels && Array.isArray(chartJsData.labels)) {
      // 标准Chart.js格式 {labels: [...], datasets: [{data: [...]}, ...]}
      const { labels, datasets } = chartJsData

      // 如果没有标签或数据集，返回空数组
      if (!labels.length || !datasets.length) {
        return []
      }

      // 转换为Recharts格式
      return labels.map((label, index) => {
        const dataPoint: any = { name: label }

        // 为每个数据集添加一个属性
        datasets.forEach((dataset, datasetIndex) => {
          const key = dataset.label || `dataset_${datasetIndex}`
          // 确保数据存在且索引有效
          if (dataset.data && index < dataset.data.length) {
            dataPoint[key] = dataset.data[index]
          } else {
            dataPoint[key] = 0 // 默认值
          }
        })

        return dataPoint
      })
    } else if (chartJsData.datasets && chartJsData.datasets.length > 0) {
      // 另一种常见格式，没有labels但有datasets
      const maxLength = Math.max(...chartJsData.datasets.map(ds => ds.data?.length || 0))
      const result = []

      for (let i = 0; i < maxLength; i++) {
        const dataPoint: any = { name: `Item ${i + 1}` }

        chartJsData.datasets.forEach((dataset, datasetIndex) => {
          const key = dataset.label || `dataset_${datasetIndex}`
          if (dataset.data && i < dataset.data.length) {
            dataPoint[key] = dataset.data[i]
          } else {
            dataPoint[key] = 0
          }
        })

        result.push(dataPoint)
      }

      return result
    }

    return []
  }

  // 下载图表为图片
  const handleDownload = () => {
    const svgElement = document.querySelector(".recharts-wrapper svg")
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL("image/png")

      // 下载图片
      const downloadLink = document.createElement("a")
      downloadLink.download = `${title || "chart"}-${new Date().toISOString().slice(0, 10)}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`
  }

  // 渲染图表
  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">加载中...</p>
          </div>
        </div>
      )
    }

    // 检查数据是否为有效的数组
    const isValidData = Array.isArray(data) && data.length > 0

    // 检查数据是否为Chart.js格式（带有datasets属性的对象）
    const isChartJsData = data && typeof data === 'object' && !Array.isArray(data) &&
      ((data.datasets && Array.isArray(data.datasets)) ||
       (data.labels && Array.isArray(data.labels)))

    // 如果数据无效且不是Chart.js格式，显示空状态
    if (!isValidData && !isChartJsData) {
      console.warn("EnhancedChart: Invalid data format", data)
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">{emptyText}</p>
        </div>
      )
    }

    // 如果是Chart.js格式的数据，转换为Recharts格式
    let chartData
    try {
      chartData = isChartJsData ? convertChartJsData(data) : data

      // 确保chartData是数组且不为空
      if (!Array.isArray(chartData) || chartData.length === 0) {
        console.warn("EnhancedChart: Data conversion resulted in empty array", { original: data, converted: chartData })
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">{emptyText}</p>
          </div>
        )
      }
    } catch (error) {
      console.error("EnhancedChart: Error converting data", error, data)
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">数据格式错误</p>
        </div>
      )
    }

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width={width} height={chartHeight}>
            <BarChart
              data={chartData}
              layout={chartOptions.orientation === "horizontal" ? "vertical" : "horizontal"}
              margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
            >
              {chartOptions.showGrid && <CartesianGrid strokeDasharray="3 3" />}

              {chartOptions.orientation === "horizontal" ? (
                <>
                  <XAxis type="number" />
                  <YAxis dataKey={xAxisKey} type="category" width={80} />
                </>
              ) : (
                <>
                  <XAxis dataKey={xAxisKey} />
                  <YAxis />
                </>
              )}

              {chartOptions.showTooltip && (
                <Tooltip formatter={formatTooltipValue} />
              )}

              {chartOptions.showLegend && <Legend />}

              {activeYAxisKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  stackId={chartOptions.stacked ? "stack" : undefined}
                  barSize={chartOptions.barSize}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer width={width} height={chartHeight}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
            >
              {chartOptions.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={xAxisKey} />
              <YAxis />

              {chartOptions.showTooltip && (
                <Tooltip formatter={formatTooltipValue} />
              )}

              {chartOptions.showLegend && <Legend />}

              {activeYAxisKeys.map((key, index) => (
                <Line
                  key={key}
                  type={chartOptions.lineType}
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case "pie":
        return (
          <ResponsiveContainer width={width} height={chartHeight}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={chartOptions.pieLabel}
                innerRadius={chartOptions.pieInnerRadius}
                outerRadius={chartOptions.pieOuterRadius}
                fill="#8884d8"
                dataKey={activeYAxisKeys[0]}
                nameKey={xAxisKey}
                label={chartOptions.pieLabel ? ({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(1)}%` : undefined}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>

              {chartOptions.showTooltip && (
                <Tooltip formatter={formatTooltipValue} />
              )}

              {chartOptions.showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer width={width} height={chartHeight}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
            >
              {chartOptions.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={xAxisKey} />
              <YAxis />

              {chartOptions.showTooltip && (
                <Tooltip formatter={formatTooltipValue} />
              )}

              {chartOptions.showLegend && <Legend />}

              {activeYAxisKeys.map((key, index) => (
                <Area
                  key={key}
                  type={chartOptions.areaType}
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.3}
                  stackId={chartOptions.stacked ? "stack" : undefined}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )

      case "radar":
        return (
          <ResponsiveContainer width={width} height={chartHeight}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey={xAxisKey} />
              <PolarRadiusAxis />

              {activeYAxisKeys.map((key, index) => (
                <Radar
                  key={key}
                  name={key}
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.2}
                />
              ))}

              {chartOptions.showLegend && <Legend />}

              {chartOptions.showTooltip && (
                <Tooltip formatter={formatTooltipValue} />
              )}
            </RadarChart>
          </ResponsiveContainer>
        )

      case "composed":
        return (
          <ResponsiveContainer width={width} height={chartHeight}>
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
            >
              {chartOptions.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={xAxisKey} />
              <YAxis />

              {chartOptions.showTooltip && (
                <Tooltip formatter={formatTooltipValue} />
              )}

              {chartOptions.showLegend && <Legend />}

              {activeYAxisKeys.map((key, index) => {
                // 为不同的键使用不同的图表类型
                const idx = index % 3
                if (idx === 0) {
                  return (
                    <Bar
                      key={key}
                      dataKey={key}
                      fill={colors[index % colors.length]}
                      barSize={chartOptions.barSize}
                    />
                  )
                } else if (idx === 1) {
                  return (
                    <Line
                      key={key}
                      type={chartOptions.lineType}
                      dataKey={key}
                      stroke={colors[index % colors.length]}
                    />
                  )
                } else {
                  return (
                    <Area
                      key={key}
                      type={chartOptions.areaType}
                      dataKey={key}
                      fill={colors[index % colors.length]}
                      stroke={colors[index % colors.length]}
                      fillOpacity={0.3}
                    />
                  )
                }
              })}
            </ComposedChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>

          <div className="flex items-center gap-2">
            {allowTypeChange && (
              <Tabs value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
                <TabsList className="grid grid-cols-3 h-8 w-auto">
                  <TabsTrigger value="bar" className="px-2 text-xs">柱状图</TabsTrigger>
                  <TabsTrigger value="line" className="px-2 text-xs">折线图</TabsTrigger>
                  <TabsTrigger value="pie" className="px-2 text-xs">饼图</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {allowDownload && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                导出
              </Button>
            )}
          </div>
        </div>

        {yAxisKeys.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {yAxisKeys.map((key) => (
              <Button
                key={key}
                variant={activeYAxisKeys.includes(key) ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  if (activeYAxisKeys.includes(key)) {
                    if (activeYAxisKeys.length > 1) {
                      setActiveYAxisKeys(activeYAxisKeys.filter(k => k !== key))
                    }
                  } else {
                    setActiveYAxisKeys([...activeYAxisKeys, key])
                  }
                }}
              >
                {key}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0 pt-2">
        <div className="h-[350px] w-full">
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  )
}
