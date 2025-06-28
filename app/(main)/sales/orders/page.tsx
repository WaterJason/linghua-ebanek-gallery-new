import { Metadata } from "next"
import { OrderManagement } from "@/components/order-management"

export const metadata: Metadata = {
  title: "订单销售记录 | 聆花掐丝珐琅馆",
  description: "管理订单销售记录和订单状态",
}

export default function SalesOrdersPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">订单销售记录</h1>
        <p className="text-muted-foreground">管理订单销售记录和订单状态</p>
      </div>

      <OrderManagement />
    </div>
  )
}
