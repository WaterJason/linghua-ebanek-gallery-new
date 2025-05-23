import { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { RoleManagement } from "@/components/settings/role-management"

export const metadata: Metadata = {
  title: "角色与权限管理",
  description: "管理系统角色和权限设置",
}

export default function RolesPage() {
  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="角色与权限管理"
        description="管理系统角色和权限设置"
      />
      
      <div className="space-y-6">
        <RoleManagement />
      </div>
    </div>
  )
}
