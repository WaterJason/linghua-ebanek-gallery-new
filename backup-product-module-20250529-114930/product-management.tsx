"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Button } from "@/components/ui/button"
import { ProductList } from "@/components/product/product-list"
import { ProductListMobile } from "@/components/product/product-list-mobile"
import { CategoryTree } from "@/components/product/category-tree"
import { ProductForm } from "@/components/product/product-form"
import { CategoryForm } from "@/components/product/category-form"
import { ProductImport } from "@/components/product/product-import"
import { ProductAnalytics } from "@/components/product/product-analytics"
import { ProductBatchEdit } from "@/components/product/product-batch-edit"
import { UnitMaterialManager } from "@/components/product/unit-material-manager"
import { ProductExport } from "@/components/product/product-export"
import { ModernPageContainer } from "@/components/modern-page-container"
import { FavoriteButton } from "@/components/personalization/favorite-button"
import { useProducts } from "@/hooks/use-products"
import { useResponsive } from "@/hooks/use-responsive"
import {
  PackageIcon,
  TagIcon,
  ImageIcon,
  TagIcon as CategoryIcon,
  UploadIcon,
  EditIcon,
  RulerIcon,
  PaintBucketIcon,
  BarChart3Icon,
  FileSpreadsheetIcon,
  RefreshCwIcon
} from "lucide-react"
import Link from "next/link"
import {
  Product,
  ProductCategory,
  ProductFormData,
  CategoryFormData,
  BatchEditData,
  ImportResult
} from "@/types/product"
import { useToast } from "@/components/ui/use-toast"
import { useSmartOperation } from "@/hooks/use-feedback"
import { UndoRedoControls } from "@/components/ui/undo-redo-controls"
import { AnimatedButton } from "@/components/ui/micro-animations"

// 导入增强操作系统
import { useEnhancedOperations } from "@/lib/enhanced-operations-integration"
import { getProductUnits, getProductMaterials, addProductUnit, removeProductUnit, addProductMaterial, removeProductMaterial, batchUpdateProducts } from "@/lib/actions/product-actions";

