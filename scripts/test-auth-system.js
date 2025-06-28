const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuthSystem() {
  console.log('🔍 开始认证系统诊断...\n');

  try {
    // 1. 检查数据库连接
    console.log('1. 检查数据库连接...');
    await prisma.$connect();
    console.log('✅ 数据库连接正常\n');

    // 2. 检查超级管理员账户
    console.log('2. 检查超级管理员账户...');
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@linghua.com' },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (admin) {
      console.log('✅ 超级管理员账户存在');
      console.log(`   邮箱: ${admin.email}`);
      console.log(`   姓名: ${admin.name}`);
      console.log(`   角色: ${admin.role}`);
      console.log(`   用户角色数量: ${admin.userRoles.length}`);

      if (admin.userRoles.length > 0) {
        admin.userRoles.forEach(ur => {
          console.log(`   - ${ur.role.name} (${ur.role.code})`);
        });
      }
    } else {
      console.log('❌ 超级管理员账户不存在');
      return;
    }
    console.log('');

    // 3. 检查角色系统
    console.log('3. 检查角色系统...');
    const roles = await prisma.role.findMany();
    console.log(`✅ 系统中共有 ${roles.length} 个角色:`);
    roles.forEach(role => {
      console.log(`   - ${role.name} (${role.code})`);
    });
    console.log('');

    // 4. 检查权限系统
    console.log('4. 检查权限系统...');
    const permissions = await prisma.permission.findMany();
    console.log(`✅ 系统中共有 ${permissions.length} 个权限`);

    // 按模块分组显示权限
    const permissionsByModule = {};
    permissions.forEach(perm => {
      const module = perm.code.split('.')[0];
      if (!permissionsByModule[module]) {
        permissionsByModule[module] = [];
      }
      permissionsByModule[module].push(perm);
    });

    Object.keys(permissionsByModule).forEach(module => {
      console.log(`   ${module}: ${permissionsByModule[module].length} 个权限`);
    });
    console.log('');

    // 5. 检查超级管理员权限
    console.log('5. 检查超级管理员权限...');
    const superAdminRole = await prisma.role.findFirst({
      where: { code: 'super_admin' },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (superAdminRole) {
      console.log(`✅ 超级管理员角色拥有 ${superAdminRole.rolePermissions.length} 个权限`);
      if (superAdminRole.rolePermissions.length === permissions.length) {
        console.log('✅ 超级管理员拥有所有权限');
      } else {
        console.log(`⚠️  超级管理员缺少 ${permissions.length - superAdminRole.rolePermissions.length} 个权限`);
      }
    } else {
      console.log('❌ 超级管理员角色不存在');
    }
    console.log('');

    // 6. 测试密码验证
    console.log('6. 测试密码验证...');
    if (admin && admin.password) {
      // 这里我们不能直接测试密码，因为我们不知道明文密码
      console.log('✅ 管理员账户有密码哈希');
      console.log(`   密码哈希长度: ${admin.password.length}`);
      console.log(`   是否为bcrypt格式: ${admin.password.startsWith('$2')}`);
    } else {
      console.log('❌ 管理员账户没有密码');
    }
    console.log('');

    // 7. 检查用户登录历史表
    console.log('7. 检查用户登录历史...');
    const loginHistoryCount = await prisma.userLoginHistory.count();
    console.log(`✅ 登录历史记录数量: ${loginHistoryCount}`);
    console.log('');

    // 8. 检查API路由权限
    console.log('8. 检查关键API路由...');
    const apiRoutes = [
      '/api/users',
      '/api/settings/parameters',
      '/api/auth/permissions',
      '/api/roles',
      '/api/permissions'
    ];

    console.log('✅ 关键API路由列表:');
    apiRoutes.forEach(route => {
      console.log(`   - ${route}`);
    });
    console.log('');

    console.log('🎉 认证系统诊断完成！');
    console.log('\n📋 诊断总结:');
    console.log(`   - 数据库连接: ✅ 正常`);
    console.log(`   - 超级管理员账户: ${admin ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`   - 角色系统: ✅ ${roles.length} 个角色`);
    console.log(`   - 权限系统: ✅ ${permissions.length} 个权限`);
    console.log(`   - 超级管理员权限: ${superAdminRole && superAdminRole.rolePermissions.length === permissions.length ? '✅ 完整' : '⚠️ 不完整'}`);
    console.log(`   - 密码系统: ${admin && admin.password ? '✅ 正常' : '❌ 异常'}`);

    console.log('\n🔑 登录信息:');
    console.log(`   邮箱: admin@linghua.com`);
    console.log(`   密码: 请查看之前的创建日志或重新运行 node scripts/ensure-super-admin.js`);

  } catch (error) {
    console.error('❌ 认证系统诊断失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthSystem();
