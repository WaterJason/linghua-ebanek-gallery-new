"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ModernPageContainer } from "@/components/modern-page-container"
import { ProductForm } from "@/components/product/product-form"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { ProductFormData, ProductCategory } from "@/types/product"
import { ArrowLeftIcon } from "lucide-react"

export default function AddProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 加载分类数据
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/product-categories")
        if (!response.ok) {
          throw new Error("Failed to fetch categories")
        }
        const data = await response.json()
        setCategories(data)
      } catch (error) {
        console.error("Error loading categories:", error)
        toast({
          title: "加载失败",
          description: "无法加载产品分类数据",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadCategories()
  }, [toast])

  // 处理保存产品
  const handleSaveProduct = async (data: ProductFormData) => {
    try {
      setIsSaving(true)
      
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "创建产品失败")
      }

      const newProduct = await response.json()

      toast({
        title: "创建成功",
        description: "产品已成功创建",
      })

      // 跳转到产品详情页面
      router.push(`/products/${newProduct.id}`)
    } catch (error) {
      console.error("Error saving product:", error)
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "创建产品失败",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // 处理取消
  const handleCancel = () => {
    router.back()
  }

  // 处理返回
  const handleBack = () => {
    router.push("/products")
  }

  return (
    <ModernPageContainer
      title="添加产品"
      description="创建新的产品信息"
    >
      <div className="mb-6">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          返回产品列表
        </Button>
      </div>

      <div className="max-w-4xl">
        <ProductForm
          categories={categories}
          onSave={handleSaveProduct}
          onCancel={handleCancel}
          isLoading={isLoading}
          isSaving={isSaving}
        />
      </div>
    </ModernPageContainer>
  )
}
