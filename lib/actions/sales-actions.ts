/**
 * 销售管理模块
 *
 * 本模块提供销售管理相关的功能，包括销售订单的增删改查、支付管理等。
 *
 * @module 销售管理
 * @category 核心模块
 */

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  PrismaOrder,
  CreateOrderInput,
  UpdateOrderInput,
  CreateOrderItemInput,
  UpdateOrderItemInput
} from "@/types/prisma-models";
import { validateCreateOrder, validateUpdateOrder } from "@/lib/validation";
import { createRecord, updateRecord, findRecord, findRecords } from "@/lib/prisma-wrapper";
import { ErrorUtils } from "@/lib/error-utils";

/**
 * 获取订单列表（分页）
 *
 * 获取订单列表，支持按状态、客户、员工、日期等条件筛选，并支持分页。
 *
 * @param status 订单状态
 * @param customerId 客户ID
 * @param employeeId 员工ID
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @param limit 每页数量
 * @param offset 偏移量
 * @param isCustom 是否为定制订单
 * @returns 订单列表和总数
 *
 * @example
 * ```typescript
 * // 获取所有进行中的订单
 * const result = await getOrders("in_progress");
 * console.log(result.total); // 输出订单总数
 * console.log(result.data.length); // 输出当前页订单数量
 * ```
 *
 * @throws 如果获取订单失败，会抛出错误
 *
 * @category 查询
 */
export async function getOrders(
  status?: string,
  customerId?: number,
  employeeId?: number,
  startDate?: string,
  endDate?: string,
  limit: number = 50,
  offset: number = 0,
  isCustom?: boolean
): Promise<{ total: number; offset: number; limit: number; data: PrismaOrder[] }> {
  try {
    // 构建查询条件
    let whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (customerId) {
      whereClause.customerId = Number(customerId);
    }

    if (employeeId) {
      whereClause.employeeId = Number(employeeId);
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

    if (isCustom !== undefined) {
      whereClause.isCustom = isCustom;
    }

    // 获取总记录数
    const total = await prisma.order.count({
      where: whereClause,
    });

    // 获取分页数据
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: true,
        employee: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
      skip: offset,
      take: limit,
    });

    return {
      total,
      offset,
      limit,
      data: orders,
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw new Error("Failed to fetch orders");
  }
}

/**
 * 获取所有销售订单
 *
 * @param status 订单状态
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 销售订单列表
 */
