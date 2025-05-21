import { Metadata } from "next"
import { PermissionManagement } from "@/components/permission-management"

export const metadata: Metadata = {
  title: "权限管理 | 聆花掐丝珐琅馆",
  description: "管理系统角色和权限",
}

export default function PermissionsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">权限管理</h1>
        <p className="text-muted-foreground">管理系统角色和用户权限</p>
      </div>
      
      <PermissionManagement />
    </div>
  )
}
