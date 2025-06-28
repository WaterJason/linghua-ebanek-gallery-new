"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { EyeIcon, MoreHorizontalIcon, FileTextIcon } from "lucide-react"
import { calculatePayroll } from "@/lib/actions/employee-actions";
import { SalaryDetailDialog } from "@/components/salary-detail-dialog";

export function PayrollTable({ year, month }) {
  const [payrollData, setPayrollData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSalary, setSelectedSalary] = useState(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  useEffect(() => {
    async function fetchPayrollData() {
      try {
        const data = await calculatePayroll(year, month)
        setPayrollData(data)
      } catch (error) {
        console.error("Error fetching payroll data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPayrollData()
  }, [year, month])

  const handleViewDetails = (salary) => {
    setSelectedSalary(salary)
    setDetailDialogOpen(true)
  }

  if (loading) {
    return <div className="text-center py-4">计算薪酬数据中...</div>
  }

  if (payrollData.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">暂无薪酬数据</div>
  }

  return (
    <>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>员工</TableHead>
              <TableHead>职位</TableHead>
              <TableHead>出勤天数</TableHead>
              <TableHead className="text-right">基本工资</TableHead>
              <TableHead className="text-right">手作团建费</TableHead>
              <TableHead className="text-right">咖啡店提成</TableHead>
              <TableHead className="text-right">珐琅馆提成</TableHead>
              <TableHead className="text-right">计件工费</TableHead>
              <TableHead className="text-right">总薪酬</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payrollData.map((payroll) => (
              <TableRow key={payroll.id}>
                <TableCell className="font-medium">{payroll.employee}</TableCell>
                <TableCell>{payroll.position}</TableCell>
                <TableCell>{payroll.workDays}天</TableCell>
                <TableCell className="text-right">¥{payroll.baseSalary.toFixed(2)}</TableCell>
                <TableCell className="text-right">¥{payroll.workshopFee.toFixed(2)}</TableCell>
                <TableCell className="text-right">¥{payroll.coffeeSalesCommission.toFixed(2)}</TableCell>
                <TableCell className="text-right">¥{payroll.gallerySalesCommission.toFixed(2)}</TableCell>
                <TableCell className="text-right">¥{(payroll.accessoryFee + payroll.enamellingFee).toFixed(2)}</TableCell>
                <TableCell className="text-right font-bold">¥{payroll.totalSalary.toFixed(2)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(payroll)}>
                        <FileTextIcon className="mr-2 h-4 w-4" />
                        查看详情
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 薪资详情对话框 */}
      <SalaryDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        salaryRecord={selectedSalary}
      />
    </>
  )
}
