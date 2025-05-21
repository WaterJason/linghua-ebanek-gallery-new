"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, ReactNode } from "react"

/**
 * 检查用户是否有指定权限
 * @param permissionCode 权限代码
 * @returns 是否有权限
 */
export function useHasPermission(permissionCode: string) {
  const { data: session } = useSession()
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPermissions() {
      if (!session?.user?.id) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch("/api/auth/permissions")
        if (!response.ok) {
          throw new Error("获取权限失败")
        }

        const data = await response.json()
        setPermissions(data)
      } catch (err) {
        console.error("获取权限失败:", err)
        setError(err instanceof Error ? err.message : "获取权限失败")
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [session?.user?.id])

  // 检查是否有超级管理员角色
  const isSuperAdmin = session?.user?.roles?.some(role => role.code === "super_admin") || false

  // 如果是超级管理员，直接返回true
  if (isSuperAdmin) {
    return { hasPermission: true, loading: false, error: null }
  }

  return {
    hasPermission: permissions.includes(permissionCode),
    loading,
    error,
  }
}

/**
 * 检查用户是否有指定角色
 * @param roleCode 角色代码
 * @returns 是否有角色
 */
export function useHasRole(roleCode: string) {
  const { data: session } = useSession()
  const userRoles = session?.user?.roles || []

  // 检查是否有超级管理员角色
  const isSuperAdmin = userRoles.some(role => role.code === "super_admin")

  // 如果是超级管理员，直接返回true
  if (isSuperAdmin) {
    return true
  }

  // 检查是否有指定角色
  return userRoles.some(role => role.code === roleCode)
}

/**
 * 检查用户是否有指定权限的组件
 * @param props 组件属性
 * @returns 组件
 */
export function HasPermission({
  permissionCode,
  children,
  fallback = null,
}: {
  permissionCode: string
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { hasPermission, loading } = useHasPermission(permissionCode)

  if (loading) {
    return null
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>
}

/**
 * 检查用户是否有指定角色的组件
 * @param props 组件属性
 * @returns 组件
 */
export function HasRole({
  roleCode,
  children,
  fallback = null,
}: {
  roleCode: string
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const hasRole = useHasRole(roleCode)

  return hasRole ? <>{children}</> : <>{fallback}</>
}
