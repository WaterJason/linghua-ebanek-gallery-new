"use client"

import { useState, useCallback } from "react"
import useSWR, { mutate } from "swr"
import { useToast } from "@/components/ui/use-toast"
import {
  Product,
  ProductCategory,
  ProductFormData,
  ProductCategoryFormData,
  ProductFilter,
  ProductApiResponse
} from "@/types/product"
import { syncProductInventory } from "@/lib/actions/inventory-actions"

// API 基础URL
const API_BASE = '/api/products'

// 音频反馈功能
const playAudioFeedback = (type: 'success' | 'error' | 'warning' | 'info') => {
  try {
    // 创建音频上下文
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    // 定义不同类型的音频参数
    const audioParams = {
      success: { frequency: 800, duration: 200, type: 'sine' as OscillatorType },
      error: { frequency: 300, duration: 400, type: 'sawtooth' as OscillatorType },
      warning: { frequency: 600, duration: 300, type: 'triangle' as OscillatorType },
      info: { frequency: 500, duration: 150, type: 'sine' as OscillatorType }
    }

    const params = audioParams[type]

    // 创建振荡器
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(params.frequency, audioContext.currentTime)
    oscillator.type = params.type

    // 设置音量包络
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + params.duration / 1000)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + params.duration / 1000)
  } catch (error) {
    // 静默处理音频错误，不影响主要功能
    console.debug('Audio feedback not available:', error)
  }
}

// SWR fetcher 函数
const fetcher = async (url: string) => {
  try {
    console.log(`🔄 SWR获取数据: GET ${url}`)

    const response = await fetch(url)

    console.log(`📡 SWR响应状态: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`

      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.details || errorMessage
        console.error(`🔥 SWR错误详情:`, errorData)
      } catch (parseError) {
        console.error(`🔥 无法解析SWR错误响应:`, parseError)
      }

      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log(`✅ SWR获取成功:`, data)
    return data
  } catch (error) {
    console.error(`🔥 SWR获取失败:`, error)

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络连接')
    }

    throw error
  }
}

