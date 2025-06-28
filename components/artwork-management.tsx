"use client"

import { useState } from "react"
import { ModernPageContainer } from "@/components/modern-page-container"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useArtworks } from "@/hooks/use-artworks"
import { useResponsive } from "@/hooks/use-responsive"
import { ArtworkList } from "@/components/artwork/artwork-list"
import { ArtworkListMobile } from "@/components/artwork/artwork-list-mobile"
import { ArtworkForm } from "@/components/artwork/artwork-form"
import { ArtworkCategoryForm } from "@/components/artwork/artwork-category-form"
import { ArtworkCategoryList } from "@/components/artwork/artwork-category-list"
import { ArtworkStats } from "@/components/artwork/artwork-stats"
import { ArtworkFilter } from "@/components/artwork/artwork-filter"
import { ArtworkFormData, ArtworkCategoryFormData } from "@/types/artwork"
import { PlusIcon, FolderPlusIcon, BarChart3Icon, RefreshCwIcon } from "lucide-react"

export function ArtworkManagement() {
  // 初始化toast
  const { toast } = useToast()

  // 检测设备类型
  const { isMobile, isTablet } = useResponsive()

  // 使用自定义钩子获取作品和分类数据
  const {
    artworks,
    categories,
    filteredArtworks,
    isLoading,
    filter,
    updateFilter,
    loadData,
    saveArtwork,
    saveCategory,
    deleteArtwork,
    deleteCategory
  } = useArtworks()

  // 对话框状态
  const [artworkDialogOpen, setArtworkDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingArtwork, setEditingArtwork] = useState<ArtworkFormData | null>(null)
  const [editingCategory, setEditingCategory] = useState<ArtworkCategoryFormData | null>(null)

  // 选中的作品
  const [selectedArtworks, setSelectedArtworks] = useState<number[]>([])

  // 处理添加作品
  const handleAddArtwork = () => {
    setEditingArtwork(null)
    setArtworkDialogOpen(true)
  }

  // 处理编辑作品
  const handleEditArtwork = (artwork: ArtworkFormData) => {
    setEditingArtwork(artwork)
    setArtworkDialogOpen(true)
  }

  // 处理删除作品
  const handleDeleteArtwork = async (artworkId: number) => {
    const artwork = artworks.find(p => p.id === artworkId)
    if (!artwork) return

    if (window.confirm(`确定要删除作品"${artwork.name}"吗？`)) {
      const success = await deleteArtwork(artworkId)
      if (success) {
        // 从选中列表中移除
        setSelectedArtworks(prev => prev.filter(id => id !== artworkId))
        toast({
          title: "删除成功",
          description: "作品已成功删除",
        })
      }
    }
  }

  // 处理保存作品
  const handleSaveArtwork = async (artworkData: ArtworkFormData) => {
    const success = await saveArtwork(artworkData)
    if (success) {
      setArtworkDialogOpen(false)
      setEditingArtwork(null)
      toast({
        title: "保存成功",
        description: editingArtwork ? "作品更新成功" : "作品创建成功",
      })
    }
  }

  // 处理添加分类
  const handleAddCategory = () => {
    setEditingCategory(null)
    setCategoryDialogOpen(true)
  }

  // 处理编辑分类
  const handleEditCategory = (category: ArtworkCategoryFormData) => {
    setEditingCategory(category)
    setCategoryDialogOpen(true)
  }

  // 处理删除分类
  const handleDeleteCategory = async (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId)
    if (!category) return

    if (window.confirm(`确定要删除分类"${category.name}"吗？`)) {
      const success = await deleteCategory(categoryId)
      if (success) {
        toast({
          title: "删除成功",
          description: "分类已成功删除",
        })
      }
    }
  }

  // 处理保存分类
  const handleSaveCategory = async (categoryData: ArtworkCategoryFormData) => {
    const success = await saveCategory(categoryData)
    if (success) {
      setCategoryDialogOpen(false)
      setEditingCategory(null)
      toast({
        title: "保存成功",
        description: editingCategory ? "分类更新成功" : "分类创建成功",
      })
    }
  }

  // 处理作品选择
  const handleArtworkSelection = (artworkIds: number[]) => {
    setSelectedArtworks(artworkIds)
  }

  // 处理刷新数据
  const handleRefresh = async () => {
    await loadData()
    toast({
      title: "刷新成功",
      description: "数据已刷新",
    })
  }

  return (
    <ModernPageContainer
      title="作品管理"
      description="管理作品信息、分类和库存"
      breadcrumbs={[
        { label: "首页", href: "/" },
        { label: "作品管理", href: "/artworks" }
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
            onClick={handleAddArtwork}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            新增作品
          </Button>
        </div>
      }
    >
      <Tabs defaultValue="artworks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="artworks">作品列表</TabsTrigger>
          <TabsTrigger value="categories">分类管理</TabsTrigger>
          <TabsTrigger value="stats">统计分析</TabsTrigger>
        </TabsList>

        <TabsContent value="artworks" className="space-y-4">
          {isMobile ? (
            <ArtworkListMobile
              artworks={filteredArtworks}
              categories={categories}
              filter={filter}
              onFilterChange={updateFilter}
              onAddArtwork={handleAddArtwork}
              onEditArtwork={handleEditArtwork}
              onDeleteArtwork={handleDeleteArtwork}
              onSelectionChange={handleArtworkSelection}
              isLoading={isLoading}
            />
          ) : (
            <ArtworkList
              artworks={filteredArtworks}
              categories={categories}
              filter={filter}
              onFilterChange={updateFilter}
              onAddArtwork={handleAddArtwork}
              onEditArtwork={handleEditArtwork}
              onDeleteArtwork={handleDeleteArtwork}
              onSelectionChange={handleArtworkSelection}
              isLoading={isLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <ArtworkCategoryList
            categories={categories}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <ArtworkStats
            artworks={artworks}
            categories={categories}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* 作品表单对话框 */}
      <Dialog open={artworkDialogOpen} onOpenChange={setArtworkDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingArtwork ? "编辑作品" : "新增作品"}
            </DialogTitle>
          </DialogHeader>
          <ArtworkForm
            artwork={editingArtwork}
            categories={categories}
            onSave={handleSaveArtwork}
            onCancel={() => setArtworkDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 分类表单对话框 */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "编辑分类" : "新增分类"}
            </DialogTitle>
          </DialogHeader>
          <ArtworkCategoryForm
            category={editingCategory}
            categories={categories}
            onSave={handleSaveCategory}
            onCancel={() => setCategoryDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </ModernPageContainer>
  )
}
