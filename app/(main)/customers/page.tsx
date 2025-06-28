import { Metadata } from "next"
import { CustomersPage } from "@/components/customers/customers-page"

export const metadata: Metadata = {
  title: "客户管理 | 聆花掐丝珐琅馆",
  description: "管理客户信息和互动记录",
}

export default function CustomersPageRoute() {
  return <CustomersPage />
}
