"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ProductDetailRecommendations } from "@/components/product/product-recommendations"
import { ProductAuditLog } from "@/components/product/product-audit-log"
import { getProduct, getProducts } from "@/lib/actions/product-actions";
import { Product } from "@/types/product"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  EditIcon,
  TrashIcon,
  PackageIcon,
  TagIcon,
  RulerIcon,
  CircleDollarSignIcon,
  PercentIcon,
  ImageIcon
} from "lucide-react"
import Link from "next/link"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const [product, setProduct] = useState<Product | null>(null)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载产品数据
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const productId = Number(params.id)
        if (isNaN(productId)) {
          throw new Error("无效的产品ID")
        }

        // 并行加载产品和所有产品数据
        const [productData, allProductsData] = await Promise.all([
          getProduct(productId),
          getProducts()
        ])

        if (!productData) {
          throw new Error("产品不存在")
        }

        setProduct(productData)
        setAllProducts(allProductsData)
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

    loadData()
  }, [params.id, toast])

  // 处理返回
  const handleBack = () => {
    router.back()
  }

  // 处理编辑
  const handleEdit = () => {
    if (!product) return
    router.push(`/products/edit/${product.id}`)
  }

  // 处理删除
  const handleDelete = () => {
    if (!product) return
    // 这里可以添加删除确认逻辑
    router.push("/products")
  }

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            返回
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-muted-foreground">加载产品数据中...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            返回
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>加载失败</AlertTitle>
          <AlertDescription>
            {error || "无法加载产品数据，请稍后再试"}
          </AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button asChild>
            <Link href="/products">
              返回产品列表
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            返回
          </Button>
          <h1 className="text-xl font-bold">产品详情</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <EditIcon className="h-4 w-4 mr-2" />
            编辑
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <TrashIcon className="h-4 w-4 mr-2" />
            删除
          </Button>
        </div>
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

          {/* 产品审计日志 */}
          <ProductAuditLog productId={product.id} />
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {product.categoryName && (
                <Badge variant="outline">{product.categoryName}</Badge>
              )}
              {product.type === "category_placeholder" ? (
                <Badge variant="secondary">下架</Badge>
              ) : (
                <Badge className="bg-green-100 text-green-800">上架</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <div className="text-3xl font-bold">¥{product.price.toFixed(2)}</div>
            {product.cost && (
              <div className="ml-2 text-sm text-muted-foreground">
                成本: ¥{product.cost.toFixed(2)}
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <RulerIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">尺寸</p>
                <p className="text-sm text-muted-foreground">
                  {product.dimensions || "未指定"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <TagIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">材质</p>
                <p className="text-sm text-muted-foreground">
                  {product.material || "未指定"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <PackageIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">单位</p>
                <p className="text-sm text-muted-foreground">
                  {product.unit || "未指定"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CircleDollarSignIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">库存</p>
                <p className="text-sm text-muted-foreground">
                  {product.inventory !== undefined && product.inventory !== null
                    ? product.inventory
                    : "未记录"}
                </p>
              </div>
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

            {product.sku && (
              <div>
                <p className="text-sm font-medium">SKU</p>
                <p className="text-sm text-muted-foreground">{product.sku}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium">提成比例</p>
              <p className="text-sm text-muted-foreground">{product.commissionRate}%</p>
            </div>

            {product.details && (
              <div>
                <p className="text-sm font-medium">作品介绍</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{product.details}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ProductDetailRecommendations
          product={product}
          allProducts={allProducts}
          maxRecommendations={4}
        />
      </div>
    </div>
  )
}
