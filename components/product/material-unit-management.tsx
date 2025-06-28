"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  PlusIcon, 
  EditIcon, 
  TrashIcon, 
  PackageIcon, 
  RulerIcon,
  SearchIcon,
  RefreshCwIcon
} from "lucide-react"

interface Material {
  id: number
  name: string
  description?: string
  productCount: number
  createdAt: string
  updatedAt: string
}

interface Unit {
  id: number
  name: string
  description?: string
  productCount: number
  createdAt: string
  updatedAt: string
}

interface MaterialUnitManagementProps {
  onClose?: () => void
}

export function MaterialUnitManagement({ onClose }: MaterialUnitManagementProps) {
  const { toast } = useToast()
  const [materials, setMaterials] = useState<Material[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  // 材质相关状态
  const [showMaterialDialog, setShowMaterialDialog] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [materialForm, setMaterialForm] = useState({ name: "", description: "" })
  
  // 单位相关状态
  const [showUnitDialog, setShowUnitDialog] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [unitForm, setUnitForm] = useState({ name: "", description: "" })

  // 加载数据
  const loadData = async () => {
    try {
      setIsLoading(true)
      const [materialsRes, unitsRes] = await Promise.all([
        fetch('/api/materials'),
        fetch('/api/units')
      ])

      if (materialsRes.ok) {
        const materialsData = await materialsRes.json()
        setMaterials(materialsData.materials || [])
      }

      if (unitsRes.ok) {
        const unitsData = await unitsRes.json()
        setUnits(unitsData.units || [])
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      toast({
        title: "加载失败",
        description: "无法加载材质和单位数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 材质操作
  const handleMaterialSubmit = async () => {
    if (!materialForm.name.trim()) {
      toast({
        title: "验证失败",
        description: "材质名称不能为空",
        variant: "destructive",
      })
      return
    }

    try {
      const url = editingMaterial ? `/api/materials/${editingMaterial.id}` : '/api/materials'
      const method = editingMaterial ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: materialForm.name.trim(),
          description: materialForm.description.trim() || null
        })
      })

      if (response.ok) {
        await loadData()
        setShowMaterialDialog(false)
        setEditingMaterial(null)
        setMaterialForm({ name: "", description: "" })
        toast({
          title: "成功",
          description: `材质${editingMaterial ? '更新' : '创建'}成功`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "操作失败",
          description: error.details || error.error || "操作失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('材质操作失败:', error)
      toast({
        title: "操作失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
    }
  }

  const handleMaterialDelete = async (material: Material) => {
    if (material.productCount > 0) {
      toast({
        title: "无法删除",
        description: `材质 "${material.name}" 正在被 ${material.productCount} 个产品使用`,
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/materials/${material.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadData()
        toast({
          title: "成功",
          description: `材质 "${material.name}" 删除成功`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "删除失败",
          description: error.details || error.error || "删除失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('删除材质失败:', error)
      toast({
        title: "删除失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
    }
  }

  // 单位操作
  const handleUnitSubmit = async () => {
    if (!unitForm.name.trim()) {
      toast({
        title: "验证失败",
        description: "单位名称不能为空",
        variant: "destructive",
      })
      return
    }

    try {
      const url = editingUnit ? `/api/units/${editingUnit.id}` : '/api/units'
      const method = editingUnit ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: unitForm.name.trim(),
          description: unitForm.description.trim() || null
        })
      })

      if (response.ok) {
        await loadData()
        setShowUnitDialog(false)
        setEditingUnit(null)
        setUnitForm({ name: "", description: "" })
        toast({
          title: "成功",
          description: `单位${editingUnit ? '更新' : '创建'}成功`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "操作失败",
          description: error.details || error.error || "操作失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('单位操作失败:', error)
      toast({
        title: "操作失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
    }
  }

  const handleUnitDelete = async (unit: Unit) => {
    if (unit.productCount > 0) {
      toast({
        title: "无法删除",
        description: `单位 "${unit.name}" 正在被 ${unit.productCount} 个产品使用`,
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/units/${unit.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadData()
        toast({
          title: "成功",
          description: `单位 "${unit.name}" 删除成功`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "删除失败",
          description: error.details || error.error || "删除失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('删除单位失败:', error)
      toast({
        title: "删除失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
    }
  }

  // 过滤数据
  const filteredMaterials = materials.filter(material =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (material.description && material.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredUnits = units.filter(unit =>
    unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (unit.description && unit.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            材质与单位管理
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
            >
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                关闭
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 搜索栏 */}
        <div className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索材质或单位..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <PackageIcon className="h-4 w-4" />
              材质管理 ({filteredMaterials.length})
            </TabsTrigger>
            <TabsTrigger value="units" className="flex items-center gap-2">
              <RulerIcon className="h-4 w-4" />
              单位管理 ({filteredUnits.length})
            </TabsTrigger>
          </TabsList>

          {/* 材质管理 */}
          <TabsContent value="materials" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">材质列表</h3>
              <Button
                onClick={() => {
                  setEditingMaterial(null)
                  setMaterialForm({ name: "", description: "" })
                  setShowMaterialDialog(true)
                }}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                添加材质
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>使用产品数</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : filteredMaterials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? '未找到匹配的材质' : '暂无材质数据'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMaterials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">{material.name}</TableCell>
                        <TableCell>{material.description || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={material.productCount > 0 ? "default" : "secondary"}>
                            {material.productCount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(material.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingMaterial(material)
                                setMaterialForm({
                                  name: material.name,
                                  description: material.description || ""
                                })
                                setShowMaterialDialog(true)
                              }}
                            >
                              <EditIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMaterialDelete(material)}
                              disabled={material.productCount > 0}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* 单位管理 */}
          <TabsContent value="units" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">单位列表</h3>
              <Button
                onClick={() => {
                  setEditingUnit(null)
                  setUnitForm({ name: "", description: "" })
                  setShowUnitDialog(true)
                }}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                添加单位
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>使用产品数</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : filteredUnits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? '未找到匹配的单位' : '暂无单位数据'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUnits.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.name}</TableCell>
                        <TableCell>{unit.description || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={unit.productCount > 0 ? "default" : "secondary"}>
                            {unit.productCount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(unit.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingUnit(unit)
                                setUnitForm({
                                  name: unit.name,
                                  description: unit.description || ""
                                })
                                setShowUnitDialog(true)
                              }}
                            >
                              <EditIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnitDelete(unit)}
                              disabled={unit.productCount > 0}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* 材质编辑对话框 */}
        <Dialog open={showMaterialDialog} onOpenChange={setShowMaterialDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMaterial ? '编辑材质' : '添加材质'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="material-name">材质名称 *</Label>
                <Input
                  id="material-name"
                  value={materialForm.name}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入材质名称"
                />
              </div>
              <div>
                <Label htmlFor="material-description">描述</Label>
                <Input
                  id="material-description"
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="请输入材质描述（可选）"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowMaterialDialog(false)
                  setEditingMaterial(null)
                  setMaterialForm({ name: "", description: "" })
                }}
              >
                取消
              </Button>
              <Button onClick={handleMaterialSubmit}>
                {editingMaterial ? '更新' : '创建'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 单位编辑对话框 */}
        <Dialog open={showUnitDialog} onOpenChange={setShowUnitDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUnit ? '编辑单位' : '添加单位'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="unit-name">单位名称 *</Label>
                <Input
                  id="unit-name"
                  value={unitForm.name}
                  onChange={(e) => setUnitForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入单位名称"
                />
              </div>
              <div>
                <Label htmlFor="unit-description">描述</Label>
                <Input
                  id="unit-description"
                  value={unitForm.description}
                  onChange={(e) => setUnitForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="请输入单位描述（可选）"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUnitDialog(false)
                  setEditingUnit(null)
                  setUnitForm({ name: "", description: "" })
                }}
              >
                取消
              </Button>
              <Button onClick={handleUnitSubmit}>
                {editingUnit ? '更新' : '创建'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