// API 调用函数
const apiCall = async (url: string, options: RequestInit = {}) => {
  try {
    console.log(`🔄 API调用: ${options.method || 'GET'} ${url}`)

    // 记录请求体内容用于调试
    if (options.body) {
      console.log(`📤 请求数据:`, JSON.parse(options.body as string))
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    console.log(`📡 API响应状态: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      let errorDetails = null

      try {
        const errorData = await response.json()
        console.error(`🔥 API错误详情:`, errorData)

        // 优化错误信息提取
        if (errorData.error) {
          errorMessage = errorData.error
        } else if (errorData.details) {
          errorMessage = errorData.details
        } else if (errorData.message) {
          errorMessage = errorData.message
        }

        errorDetails = errorData
      } catch (parseError) {
        console.error(`🔥 无法解析错误响应:`, parseError)
        // 尝试获取原始文本响应
        try {
          const textResponse = await response.text()
          console.error(`🔥 原始错误响应:`, textResponse)
          if (textResponse) {
            errorMessage = textResponse
          }
        } catch (textError) {
          console.error(`🔥 无法获取文本响应:`, textError)
        }
      }

      const error = new Error(errorMessage)
      // 附加错误详情
      if (errorDetails) {
        (error as any).details = errorDetails
      }
      throw error
    }

    const data = await response.json()
    console.log(`✅ API调用成功:`, data)
    return data
  } catch (error) {
    console.error(`🔥 API调用失败:`, error)

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络连接')
    }

    throw error
  }
}

/**
 * 产品管理钩子
 * 封装产品和分类的数据获取、过滤和操作逻辑
 * 使用SWR进行数据缓存和状态管理
 */
export function useProducts() {
  const { toast } = useToast()
  const [filter, setFilter] = useState<ProductFilter>({
    searchQuery: "",
    categoryId: null,
    statusFilter: "all",
    materialFilter: null,
    tagFilter: null
  })

  // 使用SWR获取产品数据（5分钟缓存）
  const {
    data: productsResponse,
    error: productsError,
    isLoading: productsLoading,
    mutate: mutateProducts
  } = useSWR(`${API_BASE}`, fetcher, {
    refreshInterval: 0, // 禁用自动刷新
    revalidateOnFocus: false, // 禁用焦点时重新验证
    dedupingInterval: 300000, // 5分钟去重间隔
    errorRetryCount: 3,
    errorRetryInterval: 1000,
  })

  // 使用SWR获取分类数据（30分钟缓存）
  const {
    data: categoriesResponse,
    error: categoriesError,
    isLoading: categoriesLoading,
    mutate: mutateCategories
  } = useSWR(`${API_BASE}/categories`, fetcher, {
    refreshInterval: 0, // 禁用自动刷新
    revalidateOnFocus: false, // 禁用焦点时重新验证
    dedupingInterval: 1800000, // 30分钟去重间隔
    errorRetryCount: 3,
    errorRetryInterval: 1000,
  })

  // 提取数据
  const products: Product[] = productsResponse?.products || []
  const categories: ProductCategory[] = categoriesResponse?.categories || []
  const isLoading = productsLoading || categoriesLoading

  // 处理错误
  if (productsError) {
    console.error("Error loading products:", productsError)
    toast({
      title: "加载失败",
      description: "无法加载产品数据",
      variant: "destructive",
    })
  }

  if (categoriesError) {
    console.error("Error loading categories:", categoriesError)
    toast({
      title: "加载失败",
      description: "无法加载分类数据",
      variant: "destructive",
    })
  }

  // 手动重新加载数据
  const loadData = useCallback(async () => {
    try {
      console.log("🔄 [loadData] 开始重新加载数据...")
      await Promise.all([
        mutateProducts(),
        mutateCategories()
      ])
      console.log("✅ [loadData] 数据重新加载成功")
    } catch (error) {
      console.error("🔥 [loadData] 重新加载失败:", error)
      toast({
        title: "重新加载失败",
        description: error instanceof Error ? error.message : "无法重新加载数据",
        variant: "destructive",
      })
    }
  }, [mutateProducts, mutateCategories, toast])

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
      (product.barcode && product.barcode.toLowerCase().includes(filter.searchQuery.toLowerCase()));

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

    // 标签过滤（处理标签对象）
    const matchesTag = (() => {
      try {
        return filter.tagFilter === null ||
          !filter.tagFilter ||
          (product.tags && Array.isArray(product.tags) && product.tags.some(tag => {
            try {
              // 处理标签对象或字符串
              let tagName = ''

              if (tag !== null && tag !== undefined) {
                if (typeof tag === 'string') {
                  // 如果是字符串，直接使用
                  tagName = tag.trim()
                } else if (typeof tag === 'object' && tag.name) {
                  // 如果是对象，提取name字段
                  tagName = String(tag.name).trim()
                } else {
                  // 其他情况，尝试转换为字符串
                  tagName = String(tag).trim()
                }

                return tagName === filter.tagFilter
              }
              return false
            } catch (tagError) {
              console.warn(`[useProducts] 标签比较失败:`, tag, tagError)
              return false
            }
          }))
      } catch (error) {
        console.warn(`[useProducts] 标签过滤失败:`, product.id, error)
        return true // 过滤失败时默认包含该产品
      }
    })();

    // 状态过滤 - 只对真实产品进行状态过滤
    const matchesStatus = filter.statusFilter === "all" ||
      (filter.statusFilter === "active" && product.type === "product") ||
      (filter.statusFilter === "inactive" && product.type !== "product");

    return matchesSearch && matchesCategory && matchesMaterial && matchesTag && matchesStatus;
  });

  // 分类已经包含产品数量，不需要重新计算
  const categoriesWithCount = categories;

  // 保存产品
  const saveProduct = async (data: ProductFormData): Promise<Product | null> => {
    try {
      console.log(`🔄 [saveProduct] 开始保存产品:`, data)

      // 验证数据
      if (!data.name || data.name.trim() === "") {
        toast({
          title: "验证失败",
          description: "产品名称不能为空",
          variant: "destructive",
        });
        return null;
      }

      // 价格验证：确保价格为有效数值，如果为空则设为0
      let validatedPrice = 0;
      if (data.price !== null && data.price !== undefined) {
        if (isNaN(data.price) || data.price < 0) {
          toast({
            title: "验证失败",
            description: "产品价格不能为负数",
            variant: "destructive",
          });
          return null;
        }
        validatedPrice = Number(data.price);
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

      // 准备产品数据 - 确保所有必填字段都有值
      const productData = {
        ...data,
        name: data.name.trim(),
        price: validatedPrice, // 确保价格为数值
        categoryId: data.categoryId ? (typeof data.categoryId === 'string' ? parseInt(data.categoryId) : data.categoryId) : null,
        inventory: data.inventory ? (typeof data.inventory === 'string' ? parseInt(data.inventory) : data.inventory) : null,
        material: data.material || "珐琅",
        unit: data.unit || "套",
        type: "product", // 确保类型正确
      };

      console.log(`🔄 [saveProduct] 处理后的产品数据:`, productData)

      console.log("Saving product data:", productData);
      const isEditing = !!productData.id;

      // 显示加载状态
      toast({
        title: isEditing ? "更新中" : "添加中",
        description: isEditing ? "正在更新产品..." : "正在添加新产品...",
      });

      try {
        // 使用API调用保存产品
        let result;

        if (isEditing && productData.id) {
          // 更新产品
          result = await apiCall(`${API_BASE}/${productData.id}`, {
            method: 'PUT',
            body: JSON.stringify(productData),
          });
        } else {
          // 创建新产品
          result = await apiCall(API_BASE, {
            method: 'POST',
            body: JSON.stringify(productData),
          });
        }

        console.log("Product saved successfully:", result);

        // 显示成功消息和音频反馈
        toast({
          title: isEditing ? "更新成功" : "添加成功",
          description: isEditing ? "产品已成功更新" : "产品已成功添加",
        });
        playAudioFeedback('success');

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

        // 使用SWR mutate更新缓存
        await mutateProducts();

        return result.product || result;
      } catch (apiError) {
        console.error("API error:", apiError);
        throw apiError;
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : "无法保存产品",
        variant: "destructive",
      });
      playAudioFeedback('error');
      return null;
    }
  };

  // 保存分类
  const saveCategory = async (data: ProductCategoryFormData): Promise<ProductCategory | null> => {
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
        // 使用API调用保存分类
        let result;

        if (isEditing) {
          // 更新分类
          if (!categoryData.id) {
            throw new Error("更新分类时缺少分类ID");
          }
          result = await apiCall(`${API_BASE}/categories/${categoryData.id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData),
          });
        } else {
          // 创建新分类
          result = await apiCall(`${API_BASE}/categories`, {
            method: 'POST',
            body: JSON.stringify(categoryData),
          });
        }

        console.log("Category saved successfully:", result);

        // 显示成功消息和音频反馈
        toast({
          title: isEditing ? "更新成功" : "添加成功",
          description: isEditing ? "分类已成功更新" : "分类已成功添加",
        });
        playAudioFeedback('success');

        // 使用SWR mutate更新缓存
        await Promise.all([
          mutateCategories(),
          mutateProducts() // 也更新产品缓存，因为分类变化可能影响产品显示
        ]);

        return result.category || result;
      } catch (apiError) {
        console.error("API error:", apiError);
        throw apiError;
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
      console.log(`🔄 [deleteProduct] 开始删除产品: ${id}`)

      // 验证产品ID
      if (!id || isNaN(id) || id <= 0) {
        toast({
          title: "删除失败",
          description: "无效的产品ID",
          variant: "destructive",
        });
        return false;
      }

      // 显示加载状态
      toast({
        title: "删除中",
        description: "正在删除产品...",
      });

      // 使用API调用删除产品
      const result = await apiCall(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });

      console.log(`✅ [deleteProduct] 产品删除成功:`, result)

      toast({
        title: "删除成功",
        description: "产品已成功删除",
      });
      playAudioFeedback('success');

      // 使用SWR mutate更新缓存
      await mutateProducts();

      return true;
    } catch (error) {
      console.error(`🔥 [deleteProduct] 删除产品失败:`, error);

      let errorMessage = "无法删除产品";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast({
        title: "删除失败",
        description: errorMessage,
        variant: "destructive",
      });
      playAudioFeedback('error');
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

      // 使用API调用删除分类
      await apiCall(`${API_BASE}/categories/${id}`, {
        method: 'DELETE',
      });

      toast({
        title: "删除成功",
        description: "分类已成功删除",
      });

      // 使用SWR mutate更新缓存
      await Promise.all([
        mutateCategories(),
        mutateProducts() // 也更新产品缓存，因为分类删除可能影响产品显示
      ]);

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
