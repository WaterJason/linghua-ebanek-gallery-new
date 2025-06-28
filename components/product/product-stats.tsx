"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Product, ProductCategory } from "@/types/product"
import {
  BarChart3Icon,
  PackageIcon,
  FolderIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  DollarSignIcon
} from "lucide-react"

interface ProductStatsProps {
  products: Product[]
  categories: ProductCategory[]
  isLoading?: boolean
}

export function ProductStats({
  products,
  categories,
  isLoading = false
}: ProductStatsProps) {
  // 计算统计数据
  const stats = useMemo(() => {
    if (isLoading || !products.length) {
      return {
        totalProducts: 0,
        totalCategories: 0,
        totalValue: 0,
        averagePrice: 0,
        activeProducts: 0,
        inactiveProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        categoryStats: [],
        materialStats: [],
        priceRangeStats: [],
        inventoryStats: {
          total: 0,
          average: 0,
          min: 0,
          max: 0
        }
      }
    }

    const totalProducts = products.length
    const totalCategories = categories.length
    const totalValue = products.reduce((sum, p) => sum + p.price, 0)
    const averagePrice = totalValue / totalProducts

    const activeProducts = products.filter(p => p.status === "active").length
    const inactiveProducts = products.filter(p => p.status !== "active").length

    const lowStockProducts = products.filter(p => (p.inventory || 0) > 0 && (p.inventory || 0) < 10).length
    const outOfStockProducts = products.filter(p => (p.inventory || 0) === 0).length

    // 按分类统计
    const categoryStats = categories.map(category => {
      const categoryProducts = products.filter(p => p.categoryId === category.id)
      return {
        name: category.name,
        count: categoryProducts.length,
        value: categoryProducts.reduce((sum, p) => sum + p.price, 0)
      }
    }).filter(stat => stat.count > 0).sort((a, b) => b.count - a.count)

    // 按材料统计
    const materialMap = new Map<string, { count: number, value: number }>()
    products.forEach(product => {
      const material = product.material || "未知"
      const existing = materialMap.get(material) || { count: 0, value: 0 }
      materialMap.set(material, {
        count: existing.count + 1,
        value: existing.value + product.price
      })
    })
    const materialStats = Array.from(materialMap.entries()).map(([name, data]) => ({
      name,
      ...data
    })).sort((a, b) => b.count - a.count)

    // 价格区间统计
    const priceRanges = [
      { name: "0-100", min: 0, max: 100 },
      { name: "100-500", min: 100, max: 500 },
      { name: "500-1000", min: 500, max: 1000 },
      { name: "1000-5000", min: 1000, max: 5000 },
      { name: "5000+", min: 5000, max: Infinity }
    ]
    const priceRangeStats = priceRanges.map(range => ({
      name: range.name,
      count: products.filter(p => p.price >= range.min && p.price < range.max).length
    })).filter(stat => stat.count > 0)

    // 库存统计
    const inventoryValues = products.map(p => p.inventory || 0)
    const inventoryStats = {
      total: inventoryValues.reduce((sum, val) => sum + val, 0),
      average: inventoryValues.reduce((sum, val) => sum + val, 0) / inventoryValues.length,
      min: Math.min(...inventoryValues),
      max: Math.max(...inventoryValues)
    }

    return {
      totalProducts,
      totalCategories,
      totalValue,
      averagePrice,
      activeProducts,
      inactiveProducts,
      lowStockProducts,
      outOfStockProducts,
      categoryStats,
      materialStats,
      priceRangeStats,
      inventoryStats
    }
  }, [products, categories, isLoading])

  // 格式化价格
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(price)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">加载统计数据中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 基础统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <PackageIcon className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">总产品数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FolderIcon className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <div className="text-2xl font-bold">{stats.totalCategories}</div>
                <p className="text-xs text-muted-foreground">总分类数</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <div className="text-2xl font-bold">{formatPrice(stats.totalValue)}</div>
                <p className="text-xs text-muted-foreground">总价值</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <div className="text-2xl font-bold">{formatPrice(stats.averagePrice)}</div>
                <p className="text-xs text-muted-foreground">平均价格</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 状态统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.activeProducts}</div>
            <p className="text-xs text-muted-foreground">正常产品</p>
            <Progress 
              value={(stats.activeProducts / stats.totalProducts) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">{stats.inactiveProducts}</div>
            <p className="text-xs text-muted-foreground">停用产品</p>
            <Progress 
              value={(stats.inactiveProducts / stats.totalProducts) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">库存不足</p>
            <div className="flex items-center mt-2">
              <AlertTriangleIcon className="h-4 w-4 text-yellow-600 mr-1" />
              <span className="text-xs">库存 &lt; 10</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.outOfStockProducts}</div>
            <p className="text-xs text-muted-foreground">缺货产品</p>
            <div className="flex items-center mt-2">
              <AlertTriangleIcon className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-xs">库存 = 0</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 分类统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3Icon className="h-5 w-5" />
              分类统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.categoryStats.slice(0, 5).map((stat, index) => (
                <div key={stat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="text-sm">{stat.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{stat.count} 个</div>
                    <div className="text-xs text-muted-foreground">{formatPrice(stat.value)}</div>
                  </div>
                </div>
              ))}
              {stats.categoryStats.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无分类数据
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 材料统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3Icon className="h-5 w-5" />
              材料统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.materialStats.slice(0, 5).map((stat, index) => (
                <div key={stat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="text-sm">{stat.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{stat.count} 个</div>
                    <div className="text-xs text-muted-foreground">{formatPrice(stat.value)}</div>
                  </div>
                </div>
              ))}
              {stats.materialStats.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无材料数据
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 库存统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            库存统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.inventoryStats.total}</div>
              <p className="text-xs text-muted-foreground">总库存</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(stats.inventoryStats.average)}</div>
              <p className="text-xs text-muted-foreground">平均库存</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.inventoryStats.min}</div>
              <p className="text-xs text-muted-foreground">最低库存</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.inventoryStats.max}</div>
              <p className="text-xs text-muted-foreground">最高库存</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
