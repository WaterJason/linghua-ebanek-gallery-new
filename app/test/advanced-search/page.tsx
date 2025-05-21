"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  ProductAdvancedSearch, 
  AdvancedSearchFilter, 
  defaultSearchFilter 
} from "@/components/product/product-advanced-search"
import { ProductSearchHistory } from "@/components/product/product-search-history"
import { ProductList } from "@/components/product/product-list"
import { ProductListMobile } from "@/components/product/product-list-mobile"
import { getProducts, getProductCategories, getProductMaterials } from "@/lib/actions/product-actions";
import { Product, ProductCategory } from "@/types/product"
import { useToast } from "@/components/ui/use-toast"
import { useResponsive } from "@/hooks/use-responsive"
import { 
  AlertCircleIcon, 
  CheckCircleIcon, 
  SearchIcon,
  RefreshCwIcon
} from "lucide-react"

export default function TestAdvancedSearchPage() {
  const { toast } = useToast()
  const { isMobile } = useResponsive()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [materials, setMaterials] = useState<string[]>([])
  const [filter, setFilter] = useState<AdvancedSearchFilter>(defaultSearchFilter)
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null)

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [productsData, categoriesData, materialsData] = await Promise.all([
          getProducts(),
          getProductCategories(),
          getProductMaterials()
        ])
        
        setProducts(productsData)
        setCategories(categoriesData)
        setMaterials(materialsData)
        
        setTestResult({
          success: true,
          message: "数据加载成功",
          details: `加载了 ${productsData.length} 个产品, ${categoriesData.length} 个分类, ${materialsData.length} 种材质`
        })
      } catch (error) {
        console.error("加载数据失败:", error)
        setTestResult({
          success: false,
          message: "数据加载失败",
          details: error instanceof Error ? error.message : "未知错误"
        })
        
        toast({
          title: "加载失败",
          description: "无法加载测试数据",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [toast])

  // 处理过滤器变化
  const handleFilterChange = (newFilter: AdvancedSearchFilter) => {
    setFilter(newFilter)
    
    setTestResult({
      success: true,
      message: "应用搜索条件",
      details: `应用了新的搜索条件`
    })
  }
  
  // 处理产品选择
  const handleProductSelection = (selectedIds: number[]) => {
    // 仅用于测试
    if (selectedIds.length > 0) {
      setTestResult({
        success: true,
        message: "选择产品",
        details: `选择了 ${selectedIds.length} 个产品`
      })
    }
  }
  
  // 过滤产品
  const filteredProducts = products.filter(product => {
    // 关键词搜索
    if (filter.searchQuery && !product.name.toLowerCase().includes(filter.searchQuery.toLowerCase())) {
      return false
    }
    
    // 分类过滤
    if (filter.categoryId && product.categoryId?.toString() !== filter.categoryId) {
      return false
    }
    
    // 价格范围过滤
    if (filter.priceRange) {
      const [min, max] = filter.priceRange
      if (product.price < min || product.price > max) {
        return false
      }
    }
    
    // 库存状态过滤
    if (filter.inventoryStatus !== "all") {
      const inventory = product.inventory || 0
      
      if (filter.inventoryStatus === "inStock" && inventory <= 0) {
        return false
      }
      
      if (filter.inventoryStatus === "outOfStock" && inventory > 0) {
        return false
      }
      
      if (filter.inventoryStatus === "lowStock" && (inventory === 0 || inventory > 5)) {
        return false
      }
    }
    
    // 材质过滤
    if (filter.materials.length > 0) {
      if (!product.material || !filter.materials.includes(product.material)) {
        return false
      }
    }
    
    // 图片状态过滤
    if (filter.hasImage !== null) {
      const hasImage = !!product.imageUrl
      if (hasImage !== filter.hasImage) {
        return false
      }
    }
    
    return true
  }).sort((a, b) => {
    // 排序
    switch (filter.sortBy) {
      case "priceAsc":
        return a.price - b.price
      case "priceDesc":
        return b.price - a.price
      case "nameAsc":
        return a.name.localeCompare(b.name)
      case "nameDesc":
        return b.name.localeCompare(a.name)
      case "inventoryAsc":
        return (a.inventory || 0) - (b.inventory || 0)
      case "inventoryDesc":
        return (b.inventory || 0) - (a.inventory || 0)
      default:
        return (a.id || 0) - (b.id || 0)
    }
  })
  
  // 计算活跃过滤器数量
  const getActiveFilterCount = () => {
    let count = 0
    
    if (filter.searchQuery) count++
    if (filter.categoryId) count++
    if (filter.priceRange) count++
    if (filter.inventoryStatus !== "all") count++
    if (filter.materials.length > 0) count++
    if (filter.hasImage !== null) count++
    if (filter.sortBy !== "default") count++
    
    return count
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">高级搜索功能测试</h1>
        <p className="text-muted-foreground">
          测试产品高级搜索和搜索历史功能
        </p>
      </div>
      
      {testResult && (
        <Alert variant={testResult.success ? "default" : "destructive"}>
          {testResult.success ? (
            <CheckCircleIcon className="h-4 w-4" />
          ) : (
            <AlertCircleIcon className="h-4 w-4" />
          )}
          <AlertTitle>{testResult.message}</AlertTitle>
          {testResult.details && (
            <AlertDescription>{testResult.details}</AlertDescription>
          )}
        </Alert>
      )}
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5" />
            高级搜索
          </CardTitle>
          <div className="flex items-center gap-2">
            <ProductSearchHistory
              categories={categories}
              currentFilter={filter}
              onSelectFilter={handleFilterChange}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setFilter(defaultSearchFilter)}
              disabled={getActiveFilterCount() === 0}
            >
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              重置
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProductAdvancedSearch
            categories={categories}
            materials={materials}
            filter={filter}
            onFilterChange={handleFilterChange}
            maxPrice={Math.max(...products.map(p => p.price), 1000)}
            activeFilterCount={getActiveFilterCount()}
          />
          
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">搜索结果</h3>
              <p className="text-sm text-muted-foreground">
                找到 {filteredProducts.length} 个产品
              </p>
            </div>
            
            {isMobile ? (
              <ProductListMobile
                products={filteredProducts}
                categories={categories}
                filter={{ searchQuery: "", categoryFilter: null }}
                onFilterChange={() => {}}
                onAddProduct={() => {}}
                onEditProduct={() => {}}
                onDeleteProduct={() => {}}
                onSelectionChange={handleProductSelection}
                isLoading={isLoading}
              />
            ) : (
              <ProductList
                products={filteredProducts}
                categories={categories}
                filter={{ searchQuery: "", categoryFilter: null }}
                onFilterChange={() => {}}
                onAddProduct={() => {}}
                onEditProduct={() => {}}
                onDeleteProduct={() => {}}
                onSelectionChange={handleProductSelection}
                isLoading={isLoading}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
