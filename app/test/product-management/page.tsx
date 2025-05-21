"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getProducts, getProductCategories, getProductUnits, getProductMaterials, getProductTags } from "@/lib/actions/product-actions";
import { Product, ProductCategory } from "@/types/product"
import { useToast } from "@/components/ui/use-toast"
import { 
  AlertCircleIcon, 
  CheckCircleIcon, 
  PackageIcon,
  FileSpreadsheetIcon,
  ImageIcon,
  TagIcon,
  UploadIcon,
  EditIcon
} from "lucide-react"

// 导入测试组件
import { ProductImport } from "@/components/product/product-import"
import { ProductExport } from "@/components/product/product-export"
import { ProductImageUploader } from "@/components/product/product-image-uploader"
import { ProductTagsManager, ProductTag } from "@/components/product/product-tags-manager"
import { ProductBatchEdit } from "@/components/product/product-batch-edit"
import { UnitMaterialManager } from "@/components/product/unit-material-manager"
import { ProductListVirtualized } from "@/components/product/product-list-virtualized"

export default function TestProductManagementPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [units, setUnits] = useState<string[]>([])
  const [materials, setMaterials] = useState<string[]>([])
  const [tags, setTags] = useState<ProductTag[]>([])
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
        const [productsData, categoriesData, unitsData, materialsData, tagsData] = await Promise.all([
          getProducts(),
          getProductCategories(),
          getProductUnits(),
          getProductMaterials(),
          getProductTags()
        ])
        
        setProducts(productsData)
        setCategories(categoriesData)
        setUnits(unitsData)
        setMaterials(materialsData)
        setTags(tagsData)
        
        // 默认选择前5个产品用于测试
        if (productsData.length > 0) {
          setSelectedProductIds(productsData.slice(0, 5).map(p => p.id!))
        }
        
        setTestResult({
          success: true,
          message: "数据加载成功",
          details: `加载了 ${productsData.length} 个产品, ${categoriesData.length} 个分类, ${unitsData.length} 个单位, ${materialsData.length} 种材质, ${tagsData.length} 个标签`
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

  // 处理产品选择
  const handleProductSelection = (ids: number[]) => {
    setSelectedProductIds(ids)
  }

  // 处理测试结果
  const handleTestResult = (success: boolean, message: string, details?: string) => {
    setTestResult({ success, message, details })
    
    toast({
      title: success ? "测试成功" : "测试失败",
      description: message,
      variant: success ? "default" : "destructive",
    })
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">产品管理模块集成测试</h1>
        <p className="text-muted-foreground">测试产品管理模块的各项功能</p>
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
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="list">产品列表</TabsTrigger>
          <TabsTrigger value="import">导入</TabsTrigger>
          <TabsTrigger value="export">导出</TabsTrigger>
          <TabsTrigger value="images">图片上传</TabsTrigger>
          <TabsTrigger value="tags">标签管理</TabsTrigger>
          <TabsTrigger value="unit-material">单位材质</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>产品管理模块测试概览</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <PackageIcon className="h-4 w-4" />
                      产品数据
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="text-sm">产品总数: <span className="font-medium">{products.length}</span></p>
                      <p className="text-sm">分类总数: <span className="font-medium">{categories.length}</span></p>
                      <p className="text-sm">已选择: <span className="font-medium">{selectedProductIds.length}</span></p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TagIcon className="h-4 w-4" />
                      标签与属性
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="text-sm">标签总数: <span className="font-medium">{tags.length}</span></p>
                      <p className="text-sm">单位总数: <span className="font-medium">{units.length}</span></p>
                      <p className="text-sm">材质总数: <span className="font-medium">{materials.length}</span></p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileSpreadsheetIcon className="h-4 w-4" />
                      测试功能
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="text-sm">可用测试: <span className="font-medium">7</span></p>
                      <p className="text-sm">已完成: <span className="font-medium">0</span></p>
                      <p className="text-sm">状态: <span className="font-medium text-amber-500">进行中</span></p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[
                  { icon: <PackageIcon className="h-4 w-4" />, title: "产品列表", description: "测试虚拟滚动产品列表", tab: "list" },
                  { icon: <UploadIcon className="h-4 w-4" />, title: "产品导入", description: "测试Excel导入功能", tab: "import" },
                  { icon: <FileSpreadsheetIcon className="h-4 w-4" />, title: "产品导出", description: "测试Excel/CSV导出功能", tab: "export" },
                  { icon: <ImageIcon className="h-4 w-4" />, title: "图片上传", description: "测试批量图片上传功能", tab: "images" },
                  { icon: <TagIcon className="h-4 w-4" />, title: "标签管理", description: "测试产品标签管理功能", tab: "tags" },
                  { icon: <EditIcon className="h-4 w-4" />, title: "单位材质", description: "测试单位和材质管理功能", tab: "unit-material" },
                ].map((item, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto flex flex-col items-start p-4 gap-2"
                    onClick={() => setActiveTab(item.tab)}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      {item.icon}
                      {item.title}
                    </div>
                    <p className="text-xs text-muted-foreground text-left">
                      {item.description}
                    </p>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>虚拟滚动产品列表测试</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductListVirtualized
                products={products}
                categories={categories}
                filter={{ searchQuery: "", categoryFilter: null }}
                onFilterChange={() => {}}
                onAddProduct={() => {}}
                onEditProduct={() => {}}
                onDeleteProduct={() => {}}
                onSelectionChange={handleProductSelection}
                isLoading={isLoading}
              />
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                虚拟滚动技术可以高效处理大量数据，只渲染可见区域的内容，提高性能。
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>产品导入测试</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductImport
                onImportComplete={(result) => {
                  handleTestResult(
                    true,
                    "导入测试完成",
                    `总计: ${result.total}个产品, 新建: ${result.created}个, 更新: ${result.updated}个, 失败: ${result.failed}个`
                  )
                }}
                onCancel={() => {}}
              />
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                支持Excel格式导入，可自动识别字段并处理数据。
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>产品导出测试</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductExport
                products={products}
                selectedProductIds={selectedProductIds}
                onExportComplete={() => {
                  handleTestResult(
                    true,
                    "导出测试完成",
                    `成功导出产品数据`
                  )
                }}
                onCancel={() => {}}
              />
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                支持Excel和CSV格式导出，可选择导出字段和范围。
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>产品图片上传测试</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductImageUploader
                onUploadComplete={(urls) => {
                  handleTestResult(
                    true,
                    "图片上传测试完成",
                    `成功上传 ${urls.length} 张图片`
                  )
                }}
                onCancel={() => {}}
              />
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                支持拖放上传和多图片批量上传，显示上传进度和预览。
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>产品标签管理测试</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductTagsManager
                tags={tags}
                onAddTag={async (tag) => {
                  handleTestResult(
                    true,
                    "添加标签测试",
                    `测试添加标签: ${tag.name}`
                  )
                  return Promise.resolve()
                }}
                onUpdateTag={async (tag) => {
                  handleTestResult(
                    true,
                    "更新标签测试",
                    `测试更新标签: ${tag.name}`
                  )
                  return Promise.resolve()
                }}
                onDeleteTag={async (tagId) => {
                  handleTestResult(
                    true,
                    "删除标签测试",
                    `测试删除标签ID: ${tagId}`
                  )
                  return Promise.resolve()
                }}
                onSelectTag={(tagId) => {
                  const tag = tags.find(t => t.id === tagId)
                  handleTestResult(
                    true,
                    "选择标签测试",
                    `选择标签: ${tag?.name || tagId}`
                  )
                }}
              />
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                支持标签的添加、编辑、删除和选择，可设置标签颜色和描述。
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="unit-material" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>单位和材质管理测试</CardTitle>
            </CardHeader>
            <CardContent>
              <UnitMaterialManager
                units={units}
                materials={materials}
                onAddUnit={async (unit) => {
                  handleTestResult(
                    true,
                    "添加单位测试",
                    `测试添加单位: ${unit}`
                  )
                  return Promise.resolve()
                }}
                onRemoveUnit={async (unit) => {
                  handleTestResult(
                    true,
                    "删除单位测试",
                    `测试删除单位: ${unit}`
                  )
                  return Promise.resolve()
                }}
                onAddMaterial={async (material) => {
                  handleTestResult(
                    true,
                    "添加材质测试",
                    `测试添加材质: ${material}`
                  )
                  return Promise.resolve()
                }}
                onRemoveMaterial={async (material) => {
                  handleTestResult(
                    true,
                    "删除材质测试",
                    `测试删除材质: ${material}`
                  )
                  return Promise.resolve()
                }}
              />
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                支持单位和材质的添加和删除，方便产品属性管理。
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
