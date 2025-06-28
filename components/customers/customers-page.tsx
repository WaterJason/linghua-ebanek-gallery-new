"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusIcon, SearchIcon, FilterIcon } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { getCustomers } from "@/lib/actions/customer-actions"

export function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setIsLoading(true)
      const data = await getCustomers()
      setCustomers(data)
    } catch (error) {
      console.error("Error fetching customers:", error)
      toast({
        title: "加载失败",
        description: "无法加载客户数据，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 过滤客户 - 添加安全检查
  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 表格列定义
  const columns = [
    {
      accessorKey: "name",
      header: "客户名称",
      cell: ({ row }: any) => (
        <Link href={`/customers/${row.original.id}`} className="font-medium text-primary hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "phone",
      header: "电话",
    },
    {
      accessorKey: "email",
      header: "邮箱",
    },
    {
      accessorKey: "type",
      header: "类型",
      cell: ({ row }: any) => row.original.type || "个人",
    },
    {
      accessorKey: "createdAt",
      header: "创建时间",
      cell: ({ row }: any) => {
        const date = row.original.createdAt;
        return date ? new Date(date).toLocaleDateString('zh-CN') : '-';
      },
    },
    {
      accessorKey: "isActive",
      header: "状态",
      cell: ({ row }: any) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.original.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {row.original.isActive ? '活跃' : '停用'}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/customers/${row.original.id}`}>
              <span className="sr-only">查看详情</span>
              <SearchIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">客户管理</h1>
        <Button asChild>
          <Link href="/customers/new">
            <PlusIcon className="h-4 w-4 mr-2" />
            新增客户
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">全部客户</TabsTrigger>
          <TabsTrigger value="individual">个人客户</TabsTrigger>
          <TabsTrigger value="business">企业客户</TabsTrigger>
          <TabsTrigger value="recent">最近创建</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-4 my-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索客户名称、电话或邮箱..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <FilterIcon className="h-4 w-4" />
          </Button>
        </div>

        <TabsContent value="all" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>客户列表</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={filteredCustomers}
                isLoading={isLoading}
                noResultsMessage="没有找到匹配的客户"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>个人客户</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={filteredCustomers.filter(c => c.type === "个人")}
                isLoading={isLoading}
                noResultsMessage="没有找到匹配的个人客户"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>企业客户</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={filteredCustomers.filter(c => c.type === "企业")}
                isLoading={isLoading}
                noResultsMessage="没有找到匹配的企业客户"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>最近创建客户</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={filteredCustomers.sort((a, b) =>
                  new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
                ).slice(0, 10)}
                isLoading={isLoading}
                noResultsMessage="没有最近创建的客户"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
