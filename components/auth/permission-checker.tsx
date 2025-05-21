"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

/**
 * 权限检查组件
 * 
 * 此组件会在用户登录后自动检查超级管理员权限
 */
export default function PermissionChecker() {
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    // 如果用户已登录
    if (session?.user) {
      // 检查是否是超级管理员
      const isSuperAdmin = 
        session.user.email === "admin@linghua.com" || 
        session.user.roles?.some((role: any) => role.code === "super_admin") ||
        session.user.role === "admin";
      
      if (isSuperAdmin) {
        // 调用权限检查 API
        fetch("/api/auth/check-permissions")
          .catch(error => {
            console.error("检查权限失败:", error);
          });
      }
    }
  }, [session, pathname]);

  // 此组件不渲染任何内容
  return null;
}
