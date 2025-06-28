"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ModernPageContainer } from "@/components/ui/modern-page-container"
import { ProductForm } from "@/components/product/product-form"
import { ProductCategory } from "@/types/product"

interface Product {
  id: number
  name: string
  price: number | null
  commissionRate: number
  type: string
  imageUrl: string | null
  imageUrls: string[]
  description: string | null
  categoryId: number | null
  barcode: string | null
  dimensions: string | null
  material: string
  unit: string
  inventory: number | null
  productCategory?: ProductCategory | null
  productTags?: Array<{
    tag: {
      id: number
      name: string
      color: string
    }
  }>
  tags?: Array<{
    id: number
    name: string
    color: string
  }>
}

export default function ProductEditPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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

        const result = await response.json()
        if (result.success && result.product) {
          console.log("🔄 [ProductEdit] 原始产品数据:", result.product)

          // 增强标签数据处理逻辑
          const productTags = result.product.productTags || []
          const tags = productTags.map((pt: any) => pt.tag).filter(Boolean)
          const tagIds = productTags.map((pt: any) => pt.tagId || pt.tag?.id).filter(Boolean)

          console.log("🔄 [ProductEdit] 处理后的标签数据:", { productTags, tags, tagIds })

          // 处理图片数据
          const imageUrls = result.product.imageUrls || []
          const imageUrl = result.product.imageUrl || (imageUrls.length > 0 ? imageUrls[0] : null)

          const productData = {
            ...result.product,
            tags: tags,
            tagIds: tagIds,
            imageUrl: imageUrl,
            imageUrls: imageUrls,
            // 确保分类数据正确
            categoryName: result.product.productCategory?.name || result.product.categoryName || null,
            // 确保材质和单位数据正确
            material: result.product.material || "珐琅",
            unit: result.product.unit || "套"
          }

          console.log("✅ [ProductEdit] 最终产品数据:", productData)
          setProduct(productData)
        } else {
          throw new Error("产品数据格式错误")
        }
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

  // 加载分类数据
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log("🔄 [ProductEdit] 开始加载分类数据...")
        const response = await fetch("/api/products/categories")
        if (response.ok) {
          const result = await response.json()
          console.log("🔄 [ProductEdit] 分类API响应:", result)
          const categories = result.categories || []
          console.log("✅ [ProductEdit] 分类数据加载成功:", categories)
          setCategories(categories)
        } else {
          console.error("🔥 [ProductEdit] 分类API响应失败:", response.status, response.statusText)
        }
      } catch (error) {
        console.error("🔥 [ProductEdit] 加载分类数据失败:", error)
      }
    }

    loadCategories()
  }, [])

  // 处理保存
  const handleSaveProduct = async (formData: any) => {
    if (!product) return

    setIsSaving(true)
    try {
      console.log("🔄 [ProductEdit] 提交表单数据:", formData)

      // 准备提交数据，确保标签数据格式正确
      const submitData = {
        ...formData,
        // 确保标签数据正确传递
        tagIds: formData.tagIds || [],
        // 确保图片数据正确
        imageUrls: formData.imageUrls || [],
        imageUrl: formData.imageUrl || null,
        // 确保分类数据正确
        categoryId: formData.categoryId === "uncategorized" ? null : formData.categoryId,
        // 确保价格数据正确
        price: formData.price !== null && formData.price !== undefined ? Number(formData.price) : null
      }

      console.log("🔄 [ProductEdit] 最终提交数据:", submitData)

      const response = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("🔥 [ProductEdit] API错误:", errorData)
        throw new Error(errorData.error || "更新产品失败")
      }

      const result = await response.json()
      console.log("✅ [ProductEdit] 更新成功:", result)

      toast({
        title: "更新成功",
        description: "产品信息已成功更新",
      })

      // 返回产品详情页面
      router.push(`/products/${product.id}`)
    } catch (error) {
      console.error("🔥 [ProductEdit] 更新产品失败:", error)
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "更新产品时发生错误",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // 处理取消
  const handleCancel = () => {
    router.push(`/products/${product?.id}`)
  }

  // 处理返回
  const handleBack = () => {
    router.push(`/products/${product?.id}`)
  }

  if (isLoading) {
    return (
      <ModernPageContainer
        title="编辑产品"
        description="修改产品信息"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">加载产品数据中...</p>
          </div>
        </div>
      </ModernPageContainer>
    )
  }

  if (error || !product) {
    return (
      <ModernPageContainer
        title="编辑产品"
        description="修改产品信息"
      >
        <div className="mb-6">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            返回
          </Button>
        </div>

        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {error || "无法加载产品数据"}
          </p>
          <Button onClick={() => router.push("/products")}>
            返回产品列表
          </Button>
        </div>
      </ModernPageContainer>
    )
  }

  return (
    <ModernPageContainer
      title={`编辑产品 - ${product.name}`}
      description="修改产品信息"
    >
      <div className="mb-6">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          返回产品详情
        </Button>
      </div>

      <div className="max-w-4xl">
        <ProductForm
          product={product}
          categories={categories}
          onSave={handleSaveProduct}
          onCancel={handleCancel}
        />
      </div>
    </ModernPageContainer>
  )
}
