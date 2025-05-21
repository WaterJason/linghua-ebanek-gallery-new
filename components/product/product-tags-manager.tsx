"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { PlusIcon, XIcon, TagIcon } from "lucide-react"

export interface ProductTag {
  id: number;
  name: string;
  color?: string;
  description?: string;
  productCount?: number;
}

interface ProductTagsManagerProps {
  tags: ProductTag[];
  onAddTag: (tag: Omit<ProductTag, "id">) => Promise<void>;
  onUpdateTag: (tag: ProductTag) => Promise<void>;
  onDeleteTag: (tagId: number) => Promise<void>;
  onSelectTag?: (tagId: number) => void;
}

export function ProductTagsManager({
  tags,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
  onSelectTag
}: ProductTagsManagerProps) {
  const { toast } = useToast()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [newTag, setNewTag] = useState({ name: "", color: "#3b82f6", description: "" })
  const [currentTag, setCurrentTag] = useState<ProductTag | null>(null)
  const [tagToDelete, setTagToDelete] = useState<ProductTag | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
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
  
  // 处理添加标签
  const handleAddTag = async () => {
    if (!newTag.name.trim()) {
      toast({
        title: "错误",
        description: "标签名称不能为空",
        variant: "destructive",
      })
      return
    }
    
    if (tags.some(tag => tag.name.toLowerCase() === newTag.name.trim().toLowerCase())) {
      toast({
        title: "错误",
        description: "该标签名称已存在",
        variant: "destructive",
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await onAddTag({
        name: newTag.name.trim(),
        color: newTag.color,
        description: newTag.description.trim() || undefined
      })
      
      setNewTag({ name: "", color: "#3b82f6", description: "" })
      setIsAddDialogOpen(false)
      
      toast({
        title: "成功",
        description: "标签添加成功",
      })
    } catch (error) {
      toast({
        title: "添加失败",
        description: error instanceof Error ? error.message : "添加标签失败",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // 处理更新标签
  const handleUpdateTag = async () => {
    if (!currentTag) return
    
    if (!currentTag.name.trim()) {
      toast({
        title: "错误",
        description: "标签名称不能为空",
        variant: "destructive",
      })
      return
    }
    
    if (tags.some(tag => 
      tag.id !== currentTag.id && 
      tag.name.toLowerCase() === currentTag.name.trim().toLowerCase()
    )) {
      toast({
        title: "错误",
        description: "该标签名称已存在",
        variant: "destructive",
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await onUpdateTag({
        ...currentTag,
        name: currentTag.name.trim(),
        description: currentTag.description?.trim() || undefined
      })
      
      setCurrentTag(null)
      setIsEditDialogOpen(false)
      
      toast({
        title: "成功",
        description: "标签更新成功",
      })
    } catch (error) {
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "更新标签失败",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // 处理删除标签
  const handleDeleteTag = async () => {
    if (!tagToDelete) return
    
    setIsSubmitting(true)
    
    try {
      await onDeleteTag(tagToDelete.id)
      
      setTagToDelete(null)
      setIsConfirmDialogOpen(false)
      
      toast({
        title: "成功",
        description: "标签删除成功",
      })
    } catch (error) {
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "删除标签失败",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // 处理编辑标签
  const handleEditTag = (tag: ProductTag) => {
    setCurrentTag(tag)
    setIsEditDialogOpen(true)
  }
  
  // 处理确认删除
  const handleConfirmDelete = (tag: ProductTag) => {
    setTagToDelete(tag)
    setIsConfirmDialogOpen(true)
  }
  
  // 处理选择标签
  const handleSelectTag = (tagId: number) => {
    if (onSelectTag) {
      onSelectTag(tagId)
    }
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            产品标签
          </CardTitle>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            添加标签
          </Button>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TagIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>暂无标签</p>
              <p className="text-sm">点击"添加标签"按钮创建第一个标签</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tags.map(tag => (
                <div 
                  key={tag.id} 
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: tag.color || "#3b82f6" }}
                    />
                    <div>
                      <div 
                        className="font-medium cursor-pointer hover:underline"
                        onClick={() => handleSelectTag(tag.id)}
                      >
                        {tag.name}
                      </div>
                      {tag.productCount !== undefined && (
                        <div className="text-xs text-muted-foreground">
                          {tag.productCount} 个产品
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => handleEditTag(tag)}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive" 
                      onClick={() => handleConfirmDelete(tag)}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 添加标签对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加标签</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">标签名称</Label>
              <Input
                id="tag-name"
                placeholder="输入标签名称"
                value={newTag.name}
                onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>标签颜色</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(color => (
                  <div 
                    key={color.value}
                    className={`w-8 h-8 rounded-full cursor-pointer border-2 ${
                      newTag.color === color.value ? 'border-black dark:border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setNewTag(prev => ({ ...prev, color: color.value }))}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tag-description">描述 (可选)</Label>
              <Input
                id="tag-description"
                placeholder="输入标签描述"
                value={newTag.description}
                onChange={(e) => setNewTag(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
              取消
            </Button>
            <Button onClick={handleAddTag} disabled={isSubmitting}>
              {isSubmitting ? "添加中..." : "添加标签"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 编辑标签对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑标签</DialogTitle>
          </DialogHeader>
          {currentTag && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tag-name">标签名称</Label>
                <Input
                  id="edit-tag-name"
                  placeholder="输入标签名称"
                  value={currentTag.name}
                  onChange={(e) => setCurrentTag(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>标签颜色</Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(color => (
                    <div 
                      key={color.value}
                      className={`w-8 h-8 rounded-full cursor-pointer border-2 ${
                        currentTag.color === color.value ? 'border-black dark:border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setCurrentTag(prev => prev ? { ...prev, color: color.value } : null)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-tag-description">描述 (可选)</Label>
                <Input
                  id="edit-tag-description"
                  placeholder="输入标签描述"
                  value={currentTag.description || ""}
                  onChange={(e) => setCurrentTag(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              取消
            </Button>
            <Button onClick={handleUpdateTag} disabled={isSubmitting || !currentTag}>
              {isSubmitting ? "更新中..." : "更新标签"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        title="删除标签"
        description={`确定要删除标签 "${tagToDelete?.name}" 吗？如果有产品使用此标签，标签将从这些产品中移除。`}
        confirmLabel="确认删除"
        variant="destructive"
        onConfirm={handleDeleteTag}
      />
    </div>
  )
}