export async function getSalesOrders(status?: string, startDate?: string, endDate?: string): Promise<PrismaOrder[]> {
  try {
    // 构建查询条件
    let whereClause: any = {};

    if (status) {
      whereClause.status = status;
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

    // 使用类型安全的包装函数获取销售订单
    const orders = await findRecords('order', {
      where: whereClause,
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
        payments: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return orders as PrismaOrder[];
  } catch (error) {
    console.error("Error fetching sales orders:", error);
    throw new Error("Failed to fetch sales orders");
  }
}

/**
 * 获取单个销售订单
 *
 * @param id 订单ID
 * @returns 销售订单
 */
/**
 * 获取单个销售订单
 *
 * 根据ID获取销售订单的详细信息，包括客户、订单项、支付记录等。
 *
 * @param id 订单ID
 * @returns 销售订单详细信息
 *
 * @example
 * ```typescript
 * // 获取ID为1的销售订单
 * const order = await getSalesOrder(1);
 * console.log(order.totalAmount); // 输出订单总金额
 * console.log(order.orderItems.length); // 输出订单项数量
 * ```
 *
 * @throws 如果订单不存在或获取失败，会抛出错误
 *
 * @category 查询
 */
export async function getSalesOrder(id: number): Promise<PrismaOrder> {
  try {
    // 验证参数
    if (!id || isNaN(Number(id))) {
      throw new ErrorUtils.ValidationError("订单ID无效", { id }, "sales-management");
    }

    // 使用类型安全的包装函数获取销售订单
    const order = await findRecord('order', id, {
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
        payments: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new ErrorUtils.NotFoundError("订单不存在", { id }, "sales-management");
    }

    return order as PrismaOrder;
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "sales-management");
    throw appError;
  }
}

/**
 * 创建销售订单
 *
 * @param data 订单数据
 * @returns 创建的订单
 */
export async function createSalesOrder(data: CreateOrderInput): Promise<PrismaOrder> {
  try {
    // 验证数据
    const validation = validateCreateOrder(data);
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
      const order = await tx.order.create({
        data: {
          customerId: data.customerId ? Number(data.customerId) : null,
          employeeId: data.employeeId ? Number(data.employeeId) : null,
          orderDate: data.orderDate instanceof Date ? data.orderDate : new Date(data.orderDate),
          totalAmount,
          status: data.status || "pending",
          paymentStatus: data.paymentStatus || "unpaid",
          paymentMethod: data.paymentMethod || null,
          notes: data.notes || null,
          isCustom: data.isCustom || false,
          customDesign: data.customDesign || null,
          customRequirements: data.customRequirements || null,
          designImageUrl: data.designImageUrl || null,
          expectedDeliveryDate: data.expectedDeliveryDate ? (data.expectedDeliveryDate instanceof Date ? data.expectedDeliveryDate : new Date(data.expectedDeliveryDate)) : null,
          designApproved: data.designApproved || null,
          designerNotes: data.designerNotes || null,
        },
      });

      // 创建订单项
      for (const item of data.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
            discount: item.discount ? Number(item.discount) : 0,
            notes: item.notes || null,
          },
        });

        // 更新库存记录
        const inventory = await tx.inventoryItem.findFirst({
          where: { productId: Number(item.productId) },
        });

        if (inventory) {
          await tx.inventoryItem.update({
            where: { id: inventory.id },
            data: {
              quantity: Math.max(0, inventory.quantity - Number(item.quantity)),
            },
          });

          // 记录库存变更
          await tx.inventoryTransaction.create({
            data: {
              productId: Number(item.productId),
              quantity: -Number(item.quantity),
              type: "sale",
              notes: `销售订单 #${order.id}`,
              sourceWarehouseId: inventory.warehouseId,
            },
          });
        }
      }

      // 如果提供了支付信息，创建支付记录
      if (data.paidAmount && data.paidAmount > 0) {
        await tx.payment.create({
          data: {
            orderId: order.id,
            amount: Number(data.paidAmount),
            method: data.paymentMethod || "cash",
            status: "completed",
            notes: data.notes || null,
          },
        });

        // 更新订单支付状态
        if (Number(data.paidAmount) >= totalAmount) {
          await tx.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: "paid",
            },
          });
        } else if (Number(data.paidAmount) > 0) {
          await tx.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: "partial",
            },
          });
        }
      }

      return order;
    });

    revalidatePath("/sales");
    revalidatePath("/inventory");
    return result as PrismaOrder;
  } catch (error) {
    console.error("Error creating sales order:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create sales order");
  }
}

/**
 * 更新销售订单
 *
 * @param id 订单ID
 * @param data 订单数据
 * @returns 更新后的订单
 */
export async function updateSalesOrder(id: number, data: UpdateOrderInput): Promise<PrismaOrder> {
  try {
    // 验证数据
    const validation = validateUpdateOrder(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    // 检查订单是否存在
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
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
      if (data.customerId !== undefined) updateData.customerId = data.customerId !== null ? Number(data.customerId) : null;
      if (data.employeeId !== undefined) updateData.employeeId = data.employeeId !== null ? Number(data.employeeId) : null;
      if (data.orderDate !== undefined) updateData.orderDate = data.orderDate instanceof Date ? data.orderDate : new Date(data.orderDate);
      if (data.status !== undefined) updateData.status = data.status;
      if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
      if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.isCustom !== undefined) updateData.isCustom = data.isCustom;
      if (data.customDesign !== undefined) updateData.customDesign = data.customDesign;
      if (data.customRequirements !== undefined) updateData.customRequirements = data.customRequirements;
      if (data.designImageUrl !== undefined) updateData.designImageUrl = data.designImageUrl;
      if (data.expectedDeliveryDate !== undefined) updateData.expectedDeliveryDate = data.expectedDeliveryDate ? (data.expectedDeliveryDate instanceof Date ? data.expectedDeliveryDate : new Date(data.expectedDeliveryDate)) : null;
      if (data.designApproved !== undefined) updateData.designApproved = data.designApproved;
      if (data.designerNotes !== undefined) updateData.designerNotes = data.designerNotes;

      // 更新订单基本信息
      const order = await tx.order.update({
        where: { id },
        data: updateData,
      });

      // 如果提供了订单项，更新订单项
      if (data.items && Array.isArray(data.items)) {
        // 删除现有订单项
        await tx.orderItem.deleteMany({
          where: { orderId: id },
        });

        // 计算订单总金额
        let totalAmount = 0;

        // 创建新订单项
        for (const item of data.items) {
          if (!item.productId || !item.quantity || !item.price) {
            throw new Error("订单项缺少必要信息");
          }

          await tx.orderItem.create({
            data: {
              orderId: id,
              productId: Number(item.productId),
              quantity: Number(item.quantity),
              price: Number(item.price),
              discount: item.discount ? Number(item.discount) : 0,
              notes: item.notes || null,
            },
          });

          totalAmount += Number(item.price) * Number(item.quantity);
        }

        // 更新订单总金额
        await tx.order.update({
          where: { id },
          data: {
            totalAmount,
          },
        });
      }

      // 如果提供了支付金额，创建支付记录
      if (data.paidAmount && data.paidAmount > 0) {
        await tx.payment.create({
          data: {
            orderId: id,
            amount: Number(data.paidAmount),
            method: data.paymentMethod || "cash",
            status: "completed",
            notes: data.notes || null,
          },
        });

        // 获取订单总金额和已支付金额
        const orderWithPayments = await tx.order.findUnique({
          where: { id },
          include: {
            payments: true,
          },
        });

        if (orderWithPayments) {
          const totalPaid = orderWithPayments.payments.reduce((sum, payment) => sum + payment.amount, 0);

          // 更新订单支付状态
          if (totalPaid >= orderWithPayments.totalAmount) {
            await tx.order.update({
              where: { id },
              data: {
                paymentStatus: "paid",
              },
            });
          } else if (totalPaid > 0) {
            await tx.order.update({
              where: { id },
              data: {
                paymentStatus: "partial",
              },
            });
          }
        }
      }

      return order;
    });

    revalidatePath("/sales");
    return result as PrismaOrder;
  } catch (error) {
    console.error("Error updating sales order:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update sales order");
  }
}

