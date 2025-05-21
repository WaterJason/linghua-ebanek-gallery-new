/**
 * Prisma 类型安全包装器
 *
 * 这个文件提供了类型安全的 Prisma 操作函数，
 * 使用 Prisma 生成的类型定义，避免使用不存在的字段。
 *
 * 同时提供了与模型同步检查的功能，确保代码中使用的字段名与 Prisma 模型一致。
 */

import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { checkModelSync, convertToModelFormat } from './model-sync';

/**
 * 创建记录的类型安全函数
 *
 * @param model Prisma 模型名称
 * @param data 创建数据
 * @param options 选项
 * @returns 创建的记录
 */
export async function createRecord<T extends keyof typeof prisma>(
  model: T,
  // @ts-ignore - 这里使用了动态类型
  data: Prisma.Args<typeof prisma[T], 'create'>['data'],
  options: {
    checkSync?: boolean;
    include?: any;
  } = {}
) {
  try {
    console.log(`Creating ${model} with data:`, JSON.stringify(data, null, 2));

    // 检查数据是否与模型一致
    if (options.checkSync !== false) {
      console.log(`Checking model sync for ${model}...`);
      const checkResult = await checkModelSync(model as string, data as Record<string, any>);

      if (!checkResult.isValid) {
        console.error(`Model sync check failed for ${model}:`, checkResult.errors);
        throw new Error(`数据与模型不一致: ${checkResult.errors.join(', ')}`);
      }
      console.log(`Model sync check passed for ${model}`);

      // 转换数据为正确的格式
      console.log(`Converting data format for ${model}...`);
      const convertedData = await convertToModelFormat(model as string, data as Record<string, any>);
      data = convertedData as any;
      console.log(`Converted data for ${model}:`, JSON.stringify(data, null, 2));
    }

    const createOptions: any = { data };

    if (options.include) {
      createOptions.include = options.include;
    }

    // @ts-ignore - 这里使用了动态类型
    const result = await prisma[model].create(createOptions);
    console.log(`Successfully created ${model} with ID:`, result.id);
    return result;
  } catch (error) {
    console.error(`Error creating ${model}:`, error);
    if (error instanceof Error) {
      console.error(`Error stack:`, error.stack);
      throw new Error(`Failed to create ${model}: ${error.message}`);
    } else {
      throw new Error(`Failed to create ${model}`);
    }
  }
}

/**
 * 更新记录的类型安全函数
 *
 * @param model Prisma 模型名称
 * @param id 记录 ID
 * @param data 更新数据
 * @param options 选项
 * @returns 更新后的记录
 */
export async function updateRecord<T extends keyof typeof prisma>(
  model: T,
  id: number,
  // @ts-ignore - 这里使用了动态类型
  data: Prisma.Args<typeof prisma[T], 'update'>['data'],
  options: {
    checkSync?: boolean;
    include?: any;
  } = {}
) {
  try {
    // 检查数据是否与模型一致
    if (options.checkSync !== false) {
      const checkResult = await checkModelSync(model as string, data as Record<string, any>);

      if (!checkResult.isValid) {
        throw new Error(`数据与模型不一致: ${checkResult.errors.join(', ')}`);
      }

      // 转换数据为正确的格式
      const convertedData = await convertToModelFormat(model as string, data as Record<string, any>);
      data = convertedData as any;
    }

    const updateOptions: any = {
      where: { id },
      data,
    };

    if (options.include) {
      updateOptions.include = options.include;
    }

    // @ts-ignore - 这里使用了动态类型
    return await prisma[model].update(updateOptions);
  } catch (error) {
    console.error(`Error updating ${model}:`, error);
    throw new Error(`Failed to update ${model}`);
  }
}

/**
 * 删除记录的类型安全函数
 *
 * @param model Prisma 模型名称
 * @param id 记录 ID
 * @returns 操作结果
 */
export async function deleteRecord<T extends keyof typeof prisma>(
  model: T,
  id: number
) {
  try {
    // @ts-ignore - 这里使用了动态类型
    await prisma[model].delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error(`Error deleting ${model}:`, error);
    throw new Error(`Failed to delete ${model}`);
  }
}

/**
 * 查找记录的类型安全函数
 *
 * @param model Prisma 模型名称
 * @param options 查询选项
 * @returns 查询结果
 */
export async function findRecords<T extends keyof typeof prisma>(
  model: T,
  // @ts-ignore - 这里使用了动态类型
  options?: Prisma.Args<typeof prisma[T], 'findMany'>
) {
  try {
    // 检查模型是否存在
    if (!prisma[model]) {
      console.error(`Model ${model} does not exist in Prisma client`);
      throw new Error(`Model ${model} does not exist`);
    }

    // @ts-ignore - 这里使用了动态类型
    const result = await prisma[model].findMany(options);
    return result;
  } catch (error) {
    console.error(`Error finding ${model}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // 处理已知的Prisma错误
      if (error.code === 'P2003') {
        throw new Error(`Failed to find ${model}: 外键约束失败`);
      } else if (error.code === 'P2025') {
        throw new Error(`Failed to find ${model}: 记录不存在`);
      }
    }
    throw new Error(`Failed to find ${model}: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 查找单个记录的类型安全函数
 *
 * @param model Prisma 模型名称
 * @param id 记录 ID
 * @param options 查询选项
 * @returns 查询结果
 */
export async function findRecord<T extends keyof typeof prisma>(
  model: T,
  id: number,
  // @ts-ignore - 这里使用了动态类型
  options?: Omit<Prisma.Args<typeof prisma[T], 'findUnique'>, 'where'>
) {
  try {
    // @ts-ignore - 这里使用了动态类型
    return await prisma[model].findUnique({
      where: { id },
      ...options,
    });
  } catch (error) {
    console.error(`Error finding ${model}:`, error);
    throw new Error(`Failed to find ${model}`);
  }
}

/**
 * 使用示例:
 *
 * // 创建员工
 * const employee = await createRecord('employee', {
 *   name: "张三",
 *   position: "经理",
 *   dailySalary: 200,
 *   // 如果尝试使用不存在的字段，TypeScript 会报错
 *   // department: "销售部", // 错误：'department' 不存在于 'Employee' 类型中
 * }, { checkSync: true });
 *
 * // 更新员工
 * const updatedEmployee = await updateRecord('employee', 1, {
 *   name: "李四",
 *   // department: "市场部", // 错误：'department' 不存在于 'Employee' 类型中
 * }, { checkSync: true });
 *
 * // 查找员工
 * const employees = await findRecords('employee', {
 *   where: {
 *     position: "经理",
 *   },
 *   include: {
 *     user: true,
 *   },
 * });
 *
 * // 使用模型同步检查
 * // 如果数据中包含不存在的字段，会抛出错误
 * try {
 *   const employee = await createRecord('employee', {
 *     name: "张三",
 *     position: "经理",
 *     dailySalary: 200,
 *     department: "销售部", // 这个字段在 Employee 模型中不存在
 *   }, { checkSync: true });
 * } catch (error) {
 *   console.error(error.message); // 输出: 数据与模型不一致: 字段 "department" 在模型 "Employee" 中不存在
 * }
 */
