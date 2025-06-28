import { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "账号管理 | 聆花掐丝珐琅馆",
  description: "管理系统用户账号和权限",
}

export default function AccountsPage() {
  // 重定向到统一的用户管理页面
  redirect("/settings/users")
}
