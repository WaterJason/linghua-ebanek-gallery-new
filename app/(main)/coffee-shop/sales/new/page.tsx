import { Metadata } from "next"
import { ModernPageContainer } from "@/components/modern-page-container"
import { NewCoffeeShopSaleForm } from "@/components/coffee-shop/new-coffee-shop-sale-form"

export const metadata: Metadata = {
  title: "新增销售记录 | 聆花掐丝珐琅馆",
  description: "录入新的咖啡店销售记录",
}

export default function NewCoffeeShopSalePage() {
  return (
    <ModernPageContainer
      title="新增销售记录"
      description="录入咖啡店日常销售数据"
      showBackButton={true}
      backHref="/coffee-shop/sales"
    >
      <div className="max-w-2xl">
        <NewCoffeeShopSaleForm />
      </div>
    </ModernPageContainer>
  )
}
