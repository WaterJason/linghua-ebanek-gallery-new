"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ProductFormData, ProductCategory } from "@/types/product"
import { ImageIcon, SaveIcon, XIcon, PlusIcon } from "lucide-react"
import { FileUpload } from "@/components/file-upload"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { TagSelector } from "./tag-selector"
import { MaterialSelector } from "./material-selector"
import { UnitSelector } from "./unit-selector"
import { useMaterialUnitSync } from "@/hooks/use-material-unit-sync"

interface ProductFormProps {
  product?: ProductFormData | null
  categories: ProductCategory[]
  onSave: (data: ProductFormData) => void
  onCancel: () => void
  onCategoryCreated?: () => void // 新增回调函数
}

export function ProductForm({
  product,
  categories,
  onSave,
  onCancel,
  onCategoryCreated
}: ProductFormProps) {
  const { toast } = useToast()
  const { loadAll: loadMaterialUnitData } = useMaterialUnitSync()

  // 添加调试日志
  console.log("🔄 [ProductForm] 组件渲染，接收到的props:")
  console.log("  - product:", product)
  console.log("  - categories:", categories)

  // 新增对话框状态（只保留分类相关）
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")

  // 用于跟踪初始化状态
  const isInitializedRef = useRef(false)
  const lastProductIdRef = useRef<number | undefined>(undefined)

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    price: null,
    categoryId: null,
    imageUrl: null,
    imageUrls: [],
    description: null,
    barcode: null,
    dimensions: null,
    material: "珐琅", // 保留用于兼容性
    unit: "套", // 保留用于兼容性
    inventory: null,
    tagIds: [], // 新增标签字段
  })

  // 初始化表单数据 - 只在product真正变化时执行
  useEffect(() => {
    console.log("🔄 [ProductForm] useEffect触发，product:", product)
    console.log("🔄 [ProductForm] 当前lastProductIdRef:", lastProductIdRef.current)
    console.log("🔄 [ProductForm] 当前isInitializedRef:", isInitializedRef.current)

    // 检查是否是同一个产品，避免重复初始化
    const currentProductId = product?.id
    if (currentProductId && currentProductId === lastProductIdRef.current && isInitializedRef.current) {
      console.log("🔄 [ProductForm] 跳过重复初始化，产品ID相同:", currentProductId)
      return
    }

    if (product) {
      console.log("🔄 [ProductForm] 初始化产品数据:", product)
      lastProductIdRef.current = product.id
      isInitializedRef.current = true

      // 处理标签数据：支持多种格式
      let tagIds: number[] = []
      if (product.tagIds && Array.isArray(product.tagIds)) {
        tagIds = product.tagIds
      } else if ((product as any).productTags && Array.isArray((product as any).productTags)) {
        tagIds = (product as any).productTags.map((pt: any) => pt.tagId || pt.id).filter(Boolean)
      } else if ((product as any).tags && Array.isArray((product as any).tags)) {
        tagIds = (product as any).tags.map((tag: any) => tag.id).filter(Boolean)
      }

      // 处理图片数据：确保正确的格式
      const imageUrls = Array.isArray(product.imageUrls) ? product.imageUrls : []
      const imageUrl = product.imageUrl || (imageUrls.length > 0 ? imageUrls[0] : null)

      // 处理分类数据：确保正确的ID格式
      let categoryId = null
      if (product.categoryId && typeof product.categoryId === 'number') {
        categoryId = product.categoryId
      } else if (product.categoryId && typeof product.categoryId === 'string' && product.categoryId !== 'uncategorized') {
        categoryId = parseInt(product.categoryId)
      }

      const newFormData = {
        id: product.id,
        name: product.name || "",
        price: product.price !== null && product.price !== undefined ? Number(product.price) : null,
        categoryId: categoryId,
        imageUrl: imageUrl,
        imageUrls: imageUrls,
        description: product.description || null,
        barcode: product.barcode || null,
        dimensions: product.dimensions || null,
        material: product.material || "珐琅",
        unit: product.unit || "套",
        inventory: product.inventory !== null && product.inventory !== undefined ? Number(product.inventory) : null,
        tagIds: tagIds,
      }

      console.log("🔄 [ProductForm] 处理后的表单数据:", newFormData)
      setFormData(newFormData)

      console.log("✅ [ProductForm] 表单数据初始化完成")
      console.log("  - 标签IDs:", tagIds)
      console.log("  - 图片URL:", imageUrl)
      console.log("  - 图片列表:", imageUrls)
      console.log("  - 分类ID:", categoryId)
      console.log("  - 材质:", newFormData.material)
      console.log("  - 单位:", newFormData.unit)

      // 强制重新渲染以确保组件接收到新数据
      setTimeout(() => {
        console.log("🔄 [ProductForm] 延迟检查表单数据状态:", formData)
      }, 100)
    } else if (!isInitializedRef.current) {
      console.log("🔄 [ProductForm] 初始化新产品表单")
      lastProductIdRef.current = undefined
      isInitializedRef.current = true
      setFormData({
        name: "",
        price: null,
        categoryId: null,
        imageUrl: null,
        imageUrls: [],
        description: null,
        barcode: null,
        dimensions: null,
        material: "珐琅",
        unit: "套",
        inventory: null,
        tagIds: [],
      })
    }
  }, [product])

  // 添加一个effect来监控formData的变化
  useEffect(() => {
    console.log("🔄 [ProductForm] formData状态变化:", formData)
  }, [formData])

  // 添加一个effect来监控categories的变化
  useEffect(() => {
    console.log("🔄 [ProductForm] categories状态变化:", categories)
  }, [categories])

  // 确保材质和单位数据在组件初始化时加载
  useEffect(() => {
    console.log("🔄 [ProductForm] 组件初始化，加载材质和单位数据")
    loadMaterialUnitData()
  }, [loadMaterialUnitData])



  // 处理表单字段变化
  const handleChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 创建新分类
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "错误",
        description: "分类名称不能为空",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/products/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: "",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "创建分类失败")
      }

      const result = await response.json()

      toast({
        title: "创建成功",
        description: `分类 "${newCategoryName}" 已创建`,
      })

      // 自动选择新创建的分类
      if (result.success && result.category) {
        handleChange("categoryId", result.category.id)
      }

      // 通知父组件重新加载分类数据
      if (onCategoryCreated) {
        onCategoryCreated()
      }

      setShowAddCategoryDialog(false)
      setNewCategoryName("")
    } catch (error) {
      console.error("创建分类失败:", error)
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "创建分类失败",
        variant: "destructive",
      })
    }
  }



  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("🔄 [ProductForm] 提交表单数据:", formData)

    // 表单验证
    if (!formData.name.trim()) {
      toast({
        title: "错误",
        description: "请填写产品名称",
        variant: "destructive",
      })
      return
    }

    // 价格验证：价格可以为空，但不能为负数
    if (formData.price !== null && formData.price !== undefined && (isNaN(formData.price) || formData.price < 0)) {
      toast({
        title: "错误",
        description: "产品价格不能为负数",
        variant: "destructive",
      })
      return
    }

    // 检查图片URL
    if (formData.imageUrl && !formData.imageUrl.startsWith("/uploads/") && !formData.imageUrl.startsWith("http")) {
      console.warn("图片URL可能无效:", formData.imageUrl);
      toast({
        title: "警告",
        description: "图片URL可能无效，请重新上传图片",
        variant: "warning", // 改为警告而不是错误
      })
      // 不阻止提交，但给出警告
    }

    // 准备提交数据，确保数据格式正确
    const submitData = {
      ...formData,
      name: formData.name.trim(),
      price: formData.price, // 保持原始值，让API处理默认值
      type: "product", // 确保类型正确
    }

    console.log("🔄 [ProductForm] 提交产品数据:", submitData)
    onSave(submitData)
  }

  return (
    <>
    <form className="space-y-8" onSubmit={handleSubmit}>
      {/* 基本信息区域 */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-lg font-medium text-foreground">基本信息</h3>
          <p className="text-sm text-muted-foreground">填写产品的基本信息</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                产品名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="请输入产品名称"
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium">产品价格</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">¥</span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price || ""}
                  onChange={(e) => handleChange("price", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0.00"
                  className="pl-8 h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId" className="text-sm font-medium">产品分类</Label>
              <div className="flex gap-2">
                <Select
                  key={`category-${product?.id || 'new'}-${formData.categoryId || 'none'}`}
                  value={formData.categoryId?.toString() || "none"}
                  onValueChange={(value) => {
                    console.log("🔄 [ProductForm] 分类选择变化:", value)
                    console.log("🔄 [ProductForm] 当前formData.categoryId:", formData.categoryId)
                    console.log("🔄 [ProductForm] 可用分类:", categories)
                    handleChange("categoryId", value === "none" ? null : parseInt(value))
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="选择产品分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">未分类</SelectItem>
                    {/* 如果当前值不在分类列表中，添加一个临时选项 */}
                    {formData.categoryId && !categories.find(cat => cat.id === formData.categoryId) && (
                      <SelectItem key={`current-${formData.categoryId}`} value={formData.categoryId.toString()}>
                        当前分类 (ID: {formData.categoryId})
                      </SelectItem>
                    )}
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCategoryDialog(true)}
                  className="h-10 px-3"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="barcode" className="text-sm font-medium">艺术品序列号</Label>
              <Input
                id="barcode"
                value={formData.barcode || ""}
                onChange={(e) => handleChange("barcode", e.target.value || null)}
                placeholder="输入艺术品序列号（可选）"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dimensions" className="text-sm font-medium">产品尺寸</Label>
              <Input
                id="dimensions"
                value={formData.dimensions || ""}
                onChange={(e) => handleChange("dimensions", e.target.value || null)}
                placeholder="例如：长x宽x高"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inventory" className="text-sm font-medium">库存数量</Label>
              <Input
                id="inventory"
                type="number"
                min="0"
                value={formData.inventory || ""}
                onChange={(e) => handleChange("inventory", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="输入库存数量"
                className="h-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 产品属性区域 */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-lg font-medium text-foreground">产品属性</h3>
          <p className="text-sm text-muted-foreground">设置产品的材质、单位和标签</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 材质选择器 */}
          <MaterialSelector
            key={`material-${product?.id || 'new'}-${formData.material || 'none'}`}
            value={formData.material || null}
            onChange={(value) => {
              console.log("🔄 [ProductForm] 材质选择变化:", value)
              handleChange("material", value)
            }}
            label="产品材质"
            placeholder="选择产品材质"
            allowCreate={true}
          />

          {/* 单位选择器 */}
          <UnitSelector
            key={`unit-${product?.id || 'new'}-${formData.unit || 'none'}`}
            value={formData.unit || null}
            onChange={(value) => {
              console.log("🔄 [ProductForm] 单位选择变化:", value)
              handleChange("unit", value)
            }}
            label="计量单位"
            placeholder="选择计量单位"
            allowCreate={true}
          />

          {/* 产品标签选择器 */}
          <div className="md:col-span-1">
            <TagSelector
              key={`tags-${product?.id || 'new'}-${(formData.tagIds || []).join(',') || 'none'}`}
              selectedTags={formData.tagIds || []}
              onTagsChange={(tagIds) => {
                console.log("🔄 [ProductForm] 标签选择变化:", tagIds)
                handleChange("tagIds", tagIds)
              }}
              label="产品标签"
              placeholder="选择或创建标签"
              allowCreate={true}
            />
          </div>
        </div>
      </div>

      {/* 图片上传区域 */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-lg font-medium text-foreground">产品图片</h3>
          <p className="text-sm text-muted-foreground">上传产品图片，第一张将作为主图显示</p>
        </div>

        <div className="border rounded-lg p-6 bg-muted/20">
          <FileUpload
            key={`file-upload-${product?.id || 'new'}-${formData.imageUrls?.length || 0}`}
            accept={{ "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] }}
            maxSize={30 * 1024 * 1024} // 30MB
            maxFiles={10}
            defaultValues={formData.imageUrls || []}
            primaryImageUrl={formData.imageUrl || undefined}
            allowPaste={true}
            autoUpload={true}
            enableCompression={true}
            enableSorting={true}
            onUpload={(url) => {
              console.log("🔄 [ProductForm] Image uploaded:", url);
              // 如果没有主图，设置为主图
              if (!formData.imageUrl) {
                handleChange("imageUrl", url);
              }
              // 添加到图片列表
              const currentUrls = formData.imageUrls || []
              if (!currentUrls.includes(url)) {
                handleChange("imageUrls", [...currentUrls, url]);
              }
            }}
            onMultiUploadComplete={(urls) => {
              console.log("🔄 [ProductForm] Multiple images uploaded:", urls);
              // 更新图片列表
              handleChange("imageUrls", urls);
              // 如果没有主图，设置第一张为主图
              if (!formData.imageUrl && urls.length > 0) {
                handleChange("imageUrl", urls[0]);
              }
            }}
            onPrimaryImageChange={(url) => {
              console.log("🔄 [ProductForm] Primary image changed:", url);
              // 更新主图
              handleChange("imageUrl", url);
            }}
          />
        </div>
      </div>

      {/* 产品描述区域 */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-lg font-medium text-foreground">产品描述</h3>
          <p className="text-sm text-muted-foreground">详细描述产品的特点和用途</p>
        </div>

        <div className="space-y-2">
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => handleChange("description", e.target.value || null)}
            placeholder="请输入产品的详细描述，包括特点、用途、工艺等信息..."
            rows={4}
            className="resize-none"
          />
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="min-w-[100px]">
          <XIcon className="h-4 w-4 mr-2" />
          取消
        </Button>
        <Button type="submit" className="min-w-[100px]">
          <SaveIcon className="h-4 w-4 mr-2" />
          {product?.id ? "更新产品" : "创建产品"}
        </Button>
      </div>
    </form>


      {/* 新增分类对话框 */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新增产品分类</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newCategoryName">分类名称</Label>
              <Input
                id="newCategoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="输入分类名称"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateCategory()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddCategoryDialog(false)
                setNewCategoryName("")
              }}
            >
              取消
            </Button>
            <Button type="button" onClick={handleCreateCategory}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}