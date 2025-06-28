/**
 * 库存管理模块
 *
 * 本模块提供库存管理相关的功能，包括库存的增删改查、库存转移、库存事务记录等。
 *
 * @module 库存管理
 * @category 核心模块
 */

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  PrismaInventoryItem,
  PrismaWarehouse,
  PrismaInventoryTransaction,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  CreateWarehouseInput,
  UpdateWarehouseInput,
  InventoryTransferInput
} from "@/types/prisma-models";
import {
  validateCreateInventoryItem,
  validateUpdateInventoryItem,
  validateCreateWarehouse,
  validateUpdateWarehouse,
  validateInventoryTransfer
} from "@/lib/validation";
import { findRecord, findRecords, createRecord, updateRecord } from "@/lib/prisma-wrapper";
import { ErrorUtils } from "@/lib/error-utils";

/**
 * 获取库存
 *
 * 获取所有库存项，包括产品和仓库信息。
 *
 * @returns 库存项列表，包含产品和仓库信息
 *
 * @example
 * ```typescript
 * // 获取所有库存
 * const inventory = await getInventory();
 * console.log(inventory[0].product.name); // 输出第一个库存项的产品名称
 * console.log(inventory[0].warehouse?.name); // 输出第一个库存项的仓库名称
 * ```
 *
 * @throws 如果获取库存失败，会抛出错误
 *
 * @category 查询
 */
export async function getInventory(): Promise<PrismaInventoryItem[]> {
  try {
    // 使用类型安全的包装函数获取库存
    const inventory = await findRecords('inventoryItem', {
      include: {
        product: {
          include: {
            productCategory: true,
          },
        },
        warehouse: true,
      },
      orderBy: {
        productId: "asc",
      },
    });

    return inventory as PrismaInventoryItem[];
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "inventory-management");
    throw appError;
  }
}

/**
 * 获取单个产品库存
 *
 * 获取指定产品的所有库存项，包括产品和仓库信息。
 *
 * @param productId - 产品ID
 * @returns 库存项列表，包含产品和仓库信息
 *
 * @example
 * ```typescript
 * // 获取产品ID为1的库存
 * const inventory = await getProductInventory(1);
 * console.log(inventory[0].quantity); // 输出第一个库存项的数量
 * console.log(inventory[0].warehouse?.name); // 输出第一个库存项的仓库名称
 * ```
 *
 * @throws 如果获取产品库存失败，会抛出错误
 *
 * @category 查询
 */
export async function getProductInventory(productId: number): Promise<PrismaInventoryItem[]> {
  try {
    // 检查产品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ErrorUtils.NotFoundError("产品不存在", { productId }, "inventory-management");
    }

    // 使用类型安全的包装函数获取产品库存
    const inventory = await findRecords('inventoryItem', {
      where: { productId },
      include: {
        product: {
          include: {
            productCategory: true,
          },
        },
        warehouse: true,
      },
    });

    return inventory as PrismaInventoryItem[];
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "inventory-management");
    throw appError;
  }
}

/**
 * 同步产品库存
 *
 * 将产品表中的库存数据同步到库存管理模块。
 * 如果产品已有库存记录，则更新库存数量；
 * 如果产品没有库存记录，则创建新的库存记录。
 *
 * @param productId - 产品ID
 * @returns 同步结果
 *
 * @category 同步
 */
export async function syncProductInventory(productId: number): Promise<{ success: boolean, message: string }> {
  try {
    // 查找产品
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ErrorUtils.NotFoundError("产品不存在", { productId }, "inventory-management");
    }

    // 如果产品没有库存字段，则跳过
    if (product.inventory === null || product.inventory === undefined) {
      return { success: true, message: "产品没有库存数据，无需同步" };
    }

    // 查找现有库存记录
    const existingInventory = await prisma.inventoryItem.findFirst({
      where: { productId },
    });

    if (existingInventory) {
      // 更新库存记录
      await prisma.inventoryItem.update({
        where: { id: existingInventory.id },
        data: { quantity: Number(product.inventory) },
      });

      // 记录库存变更
      await prisma.inventoryTransaction.create({
        data: {
          productId,
          quantity: Number(product.inventory) - existingInventory.quantity,
          type: "adjustment",
          notes: `从产品管理模块同步库存`,
          sourceWarehouseId: existingInventory.warehouseId,
        },
      });

      revalidatePath("/inventory");
      return { success: true, message: "库存数据已同步更新" };
    } else {
      // 查找默认仓库
      const defaultWarehouse = await prisma.warehouse.findFirst({
        where: { isDefault: true },
      });

      if (!defaultWarehouse) {
        // 查找任意一个仓库
        const anyWarehouse = await prisma.warehouse.findFirst();

        if (!anyWarehouse) {
          throw new ErrorUtils.BusinessLogicError(
            "没有找到任何仓库，无法创建库存记录",
            { productId },
            "inventory-management"
          );
        }

        // 创建新的库存记录
        await prisma.inventoryItem.create({
          data: {
            productId,
            quantity: Number(product.inventory),
            warehouseId: anyWarehouse.id,
          },
        });

        // 记录库存变更
        await prisma.inventoryTransaction.create({
          data: {
            productId,
            quantity: Number(product.inventory),
            type: "initial",
            notes: `从产品管理模块初始化库存（使用仓库：${anyWarehouse.name}）`,
            targetWarehouseId: anyWarehouse.id,
          },
        });

        revalidatePath("/inventory");
        return { success: true, message: `已创建新的库存记录（使用仓库：${anyWarehouse.name}）` };
      }

      // 创建新的库存记录
      await prisma.inventoryItem.create({
        data: {
          productId,
          quantity: Number(product.inventory),
          warehouseId: defaultWarehouse.id,
        },
      });

      // 记录库存变更
      await prisma.inventoryTransaction.create({
        data: {
          productId,
          quantity: Number(product.inventory),
          type: "initial",
          notes: `从产品管理模块初始化库存`,
          targetWarehouseId: defaultWarehouse.id,
        },
      });

      revalidatePath("/inventory");
      return { success: true, message: "已创建新的库存记录" };
    }
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "inventory-management");
    throw appError;
  }
}

/**
 * 更新库存
 *
 * 更新库存项的数量和仓库，并记录库存变更。
 *
 * @param id - 库存项ID
 * @param data - 库存项更新数据
 * @returns 更新后的库存项
 *
 * @example
 * ```typescript
 * // 更新库存项ID为1的数量为10
 * const inventory = await updateInventory(1, { quantity: 10 });
 * console.log(inventory.quantity); // 输出: 10
 * ```
 *
 * @throws 如果库存记录不存在或更新失败，会抛出错误
 *
 * @category 修改
 */
