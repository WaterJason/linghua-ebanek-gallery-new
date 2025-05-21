"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * 获取计件工作记录
 * 
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @param employeeId 员工ID
 * @returns 计件工作记录列表
 */
export async function getPieceWorks(startDate?: string, endDate?: string, employeeId?: string) {
  try {
    // 构建查询条件
    let whereClause: any = {}

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (employeeId && employeeId !== "all") {
      whereClause.employeeId = Number.parseInt(employeeId)
    }

    // 获取计件工作记录
    const pieceWorks = await prisma.pieceWork.findMany({
      where: whereClause,
      include: {
        employee: true,
        details: {
          include: {
            pieceWorkItem: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    return pieceWorks
  } catch (error) {
    console.error("Error fetching piece works:", error)
    throw new Error("Failed to fetch piece works")
  }
}

/**
 * 创建计件工作记录
 * 
 * @param data 计件工作数据
 * @returns 创建的计件工作记录
 */
export async function createPieceWork(data: any) {
  try {
    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 创建计件工作记录
      const pieceWork = await tx.pieceWork.create({
        data: {
          employeeId: Number.parseInt(data.employee),
          date: new Date(data.date),
          workType: data.workType,
          totalAmount: Number.parseFloat(data.totalAmount),
          notes: data.notes,
        },
      })

      // 创建计件工作明细
      for (const item of data.items) {
        await tx.pieceWorkDetail.create({
          data: {
            pieceWorkId: pieceWork.id,
            pieceWorkItemId: Number.parseInt(item.itemId),
            quantity: Number.parseInt(item.quantity),
            price: Number.parseFloat(item.price),
          },
        })
      }

      return pieceWork
    })

    revalidatePath("/production")
    revalidatePath("/daily-log")
    return result
  } catch (error) {
    console.error("Error creating piece work:", error)
    throw new Error("Failed to create piece work")
  }
}

/**
 * 更新计件工作记录
 * 
 * @param id 计件工作ID
 * @param data 计件工作更新数据
 * @returns 更新后的计件工作记录
 */
export async function updatePieceWork(id: number, data: any) {
  try {
    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 更新计件工作记录
      const pieceWork = await tx.pieceWork.update({
        where: { id },
        data: {
          employeeId: Number.parseInt(data.employee),
          date: new Date(data.date),
          workType: data.workType,
          totalAmount: Number.parseFloat(data.totalAmount),
          notes: data.notes,
        },
      })

      // 删除现有明细
      await tx.pieceWorkDetail.deleteMany({
        where: { pieceWorkId: id },
      })

      // 创建新明细
      for (const item of data.items) {
        await tx.pieceWorkDetail.create({
          data: {
            pieceWorkId: pieceWork.id,
            pieceWorkItemId: Number.parseInt(item.itemId),
            quantity: Number.parseInt(item.quantity),
            price: Number.parseFloat(item.price),
          },
        })
      }

      return pieceWork
    })

    revalidatePath("/production")
    revalidatePath("/daily-log")
    return result
  } catch (error) {
    console.error("Error updating piece work:", error)
    throw new Error("Failed to update piece work")
  }
}

/**
 * 删除计件工作记录
 * 
 * @param id 计件工作ID
 * @returns 操作结果
 */
export async function deletePieceWork(id: number) {
  try {
    // 使用事务确保数据一致性
    await prisma.$transaction(async (tx) => {
      // 先删除明细记录
      await tx.pieceWorkDetail.deleteMany({
        where: { pieceWorkId: id },
      })

      // 再删除主记录
      await tx.pieceWork.delete({
        where: { id },
      })
    })

    revalidatePath("/production")
    revalidatePath("/daily-log")
    return { success: true }
  } catch (error) {
    console.error("Error deleting piece work:", error)
    throw new Error("Failed to delete piece work")
  }
}
