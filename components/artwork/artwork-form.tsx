"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ArtworkFormData, ArtworkCategory } from "@/types/artwork"
import { ImageIcon, SaveIcon, XIcon, PlusIcon } from "lucide-react"
import { FileUpload } from "@/components/file-upload"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface ArtworkFormProps {
  artwork?: ArtworkFormData | null
  categories: ArtworkCategory[]
  onSave: (artwork: ArtworkFormData) => void
  onCancel: () => void
}

export function ArtworkForm({
  artwork,
  categories,
  onSave,
  onCancel
}: ArtworkFormProps) {
  const { toast } = useToast()

  // 动态选项状态
  const [materials, setMaterials] = useState<string[]>([
    "珐琅", "景泰蓝", "陶瓷", "青铜", "银器", "玉器", "木雕", "石雕", "漆器", "丝绸"
  ])
  const [units, setUnits] = useState<string[]>([
    "套", "件", "幅", "对", "组", "个", "只", "张"
  ])

  // 新增对话框状态
  const [showAddMaterialDialog, setShowAddMaterialDialog] = useState(false)
  const [showAddUnitDialog, setShowAddUnitDialog] = useState(false)
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false)
  const [newMaterial, setNewMaterial] = useState("")
  const [newUnit, setNewUnit] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")

  const [formData, setFormData] = useState<ArtworkFormData>({
    name: "",
    price: 0,
    commissionRate: 0,
    categoryId: null,
    imageUrl: null,
    imageUrls: [],
    description: null,
    cost: null,
    sku: null,
    barcode: null,
    status: "active",
    dimensions: null,
    material: "珐琅", // 默认值设置为珐琅
    unit: "套", // 默认值设置为套
    details: null,
    inventory: null,
  })

  // 初始化表单数据
  useEffect(() => {
    if (artwork) {
      setFormData({
        ...artwork,
        price: artwork.price || 0,
        commissionRate: artwork.commissionRate || 0,
      })
    }
  }, [artwork])

  // 处理字段变更
  const handleChange = (field: keyof ArtworkFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 添加新材质
  const handleAddMaterial = () => {
    if (!newMaterial.trim()) {
      toast({
        title: "错误",
        description: "材质名称不能为空",
        variant: "destructive",
      })
      return
    }

    if (materials.includes(newMaterial.trim())) {
      toast({
        title: "错误",
        description: "该材质已存在",
        variant: "destructive",
      })
      return
    }

    const updatedMaterials = [...materials, newMaterial.trim()]
    setMaterials(updatedMaterials)
    handleChange("material", newMaterial.trim())
    setNewMaterial("")
    setShowAddMaterialDialog(false)

    toast({
      title: "成功",
      description: "材质添加成功",
    })
  }

  // 添加新单位
  const handleAddUnit = () => {
    if (!newUnit.trim()) {
      toast({
        title: "错误",
        description: "单位名称不能为空",
        variant: "destructive",
      })
      return
    }

    if (units.includes(newUnit.trim())) {
      toast({
        title: "错误",
        description: "该单位已存在",
        variant: "destructive",
      })
      return
    }

    const updatedUnits = [...units, newUnit.trim()]
    setUnits(updatedUnits)
    handleChange("unit", newUnit.trim())
    setNewUnit("")
    setShowAddUnitDialog(false)

    toast({
      title: "成功",
      description: "单位添加成功",
    })
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 表单验证
    if (!formData.name.trim()) {
      toast({
        title: "错误",
        description: "请填写作品名称",
        variant: "destructive",
      })
      return
    }

    if (formData.price <= 0) {
      toast({
        title: "错误",
        description: "作品价格必须大于0",
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
        variant: "destructive",
      })
      // 不阻止提交，但给出警告
    }

    // 准备提交数据 - 确保作品类型始终为"artwork"
    const submitData = {
      ...formData,
      // 作品类型始终为"artwork"，不使用占位类型
      type: "artwork",
      // 保留status字段用于前端显示，但不影响数据库type字段
      status: formData.status
    };

    console.log("🔄 [ArtworkForm] 提交作品数据:", submitData)
    onSave(submitData)
  }

  return (
    <>
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">作品名称 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="输入作品名称"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">作品分类</Label>
            <Select
              value={formData.categoryId?.toString() || "uncategorized"}
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
            <Label htmlFor="price">作品价格 *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => handleChange("price", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inventory">库存数量</Label>
            <Input
              id="inventory"
              type="number"
              min="0"
              value={formData.inventory || ""}
              onChange={(e) => handleChange("inventory", e.target.value ? parseInt(e.target.value) : null)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">作品状态</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">正常</SelectItem>
                <SelectItem value="inactive">停用</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="barcode">条形码</Label>
            <Input
              id="barcode"
              value={formData.barcode || ""}
              onChange={(e) => handleChange("barcode", e.target.value || null)}
              placeholder="输入条形码"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="material">材质</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddMaterialDialog(true)}
                  className="h-6 px-2 text-xs"
                >
                  <PlusIcon className="h-3 w-3 mr-1" />
                  新增
                </Button>
              </div>
              <Select
                value={formData.material || "none"}
                onValueChange={(value) => {
                  if (value === "add_new") {
                    setShowAddMaterialDialog(true)
                  } else {
                    handleChange("material", value === "none" ? null : value)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择材质" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无</SelectItem>
                  {materials.map(material => (
                    <SelectItem key={material} value={material}>
                      {material}
                    </SelectItem>
                  ))}
                  <SelectItem value="add_new" className="text-primary">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    添加新材质...
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="unit">单位</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddUnitDialog(true)}
                  className="h-6 px-2 text-xs"
                >
                  <PlusIcon className="h-3 w-3 mr-1" />
                  新增
                </Button>
              </div>
              <Select
                value={formData.unit || "none"}
                onValueChange={(value) => {
                  if (value === "add_new") {
                    setShowAddUnitDialog(true)
                  } else {
                    handleChange("unit", value === "none" ? null : value)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择单位" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无</SelectItem>
                  {units.map(unit => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                  <SelectItem value="add_new" className="text-primary">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    添加新单位...
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dimensions">尺寸规格</Label>
            <Input
              id="dimensions"
              value={formData.dimensions || ""}
              onChange={(e) => handleChange("dimensions", e.target.value || null)}
              placeholder="输入尺寸规格"
            />
          </div>

          <div className="space-y-2">
            <Label>作品图片</Label>
            <div className="border rounded-md p-4">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">上传多张作品图片，第一张将作为主图显示</p>
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
                    // 更新主图
                    handleChange("imageUrl", url);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description">作品描述</Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => handleChange("description", e.target.value || null)}
            placeholder="输入作品描述"
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

    {/* 添加材质对话框 */}
    <Dialog open={showAddMaterialDialog} onOpenChange={setShowAddMaterialDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加新材质</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-material">材质名称</Label>
            <Input
              id="new-material"
              placeholder="例如：青花瓷、紫砂等"
              value={newMaterial}
              onChange={(e) => setNewMaterial(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMaterial()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAddMaterialDialog(false)}>
            取消
          </Button>
          <Button onClick={handleAddMaterial}>
            添加材质
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* 添加单位对话框 */}
    <Dialog open={showAddUnitDialog} onOpenChange={setShowAddUnitDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加新单位</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-unit">单位名称</Label>
            <Input
              id="new-unit"
              placeholder="例如：盒、箱、批等"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAddUnitDialog(false)}>
            取消
          </Button>
          <Button onClick={handleAddUnit}>
            添加单位
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
