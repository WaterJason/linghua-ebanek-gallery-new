"use server";

import prisma from "@/lib/db";
import { AppError } from "@/lib/errors";
import { revalidatePath } from "next/cache";
import {
  PrismaCustomer,
  CreateCustomerInput,
  UpdateCustomerInput
} from "@/types/prisma-models";
import { validateCreateCustomer, validateUpdateCustomer } from "@/lib/validation";

/**
 * 获取客户列表
 *
 * @param type 客户类型
 * @param query 搜索关键词
 * @returns 客户列表
 */
export async function getCustomers(type?: string, query?: string): Promise<PrismaCustomer[]> {
  try {
    let whereClause: any = {};

    if (type) {
      whereClause = {
        ...whereClause,
        type,
      };
    }

    if (query) {
      whereClause = {
        ...whereClause,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      };
    }

    return await prisma.customer.findMany({
      where: whereClause,
      orderBy: {
        id: "asc",
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error)
    throw new Error("Failed to fetch customers")
  }
}

/**
 * 创建客户
 *
 * @param data 客户数据
 * @returns 创建的客户
 */
export async function createCustomer(data: CreateCustomerInput): Promise<PrismaCustomer> {
  try {
    // 验证数据
    const validation = validateCreateCustomer(data);
    if (!validation.isValid) {
      throw new AppError(validation.errors.join("; "), 400);
    }

    // 检查是否已存在相同手机号的客户
    if (data.phone) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          phone: data.phone,
        },
      });

      if (existingCustomer) {
        throw new AppError("已存在相同手机号的客户", 400);
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        type: data.type || "individual",
        notes: data.notes || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    revalidatePath("/sales")
    return customer
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error creating customer:", error)
    throw new Error("Failed to create customer")
  }
}

/**
 * 更新客户
 *
 * @param id 客户ID
 * @param data 客户数据
 * @returns 更新后的客户
 */
export async function updateCustomer(id: number, data: UpdateCustomerInput): Promise<PrismaCustomer> {
  try {
    // 验证数据
    const validation = validateUpdateCustomer(data);
    if (!validation.isValid) {
      throw new AppError(validation.errors.join("; "), 400);
    }

    // 检查客户是否存在
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      throw new AppError("客户不存在", 404);
    }

    // 检查是否已存在相同手机号的其他客户
    if (data.phone) {
      const duplicateCustomer = await prisma.customer.findFirst({
        where: {
          phone: data.phone,
          NOT: {
            id: Number(id),
          },
        },
      });

      if (duplicateCustomer) {
        throw new AppError("已存在相同手机号的客户", 400);
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

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/sales")
    return customer
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error updating customer:", error)
    throw new Error("Failed to update customer")
  }
}

/**
 * 删除客户
 *
 * @param id 客户ID
 * @returns 操作结果
 */
export async function deleteCustomer(id: number): Promise<{ success: boolean }> {
  try {
    // 检查客户是否存在
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new AppError("客户不存在", 404);
    }

    // 检查客户是否有关联订单
    const orderCount = await prisma.order.count({
      where: { customerId: id },
    });

    if (orderCount > 0) {
      throw new AppError("客户有关联订单，无法删除", 400);
    }

    // 检查客户是否有关联工作坊
    const workshopCount = await prisma.workshop.count({
      where: { customerId: id },
    });

    if (workshopCount > 0) {
      throw new AppError("客户有关联工作坊活动，无法删除", 400);
    }

    await prisma.customer.delete({
      where: { id },
    });

    revalidatePath("/sales")
    return { success: true }
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error deleting customer:", error)
    throw new Error("Failed to delete customer")
  }
}
