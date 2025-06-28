"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Artwork, ArtworkCategory, ArtworkFilter } from "@/types/artwork"
import {
  SearchIcon,
  EditIcon,
  TrashIcon,
  ImageIcon,
  PlusIcon,
  FilterIcon,
  EyeIcon,
  MoreHorizontalIcon,
  ListIcon,
  LayoutGridIcon
} from "lucide-react"
import { LazyImage } from "@/components/ui/lazy-image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ArtworkListProps {
  artworks: Artwork[]
  categories: ArtworkCategory[]
  filter: ArtworkFilter
  onFilterChange: (filter: Partial<ArtworkFilter>) => void
  onAddArtwork: () => void
  onEditArtwork: (artwork: Artwork) => void
  onDeleteArtwork: (artworkId: number) => void
  onSelectionChange: (artworkIds: number[]) => void
  isLoading?: boolean
}

export function ArtworkList({
  artworks,
  categories,
  filter,
  onFilterChange,
  onAddArtwork,
  onEditArtwork,
  onDeleteArtwork,
  onSelectionChange,
  isLoading = false
}: ArtworkListProps) {
  const { toast } = useToast()
  const [selectedArtworks, setSelectedArtworks] = useState<number[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"table" | "grid" | "list">("table")
  const [editingField, setEditingField] = useState<{ id: number, field: string, value: string | number } | null>(null)

  // 处理选择作品
  const handleSelectArtwork = (artworkId: number, checked: boolean) => {
    const newSelection = checked
      ? [...selectedArtworks, artworkId]
      : selectedArtworks.filter(id => id !== artworkId)

    setSelectedArtworks(newSelection)
    onSelectionChange(newSelection)
  }

  // 处理全选
  const handleSelectAll = (checked: boolean) => {
    const newSelection = checked ? artworks.map(artwork => artwork.id!).filter(Boolean) : []
    setSelectedArtworks(newSelection)
    onSelectionChange(newSelection)
  }

  // 获取状态显示
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">正常</Badge>
      case "inactive":
        return <Badge variant="secondary">停用</Badge>
      case "draft":
        return <Badge variant="outline">草稿</Badge>
      default:
        return <Badge variant="default">正常</Badge>
    }
  }

  // 获取分类名称
  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return "未分类"
    const category = categories.find(c => c.id === categoryId)
    return category?.name || "未知分类"
  }

  // 处理双击编辑
  const handleDoubleClick = (artwork: Artwork, field: string) => {
    let value: string | number = ""
    if (field === 'name') {
      value = artwork.name
    } else if (field === 'price') {
      value = artwork.price
    } else if (field === 'inventory') {
      value = artwork.inventory || 0
    }

    setEditingField({ id: artwork.id!, field, value })
  }

  // 处理编辑字段值变化
  const handleEditChange = (value: string) => {
    if (editingField) {
      let newValue: string | number = value

      if (editingField.field === 'inventory' || editingField.field === 'price') {
        if (value === '') {
          newValue = 0
        } else {
          const num = Number(value)
          newValue = isNaN(num) ? editingField.value : num
        }
      }

      setEditingField({
        ...editingField,
        value: newValue
      })
    }
  }

  // 处理编辑完成
  const handleEditComplete = async () => {
    if (!editingField) return

    try {
      const artwork = artworks.find(a => a.id === editingField.id)
      if (!artwork) return

      const updatedArtwork = { ...artwork }

      if (editingField.field === 'name') {
        updatedArtwork.name = editingField.value as string
      } else if (editingField.field === 'inventory') {
        updatedArtwork.inventory = editingField.value as number
      } else if (editingField.field === 'price') {
        updatedArtwork.price = editingField.value as number
      }

      await onEditArtwork(updatedArtwork)

      toast({
        title: "更新成功",
        description: `作品${
          editingField.field === 'name' ? '名称' :
          editingField.field === 'inventory' ? '库存' : '价格'
        }已更新`,
      })

      setEditingField(null)
    } catch (error) {
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "更新失败",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* 搜索和过滤 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            搜索和过滤
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索作品名称、SKU或条形码..."
                value={filter.searchQuery}
                onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                className="pl-10"
              />
            </div>

            <Select
              value={filter.categoryId?.toString() || "all"}
              onValueChange={(value) => onFilterChange({
                categoryId: value === "all" ? null : parseInt(value)
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filter.statusFilter}
              onValueChange={(value) => onFilterChange({ statusFilter: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">正常</SelectItem>
                <SelectItem value="inactive">停用</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filter.materialFilter || "all"}
              onValueChange={(value) => onFilterChange({ materialFilter: value === "all" ? null : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择材质" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部材质</SelectItem>
                <SelectItem value="珐琅">珐琅</SelectItem>
                <SelectItem value="景泰蓝">景泰蓝</SelectItem>
                <SelectItem value="陶瓷">陶瓷</SelectItem>
                <SelectItem value="青铜">青铜</SelectItem>
                <SelectItem value="银器">银器</SelectItem>
                <SelectItem value="玉器">玉器</SelectItem>
                <SelectItem value="木雕">木雕</SelectItem>
                <SelectItem value="石雕">石雕</SelectItem>
                <SelectItem value="漆器">漆器</SelectItem>
                <SelectItem value="丝绸">丝绸</SelectItem>
                <SelectItem value="none">无材质</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={onAddArtwork} className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              新增作品
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 作品列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>作品列表 ({artworks.length})</CardTitle>
            <div className="flex items-center gap-2">
              {selectedArtworks.length > 0 && (
                <Badge variant="secondary">
                  已选择 {selectedArtworks.length} 个作品
                </Badge>
              )}
              {/* 视图模式切换 */}
              <div className="flex items-center border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none h-8 px-2"
                  onClick={() => setViewMode("table")}
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none h-8 px-2"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGridIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none h-8 px-2"
                  onClick={() => setViewMode("list")}
                >
                  <EyeIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : artworks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <ImageIcon className="h-12 w-12 mb-4" />
              <p>暂无作品数据</p>
              <Button onClick={onAddArtwork} className="mt-4">
                添加第一个作品
              </Button>
            </div>
          ) : (
            <>
              {/* 表格视图 */}
              {viewMode === "table" && (
                <div className="overflow-x-auto">
                  <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedArtworks.length === artworks.length && artworks.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>图片</TableHead>
                    <TableHead>作品名称</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>材质</TableHead>
                    <TableHead>单位</TableHead>
                    <TableHead>价格</TableHead>
                    <TableHead>库存</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {artworks.map((artwork) => (
                    <TableRow key={artwork.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedArtworks.includes(artwork.id!)}
                          onCheckedChange={(checked) => handleSelectArtwork(artwork.id!, !!checked)}
                        />
                      </TableCell>
                      <TableCell>
                        {artwork.imageUrl ? (
                          <img
                            src={artwork.imageUrl}
                            alt={artwork.name}
                            className="w-12 h-12 object-cover rounded cursor-pointer"
                            onClick={() => setPreviewImage(artwork.imageUrl)}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingField?.id === artwork.id && editingField?.field === 'name' ? (
                          <div className="flex items-center">
                            <Input
                              value={editingField.value as string}
                              onChange={(e) => handleEditChange(e.target.value)}
                              onBlur={handleEditComplete}
                              onKeyDown={(e) => e.key === 'Enter' && handleEditComplete()}
                              autoFocus
                              className="h-8"
                            />
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:text-primary"
                            onDoubleClick={() => handleDoubleClick(artwork, 'name')}
                          >
                            <div className="font-medium">{artwork.name}</div>
                            {artwork.barcode && (
                              <div className="text-sm text-gray-500">条形码: {artwork.barcode}</div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getCategoryName(artwork.categoryId)}</TableCell>
                      <TableCell>{artwork.material || "无"}</TableCell>
                      <TableCell>{artwork.unit || "无"}</TableCell>
                      <TableCell>
                        {editingField?.id === artwork.id && editingField?.field === 'price' ? (
                          <div className="flex items-center">
                            <Input
                              type="number"
                              step="0.01"
                              value={editingField.value as number}
                              onChange={(e) => handleEditChange(e.target.value)}
                              onBlur={handleEditComplete}
                              onKeyDown={(e) => e.key === 'Enter' && handleEditComplete()}
                              autoFocus
                              className="h-8 w-20"
                            />
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:text-primary"
                            onDoubleClick={() => handleDoubleClick(artwork, 'price')}
                          >
                            ¥{artwork.price.toFixed(2)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingField?.id === artwork.id && editingField?.field === 'inventory' ? (
                          <div className="flex items-center">
                            <Input
                              type="number"
                              value={editingField.value as number}
                              onChange={(e) => handleEditChange(e.target.value)}
                              onBlur={handleEditComplete}
                              onKeyDown={(e) => e.key === 'Enter' && handleEditComplete()}
                              autoFocus
                              className="h-8 w-16"
                            />
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:text-primary"
                            onDoubleClick={() => handleDoubleClick(artwork, 'inventory')}
                          >
                            {artwork.inventory || 0}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(artwork.status || "active")}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditArtwork(artwork)}>
                              <EditIcon className="h-4 w-4 mr-2" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeleteArtwork(artwork.id!)}
                              className="text-red-600"
                            >
                              <TrashIcon className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
              )}

              {/* 网格视图 */}
              {viewMode === "grid" && (
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {artworks.map(artwork => (
                      <div key={artwork.id} className="border rounded-lg overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="relative">
                          <div
                            className="aspect-square bg-gray-100 flex items-center justify-center cursor-pointer max-h-[200px]"
                            onClick={() => {
                              if (artwork.imageUrl) {
                                setPreviewImage(artwork.imageUrl)
                              }
                            }}
                          >
                            {artwork.imageUrl ? (
                              <LazyImage
                                src={artwork.imageUrl}
                                alt={artwork.name}
                                className="w-full h-full object-cover"
                                containerClassName="w-full h-full"
                                fallbackIcon={<ImageIcon className="h-8 w-8 text-gray-400" />}
                              />
                            ) : (
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          <div className="absolute top-2 left-2">
                            <Checkbox
                              checked={selectedArtworks.includes(artwork.id!)}
                              onCheckedChange={(checked) => handleSelectArtwork(artwork.id!, !!checked)}
                              className="bg-white"
                            />
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEditArtwork(artwork)}>
                                  <EditIcon className="h-4 w-4 mr-2" />
                                  编辑
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onDeleteArtwork(artwork.id!)}
                                  className="text-red-600"
                                >
                                  <TrashIcon className="h-4 w-4 mr-2" />
                                  删除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="font-medium text-sm mb-1 truncate">{artwork.name}</div>
                          <div className="text-xs text-gray-500 mb-2">
                            {getCategoryName(artwork.categoryId)} • {artwork.material || "无材质"}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-primary">¥{artwork.price.toFixed(2)}</span>
                            <span className="text-gray-500">库存: {artwork.inventory || 0}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            {getStatusBadge(artwork.status || "active")}
                            <span className="text-xs text-gray-500">{artwork.unit || "无单位"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 列表视图 */}
              {viewMode === "list" && (
                <div className="p-4">
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {artworks.map(artwork => (
                      <div key={artwork.id} className="flex items-center border rounded-md p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0 mr-3">
                          <Checkbox
                            checked={selectedArtworks.includes(artwork.id!)}
                            onCheckedChange={(checked) => handleSelectArtwork(artwork.id!, !!checked)}
                          />
                        </div>
                        <div className="flex-shrink-0 mr-4">
                          <div
                            className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center cursor-pointer"
                            onClick={() => {
                              if (artwork.imageUrl) {
                                setPreviewImage(artwork.imageUrl)
                              }
                            }}
                          >
                            {artwork.imageUrl ? (
                              <LazyImage
                                src={artwork.imageUrl}
                                alt={artwork.name}
                                className="w-full h-full object-cover"
                                containerClassName="w-full h-full"
                                fallbackIcon={<ImageIcon className="h-4 w-4 text-gray-400" />}
                              />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{artwork.name}</div>
                              <div className="text-sm text-gray-500 truncate">
                                {getCategoryName(artwork.categoryId)} • {artwork.material || "无材质"} • {artwork.unit || "无单位"}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 ml-4">
                              <div className="text-right">
                                <div className="font-medium text-primary">¥{artwork.price.toFixed(2)}</div>
                                <div className="text-sm text-gray-500">库存: {artwork.inventory || 0}</div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getStatusBadge(artwork.status || "active")}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontalIcon className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onEditArtwork(artwork)}>
                                      <EditIcon className="h-4 w-4 mr-2" />
                                      编辑
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => onDeleteArtwork(artwork.id!)}
                                      className="text-red-600"
                                    >
                                      <TrashIcon className="h-4 w-4 mr-2" />
                                      删除
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-muted-foreground">
            共 {artworks.length} 个作品
          </div>
          {selectedArtworks.length > 0 && (
            <div className="text-sm text-muted-foreground">
              已选择 {selectedArtworks.length} 个作品
            </div>
          )}
        </CardFooter>
      </Card>

      {/* 图片预览对话框 */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-3xl max-h-3xl p-4">
            <img
              src={previewImage}
              alt="预览"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}
