"use client"

import { useState } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export function SalaryDetailDialog({ open, onOpenChange, salaryRecord }) {
  const [activeTab, setActiveTab] = useState("overview")

  if (!salaryRecord) return null

  // 格式化金额
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount)
  }

  // 计算各项收入占比
  const calculatePercentage = (amount) => {
    if (!salaryRecord.totalIncome || salaryRecord.totalIncome === 0) return "0%"
    return `${((amount / salaryRecord.totalIncome) * 100).toFixed(1)}%`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>薪资详情</DialogTitle>
          <DialogDescription>
            {salaryRecord.employee?.name || "员工"} - {salaryRecord.year}年{salaryRecord.month}月薪资
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">薪资概览</TabsTrigger>
            <TabsTrigger value="details">详细明细</TabsTrigger>
            <TabsTrigger value="history">调整记录</TabsTrigger>
          </TabsList>

          {/* 薪资概览 */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">总收入</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(salaryRecord.totalIncome)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">扣除项</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(salaryRecord.socialInsurance + salaryRecord.tax + salaryRecord.deductions)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">实发工资</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(salaryRecord.netIncome)}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>收入构成</CardTitle>
                <CardDescription>各项收入占比</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>基本工资</div>
                    <div className="flex items-center gap-2">
                      <div>{formatCurrency(salaryRecord.baseSalary)}</div>
                      <Badge variant="outline">{calculatePercentage(salaryRecord.baseSalary)}</Badge>
                    </div>
                  </div>
                  <Separator />

                  <div className="flex justify-between items-center">
                    <div>排班工资</div>
                    <div className="flex items-center gap-2">
                      <div>{formatCurrency(salaryRecord.scheduleSalary)}</div>
                      <Badge variant="outline">{calculatePercentage(salaryRecord.scheduleSalary)}</Badge>
                    </div>
                  </div>
                  <Separator />

                  <div className="flex justify-between items-center">
                    <div>销售提成</div>
                    <div className="flex items-center gap-2">
                      <div>{formatCurrency(salaryRecord.salesCommission)}</div>
                      <Badge variant="outline">{calculatePercentage(salaryRecord.salesCommission)}</Badge>
                    </div>
                  </div>
                  <Separator />

                  <div className="flex justify-between items-center">
                    <div>计件工作收入</div>
                    <div className="flex items-center gap-2">
                      <div>{formatCurrency(salaryRecord.pieceWorkIncome)}</div>
                      <Badge variant="outline">{calculatePercentage(salaryRecord.pieceWorkIncome)}</Badge>
                    </div>
                  </div>
                  <Separator />

                  <div className="flex justify-between items-center">
                    <div>团建工作收入</div>
                    <div className="flex items-center gap-2">
                      <div>{formatCurrency(salaryRecord.workshopIncome)}</div>
                      <Badge variant="outline">{calculatePercentage(salaryRecord.workshopIncome)}</Badge>
                    </div>
                  </div>
                  <Separator />

                  <div className="flex justify-between items-center">
                    <div>咖啡店提成</div>
                    <div className="flex items-center gap-2">
                      <div>{formatCurrency(salaryRecord.coffeeShiftCommission)}</div>
                      <Badge variant="outline">{calculatePercentage(salaryRecord.coffeeShiftCommission)}</Badge>
                    </div>
                  </div>
                  <Separator />

                  <div className="flex justify-between items-center">
                    <div>奖金</div>
                    <div className="flex items-center gap-2">
                      <div>{formatCurrency(salaryRecord.bonus)}</div>
                      <Badge variant="outline">{calculatePercentage(salaryRecord.bonus)}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 详细明细 */}
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">员工</div>
                    <div>{salaryRecord.employee?.name || "未知"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">职位</div>
                    <div>{salaryRecord.employee?.position || "未知"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">日薪</div>
                    <div>{formatCurrency(salaryRecord.details?.dailySalary || 0)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">薪资月份</div>
                    <div>{salaryRecord.year}年{salaryRecord.month}月</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>出勤与排班</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">排班天数</div>
                    <div>{salaryRecord.details?.schedulesCount || 0}天</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">排班工资</div>
                    <div>{formatCurrency(salaryRecord.scheduleSalary)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>销售提成</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">珐琅馆销售笔数</div>
                    <div>{salaryRecord.details?.gallerySalesCount || 0}笔</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">珐琅馆销售提成</div>
                    <div>{formatCurrency(salaryRecord.details?.gallerySalesCommission || 0)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">POS销售笔数</div>
                    <div>{salaryRecord.details?.posSalesCount || 0}笔</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">POS销售提成</div>
                    <div>{formatCurrency(salaryRecord.details?.posSalesCommission || 0)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">总销售提成</div>
                    <div>{formatCurrency(salaryRecord.salesCommission)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>其他收入</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">计件工作数量</div>
                    <div>{salaryRecord.details?.pieceWorksCount || 0}件</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">计件工作收入</div>
                    <div>{formatCurrency(salaryRecord.pieceWorkIncome)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">团建活动数量</div>
                    <div>{salaryRecord.details?.workshopsCount || 0}场</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">团建活动收入</div>
                    <div>{formatCurrency(salaryRecord.workshopIncome)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">咖啡店值班数量</div>
                    <div>{salaryRecord.details?.coffeeShiftsCount || 0}次</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">咖啡店提成</div>
                    <div>{formatCurrency(salaryRecord.coffeeShiftCommission)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 调整记录 */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>薪资调整记录</CardTitle>
              </CardHeader>
              <CardContent>
                {salaryRecord.adjustments && salaryRecord.adjustments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>调整日期</TableHead>
                        <TableHead>调整类型</TableHead>
                        <TableHead>调整金额</TableHead>
                        <TableHead>调整原因</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salaryRecord.adjustments.map((adjustment) => (
                        <TableRow key={adjustment.id}>
                          <TableCell>{format(new Date(adjustment.adjustmentDate), "yyyy-MM-dd")}</TableCell>
                          <TableCell>{adjustment.type}</TableCell>
                          <TableCell>{formatCurrency(adjustment.amount)}</TableCell>
                          <TableCell>{adjustment.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">暂无薪资调整记录</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