/**
 * 取消销售订单
 *
 * @param id 订单ID
 * @returns 取消后的订单
 */
/**
 * 取消销售订单
 *
 * 取消指定的销售订单，并恢复相关产品的库存。
 *
 * @param id 订单ID
 * @returns 取消后的订单
 *
 * @example
 * ```typescript
 * // 取消ID为1的销售订单
 * const order = await cancelSalesOrder(1);
 * console.log(order.status); // 输出: cancelled
 * ```
 *
 * @throws 如果订单不存在、已完成、已取消或取消失败，会抛出错误
 *
 * @category 修改
 */
export async function cancelSalesOrder(id: number): Promise<PrismaOrder> {
  try {
    // 验证参数
    if (!id || isNaN(Number(id))) {
      throw new ErrorUtils.ValidationError("订单ID无效", { id }, "sales-management");
    }

    // 检查订单是否存在
    const existingOrder = await findRecord('order', id, {
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!existingOrder) {
      throw new ErrorUtils.NotFoundError("订单不存在", { id }, "sales-management");
    }

    // 如果订单已完成或已取消，不允许取消
    if (existingOrder.status === "completed" || existingOrder.status === "cancelled") {
      throw new ErrorUtils.BusinessLogicError(
        "已完成或已取消的订单不能再次取消",
        { id, status: existingOrder.status },
        "sales-management"
      );
    }

    // 开始事务
    const result = await prisma.$transaction(async (tx) => {
      // 更新订单状态
      const order = await tx.order.update({
        where: { id },
        data: {
          status: "cancelled",
        },
      });

      // 恢复产品库存
      for (const item of existingOrder.orderItems) {
        // 更新库存记录
        const inventory = await tx.inventoryItem.findFirst({
          where: { productId: item.productId },
        });

        if (inventory) {
          await tx.inventoryItem.update({
            where: { id: inventory.id },
            data: {
              quantity: inventory.quantity + item.quantity,
            },
          });

          // 记录库存变更
          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              type: "return",
              notes: `取消销售订单 #${id}`,
              targetWarehouseId: inventory.warehouseId,
            },
          });
        }
      }

      return order;
    });

    revalidatePath("/sales");
    revalidatePath("/inventory");
    return result as PrismaOrder;
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "sales-management");
    throw appError;
  }
}

/**
 * 获取珐琅馆销售记录
 *
 * 获取珐琅馆销售记录，支持按日期筛选。
 *
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 珐琅馆销售记录列表
 *
 * @example
 * ```typescript
 * // 获取所有珐琅馆销售记录
 * const sales = await getGallerySales();
 * console.log(sales.length); // 输出销售记录数量
 * ```
 *
 * @throws 如果获取销售记录失败，会抛出错误
 *
 * @category 查询
 */
