import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { ensureSuperAdminPermissions } from "@/lib/auth-utils";

/**
 * 检查并确保超级管理员权限
 * 
 * 此 API 路由会检查当前用户是否是超级管理员，如果是，则确保其拥有所有权限
 */
export async function GET(request: NextRequest) {
  try {
    // 获取当前会话
    const session = await auth();
    
    // 如果用户未登录，返回未授权
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    
    // 检查是否需要检查超级管理员权限
    const cookieStore = await cookies();
    const shouldCheck = cookieStore.get("check_super_admin_permissions");
    
    if (!shouldCheck) {
      return NextResponse.json({ message: "无需检查权限" });
    }
    
    // 检查用户是否是超级管理员
    const isSuperAdmin = 
      session.user.email === "admin@linghua.com" || 
      session.user.roles?.some((role: any) => role.code === "super_admin") ||
      session.user.role === "admin";
    
    if (isSuperAdmin) {
      // 确保超级管理员拥有所有权限
      await ensureSuperAdminPermissions();
      
      // 设置超级管理员 Cookie
      cookies().set("is_super_admin", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 30, // 30 天
        path: "/",
      });
      
      // 清除检查标记
      cookies().delete("check_super_admin_permissions");
      
      return NextResponse.json({ message: "超级管理员权限已更新" });
    }
    
    // 清除检查标记
    cookies().delete("check_super_admin_permissions");
    
    return NextResponse.json({ message: "用户不是超级管理员" });
  } catch (error) {
    console.error("检查超级管理员权限失败:", error);
    return NextResponse.json(
      { error: "检查权限失败" },
      { status: 500 }
    );
  }
}
