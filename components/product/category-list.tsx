"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MoreHorizontalIcon,
  TagIcon,
} from "lucide-react"
import { ProductCategory } from "@/types/product"

interface CategoryListProps {
  categories: ProductCategory[]
  onAddCategory: () => void
  onEditCategory: (category: ProductCategory) => void
  onDeleteCategory: (category: ProductCategory) => void
  onSelectCategory: (categoryId: number) => void
  isLoading?: boolean
}

export function CategoryList({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onSelectCategory,
  isLoading = false
}: CategoryListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button onClick={onAddCategory}>
          <PlusIcon className="h-4 w-4 mr-2" />
          添加分类
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <TagIcon className="h-8 w-8 mb-2 text-muted-foreground" />
                <h3 className="font-medium mb-1">没有产品分类</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  添加分类来组织和管理您的产品
                </p>
                <Button onClick={onAddCategory}>
                  添加第一个分类
                </Button>
              </CardContent>
            </Card>
          ) : (
            categories.map(category => (
              <Card key={category.id} className={!category.isActive ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>
                        {category.name}
                        {category.code && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({category.code})
                          </span>
                        )}
                      </CardTitle>
                      {category.parent && (
                        <div className="text-xs text-muted-foreground mt-1">
                          父分类: {category.parent.name}
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditCategory(category)}>
                          <PencilIcon className="h-4 w-4 mr-2" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDeleteCategory(category)}>
                          <TrashIcon className="h-4 w-4 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {category.description && (
                    <CardDescription>{category.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-1">
                    <div className="text-sm">
                      <span className="font-medium">{category.productCount}</span> 个产品
                    </div>
                    {category.children && category.children.length > 0 && (
                      <div className="text-sm">
                        <span className="font-medium">{category.children.length}</span> 个子分类
                      </div>
                    )}
                    {!category.isActive && (
                      <div className="text-xs text-muted-foreground">
                        状态: 已禁用
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onSelectCategory(category.id)}
                  >
                    查看产品
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
