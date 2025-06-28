"use client"

import { useState, useEffect } from "react"
import { ModernPageContainer } from "@/components/modern-page-container"
import { ProductCategoryList } from "@/components/product/product-category-list"
import { ProductCategoryForm } from "@/components/product/product-category-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { ProductCategory, ProductCategoryFormData } from "@/types/product"
import { PlusIcon, RefreshCwIcon } from "lucide-react"

export default function ProductCategoriesPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<ProductCategory | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<ProductCategory | null>(null)

  // 加载分类数据
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

  useEffect(() => {
    loadCategories()
  }, [])

  // 处理添加分类
  const handleAddCategory = () => {
    setCurrentCategory(null)
    setIsCategoryDialogOpen(true)
  }

  // 处理编辑分类
  const handleEditCategory = (category: ProductCategory) => {
    setCurrentCategory(category)
    setIsCategoryDialogOpen(true)
  }

  // 处理删除分类
  const handleDeleteCategory = (category: ProductCategory) => {
    setCategoryToDelete(category)
    setIsDeleteDialogOpen(true)
  }

  // 保存分类
  const handleSaveCategory = async (data: ProductCategoryFormData) => {
    try {
      const url = currentCategory 
        ? `/api/product-categories/${currentCategory.id}`
        : "/api/product-categories"
      
      const method = currentCategory ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "保存分类失败")
      }

      toast({
        title: "保存成功",
        description: currentCategory ? "分类已更新" : "分类已创建",
      })

      setIsCategoryDialogOpen(false)
      setCurrentCategory(null)
      await loadCategories()
    } catch (error) {
      console.error("Error saving category:", error)
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "保存分类失败",
        variant: "destructive",
      })
    }
  }

  // 确认删除分类
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return

    try {
      const response = await fetch(`/api/product-categories/${categoryToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "删除分类失败")
      }

      toast({
        title: "删除成功",
        description: "分类已删除",
      })

      setIsDeleteDialogOpen(false)
      setCategoryToDelete(null)
      await loadCategories()
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "删除分类失败",
        variant: "destructive",
      })
    }
  }

  return (
    <ModernPageContainer
      title="产品分类管理"
      description="管理产品分类，组织和分类您的产品"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button onClick={handleAddCategory}>
            <PlusIcon className="h-4 w-4 mr-2" />
            添加分类
          </Button>
          <Button variant="outline" onClick={loadCategories} disabled={isLoading}>
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      <ProductCategoryList
        categories={categories}
        onAddCategory={handleAddCategory}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
        isLoading={isLoading}
      />

      {/* 分类表单对话框 */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentCategory ? "编辑分类" : "添加分类"}
            </DialogTitle>
          </DialogHeader>
          <ProductCategoryForm
            category={currentCategory}
            categories={categories}
            onSave={handleSaveCategory}
            onCancel={() => {
              setIsCategoryDialogOpen(false)
              setCurrentCategory(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="删除分类"
        description={`确定要删除分类"${categoryToDelete?.name}"吗？此操作不可撤销。`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteDialogOpen(false)
          setCategoryToDelete(null)
        }}
      />
    </ModernPageContainer>
  )
}