export async function updateInventory(data: {
  batchUpdate: true,
  inventoryIds: number[],
  actionType: 'add' | 'subtract' | 'set',
  quantity: number,
  notes?: string,
  warehouseId?: number
}): Promise<{ success: boolean, updated: number }>;
export async function updateInventory(id: number, data: UpdateInventoryItemInput): Promise<PrismaInventoryItem>;
export async function updateInventory(idOrData: number | any, data?: UpdateInventoryItemInput): Promise<PrismaInventoryItem | { success: boolean, updated: number }> {
  // 处理批量更新
  if (typeof idOrData === 'object' && idOrData.batchUpdate === true) {
    return batchUpdateInventory(idOrData);
  }

  // 处理单个更新
  const id = idOrData as number;
  try {
    // 验证数据
    const validation = validateUpdateInventoryItem(data);
    if (!validation.isValid) {
      throw new ErrorUtils.ValidationError(validation.errors.join("; "), { data }, "inventory-management");
    }

    // 检查库存记录是否存在
    const existingInventory = await findRecord('inventoryItem', id);

    if (!existingInventory) {
      throw new ErrorUtils.NotFoundError("库存记录不存在", { id }, "inventory-management");
    }

    // 准备更新数据
    const updateData: any = {};

    // 只更新提供的字段
    if (data.quantity !== undefined) updateData.quantity = Number(data.quantity);
    if (data.warehouseId !== undefined) updateData.warehouseId = data.warehouseId !== null ? Number(data.warehouseId) : null;

    // 更新库存
    const inventory = await updateRecord('inventoryItem', id, updateData);

    // 记录库存变更
    if (data.quantity !== undefined && data.quantity !== existingInventory.quantity) {
      await prisma.inventoryTransaction.create({
        data: {
          productId: existingInventory.productId,
          quantity: Number(data.quantity) - existingInventory.quantity,
          type: "adjustment",
          notes: data.notes || `手动调整库存`,
          sourceWarehouseId: updateData.warehouseId || existingInventory.warehouseId,
        },
      });
    }

    revalidatePath("/inventory");
    return inventory as PrismaInventoryItem;
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "inventory-management");
    throw appError;
  }
}

/**
 * 创建库存
 *
 * 为产品创建库存记录，并记录初始库存变更。
 *
 * @param data - 库存项创建数据
 * @returns 创建的库存项
 *
 * @example
 * ```typescript
 * // 创建产品ID为1的库存，数量为10，仓库ID为1
 * const inventory = await createInventory({
 *   productId: 1,
 *   quantity: 10,
 *   warehouseId: 1
 * });
 * console.log(inventory.id); // 输出新创建的库存项ID
 * ```
 *
 * @throws 如果产品不存在、已有库存记录或创建失败，会抛出错误
 *
 * @category 创建
 */
export async function createInventory(data: CreateInventoryItemInput): Promise<PrismaInventoryItem> {
  try {
    // 验证数据
    const validation = validateCreateInventoryItem(data);
    if (!validation.isValid) {
      throw new ErrorUtils.ValidationError(validation.errors.join("; "), { data }, "inventory-management");
    }

    // 检查产品是否存在
    const product = await prisma.product.findUnique({
      where: { id: Number(data.productId) },
    });

    if (!product) {
      throw new ErrorUtils.NotFoundError("产品不存在", { productId: data.productId }, "inventory-management");
    }

    // 检查是否已存在该产品的库存记录
    const existingInventory = await prisma.inventoryItem.findFirst({
      where: {
        productId: Number(data.productId),
        warehouseId: data.warehouseId ? Number(data.warehouseId) : null,
      },
    });

    if (existingInventory) {
      throw new ErrorUtils.BusinessLogicError(
        "该产品在指定仓库已有库存记录",
        {
          productId: data.productId,
          warehouseId: data.warehouseId,
          existingInventoryId: existingInventory.id
        },
        "inventory-management"
      );
    }

    // 如果指定了仓库，检查仓库是否存在
    if (data.warehouseId) {
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: Number(data.warehouseId) },
      });

      if (!warehouse) {
        throw new ErrorUtils.NotFoundError("仓库不存在", { warehouseId: data.warehouseId }, "inventory-management");
      }
    }

    // 创建库存
    const inventory = await createRecord('inventoryItem', {
      productId: Number(data.productId),
      quantity: Number(data.quantity),
      warehouseId: data.warehouseId ? Number(data.warehouseId) : null,
      minQuantity: data.minQuantity ? Number(data.minQuantity) : null,
    });

    // 记录库存变更
    if (data.quantity > 0) {
      await prisma.inventoryTransaction.create({
        data: {
          productId: Number(data.productId),
          quantity: Number(data.quantity),
          type: "initial",
          notes: `初始库存`,
          targetWarehouseId: data.warehouseId ? Number(data.warehouseId) : null,
        },
      });
    }

    revalidatePath("/inventory");
    return inventory as PrismaInventoryItem;
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "inventory-management");
    throw appError;
  }
}

/**
 * 删除库存
 *
 * 删除库存记录。
 *
 * @param id - 库存项ID
 * @returns 操作结果，包含成功标志
 *
 * @example
 * ```typescript
 * // 删除ID为1的库存记录
 * const result = await deleteInventory(1);
 * if (result.success) {
 *   console.log('库存记录删除成功');
 * }
 * ```
 *
 * @throws 如果库存记录不存在或删除失败，会抛出错误
 *
 * @category 删除
 */
export async function deleteInventory(id: number): Promise<{ success: boolean }> {
  try {
    // 检查库存记录是否存在
    const existingInventory = await findRecord('inventoryItem', id);

    if (!existingInventory) {
      throw new ErrorUtils.NotFoundError("库存记录不存在", { id }, "inventory-management");
    }

    // 检查是否有相关的库存事务记录
    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        OR: [
          { sourceWarehouseId: existingInventory.warehouseId, productId: existingInventory.productId },
          { targetWarehouseId: existingInventory.warehouseId, productId: existingInventory.productId },
        ],
      },
      take: 1,
    });

    if (transactions.length > 0) {
      throw new ErrorUtils.BusinessLogicError(
        "该库存记录有相关的库存事务记录，无法删除",
        { id, transactionCount: transactions.length },
        "inventory-management"
      );
    }

    // 使用类型安全的包装函数删除库存
    await prisma.inventoryItem.delete({
      where: { id },
    });

    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "inventory-management");
    throw appError;
  }
}

