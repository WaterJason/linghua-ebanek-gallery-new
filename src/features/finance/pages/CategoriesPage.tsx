"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ResponsiveContainer } from '@/src/components/ui/responsive-container';
import CategoryList from '../components/mobile/CategoryList';
import CategoryTable from '../components/desktop/CategoryTable';
import { useCategoryData } from '../hooks/useCategoryData';
import { PrismaFinancialCategory } from '@/types/prisma-models';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * 分类管理页面
 */
export default function CategoriesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [state, actions] = useCategoryData();
  const { categories, isLoading, error } = state;

  // 对话框状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PrismaFinancialCategory | null>(null);

  // 搜索状态
  const [searchTerm, setSearchTerm] = useState('');
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 处理创建分类
  const handleCreateCategory = () => {
    setIsCreateDialogOpen(true);
  };

  // 处理编辑分类
  const handleEditCategory = (category: PrismaFinancialCategory) => {
    setSelectedCategory(category);
    setIsEditDialogOpen(true);
  };

  // 处理删除分类
  const handleDeleteCategory = (category: PrismaFinancialCategory) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  // 确认删除分类
  const confirmDeleteCategory = async () => {
    if (!selectedCategory) return;

    const success = await actions.deleteCategory(selectedCategory.id);
    if (success) {
      toast({
        title: "删除成功",
        description: `分类 ${selectedCategory.name} 已删除`,
      });
    }

    setIsDeleteDialogOpen(false);
    setSelectedCategory(null);
  };

  // 处理搜索
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // 共享属性
  const sharedProps = {
    categories: filteredCategories,
    isLoading,
    error,
    onCreateCategory: handleCreateCategory,
    onEditCategory: handleEditCategory,
    onDeleteCategory: handleDeleteCategory,
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">收支分类管理</h1>

      <ResponsiveContainer
        mobile={CategoryList}
        desktop={CategoryTable}
        breakpoint="md"
        props={{
          ...sharedProps,
          // 移动端特有属性
          onSearch: handleSearch,
          // 桌面端特有属性
        }}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除分类 "{selectedCategory?.name}" 吗？此操作无法撤销，使用此分类的交易记录将需要重新分类。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategory} className="bg-destructive text-destructive-foreground">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 创建/编辑对话框将在实际实现中添加 */}
      {/* 这里需要实现CategoryDialog组件 */}
    </div>
  );
}
