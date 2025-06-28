"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { ProductCategoryFormData, ProductCategory } from "@/types/product"
import { SaveIcon, XIcon } from "lucide-react"

interface ProductCategoryFormProps {
  category?: ProductCategoryFormData | null
  categories: ProductCategory[]
  onSave: (data: ProductCategoryFormData) => void
  onCancel: () => void
}

export function ProductCategoryForm({
  category,
  categories,
  onSave,
  onCancel
}: ProductCategoryFormProps) {
  const { toast } = useToast()

  const [formData, setFormData] = useState<ProductCategoryFormData>({
    name: "",
    code: null,
    parentId: null,
    description: null,
    imageUrl: null,
    isActive: true,
    sortOrder: 0,
  })

  // 初始化表单数据
  useEffect(() => {
    if (category) {
      setFormData({
        id: category.id,
        name: category.name || "",
        code: category.code || null,
        parentId: category.parentId || null,
        description: category.description || null,
        imageUrl: category.imageUrl || null,
        isActive: category.isActive !== undefined ? category.isActive : true,
        sortOrder: category.sortOrder || 0,
      })
    } else {
      setFormData({
        name: "",
        code: null,
        parentId: null,
        description: null,
        imageUrl: null,
        isActive: true,
        sortOrder: 0,
      })
    }
  }, [category])

  // 处理表单字段变化
  const handleChange = (field: keyof ProductCategoryFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 获取可用的父分类（排除自己和子分类）
  const getAvailableParentCategories = () => {
    if (!category?.id) return categories

    // 排除自己和自己的子分类
    return categories.filter(cat => {
      if (cat.id === category.id) return false
      // 简单检查：如果分类的parentId是当前分类，则排除
      if (cat.parentId === category.id) return false
      return true
    })
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 表单验证
    if (!formData.name.trim()) {
      toast({
        title: "错误",
        description: "请填写分类名称",
        variant: "destructive",
      })
      return
    }

    // 检查分类名称是否重复（同级分类）
    const existingCategory = categories.find(cat => 
      cat.name === formData.name.trim() && 
      cat.parentId === formData.parentId &&
      cat.id !== formData.id
    )

    if (existingCategory) {
      toast({
        title: "错误",
        description: "同级分类中已存在相同名称的分类",
        variant: "destructive",
      })
      return
    }

    // 防止循环引用
    if (formData.parentId === formData.id) {
      toast({
        title: "错误",
        description: "不能将分类设置为自己的父分类",
        variant: "destructive",
      })
      return
    }

    console.log("🔄 [ProductCategoryForm] 提交分类数据:", formData)
    onSave(formData)
  }

  const availableParentCategories = getAvailableParentCategories()

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">分类名称 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="输入分类名称"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">分类编码</Label>
            <Input
              id="code"
              value={formData.code || ""}
              onChange={(e) => handleChange("code", e.target.value || null)}
              placeholder="输入分类编码（可选）"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentId">父分类</Label>
            <Select
              value={formData.parentId?.toString() || "none"}
              onValueChange={(value) => handleChange("parentId", value === "none" ? null : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择父分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无父分类（顶级分类）</SelectItem>
                {availableParentCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">排序顺序</Label>
            <Input
              id="sortOrder"
              type="number"
              min="0"
              value={formData.sortOrder}
              onChange={(e) => handleChange("sortOrder", parseInt(e.target.value) || 0)}
              placeholder="输入排序顺序"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="imageUrl">分类图片URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl || ""}
              onChange={(e) => handleChange("imageUrl", e.target.value || null)}
              placeholder="输入分类图片URL（可选）"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange("isActive", checked)}
            />
            <Label htmlFor="isActive">启用分类</Label>
          </div>

          {formData.imageUrl && (
            <div className="space-y-2">
              <Label>图片预览</Label>
              <div className="border rounded-md p-2">
                <img
                  src={formData.imageUrl}
                  alt="分类图片预览"
                  className="w-full h-32 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description">分类描述</Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => handleChange("description", e.target.value || null)}
            placeholder="输入分类描述（可选）"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <XIcon className="h-4 w-4 mr-2" />
          取消
        </Button>
        <Button type="submit">
          <SaveIcon className="h-4 w-4 mr-2" />
          保存
        </Button>
      </div>
    </form>
  )
}
