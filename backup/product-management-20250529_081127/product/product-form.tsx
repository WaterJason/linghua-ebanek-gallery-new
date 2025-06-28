"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { FileUpload } from "@/components/file-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { SmartInput } from "@/components/ui/smart-input"
import { SmartTooltip } from "@/components/ui/tooltip"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Product, ProductCategory, ProductFormData } from "@/types/product"

interface ProductFormProps {
  product?: Product | null
  categories: ProductCategory[]
  units: string[]
  materials: string[]
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel: () => void
}

export function ProductForm({
  product,
  categories,
  units,
  materials,
  onSubmit,
  onCancel
}: ProductFormProps) {
  const { toast } = useToast()

  // 智能建议数据
  const [productNameSuggestions, setProductNameSuggestions] = useState([
    { id: '1', value: '祥云如意掐丝珐琅盘', label: '祥云如意掐丝珐琅盘', category: '珐琅盘', frequency: 5 },
    { id: '2', value: '莲花香炉', label: '莲花香炉', category: '香炉', frequency: 3 },
    { id: '3', value: '掐丝珐琅手镯', label: '掐丝珐琅手镯', category: '配饰', frequency: 8 },
    { id: '4', value: '凤凰纹珐琅瓶', label: '凤凰纹珐琅瓶', category: '花瓶', frequency: 2 },
    { id: '5', value: '龙纹珐琅盒', label: '龙纹珐琅盒', category: '收纳盒', frequency: 4 }
  ])

  const [dimensionSuggestions, setDimensionSuggestions] = useState([
    { id: '1', value: '10x5cm', label: '10x5cm', category: '小型', frequency: 10 },
    { id: '2', value: '15x10cm', label: '15x10cm', category: '中型', frequency: 8 },
    { id: '3', value: '20x15cm', label: '20x15cm', category: '大型', frequency: 5 },
    { id: '4', value: '直径8cm', label: '直径8cm', category: '圆形', frequency: 6 },
    { id: '5', value: '直径12cm', label: '直径12cm', category: '圆形', frequency: 4 }
  ])

  const [formData, setFormData] = useState<ProductFormData>({
    id: product?.id,
    name: product?.name || "",
    categoryId: product?.categoryId || null,
    price: product?.price || 0,
    commissionRate: product?.commissionRate || 0, // 添加佣金率字段
    cost: product?.cost || null, // 添加成本字段
    barcode: product?.barcode || "",
    sku: product?.sku || "", // 添加SKU字段
    imageUrl: product?.imageUrl || "",
    imageUrls: product?.imageUrls || [],
    status: "active", // 默认为活动状态，不再依赖type字段
    description: product?.description || "", // 添加描述字段
    // 新增字段
    dimensions: product?.dimensions || "",
    material: product?.material || "",
    unit: product?.unit || "",
    details: product?.details || "",
    inventory: product?.inventory || 0, // 确保库存字段被正确初始化
  })

  // 当产品变化时更新表单数据
  useEffect(() => {
    if (product) {
      setFormData({
        id: product.id,
        name: product.name || "",
        categoryId: product.categoryId || null,
        price: product.price || 0,
        commissionRate: product.commissionRate || 0, // 添加佣金率字段
        cost: product.cost || null, // 添加成本字段
        barcode: product.barcode || "",
        sku: product.sku || "", // 添加SKU字段
        imageUrl: product.imageUrl || "",
        imageUrls: product.imageUrls || [],
        status: "active", // 所有真实产品默认为活动状态
        description: product.description || "", // 添加描述字段
        // 新增字段
        dimensions: product.dimensions || "",
        material: product.material || "",
        unit: product.unit || "",
        details: product.details || "",
        inventory: product.inventory || 0, // 确保库存字段被正确更新
      })
    } else {
      // 重置表单
      setFormData({
        name: "",
        categoryId: null,
        price: 0,
        commissionRate: 0, // 重置佣金率为0
        cost: null, // 重置成本为null
        barcode: "",
        sku: "", // 重置SKU为空
        imageUrl: "",
        imageUrls: [],
        status: "active",
        description: "", // 重置描述为空
        // 新增字段
        dimensions: "",
        material: "",
        unit: "",
        details: "",
        inventory: 0, // 重置库存为0
      })
    }
  }, [product])

  // 处理表单字段变化
  const handleChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 表单验证
    if (!formData.name.trim()) {
      toast({
        title: "错误",
        description: "请填写产品名称",
        variant: "destructive",
      })
      return
    }

    if (formData.price <= 0) {
      toast({
        title: "错误",
        description: "产品价格必须大于0",
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
        variant: "warning",
      })
      // 不阻止提交，但给出警告
    }

    // 准备提交数据 - 确保产品类型始终为"product"
    const submitData = {
      ...formData,
      // 产品类型始终为"product"，不使用占位类型
      type: "product",
      // 保留status字段用于前端显示，但不影响数据库type字段
      status: formData.status
    };

    console.log("提交产品表单数据:", submitData);

    try {
      // 提交表单
      await onSubmit(submitData)
    } catch (error) {
      console.error("表单提交错误:", error);
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    }
  }

  return (
    <TooltipProvider>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <SmartTooltip
                content="输入产品名称，系统会根据历史数据提供智能建议"
                type="help"
                title="产品名称"
              >
                <Label htmlFor="name">产品名称 *</Label>
              </SmartTooltip>
              <SmartInput
                suggestions={productNameSuggestions}
                value={formData.name}
                onChange={(value) => handleChange("name", value)}
                onSuggestionSelect={(suggestion) => {
                  handleChange("name", suggestion.value)
                  // 根据选择的产品自动填充一些信息
                  if (suggestion.category === '珐琅盘') {
                    handleChange("unit", "个")
                    handleChange("material", "珐琅")
                  }
                }}
                placeholder="输入产品名称或选择历史产品"
                showHistory={true}
                showFrequent={true}
                className="w-full"
              />
            </div>

          <div className="space-y-2">
            <SmartTooltip
              content="选择产品所属的分类，有助于产品管理和统计"
              type="info"
            >
              <Label htmlFor="category">产品分类</Label>
            </SmartTooltip>
            <Select
              value={formData.categoryId ? formData.categoryId.toString() : "uncategorized"}
              onValueChange={(value) => handleChange("categoryId", value === "uncategorized" ? null : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncategorized">未分类</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <SmartTooltip
              content="设置产品的销售价格，支持小数点后两位"
              type="info"
              title="产品定价"
            >
              <Label htmlFor="price">售价 *</Label>
            </SmartTooltip>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => handleChange("price", parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <SmartTooltip
                content="设置产品的成本价格，用于利润计算"
                type="info"
                title="成本管理"
              >
                <Label htmlFor="cost">成本价</Label>
              </SmartTooltip>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.cost || ""}
                onChange={(e) => handleChange("cost", parseFloat(e.target.value) || null)}
              />
            </div>

            <div className="space-y-2">
              <SmartTooltip
                content="设置销售佣金率，范围0-100%"
                type="info"
                title="佣金设置"
              >
                <Label htmlFor="commissionRate">佣金率 (%)</Label>
              </SmartTooltip>
              <Input
                id="commissionRate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="0.0"
                value={formData.commissionRate}
                onChange={(e) => handleChange("commissionRate", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <SmartTooltip
              content="输入产品的SKU编码，用于库存管理"
              type="info"
            >
              <Label htmlFor="sku">SKU编码</Label>
            </SmartTooltip>
            <Input
              id="sku"
              placeholder="产品SKU编码"
              value={formData.sku || ""}
              onChange={(e) => handleChange("sku", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <SmartTooltip
                content="输入产品尺寸，系统会提供常用尺寸建议"
                type="help"
                title="产品尺寸"
              >
                <Label htmlFor="dimensions">尺寸</Label>
              </SmartTooltip>
              <SmartInput
                suggestions={dimensionSuggestions}
                value={formData.dimensions || ""}
                onChange={(value) => handleChange("dimensions", value)}
                onSuggestionSelect={(suggestion) => {
                  handleChange("dimensions", suggestion.value)
                }}
                placeholder="例如：10x5cm"
                showHistory={true}
                showFrequent={true}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <SmartTooltip
                content="输入产品条码，用于库存管理和销售扫描"
                type="info"
              >
                <Label htmlFor="barcode">条码</Label>
              </SmartTooltip>
              <Input
                id="barcode"
                placeholder="产品条码"
                value={formData.barcode || ""}
                onChange={(e) => handleChange("barcode", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <SmartTooltip
              content="设置产品的初始库存数量，数据将同步到库存管理模块"
              type="warning"
              title="库存管理"
            >
              <Label htmlFor="inventory">库存数量</Label>
            </SmartTooltip>
            <Input
              id="inventory"
              type="number"
              min="0"
              placeholder="0"
              value={formData.inventory || 0}
              onChange={(e) => handleChange("inventory", parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">库存数量将同步到库存管理模块</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">单位</Label>
              <Select
                value={formData.unit || "none"}
                onValueChange={(value) => handleChange("unit", value === "none" ? "" : value)}
              >
                <SelectTrigger id="unit">
                  <SelectValue placeholder="选择单位" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无单位</SelectItem>
                  {units.map((unit, index) => (
                    <SelectItem key={index} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="material">材质</Label>
              <Select
                value={formData.material || "none"}
                onValueChange={(value) => handleChange("material", value === "none" ? "" : value)}
              >
                <SelectTrigger id="material">
                  <SelectValue placeholder="选择材质" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无材质</SelectItem>
                  {materials.map((material, index) => (
                    <SelectItem key={index} value={material}>
                      {material}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="status"
              checked={formData.status === "active"}
              onCheckedChange={(checked) => handleChange("status", checked ? "active" : "inactive")}
            />
            <Label htmlFor="status">产品上架</Label>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>产品图片</Label>
            <div className="border rounded-md p-4">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">上传多张产品图片，第一张将作为主图显示</p>
                <FileUpload
                  accept={{ "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] }}
                  maxSize={30 * 1024 * 1024} // 30MB
                  maxFiles={10}
                  defaultValues={formData.imageUrls}
                  primaryImageUrl={formData.imageUrl}
                  allowPaste={true}
                  autoUpload={true}
                  enableCompression={true}
                  enableSorting={true}
                  onUpload={(url) => {
                    console.log("Image uploaded:", url);
                    // 如果没有主图，设置为主图
                    if (!formData.imageUrl) {
                      handleChange("imageUrl", url);
                    }
                  }}
                  onMultiUploadComplete={(urls) => {
                    console.log("Multiple images uploaded:", urls);
                    // 更新图片列表
                    handleChange("imageUrls", urls);
                  }}
                  onPrimaryImageChange={(url) => {
                    console.log("Primary image changed:", url);
                    handleChange("imageUrl", url);
                  }}
                />
              </div>

              {/* 已上传图片预览 - 隐藏，因为FileUpload组件已经显示了图片预览 */}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">产品描述</Label>
            <textarea
              id="description"
              className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="输入产品简要描述"
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">作品介绍</Label>
            <textarea
              id="details"
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="输入作品详细介绍"
              value={formData.details || ""}
              onChange={(e) => handleChange("details", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <SmartTooltip
          content={product ? "保存对产品信息的修改" : "将新产品添加到系统中"}
          type="success"
        >
          <Button type="submit">
            {product ? "保存修改" : "添加产品"}
          </Button>
        </SmartTooltip>
      </div>
    </form>
    </TooltipProvider>
  )
}
