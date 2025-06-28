import { Metadata } from "next"

export const metadata: Metadata = {
  title: "库存管理 | 聆花掐丝珐琅馆",
  description: "管理仓库和库存",
}

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
