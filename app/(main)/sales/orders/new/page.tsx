import { Metadata } from "next"
import { ModernPageContainer } from "@/components/modern-page-container"
import { NewOrderForm } from "@/components/sales/new-order-form"

export const metadata: Metadata = {
  title: "新建销售订单 | 聆花掐丝珐琅馆",
  description: "创建新的销售订单",
}

export default function NewSalesOrderPage() {
  return (
    <ModernPageContainer
      title="新建销售订单"
      description="创建新的销售订单"
      showBackButton={true}
      backHref="/sales/orders"
    >
      <NewOrderForm />
    </ModernPageContainer>
  )
}
