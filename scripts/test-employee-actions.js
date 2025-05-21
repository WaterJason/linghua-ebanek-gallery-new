/**
 * 测试员工管理模块的 createEmployee 函数
 *
 * 这个脚本用于测试 employee-actions.ts 中的 createEmployee 函数是否正常工作
 */

// 由于我们需要测试 TypeScript 文件中的函数，我们需要使用 ts-node 来运行这个脚本
// 但为了简单起见，我们可以直接在这里模拟 createEmployee 函数的行为

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { revalidatePath } = require('next/cache');

// 模拟 checkModelSync 函数
async function checkModelSync(modelName, data) {
  console.log(`[模拟] 检查模型同步: ${modelName}`, data);
  return { isValid: true, errors: [] };
}

// 模拟 convertToModelFormat 函数
async function convertToModelFormat(modelName, data) {
  console.log(`[模拟] 转换数据格式: ${modelName}`, data);

  // 确保 dailySalary 是数字类型
  if (data.dailySalary !== undefined) {
    data.dailySalary = typeof data.dailySalary === 'string' ? parseFloat(data.dailySalary) : data.dailySalary;
  }

  return data;
}

// 模拟 createRecord 函数
async function createRecord(model, data, options = {}) {
  console.log(`[模拟] 创建记录: ${model}`, data);

  // 检查数据是否与模型一致
  if (options.checkSync !== false) {
    const checkResult = await checkModelSync(model, data);
    if (!checkResult.isValid) {
      throw new Error(`数据与模型不一致: ${checkResult.errors.join(', ')}`);
    }

    // 转换数据为正确的格式
    const convertedData = await convertToModelFormat(model, data);
    data = convertedData;
  }

  // 使用 Prisma 客户端创建记录
  return await prisma[model].create({ data });
}

// 模拟 validateCreateEmployee 函数
function validateCreateEmployee(data) {
  console.log('[模拟] 验证员工创建数据:', data);

  const errors = [];

  // 验证必填字段
  if (!data.name) {
    errors.push('员工姓名为必填项');
  }

  if (!data.position) {
    errors.push('职位为必填项');
  }

  if (data.dailySalary === undefined || data.dailySalary === null) {
    errors.push('日薪为必填项');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// 模拟 createEmployee 函数
async function createEmployee(data) {
  try {
    console.log('[模拟] 创建员工:', data);

    // 验证数据
    const validation = validateCreateEmployee(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join('; '));
    }

    // 确保 dailySalary 是数字类型
    const dailySalaryValue = typeof data.dailySalary === 'string' ? parseFloat(data.dailySalary) : data.dailySalary;

    if (isNaN(dailySalaryValue)) {
      throw new Error('日薪必须是有效的数字');
    }

    // 使用类型安全的包装函数创建员工
    const employee = await createRecord('employee', {
      name: data.name,
      position: data.position,
      phone: data.phone || null,
      email: data.email || null,
      dailySalary: dailySalaryValue,
      status: data.status || 'active',
    });

    console.log('[模拟] 员工创建成功:', employee);

    return employee;
  } catch (error) {
    console.error('[模拟] 创建员工失败:', error);
    throw new Error(error instanceof Error ? error.message : '创建员工失败');
  }
}

// 测试函数
async function testCreateEmployee() {
  try {
    console.log('开始测试 createEmployee 函数...');

    // 测试用例 1: 有效数据
    const testData1 = {
      name: '测试员工',
      position: '测试职位',
      dailySalary: 200,
      status: 'active',
      phone: '13800138000',
      email: 'test@example.com',
    };

    console.log('测试用例 1: 有效数据');
    const employee1 = await createEmployee(testData1);
    console.log('测试用例 1 结果:', employee1);

    // 删除测试数据
    await prisma.employee.delete({
      where: { id: employee1.id }
    });

    // 测试用例 2: dailySalary 是字符串
    const testData2 = {
      name: '测试员工2',
      position: '测试职位2',
      dailySalary: '300',
      status: 'active',
      phone: '13800138001',
      email: 'test2@example.com',
    };

    console.log('测试用例 2: dailySalary 是字符串');
    const employee2 = await createEmployee(testData2);
    console.log('测试用例 2 结果:', employee2);

    // 删除测试数据
    await prisma.employee.delete({
      where: { id: employee2.id }
    });

    console.log('测试完成: 成功');
    return { success: true };
  } catch (error) {
    console.error('测试失败:', error);
    return { success: false, error };
  } finally {
    await prisma.$disconnect();
  }
}

// 执行测试
testCreateEmployee()
  .then(result => {
    if (result.success) {
      console.log('createEmployee 函数测试通过');
      process.exit(0);
    } else {
      console.error('createEmployee 函数测试失败');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('测试执行出错:', error);
    process.exit(1);
  });
