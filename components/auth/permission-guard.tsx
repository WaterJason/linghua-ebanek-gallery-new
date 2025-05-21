"use client"

import { ReactNode } from "react"
import { usePermission, useRole } from "@/hooks/use-permission"
import { Skeleton } from "@/components/ui/skeleton"

interface PermissionGuardProps {
  /**
   * 需要的权限代码
   */
  permission?: string
  /**
   * 需要的角色代码
   */
  role?: string | string[]
  /**
   * 当用户没有权限时显示的内容
   */
  fallback?: ReactNode
  /**
   * 当权限检查加载中时显示的内容
   */
  loading?: ReactNode
  /**
   * 子组件
   */
  children: ReactNode
}

/**
 * 权限保护组件
 * 只有当用户拥有指定权限或角色时，才会渲染子组件
 */
export function PermissionGuard({
  permission,
  role,
  fallback = null,
  loading = <Skeleton className="h-10 w-full" />,
  children
}: PermissionGuardProps) {
  // 如果同时指定了权限和角色，则需要同时满足
  const needsBoth = permission && role

  // 检查权限
  const { 
    hasPermission, 
    isLoading: permissionLoading 
  } = permission ? usePermission(permission) : { hasPermission: true, isLoading: false }

  // 检查角色
  const { 
    hasRole, 
    isLoading: roleLoading 
  } = role ? useRole(role) : { hasRole: true, isLoading: false }

  // 是否正在加载
  const isLoading = permissionLoading || roleLoading

  // 是否有权限访问
  const hasAccess = needsBoth 
    ? hasPermission && hasRole 
    : hasPermission || hasRole

  if (isLoading) {
    return <>{loading}</>
  }

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface RoleGuardProps {
  /**
   * 需要的角色代码
   */
  role: string | string[]
  /**
   * 当用户没有角色时显示的内容
   */
  fallback?: ReactNode
  /**
   * 当角色检查加载中时显示的内容
   */
  loading?: ReactNode
  /**
   * 子组件
   */
  children: ReactNode
}

/**
 * 角色保护组件
 * 只有当用户拥有指定角色时，才会渲染子组件
 */
export function RoleGuard({
  role,
  fallback = null,
  loading = <Skeleton className="h-10 w-full" />,
  children
}: RoleGuardProps) {
  const { hasRole, isLoading } = useRole(role)

  if (isLoading) {
    return <>{loading}</>
  }

  if (!hasRole) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
