import { Metadata } from "next"
import { MobileProducts } from "@/components/mobile/mobile-products"

export const metadata: Metadata = {
  title: "产品与库存 | 聆花掐丝珐琅馆",
  description: "聆花掐丝珐琅馆移动端产品与库存",
}

export default function MobileProductsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">产品与库存</h1>
      <MobileProducts />
    </div>
  )
}
