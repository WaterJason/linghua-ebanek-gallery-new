import { Metadata } from "next"

export const metadata: Metadata = {
  title: "产品管理 | 聆花掐丝珐琅馆",
  description: "管理产品信息、分类和价格",
}

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
