"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ErrorUtils } from "@/lib/error-utils";

/**
 * 获取POS销售记录
 *
 * 获取POS销售记录，支持按日期、员工等条件筛选。
 *
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @param employeeId 员工ID
 * @param limit 每页数量
 * @param offset 偏移量
 * @returns POS销售记录列表和总数
 *
 * @example
 * ```typescript
 * // 获取所有POS销售记录
 * const result = await getPosSales();
 * console.log(result.total); // 输出销售记录总数
 * console.log(result.data.length); // 输出当前页销售记录数量
 * ```
 *
 * @category 查询
 */
export async function getPosSales(
  startDate?: string,
  endDate?: string,
  employeeId?: number,
  limit: number = 50,
  offset: number = 0
) {
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

    if (employeeId) {
      whereClause.employeeId = Number(employeeId);
    }

    // 获取总记录数
    const total = await prisma.posSale.count({
      where: whereClause,
    });

    // 获取分页数据
    const sales = await prisma.posSale.findMany({
      where: whereClause,
      include: {
        employee: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      skip: offset,
      take: limit,
    });

    return {
      data: sales,
      total,
      offset,
      limit,
    };
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "pos-sales");
    throw appError;
  }
}

/**
 * 创建POS销售记录
 *
 * @param data POS销售数据
 * @returns 创建的销售记录
 */
export async function createPosSale(data: any) {
  try {
    // 验证必填字段
    if (!data.employeeId) {
      throw new Error("销售员为必填项");
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error("销售项不能为空");
    }

    if (!data.warehouseId) {
      throw new Error("仓库为必填项");
    }

    // 计算销售总金额
    let totalAmount = 0;
    for (const item of data.items) {
      if (!item.productId || !item.quantity || !item.price) {
        throw new Error("销售项缺少必要信息");
      }
      totalAmount += (item.price * item.quantity) - (item.discount || 0);
    }

    // 开始事务
    const result = await prisma.$transaction(async (tx) => {
      // 创建销售记录
      const sale = await tx.posSale.create({
        data: {
          employeeId: Number(data.employeeId),
          customerId: data.customerId ? Number(data.customerId) : null,
          customerInfo: data.customerInfo || null,
          totalAmount,
          paymentMethod: data.paymentMethod || "cash",
          date: new Date(),
          notes: data.notes || null,
        },
      });

      // 创建销售项
      for (const item of data.items) {
        await tx.posSaleItem.create({
          data: {
            posSaleId: sale.id,
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
            discount: item.discount ? Number(item.discount) : 0,
          },
        });

        // 更新库存记录
        const inventory = await tx.inventoryItem.findFirst({
          where: {
            productId: Number(item.productId),
            warehouseId: Number(data.warehouseId)
          },
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
              notes: `POS销售 #${sale.id}`,
              sourceWarehouseId: Number(data.warehouseId),
            },
          });
        }
      }

      return sale;
    });

    revalidatePath("/sales");
    revalidatePath("/inventory");
    return result;
  } catch (error) {
    console.error("Error creating POS sale:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create POS sale");
  }
}
