"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ProductAnalytics } from "@/components/product/product-analytics"
import { useCachedProducts } from "@/hooks/use-cached-products"
import { useToast } from "@/components/ui/use-toast"
import { 
  AlertCircleIcon, 
  CheckCircleIcon, 
  BarChart3Icon, 
  RefreshCwIcon,
  ArrowLeftIcon
} from "lucide-react"
import Link from "next/link"

export default function ProductAnalyticsPage() {
  const { toast } = useToast()
  const { 
    products, 
    categories, 
    isLoading, 
    error, 
    refreshProducts 
  } = useCachedProducts({
    refreshInterval: 5 * 60 * 1000 // 5分钟刷新一次
  })
  
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  
  // 处理刷新
  const handleRefresh = async () => {
    try {
      await refreshProducts()
      setLastUpdated(new Date())
      
      toast({
        title: "数据已刷新",
        description: "产品数据已成功刷新",
      })
    } catch (error) {
      toast({
        title: "刷新失败",
        description: "无法刷新产品数据，请稍后再试",
        variant: "destructive",
      })
    }
  }
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">产品数据分析</h1>
          <p className="text-muted-foreground">
            查看产品数据统计和分析图表
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/products">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              返回产品管理
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            刷新数据
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>加载失败</AlertTitle>
          <AlertDescription>
            无法加载产品数据，请刷新页面重试。
            {error.message && <p className="mt-2">{error.message}</p>}
          </AlertDescription>
        </Alert>
      )}
      
      {isLoading && products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-muted-foreground">加载产品数据中...</p>
          </CardContent>
        </Card>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <BarChart3Icon className="h-12 w-12 text-muted-foreground opacity-20" />
            <h3 className="mt-4 text-lg font-medium">暂无产品数据</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              请先添加产品，然后再查看数据分析。
            </p>
            <Button className="mt-4" asChild>
              <Link href="/products">
                添加产品
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            最后更新: {lastUpdated.toLocaleString()}
            {isLoading && <span className="ml-2">(正在刷新...)</span>}
          </div>
          
          <ProductAnalytics products={products} />
          
          <Card>
            <CardHeader>
              <CardTitle>产品数据洞察</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">库存状态</h3>
                  <p className="text-sm">
                    {products.filter(p => !p.inventory || p.inventory === 0).length} 个产品缺货
                  </p>
                  <p className="text-sm">
                    {products.filter(p => p.inventory && p.inventory > 0 && p.inventory <= 5).length} 个产品库存不足 (5个以下)
                  </p>
                  <p className="text-sm">
                    {products.filter(p => p.inventory && p.inventory > 50).length} 个产品库存过多 (50个以上)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">价格分析</h3>
                  <p className="text-sm">
                    最低价格: ¥{Math.min(...products.map(p => p.price)).toFixed(2)}
                  </p>
                  <p className="text-sm">
                    最高价格: ¥{Math.max(...products.map(p => p.price)).toFixed(2)}
                  </p>
                  <p className="text-sm">
                    中位价格: ¥{
                      products
                        .map(p => p.price)
                        .sort((a, b) => a - b)[Math.floor(products.length / 2)]
                        .toFixed(2)
                    }
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">数据完整性</h3>
                <p className="text-sm">
                  {products.filter(p => !p.category).length} 个产品未分类
                </p>
                <p className="text-sm">
                  {products.filter(p => !p.imageUrl).length} 个产品缺少图片
                </p>
                <p className="text-sm">
                  {products.filter(p => !p.description).length} 个产品缺少描述
                </p>
                <p className="text-sm">
                  {products.filter(p => !p.dimensions).length} 个产品缺少尺寸信息
                </p>
                <p className="text-sm">
                  {products.filter(p => !p.material).length} 个产品缺少材质信息
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
