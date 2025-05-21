/**
 * 采购管理模块
 *
 * 本模块提供采购管理相关的功能，包括采购订单的增删改查、供应商管理等。
 *
 * @module 采购管理
 * @category 核心模块
 */

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  PrismaPurchaseOrder,
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  PrismaSupplier,
  CreateSupplierInput,
  UpdateSupplierInput
} from "@/types/prisma-models";
import {
  validateCreatePurchaseOrder,
  validateUpdatePurchaseOrder,
  validateCreateSupplier,
  validateUpdateSupplier
} from "@/lib/validation";
import { findRecord, findRecords, createRecord, updateRecord } from "@/lib/prisma-wrapper";

/**
 * 获取所有采购订单
 *
 * @param status 订单状态
 * @param supplierId 供应商ID
 * @param employeeId 员工ID
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @param limit 每页数量
 * @param offset 偏移量
 * @returns 采购订单列表和总数
 */
export async function getPurchaseOrders(
  status?: string,
  supplierId?: number,
  employeeId?: number,
  startDate?: string,
  endDate?: string,
  limit?: number,
  offset?: number
): Promise<{ data: PrismaPurchaseOrder[], total: number }> {
  try {
    // 构建查询条件
    let whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (supplierId) {
      whereClause.supplierId = supplierId;
    }

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (startDate && endDate) {
      whereClause.orderDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.orderDate = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.orderDate = {
        lte: new Date(endDate),
      };
    }

    // 获取总数
    const total = await prisma.purchaseOrder.count({
      where: whereClause,
    });

    // 构建查询选项
    const options: any = {
      where: whereClause,
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
        employee: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    };

    // 添加分页
    if (limit !== undefined) {
      options.take = limit;
    }

    if (offset !== undefined) {
      options.skip = offset;
    }

    // 使用类型安全的包装函数获取采购订单
    const orders = await findRecords('purchaseOrder', options);

    return {
      data: orders as PrismaPurchaseOrder[],
      total
    };
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    throw new Error("Failed to fetch purchase orders");
  }
}

/**
 * 获取单个采购订单
 *
 * @param id 订单ID
 * @returns 采购订单
 */
export async function getPurchaseOrder(id: number): Promise<PrismaPurchaseOrder> {
  try {
    // 使用类型安全的包装函数获取采购订单
    const order = await findRecord('purchaseOrder', id, {
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
        employee: true,
      },
    });

    if (!order) {
      throw new Error("订单不存在");
    }

    return order as PrismaPurchaseOrder;
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    throw new Error("Failed to fetch purchase order");
  }
}

/**
 * 创建采购订单
 *
 * @param data 订单数据
 * @returns 创建的订单
 */
export async function createPurchaseOrder(data: CreatePurchaseOrderInput): Promise<PrismaPurchaseOrder> {
  try {
    // 验证数据
    const validation = validateCreatePurchaseOrder(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    // 验证订单项
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error("订单项不能为空");
    }

    // 计算订单总金额
    let totalAmount = 0;
    for (const item of data.items) {
      if (!item.productId || !item.quantity || !item.price) {
        throw new Error("订单项缺少必要信息");
      }
      totalAmount += Number(item.price) * Number(item.quantity);
    }

    // 开始事务
    const result = await prisma.$transaction(async (tx) => {
      // 创建订单
      const order = await tx.purchaseOrder.create({
        data: {
          supplierId: data.supplierId ? Number(data.supplierId) : null,
          employeeId: data.employeeId ? Number(data.employeeId) : null,
          orderDate: data.orderDate instanceof Date ? data.orderDate : new Date(data.orderDate),
          expectedDate: data.expectedDate ? (data.expectedDate instanceof Date ? data.expectedDate : new Date(data.expectedDate)) : null,
          totalAmount,
          status: data.status || "pending",
          paymentStatus: data.paymentStatus || "unpaid",
          paymentMethod: data.paymentMethod || null,
          notes: data.notes || null,
        },
      });

      // 创建订单项
      for (const item of data.items) {
        await tx.purchaseOrderItem.create({
          data: {
            orderId: order.id,
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
            receivedQuantity: item.receivedQuantity ? Number(item.receivedQuantity) : 0,
            notes: item.notes || null,
          },
        });
      }

      return order;
    });

    revalidatePath("/purchases");
    return result as PrismaPurchaseOrder;
  } catch (error) {
    console.error("Error creating purchase order:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create purchase order");
  }
}

