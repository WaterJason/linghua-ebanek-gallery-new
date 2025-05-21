import { Metadata } from "next"
import { PosSalesManagement } from "@/components/pos-sales-management"

export const metadata: Metadata = {
  title: "POS销售记录 | 聆花掐丝珐琅馆",
  description: "查看和管理POS销售记录",
}

export default function PosSalesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">POS销售记录</h1>
      </div>

      <PosSalesManagement />
    </div>
  )
}
