"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { DownloadIcon, BarChart3Icon, CalendarIcon } from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { getCoffeeShopItems } from "@/lib/actions/sales-actions";

export function CoffeeItemsReport() {
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const [itemsData, setItemsData] = useState([])
  const [categorySummary, setCategorySummary] = useState([])
  const [topItems, setTopItems] = useState([])

  // 加载商品销售数据
  useEffect(() => {
    loadItemsData()
  }, [dateRange, selectedCategory])

  const loadItemsData = async () => {
    setIsLoading(true)
    try {
      // 使用服务器端操作获取咖啡店商品数据
      const startDate = dateRange.from.toISOString()
      const endDate = dateRange.to.toISOString()
      const category = selectedCategory !== "all" ? selectedCategory : undefined

      const data = await getCoffeeShopItems(startDate, endDate, category)
      setItemsData(data)
      generateSummary(data)
    } catch (error) {
      console.error("Error loading coffee shop items:", error)
      toast({
        title: "加载失败",
        description: "无法加载咖啡店商品数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateSummary = (data) => {
    if (!data || data.length === 0) {
      setCategorySummary([])
      setTopItems([])
      return
    }

    // 按类别分组统计
    const categoryMap = new Map()

    data.forEach(item => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, {
          category: item.category,
          totalQuantity: 0,
          totalSales: 0,
          itemCount: 0
        })
      }

      const categoryStats = categoryMap.get(item.category)
      categoryStats.totalQuantity += item.quantity
      categoryStats.totalSales += item.totalPrice
      categoryStats.itemCount += 1
    })

    setCategorySummary(Array.from(categoryMap.values()))

    // 计算热销商品
    const itemMap = new Map()

    data.forEach(item => {
      const key = item.name
      if (!itemMap.has(key)) {
        itemMap.set(key, {
          name: item.name,
          category: item.category,
          totalQuantity: 0,
          totalSales: 0,
          averagePrice: 0
        })
      }

      const itemStats = itemMap.get(key)
      itemStats.totalQuantity += item.quantity
      itemStats.totalSales += item.totalPrice
    })

    // 计算平均价格并排序
    const itemStats = Array.from(itemMap.values()).map(item => ({
      ...item,
      averagePrice: item.totalSales / item.totalQuantity
    }))

    // 按销售额排序，取前10
    const sortedItems = itemStats.sort((a, b) => b.totalSales - a.totalSales).slice(0, 10)
    setTopItems(sortedItems)
  }

  const handleExportReport = async () => {
    try {
      // 构建查询参数
      const params = new URLSearchParams({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        format: 'excel'
      })

      if (selectedCategory !== "all") {
        params.append('category', selectedCategory)
      }

      // 下载报表
      window.location.href = `/api/export/coffee-items?${params}`

      toast({
        title: "导出成功",
        description: "咖啡店商品报表已开始下载",
      })
    } catch (error) {
      console.error("Error exporting report:", error)
      toast({
        title: "导出失败",
        description: "无法导出咖啡店商品报表",
        variant: "destructive",
      })
    }
  }

  const getCategoryLabel = (category) => {
    const categoryMap = {
      "coffee": "咖啡",
      "tea": "茶饮",
      "food": "食品",
      "dessert": "甜点",
      "other": "其他"
    }
    return categoryMap[category] || category
  }

  return (
    <div className="space-y-6">
      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle>咖啡店商品分析</CardTitle>
          <CardDescription>查看和导出咖啡店商品销售分析</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "yyyy-MM-dd")} 至{" "}
                          {format(dateRange.to, "yyyy-MM-dd")}
                        </>
                      ) : (
                        format(dateRange.from, "yyyy-MM-dd")
                      )
                    ) : (
                      <span>选择日期范围</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="选择类别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类别</SelectItem>
                  <SelectItem value="coffee">咖啡</SelectItem>
                  <SelectItem value="tea">茶饮</SelectItem>
                  <SelectItem value="food">食品</SelectItem>
                  <SelectItem value="dessert">甜点</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={handleExportReport}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              导出报表
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 类别统计 */}
      <Card>
        <CardHeader>
          <CardTitle>类别销售统计</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">加载中...</div>
          ) : categorySummary.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">暂无数据</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类别</TableHead>
                  <TableHead className="text-right">商品种类</TableHead>
                  <TableHead className="text-right">销售数量</TableHead>
                  <TableHead className="text-right">销售金额</TableHead>
                  <TableHead className="text-right">占比</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorySummary.map(category => {
                  const totalSales = categorySummary.reduce((sum, cat) => sum + cat.totalSales, 0)
                  const percentage = totalSales > 0 ? (category.totalSales / totalSales) * 100 : 0

                  return (
                    <TableRow key={category.category}>
                      <TableCell>{getCategoryLabel(category.category)}</TableCell>
                      <TableCell className="text-right">{category.itemCount}</TableCell>
                      <TableCell className="text-right">{category.totalQuantity}</TableCell>
                      <TableCell className="text-right">¥{category.totalSales.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{percentage.toFixed(1)}%</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 热销商品 */}
      <Card>
        <CardHeader>
          <CardTitle>热销商品 TOP 10</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">加载中...</div>
          ) : topItems.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">暂无数据</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>排名</TableHead>
                  <TableHead>商品名称</TableHead>
                  <TableHead>类别</TableHead>
                  <TableHead className="text-right">销售数量</TableHead>
                  <TableHead className="text-right">销售金额</TableHead>
                  <TableHead className="text-right">平均单价</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topItems.map((item, index) => (
                  <TableRow key={item.name}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{getCategoryLabel(item.category)}</TableCell>
                    <TableCell className="text-right">{item.totalQuantity}</TableCell>
                    <TableCell className="text-right">¥{item.totalSales.toFixed(2)}</TableCell>
                    <TableCell className="text-right">¥{item.averagePrice.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
