"use client"

import { useState } from "react"
import { ModernPageContainer } from "@/components/modern-page-container"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useProducts } from "@/hooks/use-products"
import { useResponsive } from "@/hooks/use-responsive"
import { ProductList } from "@/components/product/product-list"
import { ProductListMobile } from "@/components/product/product-list-mobile"
import { ProductForm } from "@/components/product/product-form"
import { ProductCategoryForm } from "@/components/product/product-category-form"
import { ProductCategoryList } from "@/components/product/product-category-list"
import { ProductStats } from "@/components/product/product-stats"
import { ProductFilter } from "@/components/product/product-filter"
import { ProductImportExport } from "@/components/product/product-import-export"
import { ProductFormData, ProductCategoryFormData } from "@/types/product"
import { PlusIcon, FolderPlusIcon, BarChart3Icon, RefreshCwIcon } from "lucide-react"

export function ProductManagement() {
  const { toast } = useToast()
  const { isMobile } = useResponsive()

  // 使用产品数据钩子
  const {
    products,
    categories,
    filter,
    filteredProducts,
    isLoading,
    updateFilter,
    saveProduct,
    saveCategory,
    deleteProduct,
    deleteCategory,
    loadData
  } = useProducts()

  // 对话框状态
  const [showProductForm, setShowProductForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null)
  const [editingCategory, setEditingCategory] = useState<ProductCategoryFormData | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])

  // 处理产品操作
  const handleAddProduct = () => {
    setEditingProduct(null)
    setShowProductForm(true)
  }

  const handleEditProduct = (product: any) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      price: product.price,
      categoryId: product.categoryId,
      barcode: product.barcode,
      imageUrl: product.imageUrl,
      imageUrls: product.imageUrls || [],
      type: product.type || "product",
      description: product.description,
      dimensions: product.dimensions,
      material: product.material || "珐琅",
      unit: product.unit || "套",
      inventory: product.inventory,
      tagIds: product.tagIds || [],
    })
    setShowProductForm(true)
  }

  // 专门处理内联编辑的函数
  const handleInlineEditProduct = async (productId: number, field: string, value: string | number): Promise<boolean> => {
    try {
      console.log(`[ProductManagement] 内联编辑: 产品${productId}, 字段${field}, 值${value}`)

      // 准备更新数据
      const updateData = {
        [field]: value
      }

      // 使用PATCH API进行部分更新
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error(`[ProductManagement] 内联编辑失败:`, errorData)
        toast({
          title: "更新失败",
          description: errorData.error || "无法更新产品信息",
          variant: "destructive",
        })
        return false
      }

      const result = await response.json()
      console.log(`[ProductManagement] 内联编辑成功:`, result)

      // 重新加载数据以确保一致性
      await loadData()

      return true
    } catch (error) {
      console.error(`[ProductManagement] 内联编辑异常:`, error)
      toast({
        title: "更新失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
      return false
    }
  }

  const handleDeleteProduct = async (productId: number) => {
    try {
      await deleteProduct(productId)
      toast({
        title: "成功",
        description: "产品删除成功",
      })
    } catch (error) {
      toast({
        title: "错误",
        description: "产品删除失败",
        variant: "destructive",
      })
    }
  }

  const handleSaveProduct = async (productData: ProductFormData) => {
    try {
      const result = await saveProduct(productData)
      if (result) {
        setShowProductForm(false)
        setEditingProduct(null)
      }
    } catch (error) {
      // 错误处理已在saveProduct中完成
    }
  }

  // 处理分类操作
  const handleAddCategory = () => {
    setEditingCategory(null)
    setShowCategoryForm(true)
  }

  const handleEditCategory = (category: any) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      code: category.code,
      parentId: category.parentId,
      description: category.description,
      imageUrl: category.imageUrl,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
    })
    setShowCategoryForm(true)
  }

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      await deleteCategory(categoryId)
      toast({
        title: "成功",
        description: "分类删除成功",
      })
    } catch (error) {
      toast({
        title: "错误",
        description: "分类删除失败",
        variant: "destructive",
      })
    }
  }

  const handleSaveCategory = async (categoryData: ProductCategoryFormData) => {
    try {
      const result = await saveCategory(categoryData)
      if (result) {
        setShowCategoryForm(false)
        setEditingCategory(null)
      }
    } catch (error) {
      // 错误处理已在saveCategory中完成
    }
  }

  // 处理产品选择
  const handleProductSelection = (productIds: number[]) => {
    setSelectedProducts(productIds)
  }

  // 刷新数据
  const handleRefresh = async () => {
    try {
      await loadData()
      toast({
        title: "成功",
        description: "数据刷新成功",
      })
    } catch (error) {
      toast({
        title: "错误",
        description: "数据刷新失败",
        variant: "destructive",
      })
    }
  }

  return (
    <ModernPageContainer
      title="产品管理"
      description="管理产品信息、分类和库存"
      breadcrumbs={[
        { label: "首页", href: "/" },
        { label: "产品管理", href: "/products" }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCwIcon className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCategory}
            className="flex items-center gap-2"
          >
            <FolderPlusIcon className="h-4 w-4" />
            新增分类
          </Button>
          <Button
            size="sm"
            onClick={handleAddProduct}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            新增产品
          </Button>
        </div>
      }
    >
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">产品列表</TabsTrigger>
          <TabsTrigger value="categories">分类管理</TabsTrigger>
          <TabsTrigger value="stats">统计分析</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {/* 导入导出功能 */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              共 {filteredProducts.length} 个产品
            </div>
            <ProductImportExport onImportComplete={loadData} />
          </div>

          {isMobile ? (
            <ProductListMobile
              products={filteredProducts}
              categories={categories}
              filter={filter}
              onFilterChange={updateFilter}
              onAddProduct={handleAddProduct}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onSelectionChange={handleProductSelection}
              isLoading={isLoading}
            />
          ) : (
            <ProductList
              products={filteredProducts}
              categories={categories}
              filter={filter}
              onFilterChange={updateFilter}
              onAddProduct={handleAddProduct}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onSelectionChange={handleProductSelection}
              onInlineEditProduct={handleInlineEditProduct}
              isLoading={isLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <ProductCategoryList
            categories={categories}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <ProductStats
            products={products}
            categories={categories}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* 产品表单对话框 */}
      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct?.id ? "编辑产品" : "新增产品"}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            categories={categories}
            onSave={handleSaveProduct}
            onCancel={() => {
              setShowProductForm(false)
              setEditingProduct(null)
            }}
            onCategoryCreated={loadData}
          />
        </DialogContent>
      </Dialog>

      {/* 分类表单对话框 */}
      <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory?.id ? "编辑分类" : "新增分类"}
            </DialogTitle>
          </DialogHeader>
          <ProductCategoryForm
            category={editingCategory}
            categories={categories}
            onSave={handleSaveCategory}
            onCancel={() => {
              setShowCategoryForm(false)
              setEditingCategory(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </ModernPageContainer>
  )
}
