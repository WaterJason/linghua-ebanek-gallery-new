"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ProductTagsManager, ProductTag } from "@/components/product/product-tags-manager"
import { getProductTags, createProductTag, updateProductTag, deleteProductTag, getProducts, addTagToProduct, removeTagFromProduct, getProductsByTag } from "@/lib/actions/product-actions";
import { Product } from "@/types/product"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircleIcon, CheckCircleIcon, TagIcon } from "lucide-react"

export default function TestProductTagsPage() {
  const { toast } = useToast()
  const [tags, setTags] = useState<ProductTag[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null)
  const [taggedProducts, setTaggedProducts] = useState<Product[]>([])
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
        const [tagsData, productsData] = await Promise.all([
          getProductTags(),
          getProducts()
        ])
        
        setTags(tagsData)
        setProducts(productsData)
      } catch (error) {
        console.error("加载数据失败:", error)
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

  // 处理添加标签
  const handleAddTag = async (tag: Omit<ProductTag, "id">) => {
    setIsLoading(true)
    setTestResult(null)
    
    try {
      const newTag = await createProductTag(tag)
      
      // 更新标签列表
      setTags(prev => [...prev, { ...newTag, id: newTag.id, productCount: 0 }])
      
      setTestResult({
        success: true,
        message: "添加标签测试成功",
        details: `成功添加标签: ${newTag.name}`
      })
      
      return true
    } catch (error) {
      console.error("添加标签错误:", error)
      setTestResult({
        success: false,
        message: "添加标签测试失败",
        details: error instanceof Error ? error.message : "未知错误"
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }
  
  // 处理更新标签
  const handleUpdateTag = async (tag: ProductTag) => {
    setIsLoading(true)
    setTestResult(null)
    
    try {
      await updateProductTag(tag.id, {
        name: tag.name,
        color: tag.color,
        description: tag.description
      })
      
      // 更新标签列表
      setTags(prev => prev.map(t => t.id === tag.id ? tag : t))
      
      setTestResult({
        success: true,
        message: "更新标签测试成功",
        details: `成功更新标签: ${tag.name}`
      })
      
      return true
    } catch (error) {
      console.error("更新标签错误:", error)
      setTestResult({
        success: false,
        message: "更新标签测试失败",
        details: error instanceof Error ? error.message : "未知错误"
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }
  
  // 处理删除标签
  const handleDeleteTag = async (tagId: number) => {
    setIsLoading(true)
    setTestResult(null)
    
    try {
      await deleteProductTag(tagId)
      
      // 更新标签列表
      setTags(prev => prev.filter(t => t.id !== tagId))
      
      // 如果删除的是当前选中的标签，清除选中状态
      if (selectedTagId === tagId) {
        setSelectedTagId(null)
        setTaggedProducts([])
      }
      
      setTestResult({
        success: true,
        message: "删除标签测试成功",
        details: `成功删除标签 ID: ${tagId}`
      })
      
      return true
    } catch (error) {
      console.error("删除标签错误:", error)
      setTestResult({
        success: false,
        message: "删除标签测试失败",
        details: error instanceof Error ? error.message : "未知错误"
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }
  
  // 处理选择标签
  const handleSelectTag = async (tagId: number) => {
    setIsLoading(true)
    setTestResult(null)
    setSelectedTagId(tagId)
    
    try {
      // 获取标签关联的产品
      const products = await getProductsByTag(tagId)
      setTaggedProducts(products)
      
      const tag = tags.find(t => t.id === tagId)
      
      setTestResult({
        success: true,
        message: "查询标签产品测试成功",
        details: `标签 "${tag?.name}" 关联了 ${products.length} 个产品`
      })
    } catch (error) {
      console.error("获取标签产品错误:", error)
      setTestResult({
        success: false,
        message: "查询标签产品测试失败",
        details: error instanceof Error ? error.message : "未知错误"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // 处理添加产品到标签
  const handleAddProductToTag = async (productId: number) => {
    if (!selectedTagId) return
    
    setIsLoading(true)
    setTestResult(null)
    
    try {
      await addTagToProduct(productId, selectedTagId)
      
      // 更新标签产品列表
      const product = products.find(p => p.id === productId)
      if (product && !taggedProducts.some(p => p.id === productId)) {
        setTaggedProducts(prev => [...prev, product])
      }
      
      // 更新标签计数
      setTags(prev => prev.map(t => 
        t.id === selectedTagId 
          ? { ...t, productCount: (t.productCount || 0) + 1 } 
          : t
      ))
      
      const tag = tags.find(t => t.id === selectedTagId)
      const productName = product?.name || productId.toString()
      
      setTestResult({
        success: true,
        message: "添加产品到标签测试成功",
        details: `成功将产品 "${productName}" 添加到标签 "${tag?.name}"`
      })
    } catch (error) {
      console.error("添加产品到标签错误:", error)
      setTestResult({
        success: false,
        message: "添加产品到标签测试失败",
        details: error instanceof Error ? error.message : "未知错误"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // 处理从标签移除产品
  const handleRemoveProductFromTag = async (productId: number) => {
    if (!selectedTagId) return
    
    setIsLoading(true)
    setTestResult(null)
    
    try {
      await removeTagFromProduct(productId, selectedTagId)
      
      // 更新标签产品列表
      setTaggedProducts(prev => prev.filter(p => p.id !== productId))
      
      // 更新标签计数
      setTags(prev => prev.map(t => 
        t.id === selectedTagId && t.productCount && t.productCount > 0
          ? { ...t, productCount: t.productCount - 1 } 
          : t
      ))
      
      const tag = tags.find(t => t.id === selectedTagId)
      const product = products.find(p => p.id === productId)
      const productName = product?.name || productId.toString()
      
      setTestResult({
        success: true,
        message: "从标签移除产品测试成功",
        details: `成功从标签 "${tag?.name}" 移除产品 "${productName}"`
      })
    } catch (error) {
      console.error("从标签移除产品错误:", error)
      setTestResult({
        success: false,
        message: "从标签移除产品测试失败",
        details: error instanceof Error ? error.message : "未知错误"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">产品标签功能测试</h1>
        <p className="text-muted-foreground">测试产品标签管理功能</p>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <ProductTagsManager
            tags={tags}
            onAddTag={handleAddTag}
            onUpdateTag={handleUpdateTag}
            onDeleteTag={handleDeleteTag}
            onSelectTag={handleSelectTag}
          />
        </div>
        
        <div className="space-y-6">
          {selectedTagId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TagIcon className="h-5 w-5" />
                  标签产品
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">已标记产品</h3>
                    {taggedProducts.length === 0 ? (
                      <p className="text-muted-foreground">暂无产品使用此标签</p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {taggedProducts.map(product => (
                          <li key={product.id} className="flex items-center justify-between border p-2 rounded-md">
                            <span>{product.name}</span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRemoveProductFromTag(product.id!)}
                            >
                              移除
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">添加产品到标签</h3>
                    <ul className="mt-2 space-y-2">
                      {products
                        .filter(p => !taggedProducts.some(tp => tp.id === p.id))
                        .slice(0, 5)
                        .map(product => (
                          <li key={product.id} className="flex items-center justify-between border p-2 rounded-md">
                            <span>{product.name}</span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAddProductToTag(product.id!)}
                            >
                              添加
                            </Button>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
