"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
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
  ChevronDownIcon,
  ChevronRightIcon,
  CheckIcon,
  XIcon,
  FolderIcon,
  RefreshCwIcon,
} from "lucide-react"
import { ProductCategory } from "@/types/product"
import { cn } from "@/lib/utils"

interface CategoryTreeProps {
  categories: ProductCategory[]
  onAddCategory: () => void
  onEditCategory: (category: ProductCategory) => void
  onDeleteCategory: (category: ProductCategory) => void
  onSelectCategory: (categoryId: number) => void
  isLoading?: boolean
}

// 构建分类树结构
function buildCategoryTree(categories: ProductCategory[]): ProductCategory[] {
  // 创建一个映射，用于快速查找分类
  const categoryMap = new Map<number, ProductCategory>();

  // 复制分类并添加 children 数组
  const categoriesWithChildren = categories.map(category => {
    const newCategory = { ...category, children: [] as ProductCategory[] };
    categoryMap.set(category.id, newCategory);
    return newCategory;
  });

  // 构建树结构
  const rootCategories: ProductCategory[] = [];

  categoriesWithChildren.forEach(category => {
    if (category.parentId && categoryMap.has(category.parentId)) {
      // 如果有父分类，将当前分类添加到父分类的 children 数组中
      const parent = categoryMap.get(category.parentId);
      parent?.children?.push(category);
    } else {
      // 如果没有父分类或父分类不存在，则为根分类
      rootCategories.push(category);
    }
  });

  return rootCategories;
}

// 单个分类项组件
function CategoryItem({
  category,
  level = 0,
  selectedIds,
  expandedIds,
  onToggleExpand,
  onToggleSelect,
  onEditCategory,
  onDeleteCategory,
  onSelectCategory,
}: {
  category: ProductCategory
  level?: number
  selectedIds: Set<number>
  expandedIds: Set<number>
  onToggleExpand: (id: number) => void
  onToggleSelect: (id: number) => void
  onEditCategory: (category: ProductCategory) => void
  onDeleteCategory: (category: ProductCategory) => void
  onSelectCategory: (categoryId: number) => void
}) {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedIds.has(category.id);
  const isSelected = selectedIds.has(category.id);

  return (
    <div className="category-item">
      <div
        className={cn(
          "flex items-center py-2 px-2 hover:bg-accent rounded-md",
          isSelected && "bg-accent",
          !category.isActive && "opacity-60"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0 mr-1"
            onClick={() => onToggleExpand(category.id)}
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-6"></div>
        )}

        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(category.id)}
          className="mr-2"
        />

        <div
          className="flex-1 flex items-center cursor-pointer"
          onClick={() => onSelectCategory(category.id)}
        >
          <FolderIcon className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="font-medium">{category.name}</span>
          {category.code && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({category.code})
            </span>
          )}
          {category.productCount !== undefined && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({category.productCount}个产品)
            </span>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
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

      {isExpanded && hasChildren && (
        <div className="category-children">
          {category.children?.map(child => (
            <CategoryItem
              key={child.id}
              category={child}
              level={level + 1}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onToggleSelect={onToggleSelect}
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
              onSelectCategory={onSelectCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTree({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onSelectCategory,
  isLoading = false
}: CategoryTreeProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [categoryTree, setCategoryTree] = useState<ProductCategory[]>([]);

  // 构建分类树
  useEffect(() => {
    setCategoryTree(buildCategoryTree(categories));
  }, [categories]);

  // 切换展开/折叠状态
  const handleToggleExpand = (id: number) => {
    const newExpandedIds = new Set(expandedIds);
    if (newExpandedIds.has(id)) {
      newExpandedIds.delete(id);
    } else {
      newExpandedIds.add(id);
    }
    setExpandedIds(newExpandedIds);
  };

  // 切换选择状态
  const handleToggleSelect = (id: number) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
  };

  // 父子关联（选择一个分类时，同时选择其所有子分类）
  const handleParentChildLink = () => {
    const newSelectedIds = new Set(selectedIds);

    const addChildrenRecursively = (category: ProductCategory) => {
      if (newSelectedIds.has(category.id) && category.children) {
        for (const child of category.children) {
          newSelectedIds.add(child.id);
          addChildrenRecursively(child);
        }
      }
    };

    categoryTree.forEach(category => addChildrenRecursively(category));
    setSelectedIds(newSelectedIds);
  };

  // 取消关联（取消选择所有分类）
  const handleCancelSelection = () => {
    setSelectedIds(new Set());
  };

  // 全部勾选
  const handleSelectAll = () => {
    const newSelectedIds = new Set<number>();
    const addAllCategories = (categories: ProductCategory[]) => {
      for (const category of categories) {
        newSelectedIds.add(category.id);
        if (category.children) {
          addAllCategories(category.children);
        }
      }
    };

    addAllCategories(categoryTree);
    setSelectedIds(newSelectedIds);
  };

  // 展开所有
  const handleExpandAll = () => {
    const newExpandedIds = new Set<number>();
    const addAllCategories = (categories: ProductCategory[]) => {
      for (const category of categories) {
        if (category.children && category.children.length > 0) {
          newExpandedIds.add(category.id);
          addAllCategories(category.children);
        }
      }
    };

    addAllCategories(categoryTree);
    setExpandedIds(newExpandedIds);
  };

  // 合并所有（将所有选中的分类合并到第一个选中的分类下）
  const handleMergeAll = () => {
    if (selectedIds.size < 2) {
      alert("请至少选择两个分类进行合并");
      return;
    }

    const selectedIdsArray = Array.from(selectedIds);
    const targetCategoryId = selectedIdsArray[0];

    // 这里只是UI层面的操作，实际合并需要调用后端API
    alert(`将会把选中的 ${selectedIds.size - 1} 个分类合并到 ID 为 ${targetCategoryId} 的分类下`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onAddCategory}>
            <PlusIcon className="h-4 w-4 mr-2" />
            添加分类
          </Button>
          <Button variant="outline" size="sm" onClick={handleExpandAll}>
            <ChevronDownIcon className="h-4 w-4 mr-2" />
            展开所有
          </Button>
          <Button variant="outline" size="sm" onClick={() => setExpandedIds(new Set())}>
            <ChevronRightIcon className="h-4 w-4 mr-2" />
            折叠所有
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCwIcon className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={handleParentChildLink}>
          父子关联
        </Button>
        <Button variant="outline" size="sm" onClick={handleCancelSelection}>
          取消关联
        </Button>
        <Button variant="outline" size="sm" onClick={handleSelectAll}>
          全部勾选
        </Button>
        <Button variant="outline" size="sm" onClick={handleCancelSelection}>
          取消全选
        </Button>
        <Button variant="outline" size="sm" onClick={handleExpandAll}>
          展开所有
        </Button>
        <Button variant="outline" size="sm" onClick={handleMergeAll}>
          合并所有
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-4">
            {categoryTree.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <TagIcon className="h-8 w-8 mb-2 text-muted-foreground" />
                <h3 className="font-medium mb-1">没有产品分类</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  添加分类来组织和管理您的产品
                </p>
                <Button onClick={onAddCategory}>
                  添加第一个分类
                </Button>
              </div>
            ) : (
              <div className="category-tree">
                {categoryTree.map(category => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    selectedIds={selectedIds}
                    expandedIds={expandedIds}
                    onToggleExpand={handleToggleExpand}
                    onToggleSelect={handleToggleSelect}
                    onEditCategory={onEditCategory}
                    onDeleteCategory={onDeleteCategory}
                    onSelectCategory={onSelectCategory}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
