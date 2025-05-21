"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function SalaryRecordDialog({
  open,
  onOpenChange,
  record,
  employees,
  onSaved,
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    baseSalary: 0,
    scheduleSalary: 0,
    salesCommission: 0,
    pieceWorkIncome: 0,
    workshopIncome: 0,
    coffeeShiftCommission: 0,
    status: "draft",
    notes: "",
  })

  // 初始化表单数据
  useEffect(() => {
    if (record) {
      setFormData({
        employeeId: record.employeeId.toString(),
        year: record.year,
        month: record.month,
        baseSalary: record.baseSalary,
        scheduleSalary: record.scheduleSalary,
        salesCommission: record.salesCommission,
        pieceWorkIncome: record.pieceWorkIncome,
        workshopIncome: record.workshopIncome,
        coffeeShiftCommission: record.coffeeShiftCommission,
        status: record.status,
        notes: record.notes || "",
      })
    } else {
      // 重置为默认值
      setFormData({
        employeeId: employees && employees.length > 0 ? employees[0].id.toString() : "",
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        baseSalary: 0,
        scheduleSalary: 0,
        salesCommission: 0,
        pieceWorkIncome: 0,
        workshopIncome: 0,
        coffeeShiftCommission: 0,
        status: "draft",
        notes: "",
      })
    }
  }, [record, employees, open])

  // 处理表单字段变更
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 处理数字字段变更
  const handleNumberChange = (field, value) => {
    const numValue = value === "" ? 0 : parseFloat(value)
    setFormData(prev => ({
      ...prev,
      [field]: numValue
    }))
  }

  // 计算总收入和实发工资
  const totalIncome =
    parseFloat(formData.baseSalary) +
    parseFloat(formData.scheduleSalary) +
    parseFloat(formData.salesCommission) +
    parseFloat(formData.pieceWorkIncome) +
    parseFloat(formData.workshopIncome) +
    parseFloat(formData.coffeeShiftCommission)

  // 实发工资等于总收入（已移除扣款项）
  const netIncome = totalIncome

  // 自动计算薪资
  const handleAutoCalculate = async () => {
    if (!formData.employeeId || !formData.year || !formData.month) {
      toast({
        title: "请选择员工和薪资期间",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // 获取员工活动数据
      const startDate = new Date(formData.year, formData.month - 1, 1)
      const endDate = new Date(formData.year, formData.month, 0)

      const formattedStartDate = format(startDate, "yyyy-MM-dd")
      const formattedEndDate = format(endDate, "yyyy-MM-dd")

      // 获取活动数据
      const activitiesResponse = await fetch(
        `/api/employees/${formData.employeeId}/activities?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
      )

      if (!activitiesResponse.ok) {
        throw new Error("Failed to fetch activities")
      }

      const activitiesData = await activitiesResponse.json()

      // 获取排班数据
      const schedulesResponse = await fetch(
        `/api/employees/${formData.employeeId}/schedules?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
      )

      if (!schedulesResponse.ok) {
        throw new Error("Failed to fetch schedules")
      }

      const schedulesData = await schedulesResponse.json()

      // 获取员工信息
      const employeeResponse = await fetch(`/api/employees/${formData.employeeId}`)
      if (!employeeResponse.ok) {
        throw new Error("Failed to fetch employee")
      }
      const employeeData = await employeeResponse.json()

      // 获取系统设置
      const settingsResponse = await fetch('/api/settings')
      if (!settingsResponse.ok) {
        throw new Error("Failed to fetch settings")
      }
      const settingsData = await settingsResponse.json()

      // 按类型分组活动
      const gallerySales = activitiesData.filter(a => a.type === '画廊销售')
      const pieceWorks = activitiesData.filter(a => a.type === '配件制作' || a.type === '珐琅制作')
      const teacherWorkshops = activitiesData.filter(a => a.type === '工作坊讲师')
      const assistantWorkshops = activitiesData.filter(a => a.type === '工作坊助教')
      const coffeeShifts = activitiesData.filter(a => a.type === '咖啡店值班')

      // 获取POS销售数据
      let posSales = []
      try {
        const posSalesResponse = await fetch(
          `/api/employees/${formData.employeeId}/pos-sales?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
        )

        if (posSalesResponse.ok) {
          const posSalesData = await posSalesResponse.json()
          posSales = posSalesData.data || []
          console.log("获取到POS销售数据:", posSales.length, "条记录")
        } else {
          console.error("获取POS销售数据失败:", await posSalesResponse.text())
        }
      } catch (error) {
        console.error("Error fetching POS sales:", error)
      }

      // 计算基本工资
      const baseSalary = employeeData.dailySalary * (settingsData?.basicWorkingDays || 22)

      // 计算排班工资 - 直接使用日薪乘以排班天数
      console.log(`获取到排班数据: ${schedulesData.length} 条记录, 日薪: ${employeeData.dailySalary}`)

      const scheduleSalary = schedulesData.reduce((sum, schedule) => {
        // 检查是否是周末
        const scheduleDate = new Date(schedule.date)
        const isWeekendDay = scheduleDate.getDay() === 0 || scheduleDate.getDay() === 6

        // 应用加班费率
        let rate = 1
        if (isWeekendDay) {
          rate = settingsData?.weekendOvertimeRate || 1.5
        }

        // 计算当天工资 - 直接使用日薪
        const dailyPay = employeeData.dailySalary * rate
        console.log(`排班日期: ${scheduleDate.toISOString().split('T')[0]}, 是否周末: ${isWeekendDay}, 费率: ${rate}, 工资: ${dailyPay}`)

        return sum + dailyPay
      }, 0)

      // 计算珐琅馆销售提成
      console.log(`获取到珐琅馆销售数据: ${gallerySales.length} 条记录`)

      const gallerySalesCommission = gallerySales.reduce((sum, sale) => {
        try {
          const detailsText = sale.details || '';
          const match = detailsText.match(/¥(\d+(\.\d+)?)/);
          const amount = match ? parseFloat(match[1]) : 0;
          const commission = amount * (settingsData?.gallerySalesCommissionRate || 10) / 100;
          console.log(`珐琅馆销售 ID:${sale.id}, 详情:${detailsText}, 金额:${amount}, 提成:${commission}`);
          return sum + commission;
        } catch (error) {
          console.error("Error parsing sale amount:", error);
          return sum;
        }
      }, 0)

      // 计算POS销售提成
      const posSalesCommission = posSales.reduce((sum, sale) => {
        try {
          // 使用销售总额计算提成
          const amount = sale.totalAmount || 0;
          const commission = amount * (settingsData?.gallerySalesCommissionRate || 10) / 100;
          console.log(`POS销售 ID:${sale.id}, 金额:${amount}, 提成:${commission}`);
          return sum + commission;
        } catch (error) {
          console.error("Error calculating POS sale commission:", error);
          return sum;
        }
      }, 0)

      // 合并所有销售提成
      const salesCommission = gallerySalesCommission + posSalesCommission

      // 计算计件工作收入
      const pieceWorkIncome = pieceWorks.reduce((sum, work) => {
        try {
          const detailsText = work.details || '';
          const match = detailsText.match(/¥(\d+(\.\d+)?)/);
          const amount = match ? parseFloat(match[1]) : 0;
          return sum + amount;
        } catch (error) {
          console.error("Error parsing piece work amount:", error);
          return sum;
        }
      }, 0)

      // 计算工作坊收入
      const teacherWorkshopIncome = teacherWorkshops.length * (settingsData?.teacherWorkshopFee || 200)
      const assistantWorkshopIncome = assistantWorkshops.length * (settingsData?.assistantWorkshopFee || 130)
      const workshopIncome = teacherWorkshopIncome + assistantWorkshopIncome

      // 计算咖啡店值班提成
      const coffeeShiftCommission = coffeeShifts.reduce((sum, shift) => {
        try {
          const detailsText = shift.details || '';
          const match = detailsText.match(/¥(\d+(\.\d+)?)/);
          const amount = match ? parseFloat(match[1]) : 0;
          return sum + (amount * (settingsData?.coffeeSalesCommissionRate || 20) / 100);
        } catch (error) {
          console.error("Error parsing coffee shift amount:", error);
          return sum;
        }
      }, 0)

      // 更新表单数据
      setFormData(prev => ({
        ...prev,
        baseSalary: parseFloat(baseSalary.toFixed(2)),
        scheduleSalary: parseFloat(scheduleSalary.toFixed(2)),
        salesCommission: parseFloat(salesCommission.toFixed(2)),
        pieceWorkIncome: parseFloat(pieceWorkIncome.toFixed(2)),
        workshopIncome: parseFloat(workshopIncome.toFixed(2)),
        coffeeShiftCommission: parseFloat(coffeeShiftCommission.toFixed(2)),
      }))

      toast({
        title: "自动计算完成",
        description: "薪资数据已自动计算",
      })
    } catch (error) {
      console.error("Error auto calculating salary:", error)
      toast({
        title: "自动计算失败",
        description: error.message || "请稍后再试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 保存薪资记录
  const handleSave = async () => {
    if (!formData.employeeId) {
      toast({
        title: "请选择员工",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const url = record ? `/api/salary-records/${record.id}` : '/api/salary-records'
      const method = record ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to save salary record")
      }

      const savedRecord = await response.json()

      toast({
        title: record ? "更新成功" : "添加成功",
        description: record ? "薪资记录已更新" : "薪资记录已添加",
      })

      if (onSaved) {
        onSaved(savedRecord)
      }
    } catch (error) {
      console.error("Error saving salary record:", error)
      toast({
        title: "保存失败",
        description: error.message || "请稍后再试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{record ? "编辑薪资记录" : "添加薪资记录"}</DialogTitle>
          <DialogDescription>
            {record ? "修改员工薪资记录信息" : "添加新的员工薪资记录"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 员工选择 */}
          <div className="space-y-2">
            <Label htmlFor="employeeId">员工</Label>
            <Select
              value={formData.employeeId}
              onValueChange={(value) => handleChange("employeeId", value)}
              disabled={!!record}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择员工" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.name} ({employee.position})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 薪资期间 */}
          <div className="space-y-2">
            <Label>薪资期间</Label>
            <div className="flex gap-2">
              <Select
                value={formData.year.toString()}
                onValueChange={(value) => handleChange("year", parseInt(value))}
                disabled={!!record}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="年份" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - 2 + i
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}年
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              <Select
                value={formData.month.toString()}
                onValueChange={(value) => handleChange("month", parseInt(value))}
                disabled={!!record}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="月份" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(12)].map((_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}月
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 基本工资 */}
          <div className="space-y-2">
            <Label htmlFor="baseSalary">基本工资</Label>
            <Input
              id="baseSalary"
              type="number"
              step="0.01"
              value={formData.baseSalary}
              onChange={(e) => handleNumberChange("baseSalary", e.target.value)}
            />
          </div>

          {/* 排班工资 */}
          <div className="space-y-2">
            <Label htmlFor="scheduleSalary">排班工资</Label>
            <Input
              id="scheduleSalary"
              type="number"
              step="0.01"
              value={formData.scheduleSalary}
              onChange={(e) => handleNumberChange("scheduleSalary", e.target.value)}
            />
          </div>

          {/* 销售提成 */}
          <div className="space-y-2">
            <Label htmlFor="salesCommission">销售提成</Label>
            <Input
              id="salesCommission"
              type="number"
              step="0.01"
              value={formData.salesCommission}
              onChange={(e) => handleNumberChange("salesCommission", e.target.value)}
            />
          </div>

          {/* 计件收入 */}
          <div className="space-y-2">
            <Label htmlFor="pieceWorkIncome">计件收入</Label>
            <Input
              id="pieceWorkIncome"
              type="number"
              step="0.01"
              value={formData.pieceWorkIncome}
              onChange={(e) => handleNumberChange("pieceWorkIncome", e.target.value)}
            />
          </div>

          {/* 工作坊收入 */}
          <div className="space-y-2">
            <Label htmlFor="workshopIncome">工作坊收入</Label>
            <Input
              id="workshopIncome"
              type="number"
              step="0.01"
              value={formData.workshopIncome}
              onChange={(e) => handleNumberChange("workshopIncome", e.target.value)}
            />
          </div>

          {/* 咖啡店提成 */}
          <div className="space-y-2">
            <Label htmlFor="coffeeShiftCommission">咖啡店提成</Label>
            <Input
              id="coffeeShiftCommission"
              type="number"
              step="0.01"
              value={formData.coffeeShiftCommission}
              onChange={(e) => handleNumberChange("coffeeShiftCommission", e.target.value)}
            />
          </div>



          {/* 状态 */}
          <div className="space-y-2">
            <Label htmlFor="status">状态</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="confirmed">已确认</SelectItem>
                <SelectItem value="paid">已发放</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 薪资汇总 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-muted rounded-md">
          <div>
            <span className="text-sm text-muted-foreground">总收入:</span>
            <span className="text-lg font-bold ml-2">¥{totalIncome.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">实发工资:</span>
            <span className="text-lg font-bold ml-2">¥{netIncome.toFixed(2)}</span>
          </div>
        </div>

        {/* 备注 */}
        <div className="space-y-2">
          <Label htmlFor="notes">备注</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="输入备注信息..."
            className="min-h-[80px]"
          />
        </div>

        <DialogFooter className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleAutoCalculate}
            disabled={loading || !formData.employeeId}
          >
            自动计算
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading || !formData.employeeId}
            >
              {loading ? "保存中..." : "保存"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
