"use client"

import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckIcon } from "lucide-react"

export function ChannelSalesDetail({ sale, onConfirm }) {
  // 获取状态文本和样式
  const getStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return { text: "待确认", className: "bg-yellow-100 text-yellow-800" }
      case "confirmed":
        return { text: "已确认", className: "bg-green-100 text-green-800" }
      case "settled":
        return { text: "已结算", className: "bg-blue-100 text-blue-800" }
      default:
        return { text: "未知", className: "bg-gray-100 text-gray-800" }
    }
  }

  const statusInfo = getStatusInfo(sale.status)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{sale.channel.name} - 销售记录</h2>
          <p className="text-muted-foreground">
            销售日期: {format(new Date(sale.saleDate), "yyyy-MM-dd")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.className}`}>
            {statusInfo.text}
          </div>
          {onConfirm && (
            <Button onClick={onConfirm}>
              <CheckIcon className="mr-2 h-4 w-4" />
              确认销售
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>销售明细</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>产品</TableHead>
                <TableHead>产品编码</TableHead>
                <TableHead className="text-right">数量</TableHead>
                <TableHead className="text-right">单价</TableHead>
                <TableHead className="text-right">小计</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell>{item.product.code || "-"}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">¥ {item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">
                    ¥ {(item.quantity * item.price).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4} className="text-right font-bold">
                  总计
                </TableCell>
                <TableCell className="text-right font-bold">
                  ¥ {sale.totalAmount.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>来源信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">导入来源:</span>
                <span className="text-sm ml-2">{sale.importSource || "手动录入"}</span>
              </div>
              <div>
                <span className="text-sm font-medium">创建时间:</span>
                <span className="text-sm ml-2">
                  {format(new Date(sale.createdAt), "yyyy-MM-dd HH:mm:ss")}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium">更新时间:</span>
                <span className="text-sm ml-2">
                  {format(new Date(sale.updatedAt), "yyyy-MM-dd HH:mm:ss")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>备注信息</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{sale.notes || "无备注信息"}</p>
          </CardContent>
        </Card>
      </div>

      {sale.settlementId && (
        <Card>
          <CardHeader>
            <CardTitle>结算信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">结算单ID:</span>
                <span className="text-sm ml-2">{sale.settlementId}</span>
              </div>
              <div>
                <span className="text-sm font-medium">结算状态:</span>
                <span className="text-sm ml-2">已结算</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
