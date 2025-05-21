"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

export function SalarySettingsDialog({
  open,
  onOpenChange,
  settings,
  onSaved,
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    basicWorkingHours: 8,
    basicWorkingDays: 22,
    gallerySalesCommissionRate: 10,
    coffeeSalesCommissionRate: 20,
    teacherWorkshopFeeOutside: 200,
    assistantWorkshopFeeOutside: 130,
    teacherWorkshopFeeInside: 180,
    assistantWorkshopFeeInside: 110,
  })

  // 初始化表单数据
  useEffect(() => {
    if (settings) {
      setFormData({
        basicWorkingHours: settings.basicWorkingHours || 8,
        basicWorkingDays: settings.basicWorkingDays || 22,
        gallerySalesCommissionRate: settings.gallerySalesCommissionRate || 10,
        coffeeSalesCommissionRate: settings.coffeeSalesCommissionRate || 20,
        teacherWorkshopFeeOutside: settings.teacherWorkshopFeeOutside || 200,
        assistantWorkshopFeeOutside: settings.assistantWorkshopFeeOutside || 130,
        teacherWorkshopFeeInside: settings.teacherWorkshopFeeInside || 180,
        assistantWorkshopFeeInside: settings.assistantWorkshopFeeInside || 110,
      })
    }
  }, [settings, open])

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

  // 保存设置
  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          ...formData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      const savedSettings = await response.json()

      toast({
        title: "设置已保存",
        description: "薪资计算规则已更新",
      })

      if (onSaved) {
        onSaved(savedSettings)
      }
    } catch (error) {
      console.error("Error saving settings:", error)
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
          <DialogTitle>薪资计算规则设置</DialogTitle>
          <DialogDescription>
            配置薪资计算的相关规则和参数
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本工作设置 */}
          <div>
            <h3 className="text-lg font-medium mb-4">基本工作设置</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basicWorkingHours">基本工作时间 (小时/天)</Label>
                <Input
                  id="basicWorkingHours"
                  type="number"
                  step="0.5"
                  value={formData.basicWorkingHours}
                  onChange={(e) => handleNumberChange("basicWorkingHours", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="basicWorkingDays">基本工作天数 (天/月)</Label>
                <Input
                  id="basicWorkingDays"
                  type="number"
                  value={formData.basicWorkingDays}
                  onChange={(e) => handleNumberChange("basicWorkingDays", e.target.value)}
                />
              </div>
            </div>
          </div>



          {/* 提成和费用设置 */}
          <div>
            <h3 className="text-lg font-medium mb-4">提成和费用设置</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gallerySalesCommissionRate">聆花珐琅馆销售提成率 (%)</Label>
                <Input
                  id="gallerySalesCommissionRate"
                  type="number"
                  step="0.1"
                  value={formData.gallerySalesCommissionRate}
                  onChange={(e) => handleNumberChange("gallerySalesCommissionRate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coffeeSalesCommissionRate">咖啡店销售提成率 (%)</Label>
                <Input
                  id="coffeeSalesCommissionRate"
                  type="number"
                  step="0.1"
                  value={formData.coffeeSalesCommissionRate}
                  onChange={(e) => handleNumberChange("coffeeSalesCommissionRate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacherWorkshopFeeOutside">团建沙龙讲师费用（外出）(元/场)</Label>
                <Input
                  id="teacherWorkshopFeeOutside"
                  type="number"
                  step="1"
                  value={formData.teacherWorkshopFeeOutside}
                  onChange={(e) => handleNumberChange("teacherWorkshopFeeOutside", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assistantWorkshopFeeOutside">团建沙龙助理费用（外出）(元/场)</Label>
                <Input
                  id="assistantWorkshopFeeOutside"
                  type="number"
                  step="1"
                  value={formData.assistantWorkshopFeeOutside}
                  onChange={(e) => handleNumberChange("assistantWorkshopFeeOutside", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacherWorkshopFeeInside">团建沙龙讲师费用（在馆）(元/天)</Label>
                <Input
                  id="teacherWorkshopFeeInside"
                  type="number"
                  step="1"
                  value={formData.teacherWorkshopFeeInside}
                  onChange={(e) => handleNumberChange("teacherWorkshopFeeInside", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assistantWorkshopFeeInside">团建沙龙助理费用（在馆）(元/天)</Label>
                <Input
                  id="assistantWorkshopFeeInside"
                  type="number"
                  step="1"
                  value={formData.assistantWorkshopFeeInside}
                  onChange={(e) => handleNumberChange("assistantWorkshopFeeInside", e.target.value)}
                />
              </div>
            </div>
          </div>


        </div>

        <DialogFooter>
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
            disabled={loading}
          >
            {loading ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
