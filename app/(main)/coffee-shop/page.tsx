import { Metadata } from "next"
import { CoffeeShopPage } from "@/components/coffee-shop/coffee-shop-page"

export const metadata: Metadata = {
  title: "咖啡店管理 | 聆花掐丝珐琅馆",
  description: "管理咖啡店销售和库存",
}

export default function CoffeeShopPageRoute() {
  return <CoffeeShopPage />
}
