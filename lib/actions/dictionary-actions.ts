"use server";

/**
 * 数据字典服务
 *
 * 本模块提供数据字典相关的功能，包括创建数据字典、获取数据字典列表、管理数据字典项等。
 *
 * @module 数据字典
 * @category 核心模块
 */

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import { logEntityCreation, logEntityUpdate, logEntityDeletion } from "./audit-actions";

// 创建数据字典参数
export interface CreateDictionaryParams {
  code: string;
  name: string;
  description?: string;
  isSystem?: boolean;
}

// 更新数据字典参数
export interface UpdateDictionaryParams {
  id: number;
  name?: string;
  description?: string;
  isSystem?: boolean;
}

// 创建数据字典项参数
export interface CreateDictionaryItemParams {
  dictionaryId: number;
  code: string;
  value: string;
  label: string;
  sortOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

// 更新数据字典项参数
export interface UpdateDictionaryItemParams {
  id: number;
  value?: string;
  label?: string;
  sortOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

// 批量创建数据字典项参数
export interface CreateBulkDictionaryItemsParams {
  dictionaryId: number;
  items: Array<{
    code: string;
    value: string;
    label: string;
    sortOrder?: number;
    isDefault?: boolean;
    isActive?: boolean;
  }>;
}

/**
 * 创建数据字典
 *
 * @param params 创建数据字典参数
 * @returns 创建的数据字典
 */
export async function createDictionary(params: CreateDictionaryParams) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("未授权");
    }

    // 检查代码是否已存在
    const existingDictionary = await prisma.dataDictionary.findUnique({
      where: { code: params.code },
    });

    if (existingDictionary) {
      throw new Error(`数据字典代码 ${params.code} 已存在`);
    }

    // 创建数据字典
    const dictionary = await prisma.dataDictionary.create({
      data: {
        code: params.code,
        name: params.name,
        description: params.description,
        isSystem: params.isSystem || false,
      },
    });

    // 记录审计日志
    await logEntityCreation("system", dictionary.id.toString(), dictionary, "创建数据字典");

    // 重新验证数据字典页面
    revalidatePath("/settings/dictionaries");

    return dictionary;
  } catch (error) {
    console.error("创建数据字典失败:", error);
    throw new Error(error instanceof Error ? error.message : "创建数据字典失败");
  }
}

/**
 * 更新数据字典
 *
 * @param params 更新数据字典参数
 * @returns 更新的数据字典
 */
export async function updateDictionary(params: UpdateDictionaryParams) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("未授权");
    }

    // 查询数据字典
    const dictionary = await prisma.dataDictionary.findUnique({
      where: { id: params.id },
    });

    if (!dictionary) {
      throw new Error("数据字典不存在");
    }

    // 系统数据字典只能修改名称和描述
    if (dictionary.isSystem && params.isSystem === false) {
      throw new Error("系统数据字典不能修改为非系统数据字典");
    }

    // 更新数据字典
    const updatedDictionary = await prisma.dataDictionary.update({
      where: { id: params.id },
      data: {
        name: params.name,
        description: params.description,
        isSystem: params.isSystem,
      },
    });

    // 记录审计日志
    await logEntityUpdate(
      "system",
      updatedDictionary.id.toString(),
      dictionary,
      updatedDictionary,
      "更新数据字典"
    );

    // 重新验证数据字典页面
    revalidatePath("/settings/dictionaries");

    return updatedDictionary;
  } catch (error) {
    console.error("更新数据字典失败:", error);
    throw new Error(error instanceof Error ? error.message : "更新数据字典失败");
  }
}

/**
 * 删除数据字典
 *
 * @param id 数据字典ID
 * @returns 删除的数据字典
 */
export async function deleteDictionary(id: number) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("未授权");
    }

    // 查询数据字典
    const dictionary = await prisma.dataDictionary.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!dictionary) {
      throw new Error("数据字典不存在");
    }

    // 系统数据字典不能删除
    if (dictionary.isSystem) {
      throw new Error("系统数据字典不能删除");
    }

    // 删除数据字典
    const deletedDictionary = await prisma.dataDictionary.delete({
      where: { id },
    });

    // 记录审计日志
    await logEntityDeletion(
      "system",
      deletedDictionary.id.toString(),
      dictionary,
      "删除数据字典"
    );

    // 重新验证数据字典页面
    revalidatePath("/settings/dictionaries");

    return deletedDictionary;
  } catch (error) {
    console.error("删除数据字典失败:", error);
    throw new Error(error instanceof Error ? error.message : "删除数据字典失败");
  }
}

/**
 * 获取数据字典列表
 *
 * @returns 数据字典列表
 */
export async function getDictionaries() {
  try {
    const dictionaries = await prisma.dataDictionary.findMany({
      orderBy: { code: "asc" },
    });

    return dictionaries;
  } catch (error) {
    console.error("获取数据字典列表失败:", error);
    throw new Error("获取数据字典列表失败");
  }
}

