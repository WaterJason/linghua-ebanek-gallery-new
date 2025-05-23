"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "@/components/ui/use-toast"
import { PlusIcon, SearchIcon, CheckIcon, XIcon, ArrowUpDownIcon } from "lucide-react"
import { DictionaryItemDialog } from "@/components/settings/dictionary-item-dialog"
import { getDictionary } from "@/lib/actions/dictionary-actions"

// 数据字典类型
interface Dictionary {
  id: number
  code: string
  name: string
  description?: string
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
  items: DictionaryItem[]
}

// 数据字典项类型
interface DictionaryItem {
  id: number
  dictionaryId: number
  code: string
  value: string
  label: string
  sortOrder: number
  isDefault: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface DictionaryDetailProps {
  dictionary: Dictionary
}

export function DictionaryDetail({ dictionary: initialDictionary }: DictionaryDetailProps) {
  const [dictionary, setDictionary] = useState<Dictionary>(initialDictionary)
  const [filteredItems, setFilteredItems] = useState<DictionaryItem[]>(initialDictionary.items)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DictionaryItem | null>(null)

  // 刷新数据字典
  const refreshDictionary = async () => {
    setIsLoading(true)
    try {
      const refreshedDictionary = await getDictionary(dictionary.id)
      setDictionary(refreshedDictionary)
      setFilteredItems(refreshedDictionary.items)
    } catch (error) {
      console.error("Error refreshing dictionary:", error)
      toast({
        title: "刷新失败",
        description: "无法刷新数据字典，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 搜索过滤
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(dictionary.items)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = dictionary.items.filter(
      (item) =>
        item.code.toLowerCase().includes(query) ||
        item.value.toLowerCase().includes(query) ||
        item.label.toLowerCase().includes(query)
    )
    setFilteredItems(filtered)
  }, [searchQuery, dictionary.items])

  // 打开新建字典项对话框
  const handleAddItem = () => {
    setSelectedItem(null)
    setShowDialog(true)
  }

  // 打开编辑字典项对话框
  const handleEditItem = (item: DictionaryItem) => {
    setSelectedItem(item)
    setShowDialog(true)
  }

  // 字典项表格列定义
  const columns: ColumnDef<DictionaryItem>[] = [
    {
      accessorKey: "code",
      header: "代码",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.code}</div>
      ),
    },
    {
      accessorKey: "value",
      header: "值",
    },
    {
      accessorKey: "label",
      header: "标签",
    },
    {
      accessorKey: "sortOrder",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            排序
            <ArrowUpDownIcon className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-center">{row.original.sortOrder}</div>,
    },
    {
      accessorKey: "isDefault",
      header: "默认值",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.isDefault ? (
            <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
          ) : (
            <XIcon className="h-5 w-5 text-gray-300 mx-auto" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "启用",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.isActive ? (
            <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
          ) : (
            <XIcon className="h-5 w-5 text-gray-300 mx-auto" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "更新时间",
      cell: ({ row }) => (
        <div>
          {new Date(row.original.updatedAt).toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      ),
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditItem(row.original)}
            disabled={dictionary.isSystem}
          >
            编辑
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle>字典项列表</CardTitle>
                <Badge variant={dictionary.isSystem ? "secondary" : "outline"}>
                  {dictionary.isSystem ? "系统字典" : "自定义字典"}
                </Badge>
              </div>
              <CardDescription>
                字典代码: {dictionary.code} | 共 {dictionary.items.length} 个字典项
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={refreshDictionary} disabled={isLoading}>
                刷新
              </Button>
              <Button onClick={handleAddItem} disabled={dictionary.isSystem}>
                <PlusIcon className="h-4 w-4 mr-2" />
                新建字典项
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索字典项..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredItems}
            isLoading={isLoading}
            noResultsMessage="暂无字典项"
            defaultSort={{ id: "sortOrder", desc: false }}
          />
        </CardContent>
      </Card>

      {/* 字典项对话框 */}
      <DictionaryItemDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        dictionaryId={dictionary.id}
        item={selectedItem}
        onSuccess={() => {
          refreshDictionary()
        }}
      />
    </>
  )
}
