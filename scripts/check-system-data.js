const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSystemData() {
  try {
    console.log('检查系统设置模块数据...\n');
    
    // 检查用户数据
    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true
          }
        },
        employee: true
      }
    });
    console.log(`用户数量: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email})`);
      console.log(`    角色: ${user.userRoles.map(ur => ur.role.name).join(', ')}`);
      if (user.employee) {
        console.log(`    关联员工: ${user.employee.name}`);
      }
    });
    console.log('');
    
    // 检查角色数据
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            userRoles: true
          }
        }
      }
    });
    console.log(`角色数量: ${roles.length}`);
    roles.forEach(role => {
      console.log(`  - ${role.name} (${role.code})`);
      console.log(`    权限数量: ${role.rolePermissions.length}`);
      console.log(`    用户数量: ${role._count.userRoles}`);
      console.log(`    系统角色: ${role.isSystem ? '是' : '否'}`);
    });
    console.log('');
    
    // 检查权限数据
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { name: 'asc' }
      ]
    });
    console.log(`权限数量: ${permissions.length}`);
    
    // 按模块分组显示权限
    const permissionsByModule = {};
    permissions.forEach(permission => {
      if (!permissionsByModule[permission.module]) {
        permissionsByModule[permission.module] = [];
      }
      permissionsByModule[permission.module].push(permission);
    });
    
    Object.keys(permissionsByModule).forEach(module => {
      console.log(`  ${module} 模块:`);
      permissionsByModule[module].forEach(permission => {
        console.log(`    - ${permission.name} (${permission.code})`);
      });
    });
    console.log('');
    
    // 检查备份数据
    const backups = await prisma.dataBackup.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log(`备份记录数量: ${backups.length}`);
    backups.forEach(backup => {
      console.log(`  - ${backup.name} (${backup.status})`);
      console.log(`    类型: ${backup.type}, 大小: ${backup.fileSize || 'N/A'}`);
      console.log(`    创建时间: ${backup.createdAt}`);
    });
    console.log('');
    
    // 检查系统日志
    const logs = await prisma.systemLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    console.log(`系统日志数量: ${logs.length}`);
    logs.forEach(log => {
      console.log(`  - [${log.level}] ${log.module}: ${log.message}`);
      console.log(`    时间: ${log.createdAt}`);
    });
    console.log('');
    
    // 检查数据模板
    const templates = await prisma.dataTemplate.findMany();
    console.log(`数据模板数量: ${templates.length}`);
    templates.forEach(template => {
      console.log(`  - ${template.name} (${template.type})`);
      console.log(`    模块: ${template.module}, 版本: ${template.version}`);
    });
    console.log('');
    
    // 检查系统公告
    const announcements = await prisma.systemAnnouncement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log(`系统公告数量: ${announcements.length}`);
    announcements.forEach(announcement => {
      console.log(`  - ${announcement.title} (${announcement.type})`);
      console.log(`    状态: ${announcement.isActive ? '活跃' : '非活跃'}`);
    });
    console.log('');
    
    console.log('系统数据检查完成!');
    
  } catch (error) {
    console.error('检查系统数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSystemData();
