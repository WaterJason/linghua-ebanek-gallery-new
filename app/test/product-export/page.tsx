"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ProductExport } from "@/components/product/product-export"
import { getProducts } from "@/lib/actions/product-actions";
import { Product } from "@/types/product"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircleIcon, CheckCircleIcon, FileSpreadsheetIcon } from "lucide-react"

export default function TestProductExportPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null)

  // 加载产品数据
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true)
      try {
        const productsData = await getProducts()
        setProducts(productsData)
        
        // 默认选择前5个产品用于测试
        if (productsData.length > 0) {
          setSelectedProductIds(productsData.slice(0, 5).map(p => p.id!))
        }
      } catch (error) {
        console.error("加载产品数据失败:", error)
        toast({
          title: "加载失败",
          description: "无法加载产品数据",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProducts()
  }, [toast])

  // 处理导出完成
  const handleExportComplete = () => {
    setTestResult({
      success: true,
      message: "导出测试成功",
      details: "产品数据已成功导出"
    })
  }
  
  // 处理随机选择产品
  const handleRandomSelect = () => {
    if (products.length === 0) return
    
    // 随机选择1-10个产品
    const count = Math.floor(Math.random() * 10) + 1
    const randomIds: number[] = []
    
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * products.length)
      const productId = products[randomIndex].id!
      
      if (!randomIds.includes(productId)) {
        randomIds.push(productId)
      }
    }
    
    setSelectedProductIds(randomIds)
    
    toast({
      title: "随机选择",
      description: `已随机选择 ${randomIds.length} 个产品`,
    })
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">产品数据导出测试</h1>
        <p className="text-muted-foreground">测试产品数据导出功能</p>
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheetIcon className="h-5 w-5" />
                测试数据
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleRandomSelect} disabled={products.length === 0}>
                随机选择产品
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">加载中...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>暂无产品数据</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p>共 {products.length} 个产品，已选择 {selectedProductIds.length} 个</p>
                  
                  <div className="max-h-[300px] overflow-y-auto border rounded-md">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-2 text-left">选择</th>
                          <th className="p-2 text-left">ID</th>
                          <th className="p-2 text-left">名称</th>
                          <th className="p-2 text-right">价格</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(product => (
                          <tr key={product.id} className="border-t">
                            <td className="p-2">
                              <input
                                type="checkbox"
                                checked={selectedProductIds.includes(product.id!)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProductIds(prev => [...prev, product.id!])
                                  } else {
                                    setSelectedProductIds(prev => prev.filter(id => id !== product.id))
                                  }
                                }}
                              />
                            </td>
                            <td className="p-2">{product.id}</td>
                            <td className="p-2">{product.name}</td>
                            <td className="p-2 text-right">¥{product.price.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <ProductExport
            products={products}
            selectedProductIds={selectedProductIds}
            onExportComplete={handleExportComplete}
            onCancel={() => {}}
          />
        </div>
      </div>
    </div>
  )
}
