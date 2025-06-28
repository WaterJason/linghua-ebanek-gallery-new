import { Metadata } from "next"
import { ModernPageContainer } from "@/components/modern-page-container"
import { NewCoffeeShopPurchaseForm } from "@/components/coffee-shop/new-coffee-shop-purchase-form"

export const metadata: Metadata = {
  title: "新增采购记录 | 聆花掐丝珐琅馆",
  description: "录入新的咖啡店采购记录",
}

export default function NewCoffeeShopPurchasePage() {
  return (
    <ModernPageContainer
      title="新增采购记录"
      description="录入咖啡店采购数据和供应商信息"
      showBackButton={true}
      backHref="/coffee-shop/purchase"
    >
      <div className="max-w-4xl">
        <NewCoffeeShopPurchaseForm />
      </div>
    </ModernPageContainer>
  )
}