/**
 * 更新采购订单
 *
 * @param id 订单ID
 * @param data 订单数据
 * @returns 更新后的订单
 */
export async function updatePurchaseOrder(id: number, data: UpdatePurchaseOrderInput): Promise<PrismaPurchaseOrder> {
  try {
    // 验证数据
    const validation = validateUpdatePurchaseOrder(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    // 检查订单是否存在
    const existingOrder = await findRecord('purchaseOrder', id, {
      include: {
        items: true,
      },
    });

    if (!existingOrder) {
      throw new Error("订单不存在");
    }

    // 如果订单已完成或取消，不允许修改
    if (existingOrder.status === "completed" || existingOrder.status === "cancelled") {
      throw new Error("已完成或已取消的订单不能修改");
    }

    // 开始事务
    const result = await prisma.$transaction(async (tx) => {
      // 准备更新数据
      const updateData: any = {};

      // 只更新提供的字段
      if (data.supplierId !== undefined) updateData.supplierId = data.supplierId !== null ? Number(data.supplierId) : null;
      if (data.employeeId !== undefined) updateData.employeeId = data.employeeId !== null ? Number(data.employeeId) : null;
      if (data.orderDate !== undefined) updateData.orderDate = data.orderDate instanceof Date ? data.orderDate : new Date(data.orderDate);
      if (data.expectedDate !== undefined) updateData.expectedDate = data.expectedDate ? (data.expectedDate instanceof Date ? data.expectedDate : new Date(data.expectedDate)) : null;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
      if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
      if (data.notes !== undefined) updateData.notes = data.notes;

      // 更新订单基本信息
      const order = await tx.purchaseOrder.update({
        where: { id },
        data: updateData,
      });

      // 如果提供了订单项，更新订单项
      if (data.items && Array.isArray(data.items)) {
        // 删除现有订单项
        await tx.purchaseOrderItem.deleteMany({
          where: { orderId: id },
        });

        // 计算订单总金额
        let totalAmount = 0;

        // 创建新订单项
        for (const item of data.items) {
          if (!item.productId || !item.quantity || !item.price) {
            throw new Error("订单项缺少必要信息");
          }

          await tx.purchaseOrderItem.create({
            data: {
              orderId: id,
              productId: Number(item.productId),
              quantity: Number(item.quantity),
              price: Number(item.price),
              receivedQuantity: item.receivedQuantity ? Number(item.receivedQuantity) : 0,
              notes: item.notes || null,
            },
          });

          totalAmount += Number(item.price) * Number(item.quantity);
        }

        // 更新订单总金额
        await tx.purchaseOrder.update({
          where: { id },
          data: {
            totalAmount,
          },
        });
      }

      return order;
    });

    revalidatePath("/purchases");
    return result as PrismaPurchaseOrder;
  } catch (error) {
    console.error("Error updating purchase order:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update purchase order");
  }
}

/**
 * 取消采购订单
 *
 * @param id 订单ID
 * @returns 取消后的订单
 */
export async function cancelPurchaseOrder(id: number): Promise<PrismaPurchaseOrder> {
  try {
    // 检查订单是否存在
    const existingOrder = await findRecord('purchaseOrder', id);

    if (!existingOrder) {
      throw new Error("订单不存在");
    }

    // 如果订单已完成或已取消，不允许取消
    if (existingOrder.status === "completed" || existingOrder.status === "cancelled") {
      throw new Error("已完成或已取消的订单不能再次取消");
    }

    // 更新订单状态
    const order = await updateRecord('purchaseOrder', id, {
      status: "cancelled",
    });

    revalidatePath("/purchases");
    return order as PrismaPurchaseOrder;
  } catch (error) {
    console.error("Error cancelling purchase order:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to cancel purchase order");
  }
}

/**
 * 删除采购订单
 *
 * @param id 订单ID
 * @returns 删除结果
 */
export async function deletePurchaseOrder(id: number): Promise<{ success: boolean; message: string }> {
  try {
    // 检查订单是否存在
    const existingOrder = await findRecord('purchaseOrder', id);

    if (!existingOrder) {
      throw new Error("订单不存在");
    }

    // 开始事务
    await prisma.$transaction(async (tx) => {
      // 删除订单项
      await tx.purchaseOrderItem.deleteMany({
        where: { orderId: id },
      });

      // 删除订单
      await tx.purchaseOrder.delete({
        where: { id },
      });
    });

    revalidatePath("/purchases");
    return { success: true, message: "采购订单已删除" };
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "删除采购订单失败"
    };
  }
}