/**
 * 库存转移
 *
 * 将产品从一个仓库转移到另一个仓库，并记录库存转移事务。
 *
 * @param data - 库存转移数据
 * @returns 操作结果
 *
 * @example
 * ```typescript
 * // 将产品ID为1的10个单位从仓库1转移到仓库2
 * const result = await transferInventory({
 *   productId: 1,
 *   quantity: 10,
 *   fromLocationId: 1,
 *   toLocationId: 2,
 *   notes: '季度库存调整'
 * });
 * console.log(result.success); // 输出: true
 * ```
 *
 * @throws 如果源仓库库存不足或转移失败，会抛出错误
 *
 * @category 修改
 */
export async function transferInventory(data: InventoryTransferInput): Promise<{ success: boolean }> {
  try {
    // 验证数据
    const validation = validateInventoryTransfer(data);
    if (!validation.isValid) {
      throw new ErrorUtils.ValidationError(validation.errors.join("; "), { data }, "inventory-management");
    }

    const productId = Number(data.productId);
    const quantity = Number(data.quantity);
    const fromLocationId = Number(data.fromLocationId);
    const toLocationId = data.toLocationId ? Number(data.toLocationId) : null;

    // 检查源仓库是否存在
    const sourceWarehouse = await prisma.warehouse.findUnique({
      where: { id: fromLocationId },
    });

    if (!sourceWarehouse) {
      throw new ErrorUtils.NotFoundError("源仓库不存在", { fromLocationId }, "inventory-management");
    }

    // 如果指定了目标仓库，检查目标仓库是否存在
    if (toLocationId) {
      const targetWarehouse = await prisma.warehouse.findUnique({
        where: { id: toLocationId },
      });

      if (!targetWarehouse) {
        throw new ErrorUtils.NotFoundError("目标仓库不存在", { toLocationId }, "inventory-management");
      }
    }

    // 检查产品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ErrorUtils.NotFoundError("产品不存在", { productId }, "inventory-management");
    }

    // 检查源仓库库存是否足够
    const sourceInventory = await prisma.inventoryItem.findFirst({
      where: {
        productId,
        warehouseId: fromLocationId,
      },
    });

    if (!sourceInventory) {
      throw new ErrorUtils.BusinessLogicError(
        "源仓库没有该产品的库存",
        { productId, fromLocationId },
        "inventory-management"
      );
    }

    if (sourceInventory.quantity < quantity) {
      throw new ErrorUtils.BusinessLogicError(
        "源仓库库存不足",
        {
          productId,
          fromLocationId,
          requiredQuantity: quantity,
          availableQuantity: sourceInventory.quantity
        },
        "inventory-management"
      );
    }

    // 检查目标仓库是否已有该产品的库存
    let targetInventory = await prisma.inventoryItem.findFirst({
      where: {
        productId,
        warehouseId: toLocationId,
      },
    });

    // 开始事务
    await prisma.$transaction(async (tx) => {
      // 减少源仓库库存
      await tx.inventoryItem.update({
        where: { id: sourceInventory.id },
        data: {
          quantity: sourceInventory.quantity - quantity,
        },
      });

      // 增加目标仓库库存
      if (targetInventory) {
        await tx.inventoryItem.update({
          where: { id: targetInventory.id },
          data: {
            quantity: targetInventory.quantity + quantity,
          },
        });
      } else if (toLocationId) {
        targetInventory = await tx.inventoryItem.create({
          data: {
            productId,
            quantity,
            warehouseId: toLocationId,
          },
        });
      }

      // 记录库存转移
      await tx.inventoryTransaction.create({
        data: {
          productId,
          quantity: -quantity,
          type: "transfer_out",
          notes: data.notes || `转出到仓库 ${toLocationId || "未指定"}`,
          sourceWarehouseId: fromLocationId,
        },
      });

      if (toLocationId) {
        await tx.inventoryTransaction.create({
          data: {
            productId,
            quantity,
            type: "transfer_in",
            notes: data.notes || `从仓库 ${fromLocationId} 转入`,
            targetWarehouseId: toLocationId,
          },
        });
      }
    });

    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "inventory-management");
    throw appError;
  }
}

/**
 * 批量库存转移
 *
 * 批量转移库存，支持从Excel或CSV文件导入的数据。
 *
 * @param data - 批量转移数据数组
 * @returns 转移结果数组
 *
 * @example
 * ```typescript
 * // 批量转移库存
 * const results = await batchTransferInventory([
 *   { productId: 1, quantity: 10, fromLocationId: 1, toLocationId: 2 },
 *   { productId: 2, quantity: 5, fromLocationId: 1, toLocationId: 2 }
 * ]);
 * console.log(results[0].status); // 输出: "success" 或 "error"
 * ```
 *
 * @throws 如果批量转移失败，会抛出错误
 *
 * @category 修改
 */
