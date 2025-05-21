import prisma from "../lib/db"

async function setAdminAsSuperAdmin() {
  try {
    console.log("开始将 admin@linghua.com 设置为超级管理员...")

    // 1. 查找 admin@linghua.com 用户
    const adminUser = await prisma.user.findUnique({
      where: {
        email: "admin@linghua.com",
      },
      include: {
        userRoles: true,
      },
    })

    if (!adminUser) {
      console.error("未找到 admin@linghua.com 用户")
      return
    }

    console.log(`找到用户: ${adminUser.name} (${adminUser.email})`)

    // 2. 查找超级管理员角色
    const superAdminRole = await prisma.role.findFirst({
      where: {
        code: "super_admin",
      },
    })

    if (!superAdminRole) {
      console.error("未找到超级管理员角色")
      return
    }

    console.log(`找到超级管理员角色: ${superAdminRole.name}`)

    // 3. 检查用户是否已经拥有超级管理员角色
    const hasRole = adminUser.userRoles.some(ur => ur.roleId === superAdminRole.id)

    if (hasRole) {
      console.log("用户已经拥有超级管理员角色")
    } else {
      // 4. 为用户分配超级管理员角色
      await prisma.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: superAdminRole.id,
        },
      })
      console.log("已为用户分配超级管理员角色")
    }

    // 5. 更新用户的 role 字段为 admin（兼容旧版本）
    await prisma.user.update({
      where: {
        id: adminUser.id,
      },
      data: {
        role: "admin",
      },
    })
    console.log("已更新用户的 role 字段为 admin")

    console.log("操作完成！admin@linghua.com 现在拥有超级管理员权限")
  } catch (error) {
    console.error("设置超级管理员失败:", error)
  } finally {
    await prisma.$disconnect()
  }
}

// 执行函数
setAdminAsSuperAdmin()
