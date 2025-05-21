import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetAdminPassword() {
  try {
    console.log('开始重置管理员密码...')
    
    // 设置新密码
    const newPassword = 'admin123'
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // 查找管理员账户
    const admin = await prisma.user.findFirst({
      where: {
        email: 'admin@linghua.com'
      }
    })
    
    if (admin) {
      // 更新管理员密码
      await prisma.user.update({
        where: {
          id: admin.id
        },
        data: {
          password: hashedPassword
        }
      })
      
      console.log('管理员密码已重置为:', newPassword)
      console.log('管理员邮箱:', admin.email)
    } else {
      // 创建管理员账户
      const superAdminRole = await prisma.role.findFirst({
        where: {
          code: 'super_admin'
        }
      })
      
      if (!superAdminRole) {
        console.error('未找到超级管理员角色，请先初始化账号管理系统')
        return
      }
      
      const newAdmin = await prisma.user.create({
        data: {
          name: '管理员',
          email: 'admin@linghua.com',
          password: hashedPassword,
          role: 'admin',
          userRoles: {
            create: {
              roleId: superAdminRole.id
            }
          }
        }
      })
      
      console.log('已创建管理员账户:')
      console.log('邮箱:', newAdmin.email)
      console.log('密码:', newPassword)
    }
    
    console.log('操作完成')
  } catch (error) {
    console.error('重置管理员密码失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPassword()