export async function batchTransferInventory(data: any[]): Promise<any[]> {
  try {
    // 验证数据
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new ErrorUtils.ValidationError("转移数据为空或格式不正确", { data }, "inventory-management");
    }

    const results = [];

    for (const item of data) {
      try {
        // 验证必填字段
        if (!item.productId || !item.quantity || !item.fromLocationId) {
          results.push({
            productId: item.productId || "未知",
            status: "error",
            message: "产品ID、数量和源位置为必填项",
          });
          continue;
        }

        const productId = Number(item.productId);
        const quantity = Number(item.quantity);
        const fromLocationId = Number(item.fromLocationId);
        const toLocationId = item.toLocationId ? Number(item.toLocationId) : null;
        const notes = item.notes || "批量转移";

        // 检查产品是否存在
        const product = await prisma.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          results.push({
            productId,
            status: "error",
            message: "产品不存在",
          });
          continue;
        }

        // 检查源仓库是否存在
        const sourceWarehouse = await prisma.warehouse.findUnique({
          where: { id: fromLocationId },
        });

        if (!sourceWarehouse) {
          results.push({
            productId,
            status: "error",
            message: "源仓库不存在",
          });
          continue;
        }

        // 如果指定了目标仓库，检查目标仓库是否存在
        if (toLocationId) {
          const targetWarehouse = await prisma.warehouse.findUnique({
            where: { id: toLocationId },
          });

          if (!targetWarehouse) {
            results.push({
              productId,
              status: "error",
              message: "目标仓库不存在",
            });
            continue;
          }
        }

        // 检查源仓库库存是否足够
        const sourceInventory = await prisma.inventoryItem.findFirst({
          where: {
            productId,
            warehouseId: fromLocationId,
          },
        });

        if (!sourceInventory) {
          results.push({
            productId,
            status: "error",
            message: "源仓库没有该产品的库存",
            details: {
              productName: product.name,
              fromWarehouse: sourceWarehouse.name,
            }
          });
          continue;
        }

        if (sourceInventory.quantity < quantity) {
          results.push({
            productId,
            status: "error",
            message: "源仓库库存不足",
            details: {
              productName: product.name,
              fromWarehouse: sourceWarehouse.name,
              requiredQuantity: quantity,
              availableQuantity: sourceInventory.quantity,
            }
          });
          continue;
        }

        // 检查目标仓库是否已有该产品的库存
        let targetInventory = await prisma.inventoryItem.findFirst({
          where: {
            productId,
            warehouseId: toLocationId,
          },
        });

        // 开始事务
        await prisma.$transaction(async (tx) => {
          // 减少源仓库库存
          await tx.inventoryItem.update({
            where: { id: sourceInventory.id },
            data: {
              quantity: sourceInventory.quantity - quantity,
            },
          });

          // 增加目标仓库库存
          if (targetInventory) {
            await tx.inventoryItem.update({
              where: { id: targetInventory.id },
              data: {
                quantity: targetInventory.quantity + quantity,
              },
            });
          } else if (toLocationId) {
            targetInventory = await tx.inventoryItem.create({
              data: {
                productId,
                quantity,
                warehouseId: toLocationId,
              },
            });
          }

          // 记录库存转移
          await tx.inventoryTransaction.create({
            data: {
              productId,
              quantity: -quantity,
              type: "transfer_out",
              notes: `${notes} - 转出到仓库 ${toLocationId || "未指定"}`,
              sourceWarehouseId: fromLocationId,
            },
          });

          if (toLocationId) {
            await tx.inventoryTransaction.create({
              data: {
                productId,
                quantity,
                type: "transfer_in",
                notes: `${notes} - 从仓库 ${fromLocationId} 转入`,
                targetWarehouseId: toLocationId,
              },
            });
          }
        });

        // 添加成功结果
        results.push({
          productId,
          status: "success",
          message: "库存转移成功",
          details: {
            productName: product.name,
            fromWarehouse: sourceWarehouse.name,
            toWarehouse: toLocationId ? (await prisma.warehouse.findUnique({ where: { id: toLocationId } }))?.name : "未指定",
            quantity,
          }
        });
      } catch (error) {
        // 记录单个项目的错误，但继续处理其他项目
        results.push({
          productId: item.productId || "未知",
          status: "error",
          message: error instanceof Error ? error.message : "库存转移失败",
        });
      }
    }

    revalidatePath("/inventory");
    return results;
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "inventory-management");
    throw appError;
  }
}

/**
 * 获取库存事务
 *
 * 获取库存事务记录，支持按仓库、产品、类型筛选，并支持分页。
 *
 * @param warehouseId - 可选的仓库ID，用于筛选特定仓库的事务
 * @param productId - 可选的产品ID，用于筛选特定产品的事务
 * @param type - 可选的事务类型，用于筛选特定类型的事务
 * @param limit - 可选的每页记录数，默认为10
 * @param offset - 可选的偏移量，用于分页，默认为0
 * @param startDate - 可选的开始日期，用于筛选特定日期范围的事务
 * @param endDate - 可选的结束日期，用于筛选特定日期范围的事务
 * @returns 事务记录列表和总记录数
 *
 * @example
 * ```typescript
 * // 获取所有库存事务
 * const { data, total } = await getInventoryTransactions();
 * console.log(data[0].type); // 输出第一个事务的类型
 * console.log(total); // 输出总记录数
 * ```
 *
 * @throws 如果获取事务记录失败，会抛出错误
 *
 * @category 查询
 */
/**
 * 获取库存趋势数据
 *
 * 获取指定时间范围内的库存变化趋势数据，包括入库、出库和库存总量。
 *
 * @param period - 时间周期，可以是'week'、'month'、'quarter'或'year'
 * @param warehouseId - 可选的仓库ID，用于筛选特定仓库的趋势
 * @param productId - 可选的产品ID，用于筛选特定产品的趋势
 * @returns 趋势数据，包含时间点、入库量、出库量和库存量
 *
 * @example
 * ```typescript
 * // 获取最近一个月的库存趋势
 * const trends = await getInventoryTrends('month');
 * console.log(trends[0].date); // 输出第一个时间点
 * console.log(trends[0].inflow); // 输出第一个时间点的入库量
 * ```
 *
 * @throws 如果获取趋势数据失败，会抛出错误
 *
 * @category 查询
 */
