"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { PlusIcon, TrashIcon, SaveIcon, FileIcon, ClipboardIcon } from "lucide-react"

// 模板类型定义
interface PurchaseOrderTemplate {
  id: string;
  name: string;
  supplierId: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
    notes?: string;
  }[];
  notes?: string;
  createdAt: string;
}

interface PurchaseOrderTemplatesProps {
  suppliers: any[];
  products: any[];
  onUseTemplate: (template: PurchaseOrderTemplate) => void;
}

export function PurchaseOrderTemplates({
  suppliers,
  products,
  onUseTemplate,
}: PurchaseOrderTemplatesProps) {
  const [templates, setTemplates] = useState<PurchaseOrderTemplate[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<PurchaseOrderTemplate | null>(null)
  const [newTemplate, setNewTemplate] = useState<Partial<PurchaseOrderTemplate>>({
    name: "",
    supplierId: "",
    items: [],
    notes: "",
  })

  // 从本地存储加载模板
  useEffect(() => {
    const savedTemplates = localStorage.getItem("purchaseOrderTemplates")
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates))
      } catch (error) {
        console.error("Error loading templates:", error)
        toast({
          title: "加载模板失败",
          description: "无法加载保存的模板",
          variant: "destructive",
        })
      }
    }
  }, [])

  // 保存模板到本地存储
  const saveTemplatesToStorage = (updatedTemplates: PurchaseOrderTemplate[]) => {
    localStorage.setItem("purchaseOrderTemplates", JSON.stringify(updatedTemplates))
  }

  // 添加新模板
  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.supplierId) {
      toast({
        title: "无法保存模板",
        description: "请填写模板名称和选择供应商",
        variant: "destructive",
      })
      return
    }

    if (!newTemplate.items || newTemplate.items.length === 0) {
      toast({
        title: "无法保存模板",
        description: "请添加至少一个产品项目",
        variant: "destructive",
      })
      return
    }

    const newTemplateWithId: PurchaseOrderTemplate = {
      ...newTemplate as PurchaseOrderTemplate,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }

    const updatedTemplates = [...templates, newTemplateWithId]
    setTemplates(updatedTemplates)
    saveTemplatesToStorage(updatedTemplates)

    setNewTemplate({
      name: "",
      supplierId: "",
      items: [],
      notes: "",
    })
    setIsAddDialogOpen(false)

    toast({
      title: "模板已保存",
      description: `模板 "${newTemplateWithId.name}" 已成功保存`,
    })
  }

  // 删除模板
  const handleDeleteTemplate = () => {
    if (!selectedTemplate) return

    const updatedTemplates = templates.filter(t => t.id !== selectedTemplate.id)
    setTemplates(updatedTemplates)
    saveTemplatesToStorage(updatedTemplates)
    setIsDeleteDialogOpen(false)
    setSelectedTemplate(null)

    toast({
      title: "模板已删除",
      description: `模板 "${selectedTemplate.name}" 已成功删除`,
    })
  }

  // 使用模板
  const handleUseTemplate = (template: PurchaseOrderTemplate) => {
    onUseTemplate(template)
    toast({
      title: "已应用模板",
      description: `已应用模板 "${template.name}"`,
    })
  }

  // 获取供应商名称
  const getSupplierName = (id: string) => {
    return suppliers.find(s => s.id.toString() === id)?.name || "未知供应商"
  }

  // 获取产品名称
  const getProductName = (id: string) => {
    return products.find(p => p.id.toString() === id)?.name || "未知产品"
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">采购订单模板</h3>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          新建模板
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-muted/30">
          <FileIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">暂无保存的模板</p>
          <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            创建第一个模板
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <Card key={template.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{template.name}</CardTitle>
                <CardDescription>
                  供应商: {getSupplierName(template.supplierId)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-sm text-muted-foreground mb-2">
                  包含 {template.items.length} 个产品项目
                </div>
                <div className="max-h-[100px] overflow-y-auto border rounded-md p-2">
                  <ul className="text-sm space-y-1">
                    {template.items.slice(0, 5).map((item, index) => (
                      <li key={index}>
                        {getProductName(item.productId)} × {item.quantity}
                      </li>
                    ))}
                    {template.items.length > 5 && (
                      <li className="text-muted-foreground">
                        ...还有 {template.items.length - 5} 个项目
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSelectedTemplate(template)
                    setIsDeleteDialogOpen(true)
                  }}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => handleUseTemplate(template)}
                >
                  <ClipboardIcon className="mr-2 h-4 w-4" />
                  使用模板
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* 添加模板对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建采购订单模板</DialogTitle>
            <DialogDescription>
              创建一个新的采购订单模板，以便快速创建常用的采购订单
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="templateName">模板名称</Label>
              <Input
                id="templateName"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="例如：常用文具采购"
              />
            </div>
            <div>
              <Label htmlFor="templateSupplier">供应商</Label>
              <Select
                value={newTemplate.supplierId}
                onValueChange={(value) => setNewTemplate({ ...newTemplate, supplierId: value })}
              >
                <SelectTrigger id="templateSupplier">
                  <SelectValue placeholder="选择供应商" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="templateNotes">备注</Label>
              <Input
                id="templateNotes"
                value={newTemplate.notes}
                onChange={(e) => setNewTemplate({ ...newTemplate, notes: e.target.value })}
                placeholder="模板备注（可选）"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddTemplate}>
              <SaveIcon className="mr-2 h-4 w-4" />
              保存模板
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除模板</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除模板 "{selectedTemplate?.name}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-destructive text-destructive-foreground">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
