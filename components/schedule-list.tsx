"use client"

import { useState } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  CalendarIcon, ClockIcon, UserIcon, 
  SearchIcon, FilterIcon, TrashIcon, EditIcon 
} from "lucide-react"
import { cn } from "@/lib/utils"

export function ScheduleList({ schedules = [], loading = false, onScheduleDeleted }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // 处理搜索
  const filteredSchedules = schedules.filter(schedule => {
    const employeeName = schedule.employee?.name || ""
    const date = format(new Date(schedule.date), "yyyy-MM-dd")
    const searchString = `${employeeName} ${date} ${schedule.startTime} ${schedule.endTime}`.toLowerCase()
    return searchString.includes(searchTerm.toLowerCase())
  })

  // 处理排序
  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case "date":
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
        break
      case "employee":
        comparison = (a.employee?.name || "").localeCompare(b.employee?.name || "")
        break
      case "startTime":
        comparison = a.startTime.localeCompare(b.startTime)
        break
      case "endTime":
        comparison = a.endTime.localeCompare(b.endTime)
        break
      default:
        comparison = 0
    }
    
    return sortOrder === "asc" ? comparison : -comparison
  })

  // 处理分页
  const totalPages = Math.ceil(sortedSchedules.length / itemsPerPage)
  const paginatedSchedules = sortedSchedules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // 处理删除排班
  const handleDelete = async (scheduleId) => {
    if (!confirm("确定要删除这个排班吗？")) return
    
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: "DELETE",
      })
      
      if (!response.ok) throw new Error("Failed to delete schedule")
      
      onScheduleDeleted()
    } catch (error) {
      console.error("Error deleting schedule:", error)
    }
  }

  // 处理排序变化
  const handleSortChange = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  // 生成页码数组
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPageButtons = 5
    
    if (totalPages <= maxPageButtons) {
      // 如果总页数小于等于最大按钮数，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // 否则，显示当前页附近的页码
      let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2))
      let endPage = startPage + maxPageButtons - 1
      
      if (endPage > totalPages) {
        endPage = totalPages
        startPage = Math.max(1, endPage - maxPageButtons + 1)
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }
    }
    
    return pageNumbers
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-auto">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索排班..."
            className="pl-8 w-full sm:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="排序字段" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">日期</SelectItem>
              <SelectItem value="employee">员工</SelectItem>
              <SelectItem value="startTime">开始时间</SelectItem>
              <SelectItem value="endTime">结束时间</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            <FilterIcon className={cn(
              "h-4 w-4",
              sortOrder === "desc" && "transform rotate-180"
            )} />
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="space-y-2">
          {Array(5).fill(0).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">暂无排班数据</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSortChange("date")}
                  >
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      日期
                      {sortBy === "date" && (
                        <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSortChange("employee")}
                  >
                    <div className="flex items-center">
                      <UserIcon className="mr-2 h-4 w-4" />
                      员工
                      {sortBy === "employee" && (
                        <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSortChange("startTime")}
                  >
                    <div className="flex items-center">
                      <ClockIcon className="mr-2 h-4 w-4" />
                      时间
                      {sortBy === "startTime" && (
                        <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSchedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <div className="font-medium">
                        {format(new Date(schedule.date), "yyyy-MM-dd")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(schedule.date), "EEEE", { locale: zhCN })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
                          {schedule.employee?.name?.slice(0, 1) || "?"}
                        </div>
                        <div>
                          <div className="font-medium">{schedule.employee?.name || "未知员工"}</div>
                          <div className="text-sm text-muted-foreground">
                            {schedule.employee?.position || ""}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {schedule.startTime} - {schedule.endTime}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(() => {
                          const [startHour, startMin] = schedule.startTime.split(":").map(Number)
                          const [endHour, endMin] = schedule.endTime.split(":").map(Number)
                          const startMinutes = startHour * 60 + startMin
                          const endMinutes = endHour * 60 + endMin
                          const durationHours = (endMinutes - startMinutes) / 60
                          return `${durationHours.toFixed(1)}小时`
                        })()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(schedule.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  首页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                
                {getPageNumbers().map(pageNumber => (
                  <Button
                    key={pageNumber}
                    variant={pageNumber === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  末页
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
