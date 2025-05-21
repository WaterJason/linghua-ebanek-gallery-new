"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import {
  PlusIcon,
  SearchIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  AlertCircleIcon
} from "lucide-react"
import { format } from "date-fns"
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
import { AddProductionDialog } from "./add-production-dialog"
import { EditProductionDialog } from "./edit-production-dialog"
import { ProductionDetailsDialog } from "./production-details-dialog"
import { deletePieceWork, getPieceWorks } from "@/lib/actions/piece-work-actions";

export function ProductionManagement() {
  const [pieceWorks, setPieceWorks] = useState([])
  const [filteredPieceWorks, setFilteredPieceWorks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentTab, setCurrentTab] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPieceWork, setSelectedPieceWork] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 加载计件工作数据
  useEffect(() => {
    loadPieceWorks()
  }, [])

  // 根据搜索和筛选条件更新显示的数据
  useEffect(() => {
    let filtered = pieceWorks

    // 根据标签筛选
    if (currentTab !== "all") {
      filtered = filtered.filter(item => item.workType === currentTab)
    }

    // 根据搜索词筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.employee.name.toLowerCase().includes(query) ||
        (item.notes && item.notes.toLowerCase().includes(query))
      )
    }

    setFilteredPieceWorks(filtered)
  }, [pieceWorks, searchQuery, currentTab])

  const loadPieceWorks = async () => {
    setIsLoading(true)
    try {
      const data = await getPieceWorks()
      setPieceWorks(data)
      setFilteredPieceWorks(data)
    } catch (error) {
      console.error("Error loading piece works:", error)
      toast({
        title: "加载失败",
        description: "无法加载制作工单数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProduction = () => {
    setIsAddDialogOpen(true)
  }

  const handleViewDetails = (pieceWork) => {
    setSelectedPieceWork(pieceWork)
    setIsDetailsDialogOpen(true)
  }

  const handleProductionAdded = () => {
    loadPieceWorks()
    setIsAddDialogOpen(false)
  }

  const handleEditProduction = (pieceWork) => {
    setSelectedPieceWork(pieceWork)
    setIsEditDialogOpen(true)
  }

  const handleProductionUpdated = () => {
    loadPieceWorks()
    setIsEditDialogOpen(false)
  }

  const handleDeleteClick = (pieceWork) => {
    setSelectedPieceWork(pieceWork)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedPieceWork) return

    setIsDeleting(true)
    try {
      await deletePieceWork(selectedPieceWork.id)
      toast({
        title: "删除成功",
        description: "制作工单已成功删除",
      })
      loadPieceWorks()
    } catch (error) {
      console.error("Error deleting piece work:", error)
      toast({
        title: "删除失败",
        description: "删除制作工单时出错",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const getWorkTypeLabel = (type) => {
    switch (type) {
      case "accessory":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">配饰制作</Badge>
      case "enamelling":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-50">点蓝制作</Badge>
      default:
        return <Badge variant="outline">其他</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>制作工单管理</CardTitle>
              <CardDescription>管理员工制作工单和计件工资</CardDescription>
            </div>
            <Button onClick={handleAddProduction}>
              <PlusIcon className="mr-2 h-4 w-4" />
              新建工单
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="relative w-72">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索员工或备注..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-auto">
              <TabsList>
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="accessory">配饰制作</TabsTrigger>
                <TabsTrigger value="enamelling">点蓝制作</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : filteredPieceWorks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || currentTab !== "all" ? "没有找到匹配的工单" : "暂无制作工单数据"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>员工</TableHead>
                  <TableHead>工作类型</TableHead>
                  <TableHead className="text-right">工作项数</TableHead>
                  <TableHead className="text-right">总金额</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPieceWorks.map((pieceWork) => (
                  <TableRow key={pieceWork.id}>
                    <TableCell>{format(new Date(pieceWork.date), "yyyy-MM-dd")}</TableCell>
                    <TableCell>{pieceWork.employee.name}</TableCell>
                    <TableCell>{getWorkTypeLabel(pieceWork.workType)}</TableCell>
                    <TableCell className="text-right">{pieceWork.details.length}</TableCell>
                    <TableCell className="text-right">¥{pieceWork.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(pieceWork)} title="查看详情">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditProduction(pieceWork)} title="编辑工单">
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(pieceWork)} title="删除工单">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 添加工单对话框 */}
      <AddProductionDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onProductionAdded={handleProductionAdded}
      />

      {/* 编辑工单对话框 */}
      {selectedPieceWork && (
        <EditProductionDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          pieceWork={selectedPieceWork}
          onProductionUpdated={handleProductionUpdated}
        />
      )}

      {/* 工单详情对话框 */}
      {selectedPieceWork && (
        <ProductionDetailsDialog
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          pieceWork={selectedPieceWork}
          onEdit={handleEditProduction}
          onDelete={handleDeleteClick}
        />
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这个制作工单吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
