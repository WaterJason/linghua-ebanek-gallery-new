"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { ProductCategory } from "@/types/product"
import {
  SearchIcon,
  EditIcon,
  TrashIcon,
  PlusIcon,
  FolderIcon,
  FolderOpenIcon,
  MoreHorizontalIcon
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProductCategoryListProps {
  categories: ProductCategory[]
  onAddCategory: () => void
  onEditCategory: (category: ProductCategory) => void
  onDeleteCategory: (categoryId: number) => void
  isLoading?: boolean
}

export function ProductCategoryList({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  isLoading = false
}: ProductCategoryListProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())

  // 过滤分类
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 构建分类树结构
  const buildCategoryTree = (categories: ProductCategory[]): ProductCategory[] => {
    const categoryMap = new Map<number, ProductCategory>()
    const rootCategories: ProductCategory[] = []

    // 创建分类映射
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] })
    })

    // 构建树结构
    categories.forEach(category => {
      const categoryNode = categoryMap.get(category.id)!
      if (category.parentId && categoryMap.has(category.parentId)) {
        const parent = categoryMap.get(category.parentId)!
        if (!parent.children) parent.children = []
        parent.children.push(categoryNode)
      } else {
        rootCategories.push(categoryNode)
      }
    })

    return rootCategories
  }

  const categoryTree = buildCategoryTree(filteredCategories)

  // 切换分类展开状态
  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // 渲染分类行
  const renderCategoryRow = (category: ProductCategory, level: number = 0): React.ReactNode[] => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedCategories.has(category.id)
    const indent = level * 24

    const rows: React.ReactNode[] = [
      <TableRow key={category.id}>
        <TableCell>
          <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-6 w-6 mr-2"
                onClick={() => toggleCategory(category.id)}
              >
                {isExpanded ? (
                  <FolderOpenIcon className="h-4 w-4" />
                ) : (
                  <FolderIcon className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-6 h-6 mr-2" />
            )}
            <span className="font-medium">{category.name}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">
            {category.code || "-"}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant={category.isActive ? "default" : "secondary"}>
            {category.isActive ? "启用" : "禁用"}
          </Badge>
        </TableCell>
        <TableCell>{category.sortOrder || 0}</TableCell>
        <TableCell>
          <Badge variant="outline">
            {category.productCount || 0}
          </Badge>
        </TableCell>
        <TableCell>
          <span className="text-sm text-muted-foreground">
            {category.description || "-"}
          </span>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onEditCategory(category)}>
                <EditIcon className="h-4 w-4 mr-2" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDeleteCategory(category.id)}
                className="text-red-600"
                disabled={(category.productCount || 0) > 0 || hasChildren}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ]

    // 如果展开且有子分类，递归渲染子分类
    if (isExpanded && hasChildren) {
      category.children!.forEach(child => {
        rows.push(...renderCategoryRow(child, level + 1))
      })
    }

    return rows
  }

  // 获取统计信息
  const stats = {
    total: categories.length,
    active: categories.filter(c => c.isActive).length,
    inactive: categories.filter(c => !c.isActive).length,
    withProducts: categories.filter(c => (c.productCount || 0) > 0).length
  }

  return (
    <div className="space-y-4">
      {/* 统计信息 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">总分类数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">启用分类</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">禁用分类</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.withProducts}</div>
            <p className="text-xs text-muted-foreground">有产品分类</p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和操作 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>分类管理</CardTitle>
            <Button onClick={onAddCategory}>
              <PlusIcon className="h-4 w-4 mr-2" />
              添加分类
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索分类名称、编码或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setExpandedCategories(new Set(categories.map(c => c.id)))}
            >
              全部展开
            </Button>
            <Button
              variant="outline"
              onClick={() => setExpandedCategories(new Set())}
            >
              全部收起
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <FolderIcon className="h-12 w-12 mb-4" />
              <p>暂无分类数据</p>
              <Button onClick={onAddCategory} className="mt-4">
                添加第一个分类
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>分类名称</TableHead>
                    <TableHead>编码</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>排序</TableHead>
                    <TableHead>产品数</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryTree.map(category => renderCategoryRow(category))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
