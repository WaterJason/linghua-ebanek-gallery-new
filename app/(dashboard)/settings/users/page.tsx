import { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { UserManagement } from "@/components/user/user-management"

export const metadata: Metadata = {
  title: "用户管理",
  description: "管理系统用户和权限",
}

export default function UsersPage() {
  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="用户管理"
        description="管理系统用户和权限"
      />
      
      <div className="space-y-6">
        <UserManagement />
      </div>
    </div>
  )
}
