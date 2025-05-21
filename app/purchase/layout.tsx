import { Metadata } from "next"

export const metadata: Metadata = {
  title: "采购管理 | 聆花掐丝珐琅馆",
  description: "管理供应商、采购订单和采购统计",
}

export default function PurchaseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
