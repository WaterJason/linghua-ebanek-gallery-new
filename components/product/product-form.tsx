"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { FileUpload } from "@/components/file-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
  const [formData, setFormData] = useState<ProductFormData>({
    id: product?.id,
    name: product?.name || "",
    categoryId: product?.categoryId || null,
    price: product?.price || 0,
    barcode: product?.barcode || "",
    imageUrl: product?.imageUrl || "",
    imageUrls: product?.imageUrls || [],
    status: product?.type === "category_placeholder" ? "inactive" : "active", // 根据type字段推断状态
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
        barcode: product.barcode || "",
        imageUrl: product.imageUrl || "",
        imageUrls: product.imageUrls || [],
        status: product.type === "category_placeholder" ? "inactive" : "active", // 根据type字段推断状态
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
        barcode: "",
        imageUrl: "",
        imageUrls: [],
        status: "active",
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

    // 准备提交数据 - 将status转换为type
    const submitData = {
      ...formData,
      // 如果是非活动状态，设置type为category_placeholder，否则保持原样或设为product
      type: formData.status === "inactive" ? "category_placeholder" : (product?.type || "product")
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
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">产品名称 *</Label>
            <Input
              id="name"
              placeholder="输入产品名称"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">产品分类</Label>
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
            <Label htmlFor="price">售价 *</Label>
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
              <Label htmlFor="dimensions">尺寸</Label>
              <Input
                id="dimensions"
                placeholder="例如：10x5cm"
                value={formData.dimensions || ""}
                onChange={(e) => handleChange("dimensions", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">条码</Label>
              <Input
                id="barcode"
                placeholder="产品条码"
                value={formData.barcode || ""}
                onChange={(e) => handleChange("barcode", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inventory">库存数量</Label>
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
        <Button type="submit">
          {product ? "保存修改" : "添加产品"}
        </Button>
      </div>
    </form>
  )
}
