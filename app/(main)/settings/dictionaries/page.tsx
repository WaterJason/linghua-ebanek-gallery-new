"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  BookOpenIcon,
  RefreshCwIcon,
  MoreHorizontalIcon,
  TagIcon,
  ListIcon,
  DownloadIcon,
  UploadIcon
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useEnhancedOperations } from "@/lib/enhanced-operations-integration"
import { ModernPageContainer } from "@/components/modern-page-container"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface DataDictionary {
  id: number
  code: string
  name: string
  description?: string
  isActive: boolean
  isSystem: boolean
  createdAt: string
  updatedAt: string
  items: DataDictionaryItem[]
}

interface DataDictionaryItem {
  id: number
  dictionaryId: number
  code: string
  name: string
  value?: string
  description?: string
  sortOrder: number
  isActive: boolean
  isDefault: boolean
}

export default function DictionariesPage() {
  const enhancedOps = useEnhancedOperations()
  const [dictionaries, setDictionaries] = useState<DataDictionary[]>([])
  const [selectedDictionary, setSelectedDictionary] = useState<DataDictionary | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedItems, setSelectedItems] = useState<number[]>([])

  // 对话框状态
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [dictionaryToDelete, setDictionaryToDelete] = useState<DataDictionary | null>(null)
  const [editingItem, setEditingItem] = useState<DataDictionaryItem | null>(null)

  // 表单状态
  const [dictionaryForm, setDictionaryForm] = useState({
    code: "",
    name: "",
    description: "",
    isActive: true,
  })

  const [itemForm, setItemForm] = useState({
    code: "",
    name: "",
    value: "",
    description: "",
    sortOrder: 0,
    isActive: true,
    isDefault: false,
  })

  useEffect(() => {
    fetchDictionaries()
  }, [])

  const fetchDictionaries = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/settings/dictionaries")
      if (response.ok) {
        const data = await response.json()
        setDictionaries(data)
      } else {
        toast({
          title: "错误",
          description: "获取数据字典失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("获取数据字典失败:", error)
      toast({
        title: "错误",
        description: "获取数据字典失败",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDictionary = () => {
    setDictionaryForm({
      code: "",
      name: "",
      description: "",
      isActive: true,
    })
    setShowCreateDialog(true)
  }

  const handleEditDictionary = (dictionary: DataDictionary) => {
    setSelectedDictionary(dictionary)
    setDictionaryForm({
      code: dictionary.code,
      name: dictionary.name,
      description: dictionary.description || "",
      isActive: dictionary.isActive,
    })
    setShowEditDialog(true)
  }

  const handleDeleteDictionary = (dictionary: DataDictionary) => {
    setDictionaryToDelete(dictionary)
    setShowDeleteDialog(true)
  }

  const handleManageItems = (dictionary: DataDictionary) => {
    setSelectedDictionary(dictionary)
    // 这里可以展开字典项管理界面
  }

  const confirmCreateDictionary = async () => {
    try {
      await enhancedOps.executeOperation(
        async () => {
          const response = await fetch("/api/settings/dictionaries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dictionaryForm)
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "创建数据字典失败")
          }

          return await response.json()
        },
        {
          playSound: true,
          soundType: 'success',
          feedbackMessage: `数据字典 "${dictionaryForm.name}" 创建成功`,
          enableUndo: true,
          undoTags: ['create', 'dictionary'],
          undoPriority: 7
        }
      )

      setShowCreateDialog(false)
      fetchDictionaries()
    } catch (error) {
      console.error("创建数据字典失败:", error)
    }
  }

  const confirmEditDictionary = async () => {
    if (!selectedDictionary) return

    try {
      await enhancedOps.executeOperation(
        async () => {
          const response = await fetch(`/api/settings/dictionaries/${selectedDictionary.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dictionaryForm)
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "更新数据字典失败")
          }

          return await response.json()
        },
        {
          playSound: true,
          soundType: 'success',
          feedbackMessage: `数据字典 "${dictionaryForm.name}" 更新成功`,
          enableUndo: true,
          undoTags: ['edit', 'dictionary'],
          undoPriority: 7
        }
      )

      setShowEditDialog(false)
      setSelectedDictionary(null)
      fetchDictionaries()
    } catch (error) {
      console.error("更新数据字典失败:", error)
    }
  }

  const confirmDeleteDictionary = async () => {
    if (!dictionaryToDelete) return

    try {
      await enhancedOps.executeOperation(
        async () => {
          const response = await fetch(`/api/settings/dictionaries/${dictionaryToDelete.id}`, {
            method: "DELETE"
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "删除数据字典失败")
          }

          return dictionaryToDelete
        },
        {
          playSound: true,
          soundType: 'warning',
          feedbackMessage: `数据字典 "${dictionaryToDelete.name}" 已删除`,
          enableUndo: true,
          undoTags: ['delete', 'dictionary'],
          undoPriority: 9
        }
      )

      setShowDeleteDialog(false)
      setDictionaryToDelete(null)
      fetchDictionaries()
    } catch (error) {
      console.error("删除数据字典失败:", error)
    }
  }

  const handleRefresh = () => {
    fetchDictionaries()
  }

  // 过滤字典
  const filteredDictionaries = dictionaries.filter(dict => {
    const matchesSearch = dict.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dict.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dict.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "active" && dict.isActive) ||
                         (statusFilter === "inactive" && !dict.isActive) ||
                         (statusFilter === "system" && dict.isSystem) ||
                         (statusFilter === "custom" && !dict.isSystem)

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default">启用</Badge>
    ) : (
      <Badge variant="secondary">禁用</Badge>
    )
  }

  const getTypeBadge = (isSystem: boolean) => {
    return isSystem ? (
      <Badge variant="outline">系统</Badge>
    ) : (
      <Badge variant="secondary">自定义</Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <ModernPageContainer
      title="数据字典管理"
      description="管理系统中各类下拉选项的固定值"
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button onClick={handleCreateDictionary}>
            <PlusIcon className="mr-2 h-4 w-4" />
            新建字典
          </Button>
        </div>
      }
    >
      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
          <CardDescription>
            使用筛选条件快速查找数据字典
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索字典名称、代码或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="active">启用</SelectItem>
                <SelectItem value="inactive">禁用</SelectItem>
                <SelectItem value="system">系统字典</SelectItem>
                <SelectItem value="custom">自定义字典</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || statusFilter !== "all") && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                已筛选 {filteredDictionaries.length} / {dictionaries.length} 个字典
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                }}
              >
                清除筛选
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 字典列表 */}
      <Card>
        <CardHeader>
          <CardTitle>字典列表</CardTitle>
          <CardDescription>
            共 {filteredDictionaries.length} 个字典
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>字典</TableHead>
                <TableHead>代码</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>项目数量</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDictionaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {searchTerm || statusFilter !== "all"
                      ? "没有找到符合条件的字典"
                      : "暂无字典数据"
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredDictionaries.map((dictionary) => (
                  <TableRow key={dictionary.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <BookOpenIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{dictionary.name}</div>
                          {dictionary.description && (
                            <div className="text-sm text-muted-foreground">
                              {dictionary.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {dictionary.code}
                      </code>
                    </TableCell>
                    <TableCell>{getTypeBadge(dictionary.isSystem)}</TableCell>
                    <TableCell>{getStatusBadge(dictionary.isActive)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ListIcon className="w-4 h-4 text-muted-foreground" />
                        {dictionary.items?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(dictionary.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleManageItems(dictionary)}>
                            <TagIcon className="mr-2 h-4 w-4" />
                            管理项目
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditDictionary(dictionary)}>
                            <EditIcon className="mr-2 h-4 w-4" />
                            编辑字典
                          </DropdownMenuItem>
                          {!dictionary.isSystem && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteDictionary(dictionary)}
                                className="text-destructive"
                              >
                                <TrashIcon className="mr-2 h-4 w-4" />
                                删除字典
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 创建字典对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建数据字典</DialogTitle>
            <DialogDescription>
              创建一个新的数据字典
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-code">字典代码</Label>
                <Input
                  id="create-code"
                  value={dictionaryForm.code}
                  onChange={(e) => setDictionaryForm(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="输入字典代码"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-name">字典名称</Label>
                <Input
                  id="create-name"
                  value={dictionaryForm.name}
                  onChange={(e) => setDictionaryForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入字典名称"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">描述</Label>
              <Textarea
                id="create-description"
                value={dictionaryForm.description}
                onChange={(e) => setDictionaryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="输入字典描述"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={dictionaryForm.isActive}
                onCheckedChange={(checked) => setDictionaryForm(prev => ({ ...prev, isActive: checked }))}
              />
              <Label>启用字典</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button
              onClick={confirmCreateDictionary}
              disabled={!dictionaryForm.code || !dictionaryForm.name}
            >
              创建字典
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑字典对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑数据字典</DialogTitle>
            <DialogDescription>
              修改字典信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code">字典代码</Label>
                <Input
                  id="edit-code"
                  value={dictionaryForm.code}
                  onChange={(e) => setDictionaryForm(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="输入字典代码"
                  disabled={selectedDictionary?.isSystem}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">字典名称</Label>
                <Input
                  id="edit-name"
                  value={dictionaryForm.name}
                  onChange={(e) => setDictionaryForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入字典名称"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">描述</Label>
              <Textarea
                id="edit-description"
                value={dictionaryForm.description}
                onChange={(e) => setDictionaryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="输入字典描述"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={dictionaryForm.isActive}
                onCheckedChange={(checked) => setDictionaryForm(prev => ({ ...prev, isActive: checked }))}
                disabled={selectedDictionary?.isSystem}
              />
              <Label>启用字典</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button
              onClick={confirmEditDictionary}
              disabled={!dictionaryForm.code || !dictionaryForm.name}
            >
              保存更改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除字典</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除字典 "{dictionaryToDelete?.name}" 吗？
              {dictionaryToDelete?.items && dictionaryToDelete.items.length > 0 && (
                <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive text-sm">
                  警告：该字典包含 {dictionaryToDelete.items.length} 个项目，删除后这些项目也将被删除。
                </div>
              )}
              此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDictionary}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModernPageContainer>
  )
}