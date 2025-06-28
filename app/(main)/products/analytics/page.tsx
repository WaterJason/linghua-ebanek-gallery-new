"use client"

import { useState, useEffect } from "react"
import { ModernPageContainer } from "@/components/modern-page-container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  BarChart3Icon,
  TrendingUpIcon,
  TrendingDownIcon,
  PackageIcon,
  TagIcon,
  DollarSignIcon,
  RefreshCwIcon,
  ArrowLeftIcon
} from "lucide-react"
import { useRouter } from "next/navigation"

interface ProductStats {
  overview: {
    totalProducts: number
    totalCategories: number
    totalValue: number
    averagePrice: number
  }
  distribution: {
    byCategory: Array<{
      categoryId: number | null
      categoryName: string
      count: number
    }>
    byPrice: Array<{
      range: string
      count: number
    }>
  }
  quality: {
    productsWithoutImage: number
    lowInventoryProducts: number
    completionRate: number
  }
  recent: {
    recentlyCreated: Array<{
      id: number
      name: string
      price: number
      categoryName: string
      createdAt: string
    }>
  }
}

export default function ProductAnalyticsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState<ProductStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 加载统计数据
  const loadStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/products/stats")
      if (!response.ok) {
        throw new Error("Failed to fetch product statistics")
      }
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error("Error loading product statistics:", error)
      toast({
        title: "加载失败",
        description: "无法加载产品统计数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  // 处理返回
  const handleBack = () => {
    router.push("/products")
  }

  if (isLoading) {
    return (
      <ModernPageContainer
        title="产品分析"
        description="查看产品数据统计和分析报告"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCwIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">加载统计数据中...</p>
          </div>
        </div>
      </ModernPageContainer>
    )
  }

  return (
    <ModernPageContainer
      title="产品分析"
      description="查看产品数据统计和分析报告"
    >
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          返回产品列表
        </Button>
        <Button variant="outline" onClick={loadStats} disabled={isLoading}>
          <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          刷新数据
        </Button>
      </div>

      {stats ? (
        <div className="space-y-6">
          {/* 概览统计 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总产品数</CardTitle>
                <PackageIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overview.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  活跃产品总数
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">产品分类</CardTitle>
                <TagIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overview.totalCategories}</div>
                <p className="text-xs text-muted-foreground">
                  分类总数
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均价格</CardTitle>
                <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥{stats.overview.averagePrice.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  所有产品平均价格
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总价值</CardTitle>
                <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥{stats.overview.totalValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  所有产品总价值
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 质量指标 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3Icon className="h-5 w-5" />
                产品质量指标
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.quality.completionRate}%
                  </div>
                  <p className="text-sm text-muted-foreground">信息完整度</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.quality.productsWithoutImage}
                  </div>
                  <p className="text-sm text-muted-foreground">无图片产品</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {stats.quality.lowInventoryProducts}
                  </div>
                  <p className="text-sm text-muted-foreground">低库存产品</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 分类分布 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>热门分类</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.distribution.byCategory.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{category.categoryName}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{category.count}</div>
                        <div className="text-xs text-muted-foreground">
                          {stats.overview.totalProducts > 0 ?
                            ((category.count / stats.overview.totalProducts) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>价格分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.distribution.byPrice.map((range, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{range.range}</span>
                      <div className="text-right">
                        <div className="font-bold">{range.count}</div>
                        <div className="text-xs text-muted-foreground">
                          {stats.overview.totalProducts > 0 ?
                            ((range.count / stats.overview.totalProducts) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">暂无统计数据</p>
        </div>
      )}
    </ModernPageContainer>
  )
}
