"use client";

import React from 'react';
import { PlusIcon, SearchIcon, MoreVerticalIcon } from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { Skeleton } from '@/src/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { PrismaFinancialCategory } from '@/types/prisma-models';

interface CategoryListProps {
  categories: PrismaFinancialCategory[];
  isLoading: boolean;
  error: string | null;
  onCreateCategory: () => void;
  onEditCategory: (category: PrismaFinancialCategory) => void;
  onDeleteCategory: (category: PrismaFinancialCategory) => void;
  onSearch: (term: string) => void;
}

/**
 * 分类卡片组件
 */
const CategoryCard = ({
  category,
  onEdit,
  onDelete
}: {
  category: PrismaFinancialCategory;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const isIncome = category.type === 'income';
  const isExpense = category.type === 'expense';

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-lg">{category.name}</h3>
            <p className="text-muted-foreground text-sm">{category.description || '无描述'}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={isIncome ? "success" : isExpense ? "destructive" : "default"}>
              {isIncome ? '收入' : isExpense ? '支出' : '其他'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>编辑</DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={onDelete}
                >
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * 分类列表骨架屏
 */
const CategoryListSkeleton = () => {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="mb-3">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="w-2/3">
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

/**
 * 移动端分类列表组件
 */
export default function CategoryList({
  categories,
  isLoading,
  error,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
  onSearch,
}: CategoryListProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索分类..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <Button size="icon" onClick={onCreateCategory}>
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <CategoryListSkeleton />
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            重试
          </Button>
        </div>
      ) : categories.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">暂无分类数据</p>
          <Button variant="outline" className="mt-4" onClick={onCreateCategory}>
            添加分类
          </Button>
        </div>
      ) : (
        <div>
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={() => onEditCategory(category)}
              onDelete={() => onDeleteCategory(category)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