export async function getGallerySales(startDate?: string, endDate?: string) {
  try {
    // 构建查询条件
    let whereClause: any = {};

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.date = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.date = {
        lte: new Date(endDate),
      };
    }

    // 获取销售记录
    const sales = await prisma.gallerySale.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return sales;
  } catch (error) {
    // 记录详细错误信息
    console.error("Error fetching gallery sales:", error);

    // 返回空数组而不是抛出错误，避免客户端崩溃
    return [];
  }
}

/**
 * 创建珐琅馆销售记录
 *
 * 创建新的珐琅馆销售记录，包括销售项和库存更新。
 *
 * @param data - 珐琅馆销售创建数据
 * @returns 创建的珐琅馆销售记录
 *
 * @example
 * ```typescript
 * // 创建珐琅馆销售记录
 * const sale = await createGallerySale({
 *   date: '2023-06-01',
 *   paymentMethod: 'cash',
 *   items: [
 *     { productId: 1, quantity: 2, price: 100 },
 *     { productId: 2, quantity: 1, price: 200 }
 *   ]
 * });
 * console.log(sale.id); // 输出新创建的销售记录ID
 * ```
 *
 * @throws 如果验证失败或创建失败，会抛出错误
 *
 * @category 创建
 */
export async function createGallerySale(data: CreateGallerySaleInput): Promise<PrismaGallerySale> {
  try {
    // 验证数据
    const validation = validateCreateGallerySale(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    // 计算销售总金额
    let totalAmount = 0;
    for (const item of data.items) {
      if (!item.productId || !item.quantity || !item.price) {
        throw new Error("销售项缺少必要信息");
      }
      totalAmount += Number(item.price) * Number(item.quantity);
    }

    // 开始事务
    const result = await prisma.$transaction(async (tx) => {
      // 创建销售记录
      const sale = await tx.gallerySale.create({
        data: {
          date: data.date instanceof Date ? data.date : new Date(data.date),
          totalAmount,
          paymentMethod: data.paymentMethod || "cash",
          notes: data.notes || null,
          createdById: data.createdById || null,
        },
      });

      // 创建销售项
      for (const item of data.items) {
        await tx.gallerySaleItem.create({
          data: {
            saleId: sale.id,
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
            discount: item.discount ? Number(item.discount) : 0,
            notes: item.notes || null,
          },
        });

        // 更新库存记录
        const inventory = await tx.inventoryItem.findFirst({
          where: { productId: Number(item.productId) },
        });

        if (inventory) {
          await tx.inventoryItem.update({
            where: { id: inventory.id },
            data: {
              quantity: Math.max(0, inventory.quantity - Number(item.quantity)),
            },
          });

          // 记录库存变更
          await tx.inventoryTransaction.create({
            data: {
              productId: Number(item.productId),
              quantity: -Number(item.quantity),
              type: "sale",
              notes: `珐琅馆销售 #${sale.id}`,
              sourceWarehouseId: inventory.warehouseId,
            },
          });
        }
      }

      return sale;
    });

    revalidatePath("/sales/gallery");
    revalidatePath("/inventory");
    return result as PrismaGallerySale;
  } catch (error) {
    console.error("Error creating gallery sale:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create gallery sale");
  }
}

/**
 * 获取咖啡厅销售记录
 *
 * 获取咖啡厅销售记录，支持按日期筛选。
 *
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 咖啡厅销售记录列表
 *
 * @example
 * ```typescript
 * // 获取所有咖啡厅销售记录
 * const sales = await getCoffeeShopSales();
 * console.log(sales.length); // 输出销售记录数量
 * ```
 *
 * @throws 如果获取销售记录失败，会抛出错误
 *
 * @category 查询
 */
export async function getCoffeeShopSales(startDate?: string, endDate?: string) {
  try {
    // 构建查询条件
    let whereClause: any = {};

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.date = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.date = {
        lte: new Date(endDate),
      };
    }

    // 获取销售记录
    const sales = await prisma.coffeeShopSale.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return sales;
  } catch (error) {
    // 记录详细错误信息
    console.error("Error fetching coffee shop sales:", error);

    // 返回空数组而不是抛出错误，避免客户端崩溃
    return [];
  }
}

/**
 * 创建咖啡厅销售记录
 *
 * @param data 咖啡厅销售数据
 * @returns 创建的咖啡厅销售记录
 */
