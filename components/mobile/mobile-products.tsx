"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { SearchIcon, FilterIcon, PlusIcon } from "lucide-react"
import { getArtworks } from "@/lib/actions/product-actions"
import { getInventorySummary } from "@/lib/actions/inventory-actions"

export function MobileProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [inventory, setInventory] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const productsData = await getArtworks()
        setProducts(productsData)

        const inventoryData = await getInventorySummary()
        setInventory(inventoryData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 由于inventory是汇总数据对象，不是数组，这里暂时设为空数组
  const filteredInventory: any[] = []

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索产品或库存..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <FilterIcon className="h-4 w-4" />
        </Button>
        <Button size="icon" asChild>
          <Link href="/m/products/new">
            <PlusIcon className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="products">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">产品</TabsTrigger>
          <TabsTrigger value="inventory">库存</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <Link key={product.id} href={`/m/products/${product.id}`}>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      {product.imageUrls && product.imageUrls[0] ? (
                        <img
                          src={product.imageUrls[0]}
                          alt={product.name}
                          className="h-16 w-16 object-cover rounded-md"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                          无图片
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {product.barcode || '无编码'} | ¥{product.price?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? '没有找到匹配的产品' : '暂无产品数据'}
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredInventory.length > 0 ? (
              filteredInventory.map((item) => (
                <Link key={item.id} href={`/m/inventory/${item.id}`}>
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium">{item.product?.name}</h3>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm text-muted-foreground">
                          {item.warehouse || '默认仓库'}
                        </span>
                        <span className={`font-medium ${item.quantity < 10 ? 'text-red-500' : ''}`}>
                          库存: {item.quantity}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? '没有找到匹配的库存' : '暂无库存数据'}
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