/**
 * 获取数据字典详情
 *
 * @param id 数据字典ID
 * @returns 数据字典详情
 */
export async function getDictionary(id: number) {
  try {
    const dictionary = await prisma.dataDictionary.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!dictionary) {
      throw new Error("数据字典不存在");
    }

    return dictionary;
  } catch (error) {
    console.error("获取数据字典详情失败:", error);
    throw new Error("获取数据字典详情失败");
  }
}

/**
 * 根据代码获取数据字典
 *
 * @param code 数据字典代码
 * @returns 数据字典详情
 */
export async function getDictionaryByCode(code: string) {
  try {
    const dictionary = await prisma.dataDictionary.findUnique({
      where: { code },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!dictionary) {
      throw new Error(`数据字典 ${code} 不存在`);
    }

    return dictionary;
  } catch (error) {
    console.error("获取数据字典详情失败:", error);
    throw new Error("获取数据字典详情失败");
  }
}

/**
 * 创建数据字典项
 *
 * @param params 创建数据字典项参数
 * @returns 创建的数据字典项
 */
export async function createDictionaryItem(params: CreateDictionaryItemParams) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("未授权");
    }

    // 检查数据字典是否存在
    const dictionary = await prisma.dataDictionary.findUnique({
      where: { id: params.dictionaryId },
    });

    if (!dictionary) {
      throw new Error("数据字典不存在");
    }

    // 检查代码是否已存在
    const existingItem = await prisma.dataDictionaryItem.findFirst({
      where: {
        dictionaryId: params.dictionaryId,
        code: params.code,
      },
    });

    if (existingItem) {
      throw new Error(`数据字典项代码 ${params.code} 已存在`);
    }

    // 如果设置为默认项，需要将其他项设置为非默认
    if (params.isDefault) {
      await prisma.dataDictionaryItem.updateMany({
        where: {
          dictionaryId: params.dictionaryId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // 创建数据字典项
    const item = await prisma.dataDictionaryItem.create({
      data: {
        dictionaryId: params.dictionaryId,
        code: params.code,
        value: params.value,
        label: params.label,
        sortOrder: params.sortOrder || 0,
        isDefault: params.isDefault || false,
        isActive: params.isActive !== undefined ? params.isActive : true,
      },
    });

    // 记录审计日志
    await logEntityCreation("system", item.id.toString(), item, "创建数据字典项");

    // 重新验证数据字典页面
    revalidatePath("/settings/dictionaries");

    return item;
  } catch (error) {
    console.error("创建数据字典项失败:", error);
    throw new Error(error instanceof Error ? error.message : "创建数据字典项失败");
  }
}

/**
 * 更新数据字典项
 *
 * @param params 更新数据字典项参数
 * @returns 更新的数据字典项
 */
export async function updateDictionaryItem(params: UpdateDictionaryItemParams) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("未授权");
    }

    // 查询数据字典项
    const item = await prisma.dataDictionaryItem.findUnique({
      where: { id: params.id },
    });

    if (!item) {
      throw new Error("数据字典项不存在");
    }

    // 如果设置为默认项，需要将其他项设置为非默认
    if (params.isDefault) {
      await prisma.dataDictionaryItem.updateMany({
        where: {
          dictionaryId: item.dictionaryId,
          isDefault: true,
          id: { not: params.id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // 更新数据字典项
    const updatedItem = await prisma.dataDictionaryItem.update({
      where: { id: params.id },
      data: {
        value: params.value,
        label: params.label,
        sortOrder: params.sortOrder,
        isDefault: params.isDefault,
        isActive: params.isActive,
      },
    });

    // 记录审计日志
    await logEntityUpdate(
      "system",
      updatedItem.id.toString(),
      item,
      updatedItem,
      "更新数据字典项"
    );

    // 重新验证数据字典页面
    revalidatePath("/settings/dictionaries");

    return updatedItem;
  } catch (error) {
    console.error("更新数据字典项失败:", error);
    throw new Error(error instanceof Error ? error.message : "更新数据字典项失败");
  }
}

/**
 * 删除数据字典项
 *
 * @param id 数据字典项ID
 * @returns 删除的数据字典项
 */
export async function deleteDictionaryItem(id: number) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("未授权");
    }

    // 查询数据字典项
    const item = await prisma.dataDictionaryItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new Error("数据字典项不存在");
    }

    // 删除数据字典项
    const deletedItem = await prisma.dataDictionaryItem.delete({
      where: { id },
    });

    // 记录审计日志
    await logEntityDeletion(
      "system",
      deletedItem.id.toString(),
      item,
      "删除数据字典项"
    );

    // 重新验证数据字典页面
    revalidatePath("/settings/dictionaries");

    return deletedItem;
  } catch (error) {
    console.error("删除数据字典项失败:", error);
    throw new Error(error instanceof Error ? error.message : "删除数据字典项失败");
  }
}

