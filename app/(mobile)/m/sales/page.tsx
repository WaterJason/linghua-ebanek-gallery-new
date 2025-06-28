import { Metadata } from "next"
import { MobileSales } from "@/components/mobile/mobile-sales"

export const metadata: Metadata = {
  title: "销售 | 聆花掐丝珐琅馆",
  description: "聆花掐丝珐琅馆移动端销售",
}

export default function MobileSalesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">销售</h1>
      <MobileSales />
    </div>
  )
}