export async function getInventoryTrends(
  period: 'week' | 'month' | 'quarter' | 'year' = 'month',
  warehouseId?: number,
  productId?: number
): Promise<any[]> {
  try {
    // 确定时间范围
    const now = new Date();
    let startDate: Date;
    let groupByFormat: string;
    let intervalUnit: 'day' | 'week' | 'month';

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        groupByFormat = 'YYYY-MM-DD';
        intervalUnit = 'day';
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        groupByFormat = 'YYYY-MM-DD';
        intervalUnit = 'day';
        break;
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        groupByFormat = 'YYYY-MM-WW';
        intervalUnit = 'week';
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        groupByFormat = 'YYYY-MM';
        intervalUnit = 'month';
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        groupByFormat = 'YYYY-MM-DD';
        intervalUnit = 'day';
    }

    // 构建查询条件
    let whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: now
      }
    };

    if (productId) {
      whereClause.productId = Number(productId);
    }

    if (warehouseId) {
      whereClause.OR = [
        { sourceWarehouseId: Number(warehouseId) },
        { targetWarehouseId: Number(warehouseId) }
      ];
    }

    // 获取库存事务记录
    const transactions = await prisma.inventoryTransaction.findMany({
      where: whereClause,
      include: {
        product: true,
        sourceWarehouse: true,
        targetWarehouse: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 生成时间点数组
    const timePoints = [];
    let currentDate = new Date(startDate);

    while (currentDate <= now) {
      let timePoint;

      switch (intervalUnit) {
        case 'day':
          timePoint = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'week':
          const year = currentDate.getFullYear();
          const weekNumber = Math.ceil((currentDate.getDate() +
            new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()) / 7);
          timePoint = `${year}-W${weekNumber}`;
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'month':
          timePoint = currentDate.toISOString().slice(0, 7); // YYYY-MM
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }

      timePoints.push({
        timePoint,
        date: new Date(currentDate).toISOString().split('T')[0],
        inflow: 0,
        outflow: 0,
        inventory: 0
      });
    }

    // 计算每个时间点的入库和出库量
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      let timePoint;

      switch (intervalUnit) {
        case 'day':
          timePoint = transactionDate.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week':
          const year = transactionDate.getFullYear();
          const weekNumber = Math.ceil((transactionDate.getDate() +
            new Date(transactionDate.getFullYear(), transactionDate.getMonth(), 1).getDay()) / 7);
          timePoint = `${year}-W${weekNumber}`;
          break;
        case 'month':
          timePoint = transactionDate.toISOString().slice(0, 7); // YYYY-MM
          break;
      }

      const pointIndex = timePoints.findIndex(point => point.timePoint === timePoint);
      if (pointIndex !== -1) {
        // 根据事务类型计算入库和出库量
        if (['initial', 'import', 'adjustment', 'transfer_in'].includes(transaction.type)) {
          if (transaction.quantity > 0) {
            timePoints[pointIndex].inflow += transaction.quantity;
          } else {
            timePoints[pointIndex].outflow += Math.abs(transaction.quantity);
          }
        } else if (['transfer_out', 'batch_adjustment'].includes(transaction.type)) {
          if (transaction.quantity < 0) {
            timePoints[pointIndex].outflow += Math.abs(transaction.quantity);
          } else {
            timePoints[pointIndex].inflow += transaction.quantity;
          }
        }
      }
    });

    // 计算每个时间点的库存量（累计）
    let runningInventory = 0;

    // 获取初始库存量
    if (productId) {
      // 如果指定了产品，获取该产品的初始库存
      const initialInventory = await prisma.inventoryItem.findMany({
        where: {
          productId: Number(productId),
          ...(warehouseId ? { warehouseId: Number(warehouseId) } : {})
        },
        select: {
          quantity: true
        }
      });

      runningInventory = initialInventory.reduce((sum, item) => sum + item.quantity, 0);
    } else {
      // 否则获取所有产品的初始库存
      const initialInventory = await prisma.inventoryItem.findMany({
        where: warehouseId ? { warehouseId: Number(warehouseId) } : {},
        select: {
          quantity: true
        }
      });

      runningInventory = initialInventory.reduce((sum, item) => sum + item.quantity, 0);
    }

    // 调整初始库存，减去时间范围内的所有变动
    const totalInflow = timePoints.reduce((sum, point) => sum + point.inflow, 0);
    const totalOutflow = timePoints.reduce((sum, point) => sum + point.outflow, 0);
    runningInventory = runningInventory - totalInflow + totalOutflow;

    // 计算每个时间点的累计库存
    for (let i = 0; i < timePoints.length; i++) {
      runningInventory = runningInventory + timePoints[i].inflow - timePoints[i].outflow;
      timePoints[i].inventory = runningInventory;
    }

    // 格式化返回数据
    return timePoints.map(point => ({
      date: point.date,
      入库: point.inflow,
      出库: point.outflow,
      库存: point.inventory
    }));
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "inventory-management");
    throw appError;
  }
}

export async function getInventoryTransactions(
  warehouseId?: number,
  productId?: number,
  type?: string,
  limit: number = 10,
  offset: number = 0,
  startDate?: string,
  endDate?: string
): Promise<{ data: any[], total: number }> {
  try {
    // 构建查询条件
    let whereClause: any = {};

    if (productId) {
      whereClause.productId = Number(productId);
    }

    if (type) {
      whereClause.type = type;
    }

    if (warehouseId) {
      whereClause.OR = [
        { sourceWarehouseId: Number(warehouseId) },
        { targetWarehouseId: Number(warehouseId) }
      ];
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.createdAt = {
        lte: new Date(endDate),
      };
    }

    // 获取总记录数
    const total = await prisma.inventoryTransaction.count({
      where: whereClause,
    });

    // 获取库存事务
    const transactions = await prisma.inventoryTransaction.findMany({
      where: whereClause,
      include: {
        product: true,
        sourceWarehouse: true,
        targetWarehouse: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limit,
    });

    return {
      data: transactions,
      total,
    };
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "inventory-management");
    throw appError;
  }
}

/**
 * 获取仓库
 *
 * 获取所有仓库信息，包括每个仓库的库存项数量。
 *
 * @returns 仓库列表，包含库存项数量
 *
 * @example
 * ```typescript
 * // 获取所有仓库
 * const warehouses = await getWarehouses();
 * console.log(warehouses[0].name); // 输出第一个仓库的名称
 * console.log(warehouses[0].inventoryCount); // 输出第一个仓库的库存项数量
 * ```
 *
 * @throws 如果获取仓库失败，会抛出错误
 *
 * @category 查询
 */
export async function getWarehouses() {
  return getInventoryLocations();
}

/**
 * 获取仓库
 */
export async function getInventoryLocations() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        _count: {
          select: {
            inventoryItems: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    return warehouses.map(warehouse => ({
      ...warehouse,
      inventoryCount: warehouse._count.inventoryItems,
    }));
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "inventory-management");
    throw appError;
  }
}

/**
 * 创建仓库
 *
 * 创建新的仓库。
 *
 * @param data - 仓库创建数据
 * @returns 创建的仓库
 *
 * @example
 * ```typescript
 * // 创建新仓库
 * const warehouse = await createWarehouse({
 *   name: "主仓库",
 *   type: "physical",
 *   description: "主要存储仓库"
 * });
 * console.log(warehouse.id); // 输出新创建的仓库ID
 * ```
 *
 * @throws 如果仓库已存在或创建失败，会抛出错误
 *
 * @category 创建
 */
export async function createWarehouse(data: any) {
  return createInventoryLocation(data);
}

/**
 * 创建仓库
 */
