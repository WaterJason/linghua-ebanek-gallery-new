"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet"
import { Product } from "@/types/product"
import {
  ImageIcon,
  EditIcon,
  TrashIcon,
  MoreVerticalIcon,
  CircleDollarSignIcon,
  PackageIcon,
  TagIcon
} from "lucide-react"
import Link from "next/link"

interface ProductCardMobileProps {
  product: Product
  onEdit?: (product: Product) => void
  onDelete?: (product: Product) => void
  onSelect?: (product: Product, selected: boolean) => void
  isSelected?: boolean
}

export function ProductCardMobile({
  product,
  onEdit,
  onDelete,
  onSelect,
  isSelected = false
}: ProductCardMobileProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // 处理选择
  const handleSelect = () => {
    if (onSelect) {
      onSelect(product, !isSelected)
    }
  }

  // 处理编辑
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(product)
    }
  }

  // 处理删除
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(product)
    }
  }

  return (
    <>
      <Card
        className={`h-full transition-colors ${isSelected ? 'border-primary bg-primary/5' : ''}`}
        onClick={() => setIsDetailsOpen(true)}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* 产品图片 */}
            <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* 产品信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>

                {/* 选择复选框 */}
                {onSelect && (
                  <div
                    className="w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelect()
                    }}
                  >
                    {isSelected && (
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 mt-1">
                <Badge variant="outline" className="text-xs px-1 py-0 h-auto">
                  {product.categoryName || "未分类"}
                </Badge>

                {product.inventory !== undefined && product.inventory !== null && (
                  <Badge variant={product.inventory > 0 ? "secondary" : "destructive"} className="text-xs px-1 py-0 h-auto">
                    {product.inventory > 0 ? `库存: ${product.inventory}` : "缺货"}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between mt-2">
                <p className="font-bold text-sm">¥{product.price.toFixed(2)}</p>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleEdit}
                  >
                    <EditIcon className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={handleDelete}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 产品详情抽屉 */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
          <SheetHeader className="text-left">
            <SheetTitle>{product.name}</SheetTitle>
            <SheetDescription>
              {product.categoryName && (
                <Badge variant="outline">{product.categoryName}</Badge>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* 产品图片 */}
            <div className="aspect-square rounded-md overflow-hidden bg-muted">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-muted-foreground opacity-20" />
                  <p className="mt-2 text-sm text-muted-foreground">暂无图片</p>
                </div>
              )}
            </div>

            {/* 产品信息 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">¥{product.price.toFixed(2)}</div>
                {product.cost && (
                  <div className="text-sm text-muted-foreground">
                    成本: ¥{product.cost.toFixed(2)}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <PackageIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">库存</p>
                    <p className="text-sm text-muted-foreground">
                      {product.inventory !== undefined && product.inventory !== null
                        ? product.inventory
                        : "未记录"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <TagIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">材质</p>
                    <p className="text-sm text-muted-foreground">
                      {product.material || "未指定"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <PackageIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">单位</p>
                    <p className="text-sm text-muted-foreground">
                      {product.unit || "未指定"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CircleDollarSignIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">提成</p>
                    <p className="text-sm text-muted-foreground">
                      {product.commissionRate}%
                    </p>
                  </div>
                </div>
              </div>

              {product.description && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">产品描述</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {product.dimensions && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">尺寸</p>
                  <p className="text-sm text-muted-foreground">
                    {product.dimensions}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsDetailsOpen(false)}>
                关闭
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleEdit}>
                <EditIcon className="h-4 w-4 mr-2" />
                编辑
              </Button>
              <Button variant="default" className="flex-1" asChild>
                <Link href={`/products/${product.id}`}>
                  <MoreVerticalIcon className="h-4 w-4 mr-2" />
                  详情
                </Link>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
