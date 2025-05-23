"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { PlusIcon, EditIcon, TrashIcon, SearchIcon } from "lucide-react"
import { CategoryForm } from "@/components/finance/category-form"
import { getFinancialCategories, deleteFinancialCategory } from "@/lib/actions/finance-actions"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function CategoryManagementMobile() {
  const { toast } = useToast()
  const [categories, setCategories] = useState([])
  const [filteredCategories, setFilteredCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")

  // 加载分类数据
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true)
        const data = await getFinancialCategories("all")
        setCategories(data)
        setFilteredCategories(data)
        setIsLoading(false)
      } catch (error) {
        console.error("加载分类数据失败:", error)
        toast({
          variant: "destructive",
          title: "加载失败",
          description: error.message || "无法加载分类数据",
        })
        setIsLoading(false)
      }
    }
    
    loadCategories()
  }, [toast])

  // 筛选分类
  useEffect(() => {
    let result = categories;
    
    // 应用类型筛选
    if (activeFilter !== "all") {
      result = result.filter(category => category.type === activeFilter);
    }
    
    // 应用搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(category => 
        category.name.toLowerCase().includes(query) || 
        (category.description && category.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredCategories(result);
  }, [categories, activeFilter, searchQuery]);

  // 处理添加分类
  const handleAddCategory = () => {
    setSelectedCategory(null)
    setIsEditing(false)
    setIsFormOpen(true)
  }

  // 处理编辑分类
  const handleEditCategory = (category) => {
    setSelectedCategory(category)
    setIsEditing(true)
    setIsFormOpen(true)
  }

  // 处理删除分类
  const handleDeleteCategory = (category, e) => {
    if (e) e.stopPropagation();
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  // 确认删除分类
  const confirmDeleteCategory = async () => {
    if (!selectedCategory) return
    
    try {
      await deleteFinancialCategory(selectedCategory.id)
      
      setCategories(categories.filter(category => category.id !== selectedCategory.id))
      
      toast({
        title: "删除成功",
        description: `分类 ${selectedCategory.name} 已删除`,
      })
      
      setIsDeleteDialogOpen(false)
      setSelectedCategory(null)
    } catch (error) {
      console.error("删除分类失败:", error)
      toast({
        variant: "destructive",
        title: "删除失败",
        description: error.message || "无法删除分类",
      })
    }
  }

  // 处理表单提交成功
  const handleFormSuccess = (newCategory) => {
    if (isEditing) {
      setCategories(categories.map(category => 
        category.id === newCategory.id ? newCategory : category
      ))
    } else {
      setCategories([...categories, newCategory])
    }
    
    setIsFormOpen(false)
  }

  // 获取分类类型信息
  const getCategoryTypeInfo = (type) => {
    switch (type) {
      case "income": return { label: "收入", color: "bg-green-100 text-green-800", icon: "💹" }
      case "expense": return { label: "支出", color: "bg-red-100 text-red-800", icon: "💸" }
      default: return { label: type, color: "bg-gray-100 text-gray-800", icon: "📋" }
    }
  }

  // 渲染加载状态
  const renderLoading = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="mb-3">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // 渲染空数据状态
  const renderEmpty = () => (
    <div className="text-center py-8">
      <p className="text-muted-foreground">暂无分类数据</p>
      <Button variant="outline" className="mt-4" onClick={handleAddCategory}>
        <PlusIcon className="mr-2 h-4 w-4" />
        添加分类
      </Button>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* 搜索和添加按钮 */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索分类..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button size="icon" onClick={handleAddCategory}>
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* 分类类型筛选 */}
      <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="income">收入</TabsTrigger>
          <TabsTrigger value="expense">支出</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 分类列表 */}
      <div className="space-y-3">
        {isLoading ? (
          renderLoading()
        ) : filteredCategories.length === 0 ? (
          renderEmpty()
        ) : (
          filteredCategories.map((category) => {
            const typeInfo = getCategoryTypeInfo(category.type)
            return (
              <Card 
                key={category.id} 
                className="mb-3 hover:bg-muted/50 transition-colors"
                onClick={() => handleEditCategory(category)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="font-medium flex items-center">
                      <span className="mr-2">{typeInfo.icon}</span>
                      {category.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={typeInfo.color}>
                        {typeInfo.label}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={(e) => handleDeleteCategory(category, e)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {category.description && (
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {category.description}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* 分类表单对话框 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "编辑分类" : "添加分类"}</DialogTitle>
          </DialogHeader>
          <CategoryForm
            category={selectedCategory}
            isEditing={isEditing}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="确认删除"
        description={`您确定要删除分类 "${selectedCategory?.name}" 吗？此操作无法撤销，使用此分类的交易记录将需要重新分类。`}
        onConfirm={confirmDeleteCategory}
      />
    </div>
  )
}
