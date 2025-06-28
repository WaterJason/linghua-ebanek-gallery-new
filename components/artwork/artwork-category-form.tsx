"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { ArtworkCategoryFormData, ArtworkCategory } from "@/types/artwork"
import { SaveIcon, XIcon } from "lucide-react"

interface ArtworkCategoryFormProps {
  category?: ArtworkCategoryFormData | null
  categories: ArtworkCategory[]
  onSave: (category: ArtworkCategoryFormData) => void
  onCancel: () => void
}

export function ArtworkCategoryForm({
  category,
  categories,
  onSave,
  onCancel
}: ArtworkCategoryFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<ArtworkCategoryFormData>({
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
      setFormData(category)
    }
  }, [category])

  // 处理字段变更
  const handleChange = (field: keyof ArtworkCategoryFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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

    console.log("🔄 [ArtworkCategoryForm] 提交分类数据:", formData)
    onSave(formData)
  }

  // 获取可选的父分类（排除当前分类及其子分类）
  const getAvailableParentCategories = () => {
    if (!category?.id) return categories
    
    // 排除当前分类及其子分类
    return categories.filter(cat => {
      if (cat.id === category.id) return false
      // 简单检查：如果父分类ID是当前分类，则排除
      return cat.parentId !== category.id
    })
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
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
          <Label htmlFor="code">分类代码</Label>
          <Input
            id="code"
            value={formData.code || ""}
            onChange={(e) => handleChange("code", e.target.value || null)}
            placeholder="输入分类代码"
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
              <SelectItem value="none">无父分类</SelectItem>
              {getAvailableParentCategories().map(cat => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">分类描述</Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => handleChange("description", e.target.value || null)}
            placeholder="输入分类描述"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">分类图片URL</Label>
          <Input
            id="imageUrl"
            value={formData.imageUrl || ""}
            onChange={(e) => handleChange("imageUrl", e.target.value || null)}
            placeholder="输入图片URL"
          />
          {formData.imageUrl && (
            <div className="mt-2">
              <img
                src={formData.imageUrl}
                alt="分类预览"
                className="w-32 h-32 object-cover rounded border"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sortOrder">排序</Label>
            <Input
              id="sortOrder"
              type="number"
              min="0"
              value={formData.sortOrder || 0}
              onChange={(e) => handleChange("sortOrder", parseInt(e.target.value) || 0)}
              placeholder="0"
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
