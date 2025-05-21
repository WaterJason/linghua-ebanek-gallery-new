"use client"

import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileTextIcon, CreditCardIcon, FileUpIcon } from "lucide-react"

export function ChannelSettlementDetail({ settlement, onConfirm, onMarkAsPaid, onAddInvoice }) {
  // 获取状态文本和样式
  const getStatusInfo = (status) => {
    switch (status) {
      case "draft":
        return { text: "草稿", className: "bg-gray-100 text-gray-800" }
      case "confirmed":
        return { text: "已确认", className: "bg-green-100 text-green-800" }
      case "paid":
        return { text: "已付款", className: "bg-blue-100 text-blue-800" }
      default:
        return { text: "未知", className: "bg-gray-100 text-gray-800" }
    }
  }

  const statusInfo = getStatusInfo(settlement.status)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{settlement.channel.name} - 结算单</h2>
          <p className="text-muted-foreground">
            结算单号: {settlement.settlementNo}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.className}`}>
            {statusInfo.text}
          </div>
          {onConfirm && (
            <Button onClick={onConfirm}>
              <FileTextIcon className="mr-2 h-4 w-4" />
              确认结算单
            </Button>
          )}
          {onMarkAsPaid && (
            <Button onClick={onMarkAsPaid}>
              <CreditCardIcon className="mr-2 h-4 w-4" />
              标记为已付款
            </Button>
          )}
          {onAddInvoice && (
            <Button variant="outline" onClick={onAddInvoice}>
              <FileUpIcon className="mr-2 h-4 w-4" />
              添加发票
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">结算摘要</TabsTrigger>
          <TabsTrigger value="sales">销售明细</TabsTrigger>
          <TabsTrigger value="invoices">发票记录</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>结算信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">结算周期</p>
                  <p className="text-sm">
                    {format(new Date(settlement.startDate), "yyyy-MM-dd")} 至 {format(new Date(settlement.endDate), "yyyy-MM-dd")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">创建时间</p>
                  <p className="text-sm">
                    {format(new Date(settlement.createdAt), "yyyy-MM-dd HH:mm:ss")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">总金额</p>
                  <p className="text-lg font-bold text-primary">
                    ¥ {settlement.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">已付金额</p>
                  <p className="text-lg font-bold text-primary">
                    ¥ {settlement.paidAmount.toFixed(2)}
                  </p>
                </div>
                {settlement.paymentDate && (
                  <div>
                    <p className="text-sm font-medium">付款日期</p>
                    <p className="text-sm">
                      {format(new Date(settlement.paymentDate), "yyyy-MM-dd")}
                    </p>
                  </div>
                )}
                {settlement.paymentMethod && (
                  <div>
                    <p className="text-sm font-medium">付款方式</p>
                    <p className="text-sm">{settlement.paymentMethod}</p>
                  </div>
                )}
              </div>
              
              {settlement.notes && (
                <div className="mt-4">
                  <p className="text-sm font-medium">备注</p>
                  <p className="text-sm mt-1">{settlement.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>销售统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">销售记录数</p>
                  <p className="text-2xl font-bold">{settlement.sales?.length || 0}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">发票记录数</p>
                  <p className="text-2xl font-bold">{settlement.invoices?.length || 0}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">销售商品数</p>
                  <p className="text-2xl font-bold">
                    {settlement.sales?.reduce((total, sale) => total + sale.items.length, 0) || 0}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">销售总额</p>
                  <p className="text-2xl font-bold">¥ {settlement.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>销售记录</CardTitle>
            </CardHeader>
            <CardContent>
              {settlement.sales && settlement.sales.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>销售日期</TableHead>
                      <TableHead>商品数量</TableHead>
                      <TableHead className="text-right">销售金额</TableHead>
                      <TableHead>来源</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlement.sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{format(new Date(sale.saleDate), "yyyy-MM-dd")}</TableCell>
                        <TableCell>{sale.items.length}</TableCell>
                        <TableCell className="text-right font-medium">
                          ¥ {sale.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell>{sale.importSource || "手动录入"}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} className="text-right font-bold">
                        总计
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ¥ {settlement.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  暂无销售记录
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>发票记录</CardTitle>
            </CardHeader>
            <CardContent>
              {settlement.invoices && settlement.invoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>发票号</TableHead>
                      <TableHead>开票日期</TableHead>
                      <TableHead className="text-right">金额</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlement.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.invoiceNo || "未填写"}</TableCell>
                        <TableCell>
                          {invoice.invoiceDate 
                            ? format(new Date(invoice.invoiceDate), "yyyy-MM-dd")
                            : "未填写"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ¥ {invoice.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.status === "received" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {invoice.status === "received" ? "已收到" : "待收到"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} className="text-right font-bold">
                        总计
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ¥ {settlement.invoices.reduce((total, invoice) => total + invoice.amount, 0).toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  暂无发票记录
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
