"use client"

import { useState, useEffect } from "react"
import { ModernPageContainer } from "@/components/modern-page-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { PlusIcon, EditIcon, TrashIcon, TagIcon } from "lucide-react"

interface Tag {
  id: number
  name: string
  color: string
  description?: string
  productCount: number
}

export default function TagsPage() {
  const { toast } = useToast()
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
  const [formData, setFormData] = useState({ 
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

  // 创建标签
  const handleCreate = async () => {
    if (!formData.name.trim()) {
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
          name: formData.name.trim(),
          color: formData.color,
          description: formData.description.trim() || null
        })
      })

      if (response.ok) {
        await loadTags()
        setFormData({ name: "", color: "#3b82f6", description: "" })
        setShowCreateDialog(false)
        toast({
          title: "成功",
          description: `标签 "${formData.name.trim()}" 创建成功`,
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

  // 编辑标签
  const handleEdit = async () => {
    if (!selectedTag || !formData.name.trim()) {
      toast({
        title: "错误",
        description: "标签名称不能为空",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/products/tags/${selectedTag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          color: formData.color,
          description: formData.description.trim() || null
        })
      })

      if (response.ok) {
        await loadTags()
        setFormData({ name: "", color: "#3b82f6", description: "" })
        setSelectedTag(null)
        setShowEditDialog(false)
        toast({
          title: "成功",
          description: `标签更新成功`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "更新失败",
          description: error.details || error.error || "更新标签失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('更新标签失败:', error)
      toast({
        title: "更新失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
    }
  }

  // 删除标签
  const handleDelete = async () => {
    if (!selectedTag) return

    try {
      const response = await fetch(`/api/products/tags?id=${selectedTag.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadTags()
        setSelectedTag(null)
        setShowDeleteDialog(false)
        toast({
          title: "成功",
          description: "标签删除成功",
        })
      } else {
        const error = await response.json()
        toast({
          title: "删除失败",
          description: error.details || error.error || "删除标签失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('删除标签失败:', error)
      toast({
        title: "删除失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
    }
  }

  // 打开编辑对话框
  const openEditDialog = (tag: Tag) => {
    setSelectedTag(tag)
    setFormData({ 
      name: tag.name, 
      color: tag.color, 
      description: tag.description || "" 
    })
    setShowEditDialog(true)
  }

  // 打开删除对话框
  const openDeleteDialog = (tag: Tag) => {
    setSelectedTag(tag)
    setShowDeleteDialog(true)
  }

  return (
    <ModernPageContainer
      title="标签管理"
      description="管理产品标签信息"
      icon={<TagIcon className="h-6 w-6" />}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>标签列表</CardTitle>
          <Button onClick={() => setShowCreateDialog(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            添加标签
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : tags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TagIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>暂无标签</p>
              <p className="text-sm">点击"添加标签"按钮创建第一个标签</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标签名称</TableHead>
                  <TableHead>颜色</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>使用统计</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="font-medium">{tag.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        style={{ 
                          backgroundColor: tag.color + '20', 
                          borderColor: tag.color,
                          color: tag.color 
                        }}
                      >
                        {colorOptions.find(c => c.value === tag.color)?.name || "自定义"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {tag.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {tag.productCount} 个产品
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(tag)}
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(tag)}
                          disabled={tag.productCount > 0}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 创建标签对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加新标签</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tagName">标签名称</Label>
              <Input
                id="tagName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="输入标签名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagColor">标签颜色</Label>
              <Select
                value={formData.color}
                onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
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
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="输入标签描述"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreate}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑标签对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑标签</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTagName">标签名称</Label>
              <Input
                id="editTagName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="输入标签名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTagColor">标签颜色</Label>
              <Select
                value={formData.color}
                onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
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
              <Label htmlFor="editTagDescription">描述（可选）</Label>
              <Input
                id="editTagDescription"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="输入标签描述"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleEdit}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>确定要删除标签 "{selectedTag?.name}" 吗？</p>
            {selectedTag?.productCount > 0 && (
              <p className="text-red-600 text-sm mt-2">
                该标签被 {selectedTag.productCount} 个产品使用，无法删除。
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={selectedTag?.productCount > 0}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModernPageContainer>
  )
}
