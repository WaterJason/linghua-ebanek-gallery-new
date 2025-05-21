/**
 * Prisma 模型同步检查工具
 *
 * 这个文件包含用于检查代码中使用的字段名是否与 Prisma 模型一致的工具函数
 */

import { PrismaClient } from '@prisma/client';

/**
 * 检查对象字段是否与 Prisma 模型一致
 * @param modelName Prisma 模型名称
 * @param data 要检查的数据对象
 * @returns 检查结果，包含是否有效和错误信息
 */
export async function checkModelSync(
  modelName: string,
  data: Record<string, any>
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    console.log(`Checking model sync for ${modelName} with data:`, JSON.stringify(data, null, 2));

    // 使用硬编码的模型字段映射，避免依赖 Prisma 的内部 API
    const modelFields: Record<string, string[]> = {
      employee: [
        'id', 'name', 'position', 'phone', 'email', 'dailySalary', 'status',
        'createdAt', 'updatedAt', 'address', 'emergencyContact', 'emergencyPhone',
        'idNumber', 'bankAccount', 'bankName', 'salary'
      ],
      product: [
        'id', 'name', 'description', 'price', 'cost', 'sku', 'barcode',
        'categoryId', 'images', 'inventory', 'unit', 'material', 'dimensions',
        'status', 'createdAt', 'updatedAt'
      ],
      customer: [
        'id', 'name', 'phone', 'email', 'address', 'type', 'notes',
        'createdAt', 'updatedAt'
      ],
      supplier: [
        'id', 'name', 'contactPerson', 'phone', 'email', 'address',
        'description', 'isActive', 'notes', 'createdAt', 'updatedAt'
      ],
      order: [
        'id', 'customerId', 'employeeId', 'orderDate', 'totalAmount',
        'paidAmount', 'paymentStatus', 'status', 'notes', 'createdAt', 'updatedAt'
      ],
      schedule: [
        'id', 'employeeId', 'date', 'startTime', 'endTime', 'note',
        'createdAt', 'updatedAt'
      ],
      salaryRecord: [
        'id', 'employeeId', 'year', 'month', 'baseSalary', 'scheduleSalary',
        'salesCommission', 'pieceWorkIncome', 'workshopIncome', 'coffeeShiftCommission',
        'overtimePay', 'bonus', 'deductions', 'socialInsurance', 'tax',
        'totalIncome', 'netIncome', 'status', 'paymentDate', 'notes',
        'createdAt', 'updatedAt'
      ],
      systemLog: [
        'id', 'module', 'level', 'message', 'details', 'timestamp', 'userId'
      ],
      channel: [
        'id', 'name', 'code', 'description', 'contactName', 'contactPhone',
        'contactEmail', 'address', 'isActive', 'createdAt', 'updatedAt'
      ],
      channelInventory: [
        'id', 'channelId', 'productId', 'quantity', 'minQuantity', 'notes',
        'createdAt', 'updatedAt'
      ],
      channelPrice: [
        'id', 'channelId', 'productId', 'price', 'isActive',
        'createdAt', 'updatedAt'
      ],
      // 添加其他模型的字段...
    };

    // 检查模型是否存在
    if (!modelFields[modelName]) {
      console.error(`Model "${modelName}" not found in modelFields`);
      return {
        isValid: false,
        errors: [`模型 "${modelName}" 不存在或未在 modelFields 中定义`]
      };
    }

    const fields = modelFields[modelName];
    console.log(`Model "${modelName}" found with fields:`, fields);

    // 检查数据对象中的每个字段
    for (const fieldName in data) {
      // 跳过值为 undefined 的字段
      if (data[fieldName] === undefined) {
        console.log(`Skipping undefined field "${fieldName}"`);
        continue;
      }

      // 检查字段是否存在于模型中
      if (!fields.includes(fieldName)) {
        console.error(`Field "${fieldName}" not found in model "${modelName}"`);
        errors.push(`字段 "${fieldName}" 在模型 "${modelName}" 中不存在`);
        continue;
      }

      console.log(`Field "${fieldName}" found with value:`, data[fieldName]);

      // 检查字段类型是否匹配
      const value = data[fieldName];

      if (value !== null) {
        // 检查数字类型
        if (fields.includes(fieldName)) {
          // 根据字段名称推断类型
          if (fieldName.endsWith('Id') || fieldName === 'id' || fieldName === 'inventory') {
            // ID 字段和库存字段通常是整数
            if (!Number.isInteger(Number(value))) {
              console.error(`Field "${fieldName}" should be an integer, but got ${typeof value}: ${value}`);
              errors.push(`字段 "${fieldName}" 应该是整数，但得到的是 ${typeof value}: ${value}`);
            }
          } else if (fieldName.includes('price') || fieldName.includes('cost') ||
                    fieldName.includes('amount') || fieldName.includes('rate') ||
                    fieldName.includes('salary') || fieldName.includes('fee')) {
            // 价格、成本、金额、比率、薪资、费用字段通常是浮点数
            if (isNaN(Number(value))) {
              console.error(`Field "${fieldName}" should be a number, but got ${typeof value}: ${value}`);
              errors.push(`字段 "${fieldName}" 应该是数字，但得到的是 ${typeof value}: ${value}`);
            }
          } else if (fieldName === 'images' || fieldName === 'roles' || fieldName.endsWith('Ids')) {
            // 图片、角色、ID列表字段通常是数组
            if (!Array.isArray(value)) {
              console.error(`Field "${fieldName}" should be an array, but got ${typeof value}: ${value}`);
              errors.push(`字段 "${fieldName}" 应该是数组，但得到的是 ${typeof value}: ${value}`);
            }
          } else if (fieldName.includes('date') || fieldName.includes('Date') ||
                    fieldName.includes('time') || fieldName.includes('Time') ||
                    fieldName === 'createdAt' || fieldName === 'updatedAt') {
            // 日期和时间字段
            if (!(value instanceof Date) && isNaN(new Date(value).getTime())) {
              console.error(`Field "${fieldName}" should be a date, but got invalid date: ${value}`);
              errors.push(`字段 "${fieldName}" 应该是日期，但得到的是无效日期: ${value}`);
            }
          }
        }
      }
    }

    const result = {
      isValid: errors.length === 0,
      errors,
    };

    console.log(`Model sync check result for ${modelName}:`, result);
    return result;
  } catch (error) {
    console.error('检查模型同步时出错:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      return {
        isValid: false,
        errors: [`检查模型同步时出错: ${error.message}`],
      };
    } else {
      return {
        isValid: false,
        errors: ['检查模型同步时出错: 未知错误'],
      };
    }
  }
}