/**
 * 接收采购订单
 */
export async function receivePurchaseOrder(id: number, data: any) {
  try {
    // 检查订单是否存在
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!existingOrder) {
      throw new Error("订单不存在");
    }

    // 如果订单已完成或已取消，不允许接收
    if (existingOrder.status === "completed" || existingOrder.status === "cancelled") {
      throw new Error("已完成或已取消的订单不能接收");
    }

    // 验证接收数据
    if (!data.receivedItems || !Array.isArray(data.receivedItems) || data.receivedItems.length === 0) {
      throw new Error("接收项不能为空");
    }

    // 开始事务
    const result = await prisma.$transaction(async (tx) => {
      // 更新订单状态
      const order = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: "completed",
          receivedDate: new Date(),
        },
      });

      // 处理接收项
      for (const item of data.receivedItems) {
        if (!item.itemId || !item.receivedQuantity) {
          throw new Error("接收项缺少必要信息");
        }

        // 获取订单项
        const orderItem = existingOrder.items.find(i => i.id === parseInt(item.itemId));
        if (!orderItem) {
          throw new Error(`订单项 #${item.itemId} 不存在`);
        }

        // 更新订单项接收数量
        await tx.purchaseOrderItem.update({
          where: { id: parseInt(item.itemId) },
          data: {
            receivedQuantity: parseInt(item.receivedQuantity),
            receivedDate: new Date(),
            notes: item.notes || orderItem.notes,
          },
        });

        // 更新产品库存
        const product = await tx.product.findUnique({
          where: { id: orderItem.productId },
        });

        if (product) {
          // 产品模型中没有 inventory 字段，不需要更新产品本身

          // 更新库存记录
          const inventory = await tx.inventoryItem.findFirst({
            where: { productId: orderItem.productId },
          });

          if (inventory) {
            await tx.inventoryItem.update({
              where: { id: inventory.id },
              data: {
                quantity: inventory.quantity + parseInt(item.receivedQuantity),
              },
            });

            // 记录库存变更
            await tx.inventoryTransaction.create({
              data: {
                productId: orderItem.productId,
                quantity: parseInt(item.receivedQuantity),
                type: "purchase",
                notes: `采购订单 #${id}`,
                targetWarehouseId: inventory.warehouseId,
              },
            });
          } else {
            // 获取默认仓库
            const defaultWarehouse = await tx.warehouse.findFirst({
              where: { isActive: true },
              orderBy: { id: "asc" },
            });

            // 创建库存记录
            const newInventory = await tx.inventoryItem.create({
              data: {
                productId: orderItem.productId,
                quantity: parseInt(item.receivedQuantity),
                warehouseId: defaultWarehouse ? defaultWarehouse.id : null,
              },
            });

            // 记录库存变更
            await tx.inventoryTransaction.create({
              data: {
                productId: orderItem.productId,
                quantity: parseInt(item.receivedQuantity),
                type: "purchase",
                notes: `采购订单 #${id}`,
                targetWarehouseId: newInventory.warehouseId,
              },
            });
          }
        }
      }

      return order;
    });

    revalidatePath("/purchases");
    revalidatePath("/inventory");
    return result;
  } catch (error) {
    console.error("Error receiving purchase order:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to receive purchase order");
  }
}

/**
 * 获取供应商列表
 *
 * @returns 供应商列表
 */