export async function createInventoryLocation(data: any) {
  try {
    // 验证必填字段
    if (!data.name) {
      throw new ErrorUtils.ValidationError("仓库名称为必填项", { data }, "inventory-management");
    }

    // 检查仓库是否已存在
    const existingWarehouse = await prisma.warehouse.findFirst({
      where: {
        name: data.name,
      },
    });

    if (existingWarehouse) {
      throw new ErrorUtils.BusinessLogicError("仓库已存在", { name: data.name }, "inventory-management");
    }

    // 创建仓库
    const warehouse = await prisma.warehouse.create({
      data: {
        name: data.name,
        type: data.type || "physical",
        location: data.location || null,
        description: data.description || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    revalidatePath("/inventory/locations");
    return warehouse;
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "inventory-management");
    throw appError;
  }
}

/**
 * 更新仓库
 *
 * 更新现有仓库的信息。
 *
 * @param id - 仓库ID
 * @param data - 仓库更新数据
 * @returns 更新后的仓库
 *
 * @example
 * ```typescript
 * // 更新仓库ID为1的信息
 * const warehouse = await updateWarehouse(1, {
 *   name: "新仓库名称",
 *   isActive: false
 * });
 * console.log(warehouse.name); // 输出: "新仓库名称"
 * ```
 *
 * @throws 如果仓库不存在或更新失败，会抛出错误
 *
 * @category 修改
 */
export async function updateWarehouse(id: number, data: any) {
  return updateInventoryLocation(id, data);
}

/**
 * 更新仓库
 */
export async function updateInventoryLocation(id: number, data: any) {
  try {
    // 检查仓库是否存在
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id },
    });

    if (!existingWarehouse) {
      throw new ErrorUtils.NotFoundError("仓库不存在", { id }, "inventory-management");
    }

    // 如果更改了名称，检查是否已存在
    if (data.name && data.name !== existingWarehouse.name) {
      const duplicateWarehouse = await prisma.warehouse.findFirst({
        where: {
          name: data.name,
          NOT: {
            id,
          },
        },
      });

      if (duplicateWarehouse) {
        throw new ErrorUtils.BusinessLogicError("仓库名称已存在", { name: data.name }, "inventory-management");
      }
    }

    // 更新仓库
    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : existingWarehouse.name,
        type: data.type !== undefined ? data.type : existingWarehouse.type,
        location: data.location !== undefined ? data.location : existingWarehouse.location,
        description: data.description !== undefined ? data.description : existingWarehouse.description,
        isActive: data.isActive !== undefined ? data.isActive : existingWarehouse.isActive,
      },
    });

    revalidatePath("/inventory/locations");
    return warehouse;
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "inventory-management");
    throw appError;
  }
}

/**
 * 删除仓库
 *
 * 删除仓库。如果仓库有库存记录，则无法删除。
 *
 * @param id - 仓库ID
 * @returns 操作结果，包含成功标志
 *
 * @example
 * ```typescript
 * // 删除ID为1的仓库
 * const result = await deleteWarehouse(1);
 * if (result.success) {
 *   console.log('仓库删除成功');
 * }
 * ```
 *
 * @throws 如果仓库不存在、有库存记录或删除失败，会抛出错误
 *
 * @category 删除
 */
export async function deleteWarehouse(id: number) {
  return deleteInventoryLocation(id);
}

/**
 * 删除仓库
 */
export async function deleteInventoryLocation(id: number) {
  try {
    // 检查仓库是否存在
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            inventoryItems: true,
          },
        },
      },
    });

    if (!existingWarehouse) {
      throw new ErrorUtils.NotFoundError("仓库不存在", { id }, "inventory-management");
    }

    // 检查仓库是否有库存
    if (existingWarehouse._count.inventoryItems > 0) {
      throw new ErrorUtils.BusinessLogicError(
        "仓库有库存记录，无法删除",
        { id, inventoryCount: existingWarehouse._count.inventoryItems },
        "inventory-management"
      );
    }

    // 检查仓库是否有相关的库存事务记录
    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        OR: [
          { sourceWarehouseId: id },
          { targetWarehouseId: id },
        ],
      },
      take: 1,
    });

    if (transactions.length > 0) {
      throw new ErrorUtils.BusinessLogicError(
        "仓库有相关的库存事务记录，无法删除",
        { id, transactionCount: transactions.length },
        "inventory-management"
      );
    }

    // 删除仓库
    await prisma.warehouse.delete({
      where: { id },
    });

    revalidatePath("/inventory/locations");
    return { success: true };
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "inventory-management");
    throw appError;
  }
}

/**
 * 导出库存数据
 *
 * 导出库存数据为指定格式。
 *
 * @param format - 导出格式，支持 'csv' 和 'json'
 * @param warehouseId - 可选的仓库ID，用于筛选特定仓库的库存
 * @returns 导出的数据和文件名
 *
 * @example
 * ```typescript
 * // 导出所有库存为CSV格式
 * const { data, filename } = await exportInventory('csv');
 * console.log(filename); // 输出: "inventory_export_2023-01-01.csv"
 * ```
 *
 * @throws 如果导出失败，会抛出错误
 *
 * @category 导出
 */
export async function exportInventory(format: 'csv' | 'json' = 'csv', warehouseId?: number): Promise<{ data: string, filename: string }> {
  try {
    // 验证格式
    if (!['csv', 'json'].includes(format)) {
      throw new ErrorUtils.ValidationError("导出格式无效，支持的格式为 'csv' 和 'json'", { format }, "inventory-management");
    }

    // 如果指定了仓库ID，检查仓库是否存在
    if (warehouseId) {
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: Number(warehouseId) },
      });

      if (!warehouse) {
        throw new ErrorUtils.NotFoundError("仓库不存在", { warehouseId }, "inventory-management");
      }
    }

    // 构建查询条件
    const whereClause: any = {};
    if (warehouseId) {
      whereClause.warehouseId = Number(warehouseId);
    }

    // 获取库存数据
    const inventory = await prisma.inventoryItem.findMany({
      where: whereClause,
      include: {
        product: true,
        warehouse: true,
      },
      orderBy: [
        { warehouseId: 'asc' },
        { productId: 'asc' },
      ],
    });

    // 格式化数据
    const formattedData = inventory.map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productSku: item.product.sku || '',
      warehouseId: item.warehouseId,
      warehouseName: item.warehouse?.name || '未分配',
      quantity: item.quantity,
      minQuantity: item.minQuantity || 0,
      updatedAt: item.updatedAt.toISOString(),
    }));

    // 生成文件名
    const date = new Date().toISOString().split('T')[0];
    const warehouseInfo = warehouseId ? `_warehouse${warehouseId}` : '';
    const filename = `inventory_export${warehouseInfo}_${date}.${format}`;

    // 根据格式导出数据
    if (format === 'json') {
      return {
        data: JSON.stringify(formattedData, null, 2),
        filename,
      };
    } else {
      // CSV格式
      const headers = ['ID', '产品ID', '产品名称', 'SKU', '仓库ID', '仓库名称', '数量', '最小库存', '更新时间'];
      const rows = formattedData.map(item => [
        item.id,
        item.productId,
        item.productName,
        item.productSku,
        item.warehouseId,
        item.warehouseName,
        item.quantity,
        item.minQuantity,
        item.updatedAt,
      ]);

      // 构建CSV内容
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      return {
        data: csvContent,
        filename,
      };
    }
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "inventory-management");
    throw appError;
  }
}

