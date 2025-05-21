"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PayrollTable } from "@/components/payroll-table"
import { PrinterIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExportImportButtons } from "@/components/export-import-buttons"

export default function PayrollPage() {
  const currentDate = new Date()
  const [year, setYear] = useState(currentDate.getFullYear())
  const [month, setMonth] = useState(currentDate.getMonth() + 1)

  // 生成年份选项
  const yearOptions = []
  for (let y = 2020; y <= currentDate.getFullYear(); y++) {
    yearOptions.push(y)
  }

  // 生成月份选项
  const monthOptions = []
  for (let m = 1; m <= 12; m++) {
    monthOptions.push(m)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold tracking-tight">薪酬报表</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <PrinterIcon className="mr-2 h-4 w-4" />
            打印
          </Button>
          <ExportImportButtons type="payroll" year={year} month={month} />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {year}年{month}月薪酬报表
            </CardTitle>
            <CardDescription>查看员工薪酬明细</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={year.toString()} onValueChange={(value) => setYear(Number.parseInt(value))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="选择年份" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={month.toString()} onValueChange={(value) => setMonth(Number.parseInt(value))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="选择月份" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {m}月
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <PayrollTable year={year} month={month} />
        </CardContent>
      </Card>
    </div>
  )
}
