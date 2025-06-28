import { auth } from "@/auth"

/**
 * 获取服务器端会话信息
 * 替代 next-auth v4 的 getServerSession
 */
export async function getServerSession() {
  return await auth()
}

/**
 * 检查用户是否已认证
 */
export async function isAuthenticated() {
  const session = await auth()
  return !!session?.user
}

/**
 * 检查用户是否有管理员权限
 */
export async function isAdmin() {
  const session = await auth()
  return session?.user?.role === "admin" || session?.user?.email === "admin@linghua.com"
}

/**
 * 检查用户是否有特定权限
 */
export async function hasPermission(permissionCode: string) {
  const session = await auth()
  if (!session?.user) return false

  // 使用会话中的权限检查函数
  if (typeof session.user.hasPermission === 'function') {
    return session.user.hasPermission(permissionCode)
  }

  // 后备权限检查
  if (session.user.role === "admin" || session.user.email === "admin@linghua.com") {
    return true
  }

  return false
}

/**
 * 获取当前用户ID
 */
export async function getCurrentUserId() {
  const session = await auth()
  return session?.user?.id
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}
