"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchIcon, FilterIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

// 临时库存数据
const DEMO_INVENTORY = [
  {
    id: 1,
    name: "哥伦比亚咖啡豆",
    category: "咖啡豆",
    quantity: 5,
    unit: "kg",
    unitPrice: 180,
    totalValue: 900,
    reorderPoint: 3,
    lastRestockDate: "2023-06-15",
  },
  {
    id: 2,
    name: "埃塞俄比亚咖啡豆",
    category: "咖啡豆",
    quantity: 2,
    unit: "kg",
    unitPrice: 220,
    totalValue: 440,
    reorderPoint: 3,
    lastRestockDate: "2023-06-10",
  },
  {
    id: 3,
    name: "焦糖糖浆",
    category: "糖浆",
    quantity: 8,
    unit: "瓶",
    unitPrice: 45,
    totalValue: 360,
    reorderPoint: 2,
    lastRestockDate: "2023-06-20",
  },
  {
    id: 4,
    name: "香草糖浆",
    category: "糖浆",
    quantity: 6,
    unit: "瓶",
    unitPrice: 45,
    totalValue: 270,
    reorderPoint: 2,
    lastRestockDate: "2023-06-20",
  },
  {
    id: 5,
    name: "纸杯 (中)",
    category: "杯子",
    quantity: 120,
    unit: "个",
    unitPrice: 0.8,
    totalValue: 96,
    reorderPoint: 50,
    lastRestockDate: "2023-06-25",
  },
]

export function CoffeeShopInventory({ isLoading, inventoryData }: { isLoading: boolean, inventoryData: any }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [inventory, setInventory] = useState(DEMO_INVENTORY)

  // 过滤库存记录
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 表格列定义
  const columns = [
    {
      accessorKey: "name",
      header: "商品名称",
    },
    {
      accessorKey: "category",
      header: "分类",
    },
    {
      accessorKey: "quantity",
      header: "库存数量",
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <span className={row.original.quantity <= row.original.reorderPoint ? "text-red-500 font-medium" : ""}>
            {row.original.quantity} {row.original.unit}
          </span>
          {row.original.quantity <= row.original.reorderPoint && (
            <Badge variant="destructive" className="ml-2">
              低库存
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "unitPrice",
      header: "单价",
      cell: ({ row }: any) => `¥${row.original.unitPrice}`,
    },
    {
      accessorKey: "totalValue",
      header: "总价值",
      cell: ({ row }: any) => `¥${row.original.totalValue}`,
    },
    {
      accessorKey: "lastRestockDate",
      header: "最近入库",
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索商品名称或分类..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <FilterIcon className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>库存列表</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredInventory}
            isLoading={isLoading}
            noResultsMessage="没有找到匹配的库存记录"
          />
        </CardContent>
      </Card>

      {inventoryData?.categories && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>库存分类统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {inventoryData.categories.map((category: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-muted-foreground">{category.count}种商品</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">¥{category.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