export async function getSuppliers(): Promise<(PrismaSupplier & { orderCount: number })[]> {
  try {
    // 使用类型安全的包装函数获取供应商
    const suppliers = await findRecords('supplier', {
      include: {
        _count: {
          select: {
            purchaseOrders: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return suppliers.map(supplier => ({
      ...(supplier as PrismaSupplier),
      orderCount: supplier._count.purchaseOrders,
    }));
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    throw new Error("Failed to fetch suppliers");
  }
}

/**
 * 创建供应商
 *
 * 创建新的供应商记录。
 *
 * @param data - 供应商创建数据
 * @returns 创建的供应商
 *
 * @example
 * ```typescript
 * // 创建新供应商
 * const supplier = await createSupplier({
 *   name: '北京珐琅材料有限公司',
 *   contactPerson: '张经理',
 *   phone: '13800138000'
 * });
 * console.log(supplier.id); // 输出新创建的供应商ID
 * ```
 *
 * @throws 如果验证失败、供应商已存在或创建失败，会抛出错误
 *
 * @category 创建
 */
export async function createSupplier(data: CreateSupplierInput): Promise<PrismaSupplier> {
  try {
    // 验证数据
    const validation = validateCreateSupplier(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    // 检查供应商是否已存在
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        name: data.name,
      },
    });

    if (existingSupplier) {
      throw new Error("供应商已存在");
    }

    // 使用类型安全的包装函数创建供应商
    const supplier = await createRecord('supplier', {
      name: data.name,
      contactPerson: data.contactPerson || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      description: data.description || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    }, { checkSync: true });

    revalidatePath("/purchase");
    return supplier as PrismaSupplier;
  } catch (error) {
    console.error("Error creating supplier:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create supplier");
  }
}

/**
 * 更新供应商
 *
 * 更新供应商信息。
 *
 * @param id - 供应商ID
 * @param data - 供应商更新数据
 * @returns 更新后的供应商
 *
 * @example
 * ```typescript
 * // 更新供应商信息
 * const updatedSupplier = await updateSupplier(1, {
 *   name: '上海珐琅材料有限公司',
 *   contactPerson: '李经理',
 *   phone: '13900139000'
 * });
 * console.log(updatedSupplier.name); // 输出更新后的供应商名称
 * ```
 *
 * @throws 如果验证失败、供应商不存在或更新失败，会抛出错误
 *
 * @category 更新
 */
export async function updateSupplier(id: number, data: UpdateSupplierInput): Promise<PrismaSupplier> {
  try {
    // 验证数据
    const validation = validateUpdateSupplier(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    // 检查供应商是否存在
    const existingSupplier = await findRecord('supplier', id);

    if (!existingSupplier) {
      throw new Error("供应商不存在");
    }

    // 如果更改了名称，检查是否已存在
    if (data.name && data.name !== existingSupplier.name) {
      const duplicateSupplier = await prisma.supplier.findFirst({
        where: {
          name: data.name,
          NOT: {
            id,
          },
        },
      });

      if (duplicateSupplier) {
        throw new Error("供应商名称已存在");
      }
    }

    // 准备更新数据
    const updateData: any = {};

    // 只更新提供的字段
    if (data.name !== undefined) updateData.name = data.name;
    if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // 使用类型安全的包装函数更新供应商
    const supplier = await updateRecord('supplier', id, updateData, { checkSync: true });

    revalidatePath("/purchase");
    return supplier as PrismaSupplier;
  } catch (error) {
    console.error("Error updating supplier:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update supplier");
  }
}

/**
 * 删除供应商
 *
 * 删除供应商记录。如果供应商有采购订单记录，则无法删除。
 *
 * @param id - 供应商ID
 * @returns 操作结果，包含成功标志
 *
 * @example
 * ```typescript
 * // 删除供应商
 * const result = await deleteSupplier(1);
 * if (result.success) {
 *   console.log('供应商删除成功');
 * }
 * ```
 *
 * @throws 如果供应商不存在、有采购订单记录或删除失败，会抛出错误
 *
 * @category 删除
 */
export async function deleteSupplier(id: number): Promise<{ success: boolean }> {
  try {
    // 检查供应商是否存在
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            purchaseOrders: true,
          },
        },
      },
    });

    if (!existingSupplier) {
      throw new Error("供应商不存在");
    }

    // 检查供应商是否有采购订单
    if (existingSupplier._count.purchaseOrders > 0) {
      throw new Error("供应商有采购订单记录，无法删除");
    }

    // 使用类型安全的包装函数删除供应商
    await prisma.supplier.delete({
      where: { id },
    });

    revalidatePath("/purchase");
    return { success: true };
  } catch (error) {
    console.error("Error deleting supplier:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete supplier");
  }
}
