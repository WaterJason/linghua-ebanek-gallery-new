"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import {
  Product,
  ProductCategory,
  ProductFormData,
  CategoryFormData,
  ProductFilter,
  ApiResponse
} from "@/types/product"
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct as deleteProductAction,
  getProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory
} from "@/lib/actions/product-actions"
import { syncProductInventory } from "@/lib/actions/inventory-actions"

/**
 * 产品管理钩子
 * 封装产品和分类的数据获取、过滤和操作逻辑
 */
export function useProducts() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState<ProductFilter>({
    searchQuery: "",
    categoryId: null,
    statusFilter: "all"
  })

  // 加载产品和分类数据
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      // 使用服务器端操作加载产品数据
      const productsData = await getProducts();
      setProducts(productsData);

      // 使用服务器端操作加载分类数据
      const categoriesData = await getProductCategories();
      setCategories(categoriesData);

      console.log("数据加载成功:", { products: productsData.length, categories: categoriesData.length });
    } catch (error) {
      console.error("Error loading product data:", error)
      toast({
        title: "加载失败",
        description: error instanceof Error ? error.message : "无法加载产品数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // 初始加载数据
  useEffect(() => {
    loadData()
  }, [loadData])

  // 过滤产品列表
  const filteredProducts = products.filter(product => {
    // 首先过滤掉所有占位产品 - 这是关键修复
    const isPlaceholderProduct = product.type === "category_placeholder" ||
      product.type === "unit_placeholder" ||
      product.type === "material_placeholder";

    // 如果是占位产品，直接排除
    if (isPlaceholderProduct) {
      return false;
    }

    // 搜索过滤
    const matchesSearch = filter.searchQuery === "" ||
      (product.name && product.name.toLowerCase().includes(filter.searchQuery.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(filter.searchQuery.toLowerCase())) ||
      (product.sku && product.sku.toLowerCase().includes(filter.searchQuery.toLowerCase()));

    // 分类过滤
    const matchesCategory =
      filter.categoryId === null ||
      (filter.categoryId === -1 && !product.categoryId) ||
      product.categoryId === filter.categoryId;

    // 材质过滤
    const matchesMaterial =
      filter.materialFilter === null ||
      !filter.materialFilter ||
      (product.material && product.material === filter.materialFilter);

    // 状态过滤 - 只对真实产品进行状态过滤
    const matchesStatus = filter.statusFilter === "all" ||
      (filter.statusFilter === "active" && product.type === "product") ||
      (filter.statusFilter === "inactive" && product.type !== "product");

    return matchesSearch && matchesCategory && matchesMaterial && matchesStatus;
  });

  // 分类已经包含产品数量，不需要重新计算
  const categoriesWithCount = categories;

  // 保存产品
  const saveProduct = async (data: ProductFormData): Promise<Product | null> => {
    try {
      // 验证数据
      if (!data.name || data.name.trim() === "") {
        toast({
          title: "验证失败",
          description: "产品名称不能为空",
          variant: "destructive",
        });
        return null;
      }

      if (isNaN(data.price) || data.price <= 0) {
        toast({
          title: "验证失败",
          description: "产品价格必须大于0",
          variant: "destructive",
        });
        return null;
      }

      // 检查图片URL是否有效
      if (data.imageUrl && !data.imageUrl.startsWith("/uploads/") && !data.imageUrl.startsWith("http")) {
        console.warn("图片URL可能无效:", data.imageUrl);
        toast({
          title: "警告",
          description: "图片URL可能无效，请检查图片路径",
          variant: "warning",
        });
        // 不阻止保存，但给出警告
      }

      // 准备产品数据 - 确保所有数值字段都是有效的数字
      const productData = {
        ...data,
        name: data.name.trim(),
        price: Number(data.price),
        commissionRate: isNaN(Number(data.commissionRate)) ? 0 : Number(data.commissionRate),
        cost: data.cost && !isNaN(Number(data.cost)) ? Number(data.cost) : null,
        categoryId: data.categoryId ? (typeof data.categoryId === 'string' ? parseInt(data.categoryId) : data.categoryId) : null,
        inventory: data.inventory ? (typeof data.inventory === 'string' ? parseInt(data.inventory) : data.inventory) : null,
      };

      console.log("Saving product data:", productData);
      const isEditing = !!productData.id;

      // 显示加载状态
      toast({
        title: isEditing ? "更新中" : "添加中",
        description: isEditing ? "正在更新产品..." : "正在添加新产品...",
      });

      try {
        // 使用服务器端操作保存产品
        let result;

        if (isEditing && productData.id) {
          // 更新产品
          result = await updateProduct(productData.id, productData);
        } else {
          // 创建新产品
          result = await createProduct(productData);
        }

        console.log("Product saved successfully:", result);

        // 更新产品列表
        if (isEditing) {
          setProducts(products.map(p => p.id === result.id ? result : p));
          toast({
            title: "更新成功",
            description: "产品已成功更新",
          });
        } else {
          setProducts(prevProducts => [...prevProducts, result]);
          toast({
            title: "添加成功",
            description: "产品已成功添加",
          });
        }

        // 如果更新了库存，同步到库存管理模块
        if (isEditing && productData.id && productData.inventory !== undefined) {
          try {
            await syncProductInventory(productData.id);
            console.log("Inventory synced successfully");
          } catch (syncError) {
            console.error("Error syncing inventory:", syncError);
            // 不阻止产品保存，只记录错误
          }
        }

        // 立即重新加载数据以确保一致性，不使用延迟
        await loadData();

        return result;
      } catch (actionError) {
        console.error("Server action error:", actionError);
        throw actionError;
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : "无法保存产品",
        variant: "destructive",
      });
      return null;
    }
  };

  // 保存分类
  const saveCategory = async (data: CategoryFormData): Promise<ProductCategory | null> => {
    try {
      // 验证数据
      if (!data.name || data.name.trim() === "") {
        toast({
          title: "验证失败",
          description: "分类名称不能为空",
          variant: "destructive",
        });
        return null;
      }

      // 准备分类数据
      const categoryData = {
        ...data,
        name: data.name.trim(),
        description: data.description || "",
      };

      console.log("Saving category data:", categoryData);
      const isEditing = !!categoryData.id && !!categoryData.oldName;

      // 显示加载状态
      toast({
        title: isEditing ? "更新中" : "添加中",
        description: isEditing ? "正在更新分类..." : "正在添加新分类...",
      });

      try {
        // 使用服务器端操作保存分类
        let result;

        if (isEditing) {
          // 更新分类
          if (!categoryData.id) {
            throw new Error("更新分类时缺少分类ID");
          }
          result = await updateProductCategory(categoryData.id, categoryData);
        } else {
          // 创建新分类
          result = await createProductCategory(categoryData);
        }

        console.log("Category saved successfully:", result);

        // 更新分类列表
        if (isEditing) {
          setCategories(categories.map(c => c.id === result.id ? result : c));
          toast({
            title: "更新成功",
            description: "分类已成功更新",
          });
        } else {
          setCategories(prevCategories => [...prevCategories, result]);
          toast({
            title: "添加成功",
            description: "分类已成功添加",
          });
        }

        // 立即重新加载数据以获取更新后的分类信息，不使用延迟
        await loadData();

        return result;
      } catch (actionError) {
        console.error("Server action error:", actionError);
        throw actionError;
      }
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : "无法保存分类",
        variant: "destructive",
      });
      return null;
    }
  };

  // 删除产品
  const deleteProduct = async (id: number): Promise<boolean> => {
    try {
      // 显示加载状态
      toast({
        title: "删除中",
        description: "正在删除产品...",
      });

      // 使用服务器端操作删除产品
      await deleteProductAction(id);

      // 更新产品列表
      setProducts(prevProducts => prevProducts.filter(p => p.id !== id));
      toast({
        title: "删除成功",
        description: "产品已成功删除",
      });

      // 立即重新加载数据以确保一致性，不使用延迟
      await loadData();

      return true;
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "无法删除产品",
        variant: "destructive",
      });
      return false;
    }
  };

  // 删除分类
  const deleteCategory = async (id: number): Promise<boolean> => {
    try {
      // 获取要删除的分类名称
      const categoryToDelete = categories.find(c => c.id === id);

      if (!categoryToDelete) {
        throw new Error("找不到要删除的分类");
      }

      // 显示加载状态
      toast({
        title: "删除中",
        description: "正在删除分类...",
      });

      // 使用服务器端操作删除分类
      await deleteProductCategory(id);

      // 更新分类列表
      setCategories(prevCategories => prevCategories.filter(c => c.id !== id));
      toast({
        title: "删除成功",
        description: "分类已成功删除",
      });

      // 立即重新加载数据以确保一致性，不使用延迟
      await loadData();

      return true;
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "无法删除分类",
        variant: "destructive",
      });
      return false;
    }
  };

  // 更新过滤条件
  const updateFilter = (newFilter: Partial<ProductFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };

  return {
    products,
    categories: categoriesWithCount,
    filteredProducts,
    isLoading,
    filter,
    updateFilter,
    loadData,
    saveProduct,
    saveCategory,
    deleteProduct,
    deleteCategory
  };
}