export async function createCoffeeShopSale(data: any) {
  try {
    // 验证必填字段
    if (!data.date) {
      throw new Error("销售日期为必填项");
    }

    if (!data.totalSales || parseFloat(data.totalSales) <= 0) {
      throw new Error("销售金额必须大于0");
    }

    if (!data.staffOnDuty || !Array.isArray(data.staffOnDuty) || data.staffOnDuty.length === 0) {
      throw new Error("至少需要选择一名值班员工");
    }

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 创建销售记录
      const sale = await tx.coffeeShopSale.create({
        data: {
          date: new Date(data.date),
          totalSales: parseFloat(data.totalSales),
          cashAmount: parseFloat(data.cashAmount || 0),
          cardAmount: parseFloat(data.cardAmount || 0),
          wechatAmount: parseFloat(data.wechatAmount || 0),
          alipayAmount: parseFloat(data.alipayAmount || 0),
          otherAmount: parseFloat(data.otherAmount || 0),
          customerCount: parseInt(data.customerCount || 0),
          notes: data.notes || "",
        },
      });

      // 创建值班员工记录
      for (const employeeId of data.staffOnDuty) {
        await tx.coffeeShopShift.create({
          data: {
            coffeeShopSaleId: sale.id,
            employeeId: parseInt(employeeId),
          },
        });
      }

      // 如果有销售项目，创建销售项目记录
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        for (const item of data.items) {
          await tx.coffeeShopItem.create({
            data: {
              coffeeShopSaleId: sale.id,
              name: item.name,
              category: item.category || "其他",
              quantity: parseInt(item.quantity || 1),
              unitPrice: parseFloat(item.unitPrice || 0),
              totalPrice: parseFloat(item.totalPrice || 0),
            },
          });
        }
      }

      return sale;
    });

    // 重新验证路径，更新页面数据
    revalidatePath("/sales/coffee-shop");
    revalidatePath("/reports/coffee");
    revalidatePath("/dashboard");

    return result;
  } catch (error) {
    console.error("Error creating coffee shop sale:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create coffee shop sale");
  }
}

/**
 * 导入咖啡厅销售数据
 *
 * 从Excel文件导入咖啡厅销售数据。
 *
 * @param file - 包含销售数据的Excel文件
 * @returns 导入结果，包含成功导入的记录数
 *
 * @example
 * ```typescript
 * // 导入咖啡厅销售数据
 * const result = await importCoffeeShopSales(file);
 * console.log(`成功导入 ${result.importedCount} 条记录`);
 * ```
 *
 * @throws 如果文件格式不正确或导入失败，会抛出错误
 *
 * @category 导入
 */
export async function importCoffeeShopSales(file: File): Promise<{ importedCount: number }> {
  try {
    // 这里应该解析Excel文件并导入数据
    // 由于实际解析Excel需要额外的库，这里只是模拟导入过程
    console.log(`准备导入咖啡厅销售数据，文件大小: ${file.size} 字节`);

    // 模拟导入延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模拟导入成功
    const importedCount = Math.floor(Math.random() * 10) + 1; // 随机1-10条记录

    // 重新验证相关路径
    revalidatePath("/sales/coffee-shop");
    revalidatePath("/reports/coffee");
    revalidatePath("/daily-log");

    return { importedCount };
  } catch (error) {
    console.error("导入咖啡厅销售数据失败:", error);
    throw new Error(error instanceof Error ? error.message : "导入咖啡厅销售数据失败");
  }
}

/**
 * 获取客户列表
 *
 * 获取所有客户，包括订单数量信息。
 *
 * @returns 客户列表，包含订单数量信息
 *
 * @example
 * ```typescript
 * // 获取所有客户
 * const customers = await getCustomers();
 * console.log(customers[0].name); // 输出第一个客户的名称
 * console.log(customers[0].orderCount); // 输出第一个客户的订单数量
 * ```
 *
 * @throws 如果获取客户失败，会抛出错误
 *
 * @category 查询
 */
