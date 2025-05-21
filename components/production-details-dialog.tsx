"use client"

import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PrinterIcon, PencilIcon, TrashIcon } from "lucide-react"

export function ProductionDetailsDialog({ open, onOpenChange, pieceWork, onEdit, onDelete }) {
  if (!pieceWork) return null

  const getWorkTypeLabel = (type) => {
    switch (type) {
      case "accessory":
        return "配饰制作"
      case "enamelling":
        return "点蓝制作"
      default:
        return "其他"
    }
  }

  const getWorkTypeBadge = (type) => {
    switch (type) {
      case "accessory":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">配饰制作</Badge>
      case "enamelling":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-50">点蓝制作</Badge>
      default:
        return <Badge variant="outline">其他</Badge>
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>制作工单详情</DialogTitle>
          <DialogDescription>查看制作工单详细信息</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 print:space-y-4">
          {/* 工单基本信息 */}
          <div className="grid grid-cols-2 gap-4 print:grid-cols-3">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">工单日期</h4>
              <p className="text-base">{format(new Date(pieceWork.date), "yyyy-MM-dd")}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">员工</h4>
              <p className="text-base">{pieceWork.employee.name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">工作类型</h4>
              <div className="text-base">{getWorkTypeBadge(pieceWork.workType)}</div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">总金额</h4>
              <p className="text-base font-semibold">¥{pieceWork.totalAmount.toFixed(2)}</p>
            </div>
            <div className="col-span-2">
              <h4 className="text-sm font-medium text-muted-foreground">备注</h4>
              <p className="text-base">{pieceWork.notes || "无"}</p>
            </div>
          </div>

          {/* 工作项目明细 */}
          <div>
            <h3 className="text-lg font-semibold mb-2">工作项目明细</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>项目名称</TableHead>
                  <TableHead className="text-right">数量</TableHead>
                  <TableHead className="text-right">单价</TableHead>
                  <TableHead className="text-right">小计</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pieceWork.details.map((detail) => (
                  <TableRow key={detail.id}>
                    <TableCell>{detail.pieceWorkItem.name}</TableCell>
                    <TableCell className="text-right">{detail.quantity}</TableCell>
                    <TableCell className="text-right">¥{detail.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">¥{(detail.quantity * detail.price).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">总计</TableCell>
                  <TableCell className="text-right font-bold">¥{pieceWork.totalAmount.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* 创建和更新信息 */}
          <div className="text-sm text-muted-foreground">
            <p>创建时间: {format(new Date(pieceWork.createdAt), "yyyy-MM-dd HH:mm:ss")}</p>
            <p>更新时间: {format(new Date(pieceWork.updatedAt), "yyyy-MM-dd HH:mm:ss")}</p>
          </div>

          <DialogFooter className="print:hidden">
            <div className="flex space-x-2 mr-auto">
              {onEdit && (
                <Button variant="outline" onClick={() => {
                  onOpenChange(false)
                  onEdit(pieceWork)
                }}>
                  <PencilIcon className="mr-2 h-4 w-4" />
                  编辑工单
                </Button>
              )}
              {onDelete && (
                <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => {
                  onOpenChange(false)
                  onDelete(pieceWork)
                }}>
                  <TrashIcon className="mr-2 h-4 w-4" />
                  删除工单
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={handlePrint}>
              <PrinterIcon className="mr-2 h-4 w-4" />
              打印工单
            </Button>
            <Button onClick={() => onOpenChange(false)}>关闭</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
