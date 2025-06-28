"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
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
import { ProductCategory, CategoryFormData } from "@/types/product"

interface CategoryFormProps {
  category?: ProductCategory | null
  categories?: ProductCategory[]
  onSubmit: (data: CategoryFormData) => Promise<void>
  onCancel: () => void
}

export function CategoryForm({
  category,
  categories = [],
  onSubmit,
  onCancel
}: CategoryFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<CategoryFormData>({
    id: category?.id,
    name: category?.name || "",
    code: category?.code || "",
    parentId: category?.parentId || null,
    description: category?.description || "",
    imageUrl: category?.imageUrl || "",
    isActive: category?.isActive !== false,
    sortOrder: category?.sortOrder || 0
  })

  // 当分类变化时更新表单数据
  useEffect(() => {
    if (category) {
      setFormData({
        id: category.id,
        name: category.name || "",
        code: category.code || "",
        parentId: category.parentId || null,
        description: category.description || "",
        imageUrl: category.imageUrl || "",
        isActive: category.isActive !== false,
        sortOrder: category.sortOrder || 0
      })
    } else {
      // 重置表单
      setFormData({
        name: "",
        code: "",
        parentId: null,
        description: "",
        imageUrl: "",
        isActive: true,
        sortOrder: 0
      })
    }
  }, [category])

  // 处理表单字段变化
  const handleChange = (field: keyof CategoryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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

    // 提交表单
    await onSubmit(formData)
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="categoryName">分类名称 *</Label>
          <Input
            id="categoryName"
            placeholder="输入分类名称"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryCode">分类编码</Label>
          <Input
            id="categoryCode"
            placeholder="输入分类编码"
            value={formData.code || ""}
            onChange={(e) => handleChange("code", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="parentCategory">父分类</Label>
        <Select
          value={formData.parentId ? formData.parentId.toString() : "null"}
          onValueChange={(value) => handleChange("parentId", value !== "null" ? parseInt(value) : null)}
        >
          <SelectTrigger id="parentCategory">
            <SelectValue placeholder="选择父分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">无 (顶级分类)</SelectItem>
            {categories?.filter(c => c.id !== formData.id).map(category => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryDescription">分类描述</Label>
        <textarea
          id="categoryDescription"
          className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="输入分类描述"
          value={formData.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sortOrder">排序顺序</Label>
          <Input
            id="sortOrder"
            type="number"
            placeholder="输入排序顺序"
            value={formData.sortOrder || 0}
            onChange={(e) => handleChange("sortOrder", parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">分类图片URL</Label>
          <Input
            id="imageUrl"
            placeholder="输入分类图片URL"
            value={formData.imageUrl || ""}
            onChange={(e) => handleChange("imageUrl", e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={formData.isActive !== false}
          onCheckedChange={(checked) => handleChange("isActive", !!checked)}
        />
        <Label htmlFor="isActive">启用分类</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">
          {category ? "保存修改" : "添加分类"}
        </Button>
      </div>
    </form>
  )
}
