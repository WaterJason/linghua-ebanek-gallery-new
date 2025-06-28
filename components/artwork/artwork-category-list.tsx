"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArtworkCategory } from "@/types/artwork"
import { 
  EditIcon, 
  TrashIcon, 
  PlusIcon,
  FolderIcon,
  MoreHorizontalIcon
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ArtworkCategoryListProps {
  categories: ArtworkCategory[]
  onAddCategory: () => void
  onEditCategory: (category: ArtworkCategory) => void
  onDeleteCategory: (categoryId: number) => void
  isLoading?: boolean
}

export function ArtworkCategoryList({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  isLoading = false
}: ArtworkCategoryListProps) {

  // 获取状态显示
  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge variant="default">启用</Badge>
      : <Badge variant="secondary">禁用</Badge>
  }

  // 获取父分类名称
  const getParentName = (parentId: number | null) => {
    if (!parentId) return "-"
    const parent = categories.find(c => c.id === parentId)
    return parent?.name || "未知"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>作品分类列表 ({categories.length})</span>
          <Button onClick={onAddCategory} className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            新增分类
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : categories.length === 0 ? (
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
                  <TableHead>分类代码</TableHead>
                  <TableHead>父分类</TableHead>
                  <TableHead>层级</TableHead>
                  <TableHead>作品数量</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FolderIcon className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{category.code || "-"}</TableCell>
                    <TableCell>{getParentName(category.parentId)}</TableCell>
                    <TableCell>{category.level || 1}</TableCell>
                    <TableCell>{category.artworkCount || 0}</TableCell>
                    <TableCell>{category.sortOrder || 0}</TableCell>
                    <TableCell>{getStatusBadge(category.isActive !== false)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditCategory(category)}>
                            <EditIcon className="h-4 w-4 mr-2" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDeleteCategory(category.id)}
                            className="text-red-600"
                          >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
