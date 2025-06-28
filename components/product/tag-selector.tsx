"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { PlusIcon, XIcon, TagIcon } from "lucide-react"

interface Tag {
  id: number
  name: string
  color?: string
  description?: string
  productCount?: number
}

interface TagSelectorProps {
  selectedTags: number[]
  onTagsChange: (tagIds: number[]) => void
  label?: string
  placeholder?: string
  allowCreate?: boolean
}

export function TagSelector({
  selectedTags,
  onTagsChange,
  label = "标签",
  placeholder = "选择标签",
  allowCreate = true
}: TagSelectorProps) {
  const { toast } = useToast()
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTag, setNewTag] = useState({
    name: "",
    color: "#3b82f6",
    description: ""
  })

  // 预定义的颜色选项
  const colorOptions = [
    { name: "蓝色", value: "#3b82f6" },
    { name: "红色", value: "#ef4444" },
    { name: "绿色", value: "#10b981" },
    { name: "黄色", value: "#f59e0b" },
    { name: "紫色", value: "#8b5cf6" },
    { name: "粉色", value: "#ec4899" },
    { name: "灰色", value: "#6b7280" },
    { name: "青色", value: "#06b6d4" },
  ]

  // 加载标签数据
  const loadTags = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/products/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data.tags || [])
      } else {
        throw new Error('Failed to load tags')
      }
    } catch (error) {
      console.error('加载标签失败:', error)
      toast({
        title: "加载失败",
        description: "无法加载标签数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTags()
  }, [])

  // 添加标签
  const handleAddTag = (tagId: number) => {
    if (!selectedTags.includes(tagId)) {
      onTagsChange([...selectedTags, tagId])
    }
  }

  // 移除标签
  const handleRemoveTag = (tagId: number) => {
    onTagsChange(selectedTags.filter(id => id !== tagId))
  }

  // 创建新标签
  const handleCreateTag = async () => {
    if (!newTag.name.trim()) {
      toast({
        title: "错误",
        description: "标签名称不能为空",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/products/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTag.name.trim(),
          color: newTag.color,
          description: newTag.description.trim() || null
        })
      })

      if (response.ok) {
        const result = await response.json()
        await loadTags() // 重新加载标签列表
        handleAddTag(result.tag.id) // 自动选择新创建的标签
        setNewTag({ name: "", color: "#3b82f6", description: "" })
        setShowCreateDialog(false)
        toast({
          title: "成功",
          description: `标签 "${result.tag.name}" 创建成功`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "创建失败",
          description: error.details || error.error || "创建标签失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('创建标签失败:', error)
      toast({
        title: "创建失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
    }
  }

  // 获取选中的标签
  const selectedTagObjects = tags.filter(tag => selectedTags.includes(tag.id))
  const availableTags = tags.filter(tag => !selectedTags.includes(tag.id))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {allowCreate && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            新增
          </Button>
        )}
      </div>

      {/* 已选择的标签 */}
      {selectedTagObjects.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/20">
          {selectedTagObjects.map(tag => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1"
              style={{ backgroundColor: tag.color + '20', borderColor: tag.color }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemoveTag(tag.id)}
              >
                <XIcon className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* 标签选择器 */}
      <Select onValueChange={(value) => handleAddTag(parseInt(value))}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>加载中...</SelectItem>
          ) : availableTags.length === 0 ? (
            <SelectItem value="empty" disabled>暂无可选标签</SelectItem>
          ) : (
            availableTags.map(tag => (
              <SelectItem key={tag.id} value={tag.id.toString()}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color || "#3b82f6" }}
                  />
                  {tag.name}
                  {tag.productCount !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      ({tag.productCount})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* 创建标签对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新标签</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tagName">标签名称</Label>
              <Input
                id="tagName"
                value={newTag.name}
                onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                placeholder="输入标签名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagColor">标签颜色</Label>
              <Select
                value={newTag.color}
                onValueChange={(value) => setNewTag(prev => ({ ...prev, color: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color.value }}
                        />
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagDescription">描述（可选）</Label>
              <Input
                id="tagDescription"
                value={newTag.description}
                onChange={(e) => setNewTag(prev => ({ ...prev, description: e.target.value }))}
                placeholder="输入标签描述"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateTag}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
