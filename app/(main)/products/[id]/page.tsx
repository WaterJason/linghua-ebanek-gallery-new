"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ModernPageContainer } from "@/components/modern-page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Product } from "@/types/product"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  EditIcon,
  ImageIcon,
  PackageIcon,
  TagIcon,
  DollarSignIcon,
} from "lucide-react"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载产品数据
  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const productId = Number(params.id)
        if (isNaN(productId)) {
          throw new Error("无效的产品ID")
        }

        const response = await fetch(`/api/products/${productId}`)
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("产品不存在")
          }
          throw new Error("加载产品数据失败")
        }

        const productData = await response.json()
        setProduct(productData)
      } catch (err) {
        console.error("加载产品数据失败:", err)
        setError(err instanceof Error ? err.message : "加载产品数据失败")

        toast({
          title: "加载失败",
          description: "无法加载产品数据，请稍后再试",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [params.id, toast])

  // 处理返回
  const handleBack = () => {
    router.push("/products")
  }

  // 处理编辑
  const handleEdit = () => {
    if (product) {
      router.push(`/products/${product.id}/edit`)
    }
  }

  if (isLoading) {
    return (
      <ModernPageContainer
        title="产品详情"
        description="查看产品详细信息"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <PackageIcon className="h-8 w-8 animate-pulse mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">加载产品数据中...</p>
          </div>
        </div>
      </ModernPageContainer>
    )
  }

  if (error || !product) {
    return (
      <ModernPageContainer
        title="产品详情"
        description="查看产品详细信息"
      >
        <div className="mb-6">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            返回产品列表
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>加载失败</AlertTitle>
          <AlertDescription>
            {error || "无法加载产品数据"}
          </AlertDescription>
        </Alert>
      </ModernPageContainer>
    )
  }

  return (
    <ModernPageContainer
      title={product.name}
      description="产品详细信息"
    >
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          返回产品列表
        </Button>
        <Button onClick={handleEdit}>
          <EditIcon className="h-4 w-4 mr-2" />
          编辑产品
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="aspect-square rounded-md overflow-hidden bg-muted">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground opacity-20" />
                <p className="mt-2 text-sm text-muted-foreground">暂无图片</p>
              </div>
            )}
          </div>

          {product.description && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-medium mb-2">产品描述</h2>
                <p className="text-sm whitespace-pre-line">{product.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold">{product.name}</h1>
                  {product.category && (
                    <div className="flex items-center gap-2 mt-2">
                      <TagIcon className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary">{product.category}</Badge>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <DollarSignIcon className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">
                    ¥{product.price.toFixed(2)}
                  </span>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">材质</p>
                    <p className="text-sm text-muted-foreground">{product.material || "未设置"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">单位</p>
                    <p className="text-sm text-muted-foreground">{product.unit || "未设置"}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  {product.barcode && (
                    <div>
                      <p className="text-sm font-medium">条码</p>
                      <p className="text-sm text-muted-foreground">{product.barcode}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium">创建时间</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(product.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">更新时间</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(product.updatedAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ModernPageContainer>
  )
}