/**
 * 批量创建数据字典项
 *
 * @param params 批量创建数据字典项参数
 * @returns 创建的数据字典项数量
 */
export async function createBulkDictionaryItems(params: CreateBulkDictionaryItemsParams) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("未授权");
    }

    // 检查数据字典是否存在
    const dictionary = await prisma.dataDictionary.findUnique({
      where: { id: params.dictionaryId },
    });

    if (!dictionary) {
      throw new Error("数据字典不存在");
    }

    // 检查是否有默认项
    const hasDefault = params.items.some(item => item.isDefault);

    // 如果有默认项，需要将其他项设置为非默认
    if (hasDefault) {
      await prisma.dataDictionaryItem.updateMany({
        where: {
          dictionaryId: params.dictionaryId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // 批量创建数据字典项
    const result = await prisma.dataDictionaryItem.createMany({
      data: params.items.map(item => ({
        dictionaryId: params.dictionaryId,
        code: item.code,
        value: item.value,
        label: item.label,
        sortOrder: item.sortOrder || 0,
        isDefault: item.isDefault || false,
        isActive: item.isActive !== undefined ? item.isActive : true,
      })),
      skipDuplicates: true,
    });

    // 记录审计日志
    await logEntityCreation(
      "system",
      dictionary.id.toString(),
      { count: result.count },
      `批量创建数据字典项，共 ${result.count} 项`
    );

    // 重新验证数据字典页面
    revalidatePath("/settings/dictionaries");

    return result.count;
  } catch (error) {
    console.error("批量创建数据字典项失败:", error);
    throw new Error(error instanceof Error ? error.message : "批量创建数据字典项失败");
  }
}

/**
 * 初始化系统数据字典
 *
 * 创建系统预设的数据字典和字典项
 *
 * @returns 创建的数据字典列表
 */
export async function initializeSystemDictionaries() {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("未授权");
    }

    // 系统预设数据字典
    const systemDictionaries = [
      {
        code: "order_status",
        name: "订单状态",
        description: "订单处理状态",
        items: [
          { code: "pending", value: "pending", label: "待处理", sortOrder: 1, isDefault: true },
          { code: "processing", value: "processing", label: "处理中", sortOrder: 2 },
          { code: "completed", value: "completed", label: "已完成", sortOrder: 3 },
          { code: "cancelled", value: "cancelled", label: "已取消", sortOrder: 4 },
        ],
      },
      {
        code: "payment_status",
        name: "支付状态",
        description: "订单支付状态",
        items: [
          { code: "unpaid", value: "unpaid", label: "未支付", sortOrder: 1, isDefault: true },
          { code: "partial", value: "partial", label: "部分支付", sortOrder: 2 },
          { code: "paid", value: "paid", label: "已支付", sortOrder: 3 },
          { code: "refunded", value: "refunded", label: "已退款", sortOrder: 4 },
        ],
      },
      {
        code: "payment_method",
        name: "支付方式",
        description: "订单支付方式",
        items: [
          { code: "cash", value: "cash", label: "现金", sortOrder: 1, isDefault: true },
          { code: "wechat", value: "wechat", label: "微信支付", sortOrder: 2 },
          { code: "alipay", value: "alipay", label: "支付宝", sortOrder: 3 },
          { code: "card", value: "card", label: "银行卡", sortOrder: 4 },
          { code: "transfer", value: "transfer", label: "银行转账", sortOrder: 5 },
          { code: "other", value: "other", label: "其他", sortOrder: 6 },
        ],
      },
    ];

    // 创建数据字典和字典项
    const createdDictionaries = [];

    for (const dict of systemDictionaries) {
      // 检查是否已存在
      let dictionary = await prisma.dataDictionary.findUnique({
        where: { code: dict.code },
      });

      // 如果不存在，创建数据字典
      if (!dictionary) {
        dictionary = await prisma.dataDictionary.create({
          data: {
            code: dict.code,
            name: dict.name,
            description: dict.description,
            isSystem: true,
          },
        });

        // 创建数据字典项
        await prisma.dataDictionaryItem.createMany({
          data: dict.items.map(item => ({
            dictionaryId: dictionary!.id,
            code: item.code,
            value: item.value,
            label: item.label,
            sortOrder: item.sortOrder || 0,
            isDefault: item.isDefault || false,
            isActive: true,
          })),
          skipDuplicates: true,
        });
      }

      createdDictionaries.push(dictionary);
    }

    // 记录审计日志
    await logEntityCreation(
      "system",
      "system_dictionaries",
      { count: createdDictionaries.length },
      `初始化系统数据字典，共 ${createdDictionaries.length} 个`
    );

    // 重新验证数据字典页面
    revalidatePath("/settings/dictionaries");

    return createdDictionaries;
  } catch (error) {
    console.error("初始化系统数据字典失败:", error);
    throw new Error("初始化系统数据字典失败");
  }
}
