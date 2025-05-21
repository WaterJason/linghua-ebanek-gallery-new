"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

/**
 * 权限检查钩子
 * 用于检查当前用户是否拥有指定权限
 * 
 * @param permissionCode 权限代码，如 "users.create"
 * @returns 包含权限检查结果和加载状态的对象
 */
export function usePermission(permissionCode: string) {
  const { data: session, status } = useSession()
  const [hasPermission, setHasPermission] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const checkPermission = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (status === "loading") {
          return
        }

        if (status === "unauthenticated" || !session) {
          setHasPermission(false)
          return
        }

        // 检查用户是否有超级管理员角色
        const isSuperAdmin = session.user.roles?.some(role => role.code === "super_admin")
        if (isSuperAdmin) {
          setHasPermission(true)
          return
        }

        // 使用会话中的hasPermission函数
        if (typeof session.user.hasPermission === "function") {
          setHasPermission(session.user.hasPermission(permissionCode))
          return
        }

        // 如果会话中没有hasPermission函数，则通过API检查权限
        const response = await fetch(`/api/permissions/check?code=${permissionCode}`)
        if (!response.ok) {
          throw new Error("权限检查失败")
        }

        const data = await response.json()
        setHasPermission(data.hasPermission)
      } catch (err) {
        console.error("权限检查错误:", err)
        setError(err instanceof Error ? err : new Error("权限检查失败"))
        setHasPermission(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkPermission()
  }, [permissionCode, session, status])

  return { hasPermission, isLoading, error }
}

/**
 * 角色检查钩子
 * 用于检查当前用户是否拥有指定角色
 * 
 * @param roleCode 角色代码，如 "admin"
 * @returns 包含角色检查结果和加载状态的对象
 */
export function useRole(roleCode: string | string[]) {
  const { data: session, status } = useSession()
  const [hasRole, setHasRole] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkRole = () => {
      setIsLoading(true)

      if (status === "loading") {
        return
      }

      if (status === "unauthenticated" || !session) {
        setHasRole(false)
        setIsLoading(false)
        return
      }

      const roleCodes = Array.isArray(roleCode) ? roleCode : [roleCode]
      
      // 检查用户是否有指定角色
      const userHasRole = session.user.roles?.some(role => 
        roleCodes.includes(role.code)
      ) || false

      setHasRole(userHasRole)
      setIsLoading(false)
    }

    checkRole()
  }, [roleCode, session, status])

  return { hasRole, isLoading }
}

/**
 * 获取当前用户所有权限的钩子
 * 
 * @returns 包含用户权限列表和加载状态的对象
 */
export function useUserPermissions() {
  const { data: session, status } = useSession()
  const [permissions, setPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchPermissions = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (status === "loading") {
          return
        }

        if (status === "unauthenticated" || !session) {
          setPermissions([])
          return
        }

        // 通过API获取用户权限
        const response = await fetch("/api/permissions/user")
        if (!response.ok) {
          throw new Error("获取权限失败")
        }

        const data = await response.json()
        setPermissions(data.permissions || [])
      } catch (err) {
        console.error("获取权限错误:", err)
        setError(err instanceof Error ? err : new Error("获取权限失败"))
        setPermissions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPermissions()
  }, [session, status])

  return { permissions, isLoading, error }
}