/**
 * 将数据对象转换为与 Prisma 模型一致的格式
 * @param modelName Prisma 模型名称
 * @param data 要转换的数据对象
 * @returns 转换后的数据对象
 */
export async function convertToModelFormat(
  modelName: string,
  data: Record<string, any>
): Promise<Record<string, any>> {
  const result: Record<string, any> = {};

  try {
    console.log(`Converting data format for ${modelName} with data:`, JSON.stringify(data, null, 2));

    // 使用硬编码的模型字段类型映射
    const modelFieldTypes: Record<string, Record<string, string>> = {
      employee: {
        id: 'Int',
        name: 'String',
        position: 'String',
        phone: 'String',
        email: 'String',
        dailySalary: 'Float',
        status: 'String',
        createdAt: 'DateTime',
        updatedAt: 'DateTime',
        address: 'String',
        emergencyContact: 'String',
        emergencyPhone: 'String',
        idNumber: 'String',
        bankAccount: 'String',
        bankName: 'String',
        salary: 'Float'
      },
      product: {
        id: 'Int',
        name: 'String',
        description: 'String',
        price: 'Float',
        cost: 'Float',
        sku: 'String',
        barcode: 'String',
        categoryId: 'Int',
        images: 'String[]',
        inventory: 'Int',
        unit: 'String',
        material: 'String',
        dimensions: 'String',
        status: 'String',
        createdAt: 'DateTime',
        updatedAt: 'DateTime'
      },
      supplier: {
        id: 'Int',
        name: 'String',
        contactPerson: 'String',
        phone: 'String',
        email: 'String',
        address: 'String',
        description: 'String',
        isActive: 'Boolean',
        notes: 'String',
        createdAt: 'DateTime',
        updatedAt: 'DateTime'
      },
      schedule: {
        id: 'Int',
        employeeId: 'Int',
        date: 'DateTime',
        startTime: 'String',
        endTime: 'String',
        note: 'String',
        createdAt: 'DateTime',
        updatedAt: 'DateTime'
      },
      salaryRecord: {
        id: 'Int',
        employeeId: 'Int',
        year: 'Int',
        month: 'Int',
        baseSalary: 'Float',
        scheduleSalary: 'Float',
        salesCommission: 'Float',
        pieceWorkIncome: 'Float',
        workshopIncome: 'Float',
        coffeeShiftCommission: 'Float',
        overtimePay: 'Float',
        bonus: 'Float',
        deductions: 'Float',
        socialInsurance: 'Float',
        tax: 'Float',
        totalIncome: 'Float',
        netIncome: 'Float',
        status: 'String',
        paymentDate: 'DateTime',
        notes: 'String',
        createdAt: 'DateTime',
        updatedAt: 'DateTime'
      },
      systemLog: {
        id: 'Int',
        module: 'String',
        level: 'String',
        message: 'String',
        details: 'String',
        timestamp: 'DateTime',
        userId: 'String'
      },
      channel: {
        id: 'Int',
        name: 'String',
        code: 'String',
        description: 'String',
        contactName: 'String',
        contactPhone: 'String',
        contactEmail: 'String',
        address: 'String',
        isActive: 'Boolean',
        createdAt: 'DateTime',
        updatedAt: 'DateTime'
      },
      channelInventory: {
        id: 'Int',
        channelId: 'Int',
        productId: 'Int',
        quantity: 'Int',
        minQuantity: 'Int',
        notes: 'String',
        createdAt: 'DateTime',
        updatedAt: 'DateTime'
      },
      channelPrice: {
        id: 'Int',
        channelId: 'Int',
        productId: 'Int',
        price: 'Float',
        isActive: 'Boolean',
        createdAt: 'DateTime',
        updatedAt: 'DateTime'
      },
      // 添加其他模型的字段类型...
    };

    // 检查模型是否存在
    if (!modelFieldTypes[modelName]) {
      console.error(`Model "${modelName}" not found in modelFieldTypes`);
      throw new Error(`模型 "${modelName}" 不存在或未在 modelFieldTypes 中定义`);
    }

    const fieldTypes = modelFieldTypes[modelName];
    console.log(`Model "${modelName}" found with field types:`, fieldTypes);

    // 转换数据对象中的每个字段
    for (const fieldName in data) {
      // 跳过值为 undefined 的字段
      if (data[fieldName] === undefined) {
        console.log(`Skipping undefined field "${fieldName}"`);
        continue;
      }

      // 检查字段是否存在于模型中
      const fieldType = fieldTypes[fieldName];

      if (!fieldType) {
        console.log(`Field "${fieldName}" not found in model "${modelName}", skipping`);
        // 字段不存在，跳过
        continue;
      }

      console.log(`Converting field "${fieldName}" with type "${fieldType}" and value:`, data[fieldName]);

      const value = data[fieldName];

      if (value === null) {
        result[fieldName] = null;
        console.log(`Field "${fieldName}" is null, keeping as null`);
      } else {
        // 转换字段值为正确的类型
        switch (fieldType) {
          case 'Int':
            result[fieldName] = typeof value === 'string' ? parseInt(value) : Number(value);
            console.log(`Converted Int field "${fieldName}" from ${value} (${typeof value}) to ${result[fieldName]} (${typeof result[fieldName]})`);
            break;
          case 'Float':
            result[fieldName] = typeof value === 'string' ? parseFloat(value) : Number(value);
            console.log(`Converted Float field "${fieldName}" from ${value} (${typeof value}) to ${result[fieldName]} (${typeof result[fieldName]})`);
            break;
          case 'String':
            result[fieldName] = String(value);
            console.log(`Converted String field "${fieldName}" from ${value} (${typeof value}) to ${result[fieldName]} (${typeof result[fieldName]})`);
            break;
          case 'Boolean':
            result[fieldName] = Boolean(value);
            console.log(`Converted Boolean field "${fieldName}" from ${value} (${typeof value}) to ${result[fieldName]} (${typeof result[fieldName]})`);
            break;
          case 'DateTime':
            result[fieldName] = value instanceof Date ? value : new Date(value);
            console.log(`Converted DateTime field "${fieldName}" from ${value} (${typeof value}) to ${result[fieldName]} (${typeof result[fieldName]})`);
            break;
          default:
            if (fieldType.endsWith('[]') && Array.isArray(value)) {
              // 处理数组类型
              const itemType = fieldType.slice(0, -2); // 移除 '[]'
              result[fieldName] = value.map(item => {
                switch (itemType) {
                  case 'Int':
                    return typeof item === 'string' ? parseInt(item) : Number(item);
                  case 'Float':
                    return typeof item === 'string' ? parseFloat(item) : Number(item);
                  case 'String':
                    return String(item);
                  case 'Boolean':
                    return Boolean(item);
                  case 'DateTime':
                    return item instanceof Date ? item : new Date(item);
                  default:
                    return item;
                }
              });
              console.log(`Converted Array field "${fieldName}" from ${JSON.stringify(value)} to ${JSON.stringify(result[fieldName])}`);
            } else {
              // 其他类型，直接赋值
              result[fieldName] = value;
              console.log(`Kept field "${fieldName}" as is: ${value} (${typeof value})`);
            }
        }
      }
    }

    console.log(`Converted data for ${modelName}:`, JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('转换数据格式时出错:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

/**
 * 安全创建数据
 * @param modelName Prisma 模型名称
 * @param data 要创建的数据对象
 * @returns 创建的数据对象
 */
export async function safeCreate(
  modelName: string,
  data: Record<string, any>
): Promise<any> {
  // 检查数据是否与模型一致
  const checkResult = await checkModelSync(modelName, data);

  if (!checkResult.isValid) {
    throw new Error(`数据与模型不一致: ${checkResult.errors.join(', ')}`);
  }

  // 转换数据为正确的格式
  const convertedData = await convertToModelFormat(modelName, data);

  // 创建数据
  const prisma = new PrismaClient();

  try {
    const result = await (prisma as any)[modelName].create({
      data: convertedData,
    });

    return result;
  } catch (error) {
    console.error(`创建 ${modelName} 时出错:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 安全更新数据
 * @param modelName Prisma 模型名称
 * @param id 要更新的数据ID
 * @param data 要更新的数据对象
 * @returns 更新的数据对象
 */
export async function safeUpdate(
  modelName: string,
  id: number | string,
  data: Record<string, any>
): Promise<any> {
  // 检查数据是否与模型一致
  const checkResult = await checkModelSync(modelName, data);

  if (!checkResult.isValid) {
    throw new Error(`数据与模型不一致: ${checkResult.errors.join(', ')}`);
  }

  // 转换数据为正确的格式
  const convertedData = await convertToModelFormat(modelName, data);

  // 更新数据
  const prisma = new PrismaClient();

  try {
    const result = await (prisma as any)[modelName].update({
      where: { id },
      data: convertedData,
    });

    return result;
  } catch (error) {
    console.error(`更新 ${modelName} 时出错:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
