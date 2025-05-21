import { Metadata } from "next"
import { AccountManagement } from "@/components/account-management"

export const metadata: Metadata = {
  title: "账号管理 | 聆花掐丝珐琅馆",
  description: "管理系统用户账号和权限",
}

export default function AccountsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">账号管理</h1>
        <p className="text-muted-foreground">管理系统用户账号和权限</p>
      </div>
      
      <AccountManagement />
    </div>
  )
}
