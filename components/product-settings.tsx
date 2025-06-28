"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PlusIcon, PencilIcon, TrashIcon, ImageIcon } from "lucide-react"
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/lib/actions/product-actions"
import { useToast } from "@/components/ui/use-toast"
import { FileUpload } from "@/components/file-upload"
import { ExportImportButtons } from "@/components/export-import-buttons"

interface Product {
  id: number
  name: string
  price: number
  commissionRate?: number
  imageUrl?: string | null
  description?: string | null
}

export function ProductSettings() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 获取产品数据
  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await getProducts()
        // 转换数据格式以匹配本地Product接口
        const formattedProducts = data.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          commissionRate: 10, // 默认佣金率，因为产品模块不包含此字段
          imageUrl: product.imageUrl,
          description: product.description
        }))
        setProducts(formattedProducts)
      } catch (error) {
        console.error("Error fetching products:", error)
        toast({
          title: "加载失败",
          description: "获取产品数据时出错",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [toast])

  const handleAddProduct = () => {
    setEditingProduct({
      id: 0,
      name: "",
      price: 0,
      commissionRate: 10,
      imageUrl: "",
      description: ""
    })
    setIsDialogOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct({ ...product })
    setIsDialogOpen(true)
  }

  const handleImageUpload = (url: string) => {
    if (editingProduct) {
      setEditingProduct({ ...editingProduct, imageUrl: url })
    }
  }

  const handleDeleteProduct = async (id: number) => {
    if (confirm("确定要删除这个产品吗？")) {
      try {
        await deleteProduct(id)
        setProducts(products.filter((product) => product.id !== id))
        toast({
          title: "删除成功",
          description: "产品已成功删除",
        })
      } catch (error) {
        console.error("Error deleting product:", error)
        toast({
          title: "删除失败",
          description: "删除产品时出错",
        })
      }
    }
  }

  const handleSaveProduct = async () => {
    if (!editingProduct) return

    setSubmitting(true)
    try {
      if (editingProduct.id === 0) {
        // 添加新产品
        const newProduct = await createProduct({
          name: editingProduct.name,
          price: editingProduct.price,
          imageUrl: editingProduct.imageUrl,
          description: editingProduct.description
        })
        setProducts([...products, {
          id: newProduct.id,
          name: newProduct.name,
          price: newProduct.price,
          commissionRate: 10,
          imageUrl: newProduct.imageUrl,
          description: newProduct.description
        }])
        toast({
          title: "添加成功",
          description: "新产品已成功添加",
        })
      } else {
        // 更新现有产品
        const updatedProduct = await updateProduct(editingProduct.id, {
          name: editingProduct.name,
          price: editingProduct.price,
          imageUrl: editingProduct.imageUrl,
          description: editingProduct.description
        })
        setProducts(products.map((product) =>
          product.id === editingProduct.id ? {
            id: updatedProduct.id,
            name: updatedProduct.name,
            price: updatedProduct.price,
            commissionRate: editingProduct.commissionRate || 10,
            imageUrl: updatedProduct.imageUrl,
            description: updatedProduct.description
          } : product
        ))
        toast({
          title: "更新成功",
          description: "产品信息已成功更新",
        })
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error saving product:", error)
      toast({
        title: "保存失败",
        description: "保存产品信息时出错",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">加载产品数据中...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">产品列表</h3>
        <div className="flex gap-2">
          <ExportImportButtons type="products" />
          <Button onClick={handleAddProduct}>
            <PlusIcon className="mr-2 h-4 w-4" />
            添加产品
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>图片</TableHead>
              <TableHead>产品名称</TableHead>
              <TableHead className="text-right">价格 (¥)</TableHead>
              <TableHead className="text-right">提成比例 (%)</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  暂无产品数据
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.imageUrl ? (
                      <div className="h-10 w-10 rounded-md overflow-hidden">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-right">{product.price}</TableCell>
                  <TableCell className="text-right">{product.commissionRate}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct?.id === 0 ? "添加产品" : "编辑产品"}</DialogTitle>
            <DialogDescription>填写产品信息，点击保存完成操作。</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                产品名称
              </Label>
              <Input
                id="name"
                value={editingProduct?.name || ""}
                onChange={(e) => editingProduct && setEditingProduct({ ...editingProduct, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                价格 (¥)
              </Label>
              <Input
                id="price"
                type="number"
                value={editingProduct?.price || 0}
                onChange={(e) =>
                  editingProduct && setEditingProduct({ ...editingProduct, price: Number.parseFloat(e.target.value) || 0 })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                产品描述
              </Label>
              <Textarea
                id="description"
                value={editingProduct?.description || ""}
                onChange={(e) => editingProduct && setEditingProduct({ ...editingProduct, description: e.target.value })}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                产品图片
              </Label>
              <div className="col-span-3">
                {editingProduct?.imageUrl ? (
                  <div className="mb-2">
                    <div className="relative w-full max-w-[200px] aspect-square rounded-md overflow-hidden border">
                      <img
                        src={editingProduct.imageUrl}
                        alt={editingProduct.name}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full"
                        onClick={() => editingProduct && setEditingProduct({ ...editingProduct, imageUrl: "" })}
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <FileUpload onUploadComplete={handleImageUpload} />
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveProduct} disabled={submitting}>
              {submitting ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}