/**
 * 导入库存数据
 *
 * 从CSV或JSON文件导入库存数据。
 *
 * @param data - 导入数据
 * @param options - 导入选项
 * @returns 导入结果
 *
 * @example
 * ```typescript
 * // 导入库存数据
 * const result = await importInventory({
 *   items: [{ productId: 1, quantity: 10, warehouseId: 1 }],
 *   updateMode: 'merge',
 *   warehouseId: 1
 * });
 * console.log(result.success); // 输出: true
 * console.log(result.imported); // 输出: 1
 * ```
 *
 * @throws 如果导入失败，会抛出错误
 *
 * @category 导入
 */
export async function importInventory(data: {
  items: any[],
  updateMode?: 'replace' | 'merge' | 'add',
  warehouseId?: number,
  notes?: string
}): Promise<{ success: boolean, imported: number, errors: any[], results: any[] }> {
  try {
    const { items, updateMode = 'merge', warehouseId, notes = '通过导入更新库存' } = data;
    const results = [];
    const errors = [];
    let imported = 0;

    // 验证数据
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new ErrorUtils.ValidationError("导入数据为空或格式不正确", { data }, "inventory-management");
    }

    // 处理每个导入项
    for (const item of items) {
      try {
        // 验证必填字段
        if (!item.productId) {
          errors.push({ item, error: "产品ID为必填项" });
          continue;
        }

        const productId = Number(item.productId);
        const quantity = Number(item.quantity || 0);
        const itemWarehouseId = item.warehouseId ? Number(item.warehouseId) : warehouseId;

        // 检查产品是否存在
        const product = await prisma.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          errors.push({
            item,
            error: "产品不存在",
            details: { productId }
          });
          continue;
        }

        // 检查仓库是否存在
        if (itemWarehouseId) {
          const warehouse = await prisma.warehouse.findUnique({
            where: { id: itemWarehouseId },
          });

          if (!warehouse) {
            errors.push({
              item,
              error: "仓库不存在",
              details: { warehouseId: itemWarehouseId }
            });
            continue;
          }
        } else {
          // 如果没有指定仓库，尝试使用默认仓库
          const defaultWarehouse = await prisma.warehouse.findFirst({
            where: { isDefault: true },
          });

          if (!defaultWarehouse) {
            errors.push({
              item,
              error: "未指定仓库且系统没有默认仓库",
              details: { productId }
            });
            continue;
          }
        }

        // 检查是否已存在该产品的库存记录
        const existingInventory = await prisma.inventoryItem.findFirst({
          where: {
            productId,
            warehouseId: itemWarehouseId,
          },
        });

        // 根据更新模式处理库存
        if (existingInventory) {
          let newQuantity = quantity;

          if (updateMode === 'merge') {
            newQuantity = existingInventory.quantity + quantity;
          } else if (updateMode === 'add') {
            newQuantity = existingInventory.quantity + Math.abs(quantity);
          }

          // 更新库存
          await prisma.inventoryItem.update({
            where: { id: existingInventory.id },
            data: {
              quantity: newQuantity,
              minQuantity: item.minQuantity ? Number(item.minQuantity) : existingInventory.minQuantity,
            },
          });

          // 记录库存变更
          await prisma.inventoryTransaction.create({
            data: {
              productId,
              quantity: newQuantity - existingInventory.quantity,
              type: "import",
              notes: `${notes} (${updateMode})`,
              targetWarehouseId: itemWarehouseId,
            },
          });

          results.push({
            productId,
            productName: product.name,
            status: "updated",
            oldQuantity: existingInventory.quantity,
            newQuantity,
            warehouseId: itemWarehouseId,
          });
        } else {
          // 创建新的库存记录
          const newInventory = await prisma.inventoryItem.create({
            data: {
              productId,
              quantity,
              warehouseId: itemWarehouseId,
              minQuantity: item.minQuantity ? Number(item.minQuantity) : null,
            },
          });

          // 记录库存变更
          await prisma.inventoryTransaction.create({
            data: {
              productId,
              quantity,
              type: "import",
              notes: `${notes} (新建)`,
              targetWarehouseId: itemWarehouseId,
            },
          });

          results.push({
            productId,
            productName: product.name,
            status: "created",
            quantity,
            warehouseId: itemWarehouseId,
            inventoryId: newInventory.id
          });
        }

        imported++;
      } catch (itemError) {
        errors.push({
          item,
          error: itemError instanceof Error ? itemError.message : "处理导入项时出错",
        });
      }
    }

    revalidatePath("/inventory");
    return { success: true, imported, errors, results };
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "inventory-management");
    throw appError;
  }
}

/**
 * 批量更新库存
 *
 * 批量更新库存记录。
 *
 * @param data - 批量更新数据
 * @returns 操作结果，包含成功标志和更新数量
 *
 * @example
 * ```typescript
 * // 批量增加库存
 * const result = await updateInventory({
 *   batchUpdate: true,
 *   inventoryIds: [1, 2, 3],
 *   actionType: 'add',
 *   quantity: 5,
 *   notes: '批量补货'
 * });
 * console.log(result.success); // 输出: true
 * console.log(result.updated); // 输出: 3
 * ```
 *
 * @throws 如果更新失败，会抛出错误
 *
 * @category 修改
 */
