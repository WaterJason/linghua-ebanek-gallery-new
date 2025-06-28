"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Artwork, ArtworkCategory } from "@/types/artwork"
import { 
  PaletteIcon, 
  FolderIcon, 
  DollarSignIcon,
  TrendingUpIcon,
  BarChart3Icon
} from "lucide-react"

interface ArtworkStatsProps {
  artworks: Artwork[]
  categories: ArtworkCategory[]
  isLoading?: boolean
}

export function ArtworkStats({
  artworks,
  categories,
  isLoading = false
}: ArtworkStatsProps) {

  // 计算统计数据
  const stats = {
    totalArtworks: artworks.length,
    activeArtworks: artworks.filter(a => a.status === "active").length,
    inactiveArtworks: artworks.filter(a => a.status === "inactive").length,
    draftArtworks: artworks.filter(a => a.status === "draft").length,
    totalCategories: categories.length,
    totalValue: artworks.reduce((sum, artwork) => sum + artwork.price, 0),
    averagePrice: artworks.length > 0 ? artworks.reduce((sum, artwork) => sum + artwork.price, 0) / artworks.length : 0,
    totalInventory: artworks.reduce((sum, artwork) => sum + (artwork.inventory || 0), 0),
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 基础统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总作品数</p>
                <p className="text-2xl font-bold">{stats.totalArtworks}</p>
              </div>
              <PaletteIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">正常作品</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeArtworks}</p>
              </div>
              <TrendingUpIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">作品分类</p>
                <p className="text-2xl font-bold">{stats.totalCategories}</p>
              </div>
              <FolderIcon className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总价值</p>
                <p className="text-2xl font-bold">¥{stats.totalValue.toFixed(2)}</p>
              </div>
              <DollarSignIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3Icon className="h-5 w-5" />
              作品状态分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default">正常</Badge>
                  <span className="text-sm text-gray-600">正常销售的作品</span>
                </div>
                <span className="font-medium">{stats.activeArtworks}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">停用</Badge>
                  <span className="text-sm text-gray-600">已停用的作品</span>
                </div>
                <span className="font-medium">{stats.inactiveArtworks}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">草稿</Badge>
                  <span className="text-sm text-gray-600">草稿状态的作品</span>
                </div>
                <span className="font-medium">{stats.draftArtworks}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSignIcon className="h-5 w-5" />
              价格统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">平均价格</span>
                <span className="font-medium">¥{stats.averagePrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">最高价格</span>
                <span className="font-medium">
                  ¥{artworks.length > 0 ? Math.max(...artworks.map(a => a.price)).toFixed(2) : "0.00"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">最低价格</span>
                <span className="font-medium">
                  ¥{artworks.length > 0 ? Math.min(...artworks.map(a => a.price)).toFixed(2) : "0.00"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">总库存</span>
                <span className="font-medium">{stats.totalInventory}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 分类统计 */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderIcon className="h-5 w-5" />
              分类作品分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => {
                const categoryArtworks = artworks.filter(a => a.categoryId === category.id)
                return (
                  <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{category.name}</span>
                    <Badge variant="outline">{categoryArtworks.length}</Badge>
                  </div>
                )
              })}
              {/* 未分类作品 */}
              {(() => {
                const uncategorizedArtworks = artworks.filter(a => !a.categoryId)
                if (uncategorizedArtworks.length > 0) {
                  return (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">未分类</span>
                      <Badge variant="outline">{uncategorizedArtworks.length}</Badge>
                    </div>
                  )
                }
                return null
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
