"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { UserManagement } from "@/components/user/user-management"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircleIcon, ArrowLeftIcon } from "lucide-react"

/**
 * 用户管理页面
 */
export default function UsersPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">用户管理</h1>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PermissionGuard
        permission="users.view"
        fallback={
          <Alert>
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>无权访问</AlertTitle>
            <AlertDescription>
              您没有查看用户管理的权限。请联系管理员获取权限。
            </AlertDescription>
          </Alert>
        }
      >
        <UserManagement onError={setError} />
      </PermissionGuard>
    </div>
  )
}
