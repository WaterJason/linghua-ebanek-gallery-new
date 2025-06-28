"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ResponsiveDataGrid } from "@/components/ui/responsive-data-grid"
import { PlusIcon, EditIcon, TrashIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChannelPriceForm } from "@/components/channel/channel-price-form"
import { getChannels, getChannelPrices, deleteChannelPrice } from "@/lib/actions/channel-actions"
import { getProducts } from "@/lib/actions/product-actions"

export function ChannelPriceManagement() {
  const { toast } = useToast()
  const [channels, setChannels] = useState([])
  const [products, setProducts] = useState([])
  const [prices, setPrices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPrice, setSelectedPrice] = useState(null)
  const [selectedChannel, setSelectedChannel] = useState("all")
  const [selectedProduct, setSelectedProduct] = useState("all")

  // 加载渠道和产品数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [channelsData, productsData] = await Promise.all([
          getChannels(),
          getProducts(),
        ])
        setChannels(channelsData)
        setProducts(productsData)
      } catch (error) {
        toast({
          title: "加载失败",
          description: error.message || "无法加载渠道和产品数据",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  // 加载价格数据
  const loadPrices = async () => {
    try {
      setIsLoading(true)

      const channelId = selectedChannel !== "all" ? parseInt(selectedChannel) : undefined
      const productId = selectedProduct !== "all" ? parseInt(selectedProduct) : undefined

      const data = await getChannelPrices(channelId, productId)
      setPrices(data)
    } catch (error) {
      toast({
        title: "加载失败",
        description: error.message || "无法加载价格数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 当选择的渠道或产品变化时，重新加载价格数据
  useEffect(() => {
    loadPrices()
  }, [selectedChannel, selectedProduct])

  // 处理添加价格
  const handleAddPrice = () => {
    setSelectedPrice(null)
    setIsFormOpen(true)
  }

  // 处理编辑价格
  const handleEditPrice = (price) => {
    setSelectedPrice(price)
    setIsFormOpen(true)
  }

  // 处理删除价格
  const handleDeletePrice = (price) => {
    setSelectedPrice(price)
    setIsDeleteDialogOpen(true)
  }

  // 确认删除价格
  const confirmDeletePrice = async () => {
    try {
      await deleteChannelPrice(selectedPrice.id)
      toast({
        title: "删除成功",
        description: "渠道价格已成功删除",
      })
      loadPrices()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast({
        title: "删除失败",
        description: error.message || "无法删除渠道价格",
        variant: "destructive",
      })
    }
  }

  // 表格列定义
  const columns = [
    {
      header: "渠道",
      accessorKey: "channel.name",
    },
    {
      header: "作品",
      accessorKey: "artwork.name",
    },
    {
      header: "产品编码",
      accessorKey: "artwork.code",
    },
    {
      header: "价格",
      accessorKey: "price",
      cell: ({ row }) => (
        <div className="font-medium">¥ {row.original.price.toFixed(2)}</div>
      ),
    },
    {
      header: "状态",
      accessorKey: "isActive",
      cell: ({ row }) => {
        const isActive = row.original.isActive
        return (
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {isActive ? "启用" : "禁用"}
          </div>
        )
      },
    },
    {
      header: "操作",
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              handleEditPrice(row.original)
            }}
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              handleDeletePrice(row.original)
            }}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>渠道价格管理</CardTitle>
              <CardDescription>管理渠道商品的专属价格</CardDescription>
            </div>
            <Button onClick={handleAddPrice}>
              <PlusIcon className="mr-2 h-4 w-4" />
              添加价格
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="flex gap-4">
              <div className="w-64">
                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择渠道" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有渠道</SelectItem>
                    {channels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id.toString()}>
                        {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-64">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择产品" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有产品</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <ResponsiveDataGrid
            data={prices}
            columns={columns}
            searchable={true}
            searchKeys={["channel.name", "artwork.name", "artwork.code"]}
            loading={isLoading}
            emptyText="暂无价格数据"
          />
        </CardContent>
      </Card>

      {/* 价格表单对话框 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedPrice ? "编辑价格" : "添加价格"}</DialogTitle>
          </DialogHeader>
          <ChannelPriceForm
            price={selectedPrice}
            channels={channels}
            products={products}
            onSuccess={() => {
              setIsFormOpen(false)
              loadPrices()
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="删除价格"
        description={`确定要删除 "${selectedPrice?.channel?.name}" 的 "${selectedPrice?.product?.name}" 价格设置吗？此操作不可撤销。`}
        onConfirm={confirmDeletePrice}
      />
    </div>
  )
}
