"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "@/components/ui/use-toast"
import { PlusIcon, SearchIcon, SettingsIcon, TagIcon, CheckIcon, XIcon } from "lucide-react"
import Link from "next/link"
import { getDictionaries } from "@/lib/actions/dictionary-actions"
import { DictionaryDialog } from "@/components/settings/dictionary-dialog"

// 数据字典类型
interface Dictionary {
  id: number
  code: string
  name: string
  description?: string
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
  itemCount?: number
}

export function DictionaryList() {
  const router = useRouter()
  const [dictionaries, setDictionaries] = useState<Dictionary[]>([])
  const [filteredDictionaries, setFilteredDictionaries] = useState<Dictionary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [selectedDictionary, setSelectedDictionary] = useState<Dictionary | null>(null)

  // 加载数据字典
  useEffect(() => {
    const loadDictionaries = async () => {
      setIsLoading(true)
      try {
        // 从服务器获取数据字典
        const data = await getDictionaries()
        setDictionaries(data)
        setFilteredDictionaries(data)
      } catch (error) {
        console.error("Error loading dictionaries:", error)
        toast({
          title: "加载失败",
          description: "无法加载数据字典，请稍后再试",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadDictionaries()
  }, [])

  // 搜索过滤
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDictionaries(dictionaries)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = dictionaries.filter(
      (dict) =>
        dict.code.toLowerCase().includes(query) ||
        dict.name.toLowerCase().includes(query) ||
        (dict.description && dict.description.toLowerCase().includes(query))
    )
    setFilteredDictionaries(filtered)
  }, [searchQuery, dictionaries])

  // 打开新建数据字典对话框
  const handleAddDictionary = () => {
    setSelectedDictionary(null)
    setShowDialog(true)
  }

  // 打开编辑数据字典对话框
  const handleEditDictionary = (dictionary: Dictionary) => {
    setSelectedDictionary(dictionary)
    setShowDialog(true)
  }

  // 查看数据字典详情
  const handleViewDictionary = (dictionary: Dictionary) => {
    router.push(`/settings/dictionaries/${dictionary.id}`)
  }

  // 数据字典表格列定义
  const columns: ColumnDef<Dictionary>[] = [
    {
      accessorKey: "code",
      header: "代码",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.code}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "名称",
    },
    {
      accessorKey: "description",
      header: "描述",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate">
          {row.original.description || "-"}
        </div>
      ),
    },
    {
      accessorKey: "isSystem",
      header: "系统字典",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.isSystem ? (
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
            onClick={() => handleViewDictionary(row.original)}
          >
            查看
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditDictionary(row.original)}
            disabled={row.original.isSystem}
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
              <CardTitle>数据字典列表</CardTitle>
              <CardDescription>管理系统中使用的数据字典</CardDescription>
            </div>
            <Button onClick={handleAddDictionary}>
              <PlusIcon className="h-4 w-4 mr-2" />
              新建字典
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索数据字典..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredDictionaries}
            isLoading={isLoading}
            noResultsMessage="暂无数据字典"
          />
        </CardContent>
      </Card>

      {/* 数据字典对话框 */}
      <DictionaryDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        dictionary={selectedDictionary}
        onSuccess={(newDictionary) => {
          if (selectedDictionary) {
            // 更新字典
            setDictionaries(
              dictionaries.map((dict) =>
                dict.id === newDictionary.id ? newDictionary : dict
              )
            )
          } else {
            // 添加新字典
            setDictionaries([...dictionaries, newDictionary])
          }
        }}
      />
    </>
  )
}