export function ProductManagement() {
  // 初始化toast
  const { toast } = useToast()

  // 智能操作系统
  const {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    submitForm,
    deleteData
  } = useSmartOperation()

  // 增强操作系统
  const { executeOperation: enhancedExecuteOperation, executeFormOperation, executeBatchOperation } = useEnhancedOperations()

  // 检测设备类型
  const { isMobile, isTablet } = useResponsive()

  // 使用自定义钩子获取产品和分类数据
  const {
    products,
    categories,
    filteredProducts,
    isLoading,
    filter,
    updateFilter,
    loadData,
    saveProduct,
    saveCategory,
    deleteProduct,
    deleteCategory
  } = useProducts()

  // 组件状态
  const [activeTab, setActiveTab] = useState("products")
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isCategoryListDialogOpen, setIsCategoryListDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isBatchEditDialogOpen, setIsBatchEditDialogOpen] = useState(false)
  const [isUnitMaterialDialogOpen, setIsUnitMaterialDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
  const [currentCategory, setCurrentCategory] = useState<ProductCategory | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Product | ProductCategory | null>(null)
  const [deleteType, setDeleteType] = useState<"product" | "category" | "">("")
  const [units, setUnits] = useState<string[]>([])
  const [materials, setMaterials] = useState<string[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // 加载单位和材质数据
  useEffect(() => {
    const loadUnitsMaterials = async () => {
      try {
        const [unitsData, materialsData] = await Promise.all([
          getProductUnits(),
          getProductMaterials()
        ]);
        setUnits(unitsData);
        setMaterials(materialsData);
      } catch (error) {
        console.error("Error loading units and materials:", error);
        toast({
          title: "加载失败",
          description: "无法加载单位和材质数据",
          variant: "destructive",
        });
      }
    };

    loadUnitsMaterials();
  }, [toast]);

  // 处理添加产品
  const handleAddProduct = () => {
    setCurrentProduct(null)
    setIsProductDialogOpen(true)
  }

  // 处理编辑产品
  const handleEditProduct = (product: Product) => {
    setCurrentProduct(product)
    setIsProductDialogOpen(true)
  }

  // 处理删除产品
  const handleDeleteProduct = (product: Product) => {
    setItemToDelete(product)
    setDeleteType("product")
    setIsDeleteDialogOpen(true)
  }

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
    setItemToDelete(category)
    setDeleteType("category")
    setIsDeleteDialogOpen(true)
  }

  // 处理选择分类
  const handleSelectCategory = (categoryId: number) => {
    setActiveTab("products")
    updateFilter({ categoryId })
    setIsCategoryListDialogOpen(false)
  }

  // 处理打开分类管理
  const handleOpenCategoryManager = () => {
    setIsCategoryListDialogOpen(true)
  }

  // 处理产品选择
  const handleProductSelection = (ids: number[]) => {
    setSelectedProductIds(ids);
  }

  // 处理导入
  const handleImport = () => {
    setIsImportDialogOpen(true);
  }

  // 处理导入完成
  const handleImportComplete = async (result: ImportResult) => {
    try {
      await enhancedExecuteOperation(
        async () => {
          // 模拟导入进度处理
          for (let i = 0; i <= result.total; i++) {
            await new Promise(resolve => setTimeout(resolve, 10))
          }
          return result
        },
        {
          playSound: true,
          soundType: 'success',
          showProgress: true,
          progressTitle: '导入产品数据',
          feedbackMessage: `成功导入 ${result.success} 个产品，失败 ${result.failed} 个`,
          enableUndo: true,
          undoTags: ['import', 'products']
        }
      )

      setIsImportDialogOpen(false)
      // 重新加载数据
      loadData()
    } catch (error) {
      console.error("导入处理错误:", error)
      // 错误已由增强操作系统处理
    }
  }

  // 处理批量编辑
  const handleBatchEdit = () => {
    if (selectedProductIds.length === 0) {
      showWarning("请先选择要批量编辑的产品");
      return;
    }

    setIsBatchEditDialogOpen(true);
  }

  // 处理批量编辑提交
  const handleBatchEditSubmit = async (field: string, value: any, reason: string) => {
    try {
      // 构造批量更新所需的数据结构
      const updateData = selectedProductIds.map(id => ({
        id,
        [field]: value,
        updateReason: reason
      }));

      await executeBatchOperation(
        updateData,
        async (item, index) => {
          // 这里可以添加单个项目的处理逻辑
          console.log(`Processing item ${index + 1}:`, item)
          return await batchUpdateProducts([item])
        },
        '批量编辑产品',
        'products',
        {
          playSound: true,
          soundType: 'success',
          enableUndo: true,
          undoTags: ['batch-edit', 'products'],
          undoGroupId: `batch-edit-${Date.now()}`
        }
      )

      setIsBatchEditDialogOpen(false)
      // 重新加载数据
      loadData()
    } catch (error) {
      console.error("批量编辑错误:", error)
      // 错误已由增强操作系统处理
    }
  }

  // 处理单位材质管理
  const handleUnitMaterialManage = () => {
    setIsUnitMaterialDialogOpen(true);
  }

  // 处理添加单位
  const handleAddUnit = async (unit: string) => {
    try {
      if (!unit || unit.trim() === '') {
        throw new Error("单位名称不能为空");
      }

      await addProductUnit(unit);

      // 重新加载单位数据
      const unitsData = await getProductUnits();
      setUnits(unitsData);

      toast({
        title: "添加成功",
        description: `单位 "${unit}" 已成功添加`,
      });

      return true;
    } catch (error) {
      console.error("添加单位错误:", error);
      toast({
        title: "添加失败",
        description: error instanceof Error ? error.message : "添加单位失败",
        variant: "destructive",
      });
      throw error;
    }
  }

  // 处理删除单位
  const handleRemoveUnit = async (unit: string) => {
    try {
      if (!unit || unit.trim() === '') {
        throw new Error("单位名称不能为空");
      }

      await removeProductUnit(unit);

      // 重新加载单位数据
      const unitsData = await getProductUnits();
      setUnits(unitsData);

      toast({
        title: "删除成功",
        description: `单位 "${unit}" 已成功删除`,
      });

      return true;
    } catch (error) {
      console.error("删除单位错误:", error);
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "删除单位失败",
        variant: "destructive",
      });
      throw error;
    }
  }

  // 处理添加材质
  const handleAddMaterial = async (material: string) => {
    try {
      if (!material || material.trim() === '') {
        throw new Error("材质名称不能为空");
      }

      await addProductMaterial(material);

      // 重新加载材质数据
      const materialsData = await getProductMaterials();
      setMaterials(materialsData);

      toast({
        title: "添加成功",
        description: `材质 "${material}" 已成功添加`,
      });

      return true;
    } catch (error) {
      console.error("添加材质错误:", error);
      toast({
        title: "添加失败",
        description: error instanceof Error ? error.message : "添加材质失败",
        variant: "destructive",
      });
      throw error;
    }
  }

  // 处理删除材质
  const handleRemoveMaterial = async (material: string) => {
    try {
      if (!material || material.trim() === '') {
        throw new Error("材质名称不能为空");
      }

      await removeProductMaterial(material);

      // 重新加载材质数据
      const materialsData = await getProductMaterials();
      setMaterials(materialsData);

      toast({
        title: "删除成功",
        description: `材质 "${material}" 已成功删除`,
      });

      return true;
    } catch (error) {
      console.error("删除材质错误:", error);
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "删除材质失败",
        variant: "destructive",
      });
      throw error;
    }
  }

  // 处理确认删除
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return

    try {
      if (deleteType === "product") {
        await enhancedExecuteOperation(
          async () => {
            return await deleteProduct(itemToDelete.id!)
          },
          {
            playSound: true,
            soundType: 'warning',
            feedbackMessage: `产品 "${itemToDelete.name}" 已删除`,
            enableUndo: true,
            undoTags: ['delete', 'product'],
            undoPriority: 8
          }
        )
      } else if (deleteType === "category") {
        await enhancedExecuteOperation(
          async () => {
            return await deleteCategory(itemToDelete.id!)
          },
          {
            playSound: true,
            soundType: 'warning',
            feedbackMessage: `分类 "${itemToDelete.name}" 已删除`,
            enableUndo: true,
            undoTags: ['delete', 'category'],
            undoPriority: 8
          }
        )
      }
    } catch (error) {
      console.error("删除错误:", error)
      // 错误已由增强操作系统处理
    } finally {
      setItemToDelete(null)
      setDeleteType("")
      setIsDeleteDialogOpen(false)
    }
  }

  // 处理产品表单提交
  const handleProductFormSubmit = async (data: ProductFormData) => {
    console.log("处理产品表单提交:", data);

    // 验证数据
    if (!data.name || data.name.trim() === "") {
      toast({
        title: "验证失败",
        description: "产品名称不能为空",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(data.price) || data.price <= 0) {
      toast({
        title: "验证失败",
        description: "产品价格必须大于0",
        variant: "destructive",
      });
      return;
    }

    try {
      // 准备产品数据
      const productData = {
        ...data,
        name: data.name.trim(),
        price: Number(data.price),
        commissionRate: isNaN(Number(data.commissionRate)) ? 0 : Number(data.commissionRate),
        cost: data.cost && !isNaN(Number(data.cost)) ? Number(data.cost) : null,
      };

      // 使用增强操作系统
      const operationType = currentProduct ? '更新' : '创建'
      const beforeData = currentProduct
      const afterData = productData

      await executeFormOperation(
        async () => {
          return await saveProduct(productData)
        },
        beforeData,
        afterData,
        `${operationType}产品`,
        'products',
        {
          playSound: true,
          soundType: 'success',
          enableUndo: true,
          undoTags: [operationType.toLowerCase(), 'product'],
          undoPriority: 5
        }
      )

      setIsProductDialogOpen(false)
    } catch (error) {
      console.error("产品表单提交错误:", error);
      // 错误已由增强操作系统处理
    }
  }

  // 处理分类表单提交
  const handleCategoryFormSubmit = async (data: CategoryFormData) => {
    console.log("处理分类表单提交:", data);

    // 验证数据
    if (!data.name || data.name.trim() === "") {
      toast({
        title: "验证失败",
        description: "分类名称不能为空",
        variant: "destructive",
      });
      return;
    }

    try {
      // 准备分类数据
      const categoryData = {
        ...data,
        name: data.name.trim(),
        description: data.description || "",
        code: data.code || null,
        parentId: data.parentId || null,
        imageUrl: data.imageUrl || null,
        isActive: data.isActive !== false,
        sortOrder: data.sortOrder || 0,
      };

      // 使用增强操作系统
      const operationType = currentCategory ? '更新' : '创建'
      const beforeData = currentCategory
      const afterData = categoryData

      await executeFormOperation(
        async () => {
          return await saveCategory(categoryData)
        },
        beforeData,
        afterData,
        `${operationType}分类`,
        'products',
        {
          playSound: true,
          soundType: 'success',
          enableUndo: true,
          undoTags: [operationType.toLowerCase(), 'category'],
          undoPriority: 5
        }
      )

      setIsCategoryDialogOpen(false)
    } catch (error) {
      console.error("分类表单提交错误:", error);
      // 错误已由增强操作系统处理
    }
  }

  return (
    <ModernPageContainer
      title="产品管理"
      description="管理产品信息、分类和库存"
      breadcrumbs={[
        { label: "首页", href: "/" },
        { label: "产品管理" }
      ]}
      favoriteButton={
        <FavoriteButton
          type="page"
          title="产品管理"
          url="/products"
          icon="PackageIcon"
          category="product"
          description="管理产品信息、分类和库存"
          variant="ghost"
          size="sm"
        />
      }
      actions={
        <div className="flex flex-wrap gap-2">
          {/* 撤销重做控制 */}
          <UndoRedoControls compact showHistory={false} />

          <AnimatedButton variant="outline" size="sm" onClick={handleOpenCategoryManager}>
            <TagIcon className="h-4 w-4 mr-2" />
            产品分类
          </AnimatedButton>
          <AnimatedButton variant="outline" size="sm" onClick={handleUnitMaterialManage}>
            <RulerIcon className="h-4 w-4 mr-2" />
            单位与材质
          </AnimatedButton>
          <AnimatedButton variant="outline" size="sm" onClick={handleImport}>
            <UploadIcon className="h-4 w-4 mr-2" />
            导入产品
          </AnimatedButton>
          <AnimatedButton variant="outline" size="sm" onClick={handleBatchEdit} disabled={selectedProductIds.length === 0}>
            <EditIcon className="h-4 w-4 mr-2" />
            批量编辑 {selectedProductIds.length > 0 ? `(${selectedProductIds.length})` : ""}
          </AnimatedButton>
          <AnimatedButton variant="outline" size="sm" onClick={() => setIsExportDialogOpen(true)}>
            <FileSpreadsheetIcon className="h-4 w-4 mr-2" />
            导出数据
          </AnimatedButton>
        </div>
      }
    >

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">
            <PackageIcon className="h-4 w-4 mr-2" />
            产品列表
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3Icon className="h-4 w-4 mr-2" />
            数据分析
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
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
              isLoading={isLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
          </div>
          <ProductAnalytics products={products} />
        </TabsContent>
      </Tabs>

      {/* 产品添加/编辑对话框 */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{currentProduct ? "编辑产品" : "添加产品"}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <ProductForm
              product={currentProduct}
              categories={categories}
              units={units}
              materials={materials}
              onSubmit={handleProductFormSubmit}
              onCancel={() => setIsProductDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 分类添加/编辑对话框 */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{currentCategory ? "编辑分类" : "添加分类"}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <CategoryForm
              category={currentCategory}
              categories={categories}
              onSubmit={handleCategoryFormSubmit}
              onCancel={() => setIsCategoryDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="确认删除"
        description={
          deleteType === "product"
            ? "您确定要删除这个产品吗？此操作无法撤销。"
            : "您确定要删除这个分类吗？如果有产品使用此分类，删除可能会失败。"
        }
        confirmLabel="确认删除"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      >
        {itemToDelete && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
              {deleteType === "product" ? (
                itemToDelete.imageUrl ? (
                  <img
                    src={itemToDelete.imageUrl}
                    alt={itemToDelete.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <PackageIcon className="h-5 w-5 text-gray-400" />
                )
              ) : (
                <CategoryIcon className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div>
              <div className="font-medium">{itemToDelete.name}</div>
              {deleteType === "product" && itemToDelete.category && (
                <div className="text-sm text-muted-foreground">{itemToDelete.category}</div>
              )}
              {deleteType === "category" && (
                <div className="text-sm text-muted-foreground">
                  {(itemToDelete as ProductCategory).productCount} 个产品
                </div>
              )}
            </div>
          </div>
        )}
      </ConfirmDialog>

      {/* 产品导入对话框 */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>导入产品数据</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <ProductImport
              onImportComplete={handleImportComplete}
              onCancel={() => setIsImportDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 批量编辑对话框 */}
      <Dialog open={isBatchEditDialogOpen} onOpenChange={setIsBatchEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>批量编辑产品</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <ProductBatchEdit
              selectedIds={selectedProductIds}
              categories={categories}
              units={units}
              materials={materials}
              onBatchEdit={handleBatchEditSubmit}
              onCancel={() => setIsBatchEditDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 单位材质管理对话框 */}
      <Dialog open={isUnitMaterialDialogOpen} onOpenChange={setIsUnitMaterialDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>单位与材质管理</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <UnitMaterialManager
              units={units}
              materials={materials}
              onAddUnit={handleAddUnit}
              onRemoveUnit={handleRemoveUnit}
              onAddMaterial={handleAddMaterial}
              onRemoveMaterial={handleRemoveMaterial}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 产品导出对话框 */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>导出产品数据</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <ProductExport
              products={products}
              selectedProductIds={selectedProductIds}
              onExportComplete={() => {
                setIsExportDialogOpen(false)
                toast({
                  title: "导出成功",
                  description: "产品数据已成功导出",
                })
              }}
              onCancel={() => setIsExportDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 产品分类管理对话框 */}
      <Dialog open={isCategoryListDialogOpen} onOpenChange={setIsCategoryListDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>产品分类管理</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-2" style={{ maxHeight: 'calc(80vh - 120px)' }}>
            <CategoryTree
              categories={categories}
              onAddCategory={handleAddCategory}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
              onSelectCategory={handleSelectCategory}
              isLoading={isLoading}
            />
          </div>
        </DialogContent>
      </Dialog>
    </ModernPageContainer>
  )
}
