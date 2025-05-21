"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ProductImport } from "@/components/product/product-import"
import { ProductBatchEdit } from "@/components/product/product-batch-edit"
import { UnitMaterialManager } from "@/components/product/unit-material-manager"
import { getProducts, getProductCategories, getProductUnits, getProductMaterials, addProductUnit, removeProductUnit, addProductMaterial, removeProductMaterial, batchUpdateProducts } from "@/lib/actions/product-actions";
import { ImportResult, BatchEditData, Product, ProductCategory } from "@/types/product"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircleIcon, CheckCircleIcon } from "lucide-react"

export default function TestProductsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("import")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [units, setUnits] = useState<string[]>([])
  const [materials, setMaterials] = useState<string[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
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
        const [productsData, categoriesData, unitsData, materialsData] = await Promise.all([
          getProducts(),
          getProductCategories(),
          getProductUnits(),
          getProductMaterials()
        ])
        
        setProducts(productsData)
        setCategories(categoriesData)
        setUnits(unitsData)
        setMaterials(materialsData)
        
        // 默认选择前5个产品用于测试
        if (productsData.length > 0) {
          setSelectedProductIds(productsData.slice(0, 5).map(p => p.id!))
        }
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

  // 处理导入完成
  const handleImportComplete = (result: ImportResult) => {
    setTestResult({
      success: true,
      message: "导入测试成功",
      details: `总计: ${result.total}个产品, 新建: ${result.created}个, 更新: ${result.updated}个, 失败: ${result.failed}个`
    })
    
    // 重新加载产品数据
    getProducts().then(data => setProducts(data))
  }
  
  // 处理批量编辑
  const handleBatchEdit = async (data: BatchEditData) => {
    setIsLoading(true)
    setTestResult(null)
    
    try {
      const result = await batchUpdateProducts(data)
      
      setTestResult({
        success: true,
        message: "批量编辑测试成功",
        details: `成功更新 ${result.updatedCount} 个产品`
      })
      
      // 重新加载产品数据
      const productsData = await getProducts()
      setProducts(productsData)
    } catch (error) {
      console.error("批量编辑错误:", error)
      setTestResult({
        success: false,
        message: "批量编辑测试失败",
        details: error instanceof Error ? error.message : "未知错误"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // 处理添加单位
  const handleAddUnit = async (unit: string) => {
    setIsLoading(true)
    setTestResult(null)
    
    try {
      await addProductUnit(unit)
      
      // 重新加载单位数据
      const unitsData = await getProductUnits()
      setUnits(unitsData)
      
      setTestResult({
        success: true,
        message: "添加单位测试成功",
        details: `成功添加单位: ${unit}`
      })
      
      return true
    } catch (error) {
      console.error("添加单位错误:", error)
      setTestResult({
        success: false,
        message: "添加单位测试失败",
        details: error instanceof Error ? error.message : "未知错误"
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }
  
  // 处理删除单位
  const handleRemoveUnit = async (unit: string) => {
    setIsLoading(true)
    setTestResult(null)
    
    try {
      await removeProductUnit(unit)
      
      // 重新加载单位数据
      const unitsData = await getProductUnits()
      setUnits(unitsData)
      
      setTestResult({
        success: true,
        message: "删除单位测试成功",
        details: `成功删除单位: ${unit}`
      })
      
      return true
    } catch (error) {
      console.error("删除单位错误:", error)
      setTestResult({
        success: false,
        message: "删除单位测试失败",
        details: error instanceof Error ? error.message : "未知错误"
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }
  
  // 处理添加材质
  const handleAddMaterial = async (material: string) => {
    setIsLoading(true)
    setTestResult(null)
    
    try {
      await addProductMaterial(material)
      
      // 重新加载材质数据
      const materialsData = await getProductMaterials()
      setMaterials(materialsData)
      
      setTestResult({
        success: true,
        message: "添加材质测试成功",
        details: `成功添加材质: ${material}`
      })
      
      return true
    } catch (error) {
      console.error("添加材质错误:", error)
      setTestResult({
        success: false,
        message: "添加材质测试失败",
        details: error instanceof Error ? error.message : "未知错误"
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }
  
  // 处理删除材质
  const handleRemoveMaterial = async (material: string) => {
    setIsLoading(true)
    setTestResult(null)
    
    try {
      await removeProductMaterial(material)
      
      // 重新加载材质数据
      const materialsData = await getProductMaterials()
      setMaterials(materialsData)
      
      setTestResult({
        success: true,
        message: "删除材质测试成功",
        details: `成功删除材质: ${material}`
      })
      
      return true
    } catch (error) {
      console.error("删除材质错误:", error)
      setTestResult({
        success: false,
        message: "删除材质测试失败",
        details: error instanceof Error ? error.message : "未知错误"
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">产品管理功能测试</h1>
        <p className="text-muted-foreground">测试产品导入、批量编辑和单位材质管理功能</p>
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="import">产品导入测试</TabsTrigger>
          <TabsTrigger value="batch-edit">批量编辑测试</TabsTrigger>
          <TabsTrigger value="unit-material">单位材质管理测试</TabsTrigger>
        </TabsList>
        
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>产品导入测试</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductImport
                onImportComplete={handleImportComplete}
                onCancel={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="batch-edit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>批量编辑测试</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedProductIds.length > 0 ? (
                <ProductBatchEdit
                  selectedIds={selectedProductIds}
                  categories={categories}
                  units={units}
                  materials={materials}
                  onBatchEdit={handleBatchEdit}
                  onCancel={() => {}}
                />
              ) : (
                <div className="text-center py-4">
                  <p>没有可用的产品进行测试</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="unit-material" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>单位材质管理测试</CardTitle>
            </CardHeader>
            <CardContent>
              <UnitMaterialManager
                units={units}
                materials={materials}
                onAddUnit={handleAddUnit}
                onRemoveUnit={handleRemoveUnit}
                onAddMaterial={handleAddMaterial}
                onRemoveMaterial={handleRemoveMaterial}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
