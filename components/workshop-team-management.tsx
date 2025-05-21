"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon, UserIcon, StarIcon } from "lucide-react"
import { getEmployees } from "@/lib/actions/employee-actions";
import { getWorkshopTeamMembers, createWorkshopTeamMember, updateWorkshopTeamMember, deleteWorkshopTeamMember } from "@/lib/actions/workshop-actions";
import { toast } from "@/components/ui/use-toast"

export function WorkshopTeamManagement() {
  const [teamMembers, setTeamMembers] = useState([])
  const [filteredMembers, setFilteredMembers] = useState([])
  const [employees, setEmployees] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [specialtyInput, setSpecialtyInput] = useState("")

  useEffect(() => {
    loadData()
  }, [selectedRole])

  useEffect(() => {
    filterMembers()
  }, [teamMembers, searchQuery])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [employeesData, teamData] = await Promise.all([
        getEmployees(),
        getWorkshopTeamMembers(selectedRole !== "all" ? selectedRole : undefined)
      ])

      setEmployees(employeesData)
      setTeamMembers(teamData)
      setFilteredMembers(teamData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "加载失败",
        description: error.message || "无法加载团队成员数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterMembers = () => {
    let filtered = [...teamMembers]

    // 按角色筛选
    if (selectedRole !== "all") {
      filtered = filtered.filter(member => member.role === selectedRole)
    }

    // 按搜索词筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(member =>
        member.employee.name.toLowerCase().includes(query) ||
        member.employee.position.toLowerCase().includes(query) ||
        member.specialties.some(specialty => specialty.toLowerCase().includes(query))
      )
    }

    setFilteredMembers(filtered)
  }

  const handleAddMember = () => {
    setEditingMember({
      id: 0,
      employeeId: "",
      role: "teacher",
      specialties: [],
      rating: 5.0,
      maxWorkshopsPerDay: 2,
      isActive: true,
    })
    setSpecialtyInput("")
    setIsDialogOpen(true)
  }

  const handleEditMember = (member) => {
    setEditingMember({
      ...member,
      employeeId: member.employeeId.toString(),
    })
    setSpecialtyInput("")
    setIsDialogOpen(true)
  }

  const handleDeleteMember = async (id) => {
    if (!confirm("确定要从团队中移除这个成员吗？")) return

    try {
      await deleteWorkshopTeamMember(id)
      setTeamMembers(teamMembers.filter(m => m.id !== id))
      toast({
        title: "移除成功",
        description: "团队成员已移除",
      })
    } catch (error) {
      console.error("Error deleting team member:", error)
      toast({
        title: "移除失败",
        description: error.message || "移除团队成员时出错",
        variant: "destructive",
      })
    }
  }

  const handleAddSpecialty = () => {
    if (!specialtyInput.trim()) return

    if (!editingMember.specialties.includes(specialtyInput.trim())) {
      setEditingMember({
        ...editingMember,
        specialties: [...editingMember.specialties, specialtyInput.trim()]
      })
    }

    setSpecialtyInput("")
  }

  const handleRemoveSpecialty = (specialty) => {
    setEditingMember({
      ...editingMember,
      specialties: editingMember.specialties.filter(s => s !== specialty)
    })
  }

  const handleSaveMember = async () => {
    if (!editingMember.employeeId) {
      toast({
        title: "验证失败",
        description: "请选择员工",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const memberData = {
        ...editingMember,
        employeeId: parseInt(editingMember.employeeId),
      }

      if (editingMember.id === 0) {
        // 创建新团队成员
        const newMember = await createWorkshopTeamMember(memberData)
        setTeamMembers([...teamMembers, newMember])
        toast({
          title: "添加成功",
          description: "团队成员已添加",
        })
      } else {
        // 更新现有团队成员
        const updatedMember = await updateWorkshopTeamMember(editingMember.id, memberData)
        setTeamMembers(teamMembers.map(m => (m.id === updatedMember.id ? updatedMember : m)))
        toast({
          title: "更新成功",
          description: "团队成员信息已更新",
        })
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error saving team member:", error)
      toast({
        title: "保存失败",
        description: error.message || "保存团队成员信息时出错",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case "teacher":
        return "讲师"
      case "assistant":
        return "助教"
      default:
        return role
    }
  }

  const renderRating = (rating) => {
    return (
      <div className="flex items-center">
        {rating.toFixed(1)}
        <StarIcon className="h-4 w-4 text-yellow-500 ml-1" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>团建服务团队管理</CardTitle>
              <CardDescription>管理手作团建活动的服务团队成员</CardDescription>
            </div>
            <Button onClick={handleAddMember}>
              <PlusIcon className="mr-2 h-4 w-4" />
              添加团队成员
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="flex gap-4">
              <div className="w-40">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有角色</SelectItem>
                    <SelectItem value="teacher">讲师</SelectItem>
                    <SelectItem value="assistant">助教</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-64">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜索成员姓名或专长..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || selectedRole !== "all"
                ? "没有找到匹配的团队成员"
                : "暂无团队成员数据"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>成员姓名</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>专长</TableHead>
                  <TableHead className="text-center">评分</TableHead>
                  <TableHead className="text-center">每日最大团建数</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        {member.employee.name}
                      </div>
                    </TableCell>
                    <TableCell>{getRoleLabel(member.role)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {member.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{renderRating(member.rating)}</TableCell>
                    <TableCell className="text-center">{member.maxWorkshopsPerDay}</TableCell>
                    <TableCell>
                      <Badge variant={member.isActive ? "default" : "secondary"}>
                        {member.isActive ? "活跃" : "禁用"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditMember(member)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteMember(member.id)}>
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 团队成员编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingMember?.id === 0 ? "添加团队成员" : "编辑团队成员"}</DialogTitle>
            <DialogDescription>
              {editingMember?.id === 0 ? "添加新的团建服务团队成员" : "编辑现有团建服务团队成员"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employee" className="text-right">
                员工 *
              </Label>
              <Select
                value={editingMember?.employeeId || ""}
                onValueChange={(value) => setEditingMember({ ...editingMember, employeeId: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择员工" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.name} ({employee.position})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                角色
              </Label>
              <Select
                value={editingMember?.role || "teacher"}
                onValueChange={(value) => setEditingMember({ ...editingMember, role: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">讲师</SelectItem>
                  <SelectItem value="assistant">助教</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="specialties" className="text-right">
                专长
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="specialtyInput"
                    value={specialtyInput}
                    onChange={(e) => setSpecialtyInput(e.target.value)}
                    placeholder="输入专长项目"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddSpecialty()
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddSpecialty}>添加</Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {editingMember?.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {specialty}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => handleRemoveSpecialty(specialty)}
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rating" className="text-right">
                评分
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="rating"
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={editingMember?.rating || ""}
                  onChange={(e) => setEditingMember({ ...editingMember, rating: parseFloat(e.target.value) })}
                  className="w-24"
                />
                <StarIcon className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">(1-5分)</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxWorkshopsPerDay" className="text-right">
                每日最大团建数
              </Label>
              <Input
                id="maxWorkshopsPerDay"
                type="number"
                min="1"
                value={editingMember?.maxWorkshopsPerDay || ""}
                onChange={(e) => setEditingMember({ ...editingMember, maxWorkshopsPerDay: parseInt(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                状态
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="isActive"
                  checked={editingMember?.isActive}
                  onCheckedChange={(checked) => setEditingMember({ ...editingMember, isActive: checked })}
                />
                <Label htmlFor="isActive">{editingMember?.isActive ? "活跃" : "禁用"}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              取消
            </Button>
            <Button onClick={handleSaveMember} disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
