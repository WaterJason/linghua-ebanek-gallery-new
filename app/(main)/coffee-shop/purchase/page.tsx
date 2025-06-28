import { Metadata } from "next"
import { CoffeeShopPurchaseManagement } from "@/components/coffee-shop/coffee-shop-purchase-management"

export const metadata: Metadata = {
  title: "咖啡店采购管理 | 聆花掐丝珐琅馆",
  description: "管理咖啡店采购记录和库存",
}

export default function CoffeeShopPurchasePage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">咖啡店采购管理</h1>
        <p className="text-muted-foreground">管理咖啡店采购记录、供应商和库存管理</p>
      </div>
      <CoffeeShopPurchaseManagement />
    </div>
  )
}
