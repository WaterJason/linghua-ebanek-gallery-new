"use client"

import { useEffect, useRef } from "react"
import * as echarts from "echarts/core"
import {
  BarChart as EBarChart,
  LineChart as ELineChart,
  PieChart as EPieChart,
} from "echarts/charts"
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
} from "echarts/components"
import { LabelLayout, UniversalTransition } from "echarts/features"
import { CanvasRenderer } from "echarts/renderers"

// 注册必要的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  LabelLayout,
  UniversalTransition,
  EBarChart,
  ELineChart,
  EPieChart,
  CanvasRenderer,
])

// 柱状图组件
export function BarChart({ data, xAxisKey, yAxisKey, title }) {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    // 初始化图表
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    // 窗口大小变化时重新调整图表大小
    const handleResize = () => {
      chartInstance.current?.resize()
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      chartInstance.current?.dispose()
    }
  }, [])

  useEffect(() => {
    if (!chartInstance.current || !data || data.length === 0) return

    // 准备数据
    const xAxisData = data.map(item => item[xAxisKey])
    const seriesData = data.map(item => item[yAxisKey])

    // 设置图表选项
    const option = {
      title: {
        text: title,
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        formatter: params => {
          const item = params[0]
          return `${item.name}: ¥${item.value.toFixed(2)}`
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: xAxisData,
        axisLabel: {
          interval: 0,
          rotate: 30,
          formatter: value => {
            return value.length > 8 ? value.substring(0, 8) + "..." : value
          },
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: value => {
            return `¥${value}`
          },
        },
      },
      series: [
        {
          name: "销售额",
          type: "bar",
          data: seriesData,
          itemStyle: {
            color: "#3b82f6",
          },
        },
      ],
    }

    // 使用配置项设置图表
    chartInstance.current.setOption(option)
  }, [data, xAxisKey, yAxisKey, title])

  return <div ref={chartRef} style={{ width: "100%", height: "100%" }} />
}

// 折线图组件
export function LineChart({ data, xAxisKey, yAxisKey, title }) {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    // 初始化图表
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    // 窗口大小变化时重新调整图表大小
    const handleResize = () => {
      chartInstance.current?.resize()
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      chartInstance.current?.dispose()
    }
  }, [])

  useEffect(() => {
    if (!chartInstance.current || !data || data.length === 0) return

    // 准备数据
    const xAxisData = data.map(item => item[xAxisKey])
    const seriesData = data.map(item => item[yAxisKey])

    // 设置图表选项
    const option = {
      title: {
        text: title,
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        formatter: params => {
          const item = params[0]
          return `${item.name}: ¥${item.value.toFixed(2)}`
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: xAxisData,
        boundaryGap: false,
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: value => {
            return `¥${value}`
          },
        },
      },
      series: [
        {
          name: "销售额",
          type: "line",
          data: seriesData,
          smooth: true,
          itemStyle: {
            color: "#10b981",
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: "rgba(16, 185, 129, 0.5)",
              },
              {
                offset: 1,
                color: "rgba(16, 185, 129, 0.05)",
              },
            ]),
          },
        },
      ],
    }

    // 使用配置项设置图表
    chartInstance.current.setOption(option)
  }, [data, xAxisKey, yAxisKey, title])

  return <div ref={chartRef} style={{ width: "100%", height: "100%" }} />
}

// 饼图组件
export function PieChart({ data, nameKey, valueKey, title }) {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    // 初始化图表
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    // 窗口大小变化时重新调整图表大小
    const handleResize = () => {
      chartInstance.current?.resize()
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      chartInstance.current?.dispose()
    }
  }, [])

  useEffect(() => {
    if (!chartInstance.current || !data || data.length === 0) return

    // 准备数据
    const seriesData = data.map(item => ({
      name: item[nameKey],
      value: item[valueKey],
    }))

    // 设置图表选项
    const option = {
      title: {
        text: title,
        left: "center",
      },
      tooltip: {
        trigger: "item",
        formatter: params => {
          return `${params.name}: ¥${params.value.toFixed(2)} (${params.percent}%)`
        },
      },
      legend: {
        orient: "vertical",
        left: "left",
        formatter: name => {
          return name.length > 10 ? name.substring(0, 10) + "..." : name
        },
      },
      series: [
        {
          name: "销售额",
          type: "pie",
          radius: "50%",
          data: seriesData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    }

    // 使用配置项设置图表
    chartInstance.current.setOption(option)
  }, [data, nameKey, valueKey, title])

  return <div ref={chartRef} style={{ width: "100%", height: "100%" }} />
}