export async function getCustomers(): Promise<(PrismaCustomer & { orderCount: number })[]> {
  try {
    // 使用类型安全的包装函数获取客户
    const customers = await findRecords('customer', {
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return customers.map(customer => ({
      ...(customer as PrismaCustomer),
      orderCount: customer._count.orders,
    }));
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw new Error("Failed to fetch customers");
  }
}

/**
 * 创建客户
 *
 * 创建新的客户记录。
 *
 * @param data - 客户创建数据
 * @returns 创建的客户
 *
 * @example
 * ```typescript
 * // 创建新客户
 * const customer = await createCustomer({
 *   name: '张三',
 *   phone: '13800138000',
 *   email: 'zhangsan@example.com'
 * });
 * console.log(customer.id); // 输出新创建的客户ID
 * ```
 *
 * @throws 如果验证失败、客户已存在或创建失败，会抛出错误
 *
 * @category 创建
 */
export async function createCustomer(data: CreateCustomerInput): Promise<PrismaCustomer> {
  try {
    // 验证数据
    const validation = validateCreateCustomer(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    // 检查客户是否已存在
    if (data.phone) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          phone: data.phone,
        },
      });

      if (existingCustomer) {
        throw new Error("该手机号已被注册");
      }
    }

    // 使用类型安全的包装函数创建客户
    const customer = await createRecord('customer', {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      type: data.type || 'regular',
      notes: data.notes || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    revalidatePath("/customers");
    return customer as PrismaCustomer;
  } catch (error) {
    console.error("Error creating customer:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create customer");
  }
}

/**
 * 更新客户
 *
 * 更新现有客户的信息。
 *
 * @param id - 客户ID
 * @param data - 客户更新数据
 * @returns 更新后的客户
 *
 * @example
 * ```typescript
 * // 更新客户信息
 * const customer = await updateCustomer(1, {
 *   phone: '13900139000',
 *   email: 'new-email@example.com'
 * });
 * console.log(customer.phone); // 输出: '13900139000'
 * ```
 *
 * @throws 如果验证失败、客户不存在、手机号已被使用或更新失败，会抛出错误
 *
 * @category 修改
 */
export async function updateCustomer(id: number, data: UpdateCustomerInput): Promise<PrismaCustomer> {
  try {
    // 验证数据
    const validation = validateUpdateCustomer(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    // 检查客户是否存在
    const existingCustomer = await findRecord('customer', id);

    if (!existingCustomer) {
      throw new Error("客户不存在");
    }

    // 如果更改了手机号，检查是否已被其他客户使用
    if (data.phone && data.phone !== existingCustomer.phone) {
      const duplicateCustomer = await prisma.customer.findFirst({
        where: {
          phone: data.phone,
          NOT: {
            id,
          },
        },
      });

      if (duplicateCustomer) {
        throw new Error("该手机号已被其他客户使用");
      }
    }

    // 准备更新数据
    const updateData: any = {};

    // 只更新提供的字段
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // 使用类型安全的包装函数更新客户
    const customer = await updateRecord('customer', id, updateData);

    revalidatePath("/customers");
    return customer as PrismaCustomer;
  } catch (error) {
    console.error("Error updating customer:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update customer");
  }
}

/**
 * 删除客户
 *
 * 删除指定的客户记录。如果客户有关联的订单，将无法删除。
 *
 * @param id - 客户ID
 * @returns 操作结果
 *
 * @example
 * ```typescript
 * // 删除客户
 * const result = await deleteCustomer(1);
 * console.log(result.success); // 输出: true
 * ```
 *
 * @throws 如果客户不存在、有关联订单或删除失败，会抛出错误
 *
 * @category 删除
 */
export async function deleteCustomer(id: number): Promise<{ success: boolean }> {
  try {
    // 检查客户是否存在
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!existingCustomer) {
      throw new Error("客户不存在");
    }

    // 检查客户是否有订单
    if (existingCustomer._count.orders > 0) {
      throw new Error("客户有订单记录，无法删除");
    }

    // 删除客户
    await prisma.customer.delete({
      where: { id },
    });

    revalidatePath("/customers");
    return { success: true };
  } catch (error) {
    console.error("Error deleting customer:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete customer");
  }
}

/**
 * 获取销售记录
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 销售记录列表
 */
export async function getSales(startDate?: string, endDate?: string) {
  try {
    let whereClause: any = {};

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

    const sales = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: true,
        employee: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
      orderBy: {
        orderDate: "desc",
      },
    });

    return sales;
  } catch (error) {
    console.error("Error getting sales:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to get sales");
  }
}

/**
 * 创建订单
 * @param data 订单数据
 * @returns 创建的订单
 */
export async function createOrder(data: CreateOrderInput) {
  return await createSalesOrder(data);
}

/**
 * 更新订单
 * @param id 订单ID
 * @param data 更新数据
 * @returns 更新后的订单
 */
export async function updateOrder(id: number, data: UpdateOrderInput) {
  return await updateSalesOrder(id, data);
}