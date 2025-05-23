"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import {
  getFinancialCategories,
  createFinancialCategory,
  updateFinancialCategory,
  deleteFinancialCategory
} from "@/lib/actions/finance-actions";
import { PrismaFinancialCategory } from "@/types/prisma-models";

export interface CategoryDataState {
  categories: PrismaFinancialCategory[];
  isLoading: boolean;
  error: string | null;
}

export interface CategoryDataActions {
  refresh: () => Promise<void>;
  createCategory: (data: any) => Promise<PrismaFinancialCategory | null>;
  updateCategory: (id: string, data: any) => Promise<PrismaFinancialCategory | null>;
  deleteCategory: (id: string) => Promise<boolean>;
  getIncomeCategories: () => PrismaFinancialCategory[];
  getExpenseCategories: () => PrismaFinancialCategory[];
}

/**
 * 财务分类数据管理钩子
 *
 * 提供财务分类数据的获取、创建、更新和删除功能
 */
export function useCategoryData(useMockData = false): [CategoryDataState, CategoryDataActions] {
  const [state, setState] = useState<CategoryDataState>({
    categories: [],
    isLoading: true,
    error: null,
  });

  // 加载分类数据
  const loadCategories = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const categories = await getFinancialCategories("all", useMockData);
      setState(prev => ({ ...prev, categories, isLoading: false }));
      return categories;
    } catch (error) {
      console.error("Error loading categories:", error);
      const errorMessage = error instanceof Error ? error.message : "加载分类数据失败";
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({
        variant: "destructive",
        title: "加载失败",
        description: errorMessage,
      });
      return [];
    }
  }, [useMockData]);

  // 创建分类
  const createCategory = useCallback(async (data: any): Promise<PrismaFinancialCategory | null> => {
    try {
      const newCategory = await createFinancialCategory(data);
      setState(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory],
      }));
      toast({
        title: "创建成功",
        description: `分类 ${newCategory.name} 已创建`,
      });
      return newCategory;
    } catch (error) {
      console.error("Error creating category:", error);
      const errorMessage = error instanceof Error ? error.message : "创建分类失败";
      toast({
        variant: "destructive",
        title: "创建失败",
        description: errorMessage,
      });
      return null;
    }
  }, []);

  // 更新分类
  const updateCategory = useCallback(async (id: string, data: any): Promise<PrismaFinancialCategory | null> => {
    try {
      const updatedCategory = await updateFinancialCategory(id, data);
      setState(prev => ({
        ...prev,
        categories: prev.categories.map(category =>
          category.id === id ? updatedCategory : category
        ),
      }));
      toast({
        title: "更新成功",
        description: `分类 ${updatedCategory.name} 已更新`,
      });
      return updatedCategory;
    } catch (error) {
      console.error("Error updating category:", error);
      const errorMessage = error instanceof Error ? error.message : "更新分类失败";
      toast({
        variant: "destructive",
        title: "更新失败",
        description: errorMessage,
      });
      return null;
    }
  }, []);

  // 删除分类
  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteFinancialCategory(id);
      setState(prev => ({
        ...prev,
        categories: prev.categories.filter(category => category.id !== id),
      }));
      toast({
        title: "删除成功",
        description: "分类已删除",
      });
      return true;
    } catch (error) {
      console.error("Error deleting category:", error);
      const errorMessage = error instanceof Error ? error.message : "删除分类失败";
      toast({
        variant: "destructive",
        title: "删除失败",
        description: errorMessage,
      });
      return false;
    }
  }, []);

  // 获取收入分类
  const getIncomeCategories = useCallback(() => {
    return state.categories.filter(category => category.type === "income");
  }, [state.categories]);

  // 获取支出分类
  const getExpenseCategories = useCallback(() => {
    return state.categories.filter(category => category.type === "expense");
  }, [state.categories]);

  // 初始加载
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const actions: CategoryDataActions = {
    refresh: loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getIncomeCategories,
    getExpenseCategories,
  };

  return [state, actions];
}
