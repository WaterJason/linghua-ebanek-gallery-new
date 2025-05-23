"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ResponsiveDataGrid } from "@/components/ui/responsive-data-grid"
import { PlusIcon, EditIcon, TrashIcon } from "lucide-react"
import { CategoryForm } from "@/components/finance/category-form"
import { getFinancialCategories, deleteFinancialCategory } from "@/lib/actions/finance-actions"
import { useMediaQuery } from "@/hooks/use-media-query"
import { CategoryManagementMobile } from "@/components/finance/category-management-mobile"

export function CategoryManagement() {
  const isMobile = useMediaQuery("(max-width: 768px)")

  // 如果是移动设备，使用移动端优化版本
  if (isMobile) {
    return <CategoryManagementMobile />
  }

  // 桌面端版本
  const { toast } = useToast()
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  // 加载分类数据
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true)
        const data = await getFinancialCategories("all")
        setCategories(data)
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
  const handleDeleteCategory = (category) => {
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

  // 表格列定义
  const columns = [
    {
      header: "分类名称",
      accessorKey: "name",
      cell: (info) => <div className="font-medium">{info.getValue()}</div>,
    },
    {
      header: "类型",
      accessorKey: "type",
      cell: (info) => {
        const type = info.getValue()
        return (
          <div className={
            type === "income" ? "text-green-600" :
            type === "expense" ? "text-red-600" :
            "text-blue-600"
          }>
            {type === "income" ? "收入" :
             type === "expense" ? "支出" : type}
          </div>
        )
      },
    },
    {
      header: "描述",
      accessorKey: "description",
      cell: (info) => {
        const description = info.getValue()
        return description ? (
          <div className="max-w-[300px] truncate" title={description}>
            {description}
          </div>
        ) : "-"
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const category = row.original
        return (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={(e) => {
              e.stopPropagation()
              handleEditCategory(category)
            }}>
              <EditIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => {
              e.stopPropagation()
              handleDeleteCategory(category)
            }}>
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>收支分类管理</CardTitle>
              <CardDescription>管理收入和支出的分类</CardDescription>
            </div>
            <Button onClick={handleAddCategory}>
              <PlusIcon className="mr-2 h-4 w-4" />
              添加分类
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveDataGrid
            data={categories}
            columns={columns}
            searchable={true}
            searchKeys={["name", "description"]}
            loading={isLoading}
            emptyText="暂无分类数据"
            onRowClick={(category) => handleEditCategory(category)}
          />
        </CardContent>
      </Card>

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