async function batchUpdateInventory(data: {
  batchUpdate: true,
  inventoryIds: number[],
  actionType: 'add' | 'subtract' | 'set',
  quantity: number,
  notes?: string,
  warehouseId?: number
}): Promise<{ success: boolean, updated: number }> {
  try {
    // 验证数据
    if (!data.inventoryIds || !Array.isArray(data.inventoryIds) || data.inventoryIds.length === 0) {
      throw new ErrorUtils.ValidationError("库存项ID列表为空", { data }, "inventory-management");
    }

    if (data.quantity === undefined || data.quantity < 0) {
      throw new ErrorUtils.ValidationError("数量必须是非负数", { data }, "inventory-management");
    }

    if (!['add', 'subtract', 'set'].includes(data.actionType)) {
      throw new ErrorUtils.ValidationError("操作类型无效", { data }, "inventory-management");
    }

    // 获取库存记录
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        id: { in: data.inventoryIds },
      },
    });

    if (inventoryItems.length === 0) {
      throw new ErrorUtils.NotFoundError("未找到指定的库存记录", { ids: data.inventoryIds }, "inventory-management");
    }

    // 批量更新库存
    let updated = 0;
    for (const item of inventoryItems) {
      let newQuantity = item.quantity;

      // 根据操作类型计算新数量
      switch (data.actionType) {
        case 'add':
          newQuantity = item.quantity + data.quantity;
          break;
        case 'subtract':
          newQuantity = Math.max(0, item.quantity - data.quantity);
          break;
        case 'set':
          newQuantity = data.quantity;
          break;
      }

      // 只有数量变化时才更新
      if (newQuantity !== item.quantity) {
        // 更新库存
        await prisma.inventoryItem.update({
          where: { id: item.id },
          data: { quantity: newQuantity },
        });

        // 记录库存变更
        await prisma.inventoryTransaction.create({
          data: {
            productId: item.productId,
            quantity: newQuantity - item.quantity,
            type: "batch_adjustment",
            notes: data.notes || `批量${data.actionType === 'add' ? '增加' : data.actionType === 'subtract' ? '减少' : '设置'}库存`,
            sourceWarehouseId: item.warehouseId,
          },
        });

        updated++;
      }
    }

    revalidatePath("/inventory");
    return { success: true, updated };
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "inventory-management");
    throw appError;
  }
}

/**
 * 批量删除库存
 *
 * 批量删除库存记录。
 *
 * @param ids - 库存项ID数组
 * @returns 操作结果，包含成功标志和删除数量
 *
 * @example
 * ```typescript
 * // 批量删除库存记录
 * const result = await batchDeleteInventory([1, 2, 3]);
 * console.log(result.success); // 输出: true
 * console.log(result.deleted); // 输出: 3
 * ```
 *
 * @throws 如果删除失败，会抛出错误
 *
 * @category 删除
 */
export async function batchDeleteInventory(ids: number[]): Promise<{ success: boolean, deleted: number }> {
  try {
    // 验证数据
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ErrorUtils.ValidationError("库存项ID列表为空", { ids }, "inventory-management");
    }

    // 检查是否有相关的库存事务记录
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        id: { in: ids },
      },
    });

    if (inventoryItems.length === 0) {
      throw new ErrorUtils.NotFoundError("未找到指定的库存记录", { ids }, "inventory-management");
    }

    // 检查每个库存项是否有相关的库存事务记录
    const itemsWithTransactions = [];
    for (const item of inventoryItems) {
      const transactions = await prisma.inventoryTransaction.findMany({
        where: {
          OR: [
            { sourceWarehouseId: item.warehouseId, productId: item.productId },
            { targetWarehouseId: item.warehouseId, productId: item.productId },
          ],
        },
        take: 1,
      });

      if (transactions.length > 0) {
        itemsWithTransactions.push(item.id);
      }
    }

    if (itemsWithTransactions.length > 0) {
      throw new ErrorUtils.BusinessLogicError(
        `以下库存记录有相关的库存事务记录，无法删除: ${itemsWithTransactions.join(', ')}`,
        { itemsWithTransactions },
        "inventory-management"
      );
    }

    // 批量删除库存记录
    const result = await prisma.inventoryItem.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    revalidatePath("/inventory");
    return { success: true, deleted: result.count };
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "inventory-management");
    throw appError;
  }
}

/**
 * 获取产品库存变更历史
 *
 * 获取指定产品的所有库存变更记录，包括变更类型、数量、时间等信息。
 *
 * @param productId - 产品ID
 * @returns 库存变更记录列表
 *
 * @category 查询
 */
export async function getInventoryHistory(productId: number) {
  try {
    // 首先检查产品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`产品不存在 (ID: ${productId})`);
    }

    // 获取库存事务记录
    const transactions = await prisma.inventoryTransaction.findMany({
      where: { productId },
      include: {
        product: {
          select: {
            name: true,
          },
        },
        sourceWarehouse: {
          select: {
            name: true,
          },
        },
        targetWarehouse: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 如果没有找到任何事务记录，创建一个初始记录
    if (transactions.length === 0 && product.inventory !== undefined && product.inventory !== null) {
      // 返回一个模拟的初始库存记录
      return [{
        id: 0,
        productId,
        quantity: product.inventory,
        type: "initial",
        notes: "初始库存",
        sourceWarehouseId: null,
        targetWarehouseId: null,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        product: {
          name: product.name
        },
        sourceWarehouse: null,
        targetWarehouse: null
      }];
    }

    return transactions;
  } catch (error) {
    console.error("Error fetching inventory history:", error);
    throw new Error("Failed to fetch inventory history");
  }
}

/**
 * 获取库存汇总信息
 * @returns 库存汇总数据
 */
export async function getInventorySummary() {
  try {
    // 获取总产品数
    const totalProducts = await prisma.product.count();

    // 获取有库存的产品数
    const productsWithInventory = await prisma.inventoryItem.count({
      distinct: ['productId'],
    });

    // 获取库存不足的产品数（库存小于最小库存）
    const lowStockProducts = await prisma.inventoryItem.count({
      where: {
        AND: [
          { minQuantity: { not: null } },
          { quantity: { lt: prisma.inventoryItem.fields.minQuantity } }
        ]
      }
    });

    // 获取总库存价值
    const inventoryValue = await prisma.inventoryItem.findMany({
      include: {
        product: true,
      },
    });

    const totalValue = inventoryValue.reduce((sum, item) => {
      const price = item.product.price || 0;
      return sum + (price * item.quantity);
    }, 0);

    // 获取仓库数量
    const totalWarehouses = await prisma.warehouse.count();

    return {
      totalProducts,
      productsWithInventory,
      lowStockProducts,
      totalValue,
      totalWarehouses,
    };
  } catch (error) {
    console.error("Error getting inventory summary:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to get inventory summary");
  }
}