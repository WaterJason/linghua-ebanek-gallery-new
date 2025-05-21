/**
 * 日程管理模块
 *
 * 本模块提供日程管理相关的功能，包括日程的增删改查、批量操作等。
 *
 * @module 日程管理
 * @category 核心模块
 */

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  PrismaSchedule,
  CreateScheduleInput,
  UpdateScheduleInput,
  BatchCreateSchedulesInput
} from "@/types/prisma-models";
import {
  validateCreateSchedule,
  validateUpdateSchedule,
  validateBatchCreateSchedules
} from "@/lib/validation";
import { findRecord, findRecords, createRecord, updateRecord, deleteRecord } from "@/lib/prisma-wrapper";
import { ErrorUtils } from "@/lib/error-utils";

/**
 * 获取所有日程
 *
 * 获取所有日程，可以按日期范围筛选。
 *
 * @param startDate - 开始日期，可选
 * @param endDate - 结束日期，可选
 * @returns 日程列表
 *
 * @example
 * ```typescript
 * // 获取所有日程
 * const schedules = await getSchedules();
 *
 * // 获取指定日期范围的日程
 * const schedules = await getSchedules('2023-06-01', '2023-06-30');
 * ```
 *
 * @throws 如果获取日程失败，会抛出错误
 *
 * @category 查询
 */
export async function getSchedules(startDate?: string, endDate?: string): Promise<PrismaSchedule[]> {
  try {
    // 验证日期格式
    if (startDate && isNaN(Date.parse(startDate))) {
      throw new ErrorUtils.ValidationError("开始日期格式无效", { startDate }, "schedule-management");
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      throw new ErrorUtils.ValidationError("结束日期格式无效", { endDate }, "schedule-management");
    }

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

    // 使用类型安全的包装函数获取日程
    const schedules = await findRecords('schedule', {
      where: whereClause,
      include: {
        employee: true,
      },
      orderBy: [
        { date: "asc" },
        { startTime: "asc" },
      ],
    });

    return schedules as PrismaSchedule[];
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "schedule-management");
    throw appError;
  }
}

/**
 * 获取员工日程
 */
export async function getEmployeeSchedules(employeeId: number, startDate?: string, endDate?: string) {
  try {
    // 构建查询条件
    let whereClause: any = {
      employeeId,
    };

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

    // 获取日程
    const schedules = await prisma.schedule.findMany({
      where: whereClause,
      include: {
        employee: true,
      },
      orderBy: [
        { date: "asc" },
        { startTime: "asc" },
      ],
    });

    return schedules;
  } catch (error) {
    console.error("Error fetching employee schedules:", error);
    throw new Error("Failed to fetch employee schedules");
  }
}

/**
 * 创建日程
 *
 * 创建新的日程记录。
 *
 * @param data - 日程创建数据
 * @returns 创建的日程
 *
 * @example
 * ```typescript
 * // 创建新日程
 * const schedule = await createSchedule({
 *   employeeId: 1,
 *   date: '2023-07-01',
 *   startTime: '09:00',
 *   endTime: '18:00'
 * });
 * console.log(schedule.id); // 输出新创建的日程ID
 * ```
 *
 * @throws 如果验证失败、员工不存在、日程冲突或创建失败，会抛出错误
 *
 * @category 创建
 */
export async function createSchedule(data: CreateScheduleInput): Promise<PrismaSchedule> {
  try {
    // 验证数据
    const validation = validateCreateSchedule(data);
    if (!validation.isValid) {
      throw new ErrorUtils.ValidationError(validation.errors.join("; "), validation.errors, "schedule-management");
    }

    // 检查员工是否存在
    const employee = await prisma.employee.findUnique({
      where: { id: Number(data.employeeId) },
    });

    if (!employee) {
      throw new ErrorUtils.NotFoundError("员工不存在", { employeeId: data.employeeId }, "schedule-management");
    }

    // 检查是否已存在相同员工和日期的日程
    if (data.checkConflict !== false) {
      const existingSchedule = await prisma.schedule.findFirst({
        where: {
          employeeId: Number(data.employeeId),
          date: data.date instanceof Date ? data.date : new Date(data.date),
        },
      });

      if (existingSchedule) {
        throw new ErrorUtils.AlreadyExistsError(
          "该员工在指定日期已有日程安排",
          {
            employeeId: data.employeeId,
            date: data.date,
            existingScheduleId: existingSchedule.id
          },
          "schedule-management"
        );
      }
    }

    // 直接使用Prisma创建日程，确保字段类型与数据库模型一致
    const schedule = await prisma.schedule.create({
      data: {
        employeeId: Number(data.employeeId),
        date: data.date instanceof Date ? data.date : new Date(data.date),
        startTime: String(data.startTime || "00:00"), // 确保是字符串类型
        endTime: String(data.endTime || "00:00"), // 确保是字符串类型
        note: data.note || null, // 注意字段可以为null
      },
    });

    revalidatePath("/schedule");
    return schedule as PrismaSchedule;
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "schedule-management");
    throw appError;
  }
}

/**
 * 批量创建日程
 *
 * 为多个员工和多个日期创建排班记录。
 *
 * @param data - 批量创建数据，包含员工ID列表和日期列表
 * @returns 操作结果，包含创建的记录和错误信息
 *
 * @example
 * ```typescript
 * // 批量创建排班
 * const result = await batchCreateSchedules({
 *   employeeIds: [1, 2, 3],
 *   dates: ['2023-07-01', '2023-07-02', '2023-07-03'],
 *   startTime: '09:00',
 *   endTime: '17:00'
 * });
 * console.log(`成功创建 ${result.created} 条排班记录`);
 * ```
 *
 * @throws 如果验证失败或创建失败，会抛出错误
 *
 * @category 创建
 */
export async function batchCreateSchedules(data: any) {
  try {
    // 验证必填字段
    if (!data.employeeIds || !Array.isArray(data.employeeIds) || data.employeeIds.length === 0) {
      throw new Error("员工ID列表不能为空");
    }

    if (!data.dates || !Array.isArray(data.dates) || data.dates.length === 0) {
      throw new Error("日期列表不能为空");
    }

    const results = [];
    const errors = [];

    // 为每个员工和每个日期创建日程
    for (const employeeId of data.employeeIds) {
      for (const date of data.dates) {
        try {
          // 检查员工是否存在
          const employee = await prisma.employee.findUnique({
            where: { id: parseInt(employeeId) },
          });

          if (!employee) {
            errors.push(`员工ID ${employeeId} 不存在`);
            continue;
          }

          // 检查是否已存在相同员工和日期的日程
          if (data.checkConflict !== false) {
            const existingSchedule = await prisma.schedule.findFirst({
              where: {
                employeeId: parseInt(employeeId),
                date: new Date(date),
                NOT: {
                  // 移除 type 字段，因为 Schedule 模型中没有这个字段
                },
              },
            });

            if (existingSchedule) {
              errors.push(`员工 ${employee.name} 在 ${date} 已有日程安排`);
              continue;
            }
          }

          // 创建日程
          const schedule = await prisma.schedule.create({
            data: {
              employeeId: parseInt(employeeId),
              date: new Date(date),
              startTime: data.startTime || "00:00", // 确保不为null，符合数据库模型
              endTime: data.endTime || "00:00", // 确保不为null，符合数据库模型
              note: data.note || null, // 注意字段可以为null
            },
          });

          results.push(schedule);
        } catch (error) {
          errors.push(`为员工ID ${employeeId} 在 ${date} 创建日程失败: ${error instanceof Error ? error.message : "未知错误"}`);
        }
      }
    }

    revalidatePath("/schedule");
    return {
      success: errors.length === 0,
      results,
      errors,
      created: results.length,
      failed: errors.length,
    };
  } catch (error) {
    console.error("Error batch creating schedules:", error);
    const appError = await ErrorUtils.handleError(error, "schedule-management");
    throw appError;
  }
}

/**
 * createBatchSchedules 是 batchCreateSchedules 的别名
 * 为了保持向后兼容性
 */
export const createBatchSchedules = batchCreateSchedules;

/**
 * 更新日程
 */
export async function updateSchedule(id: number, data: any) {
  try {
    // 检查日程是否存在
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      throw new Error("日程不存在");
    }

    // 如果更改了员工或日期，检查是否会与现有日程冲突
    if ((data.employeeId && data.employeeId !== existingSchedule.employeeId) ||
        (data.date && new Date(data.date).toISOString() !== existingSchedule.date.toISOString())) {

      const newEmployeeId = data.employeeId ? parseInt(data.employeeId) : existingSchedule.employeeId;
      const newDate = data.date ? new Date(data.date) : existingSchedule.date;

      if (data.checkConflict !== false) {
        const conflictingSchedule = await prisma.schedule.findFirst({
          where: {
            employeeId: newEmployeeId,
            date: newDate,
            NOT: {
              id,
              // 移除 type 字段，因为 Schedule 模型中没有这个字段
            },
          },
        });

        if (conflictingSchedule) {
          throw new Error("该员工在指定日期已有日程安排");
        }
      }
    }

    // 更新日程
    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        employeeId: data.employeeId ? parseInt(data.employeeId) : existingSchedule.employeeId,
        date: data.date ? new Date(data.date) : existingSchedule.date,
        startTime: data.startTime !== undefined ? (data.startTime || "00:00") : existingSchedule.startTime,
        endTime: data.endTime !== undefined ? (data.endTime || "00:00") : existingSchedule.endTime,
        note: data.note !== undefined ? data.note : existingSchedule.note,
      },
    });

    revalidatePath("/schedule");
    return schedule;
  } catch (error) {
    console.error("Error updating schedule:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update schedule");
  }
}

/**
 * 删除日程
 */
export async function deleteSchedule(id: number) {
  try {
    // 检查日程是否存在
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      throw new Error("日程不存在");
    }

    // 删除日程
    await prisma.schedule.delete({
      where: { id },
    });

    revalidatePath("/schedule");
    return { success: true };
  } catch (error) {
    console.error("Error deleting schedule:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete schedule");
  }
}

/**
 * 批量删除日程
 */
export async function batchDeleteSchedules(ids: number[]) {
  try {
    // 验证ID列表
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new Error("ID列表不能为空");
    }

    // 删除日程
    const result = await prisma.schedule.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    revalidatePath("/schedule");
    return {
      success: true,
      deleted: result.count,
    };
  } catch (error) {
    console.error("Error batch deleting schedules:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to batch delete schedules");
  }
}

/**
 * 获取日程类型
 *
 * 注意：Schedule 模型中已经没有 type 字段，此函数仅为向后兼容保留
 */
export async function getScheduleTypes() {
  try {
    return [
      { id: "work", name: "工作", color: "#4CAF50" },
      { id: "off", name: "休息", color: "#9E9E9E" },
      { id: "leave", name: "请假", color: "#FFC107" },
      { id: "training", name: "培训", color: "#2196F3" },
      { id: "meeting", name: "会议", color: "#673AB7" },
      { id: "other", name: "其他", color: "#795548" },
    ];
  } catch (error) {
    console.error("Error fetching schedule types:", error);
    throw new Error("Failed to fetch schedule types");
  }
}

/**
 * 获取指定日期的排班
 *
 * @param date 日期
 * @returns 指定日期的排班列表
 */
export async function getSchedulesByDate(date: Date | string) {
  try {
    // 确保日期格式正确
    const scheduleDate = date instanceof Date ? date : new Date(date);

    if (isNaN(scheduleDate.getTime())) {
      throw new ErrorUtils.ValidationError("日期格式无效", { date }, "schedule-management");
    }

    // 设置日期范围为当天的开始和结束
    const startOfDay = new Date(scheduleDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(scheduleDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 查询当天的排班
    const schedules = await prisma.schedule.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        employee: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return schedules;
  } catch (error) {
    console.error("Error fetching schedules by date:", error);
    const appError = await ErrorUtils.handleError(error, "schedule-management");
    throw appError;
  }
}

/**
 * 获取日程统计
 */
export async function getScheduleStats(startDate?: string, endDate?: string) {
  try {
    // 构建日期范围
    let dateRange: any = {};

    if (startDate && endDate) {
      dateRange = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      dateRange = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      dateRange = {
        lte: new Date(endDate),
      };
    } else {
      // 默认获取当月的数据
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateRange = {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth,
      };
    }

    // 获取日程
    const schedules = await prisma.schedule.findMany({
      where: {
        date: dateRange,
      },
      include: {
        employee: true,
      },
    });

    // 按员工统计
    const employeeStats: Record<number, { employeeId: number, name: string, count: number }> = {};
    for (const schedule of schedules) {
      if (!employeeStats[schedule.employeeId]) {
        employeeStats[schedule.employeeId] = {
          employeeId: schedule.employeeId,
          name: schedule.employee?.name || "未知员工",
          count: 0,
        };
      }
      employeeStats[schedule.employeeId].count += 1;
    }

    // 按日期统计
    const dateStats: Record<string, number> = {};
    for (const schedule of schedules) {
      const dateStr = schedule.date.toISOString().split("T")[0];
      dateStats[dateStr] = (dateStats[dateStr] || 0) + 1;
    }

    return {
      total: schedules.length,
      employeeStats: Object.values(employeeStats),
      dateStats,
    };
  } catch (error) {
    console.error("Error fetching schedule stats:", error);
    throw new Error("Failed to fetch schedule stats");
  }
}

/**
 * 清除所有排班
 *
 * 删除系统中的所有排班记录。此操作不可恢复，请谨慎使用。
 *
 * @returns 操作结果，包含删除的记录数
 *
 * @example
 * ```typescript
 * // 清除所有排班
 * const result = await clearAllSchedules();
 * console.log(`已删除 ${result.deleted} 条排班记录`);
 * ```
 *
 * @throws 如果删除失败，会抛出错误
 *
 * @category 删除
 */
export async function clearAllSchedules() {
  try {
    // 删除所有排班记录
    const result = await prisma.schedule.deleteMany({});

    // 刷新排班页面
    revalidatePath("/schedule");

    return {
      success: true,
      deleted: result.count,
    };
  } catch (error) {
    console.error("Error clearing all schedules:", error);
    const appError = await ErrorUtils.handleError(error, "schedule-management");
    throw appError;
  }
}

/**
 * 获取排班模板列表
 *
 * 获取所有排班模板。
 *
 * @returns 排班模板列表
 *
 * @example
 * ```typescript
 * // 获取所有排班模板
 * const templates = await getScheduleTemplates();
 * console.log(`共有 ${templates.length} 个排班模板`);
 * ```
 *
 * @throws 如果获取失败，会抛出错误
 *
 * @category 查询
 */
export async function getScheduleTemplates() {
  try {
    // 获取所有排班模板
    const templates = await prisma.scheduleTemplate.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return templates;
  } catch (error) {
    console.error("Error fetching schedule templates:", error);
    const appError = await ErrorUtils.handleError(error, "schedule-management");
    throw appError;
  }
}

/**
 * 创建排班模板
 *
 * 创建或更新排班模板。
 *
 * @param data - 模板数据
 * @returns 创建或更新的模板
 *
 * @example
 * ```typescript
 * // 创建新模板
 * const template = await createScheduleTemplate({
 *   name: "标准工作日",
 *   startTime: "09:00",
 *   endTime: "17:00",
 *   weekdays: [1, 2, 3, 4, 5],
 *   employeeIds: [1, 2, 3],
 *   isDefault: true
 * });
 * console.log(`模板 ${template.name} 已创建`);
 * ```
 *
 * @throws 如果创建失败，会抛出错误
 *
 * @category 创建
 */
export async function createScheduleTemplate(data: any) {
  try {
    // 验证必填字段
    if (!data.name) {
      throw new ErrorUtils.ValidationError("模板名称不能为空", { name: data.name }, "schedule-management");
    }

    if (!data.startTime) {
      throw new ErrorUtils.ValidationError("开始时间不能为空", { startTime: data.startTime }, "schedule-management");
    }

    if (!data.endTime) {
      throw new ErrorUtils.ValidationError("结束时间不能为空", { endTime: data.endTime }, "schedule-management");
    }

    if (!data.weekdays || !Array.isArray(data.weekdays) || data.weekdays.length === 0) {
      throw new ErrorUtils.ValidationError("至少选择一天", { weekdays: data.weekdays }, "schedule-management");
    }

    // 如果设置为默认模板，则将其他模板设置为非默认
    if (data.isDefault) {
      await prisma.scheduleTemplate.updateMany({
        where: {
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // 转换数据类型
    const templateData = {
      name: data.name,
      startTime: data.startTime,
      endTime: data.endTime,
      weekdays: data.weekdays.map(day => parseInt(day)),
      employeeIds: data.employeeIds ? data.employeeIds.map(id => parseInt(id)) : [],
      isDefault: data.isDefault || false,
    };

    let template;

    // 如果有ID，则更新现有模板
    if (data.id) {
      template = await prisma.scheduleTemplate.update({
        where: { id: parseInt(data.id) },
        data: templateData,
      });
    } else {
      // 否则创建新模板
      template = await prisma.scheduleTemplate.create({
        data: templateData,
      });
    }

    // 刷新排班页面
    revalidatePath("/schedule");

    return template;
  } catch (error) {
    console.error("Error creating schedule template:", error);
    const appError = await ErrorUtils.handleError(error, "schedule-management");
    throw appError;
  }
}

/**
 * 删除排班模板
 *
 * 删除指定ID的排班模板。
 *
 * @param id - 模板ID
 * @returns 操作结果
 *
 * @example
 * ```typescript
 * // 删除模板
 * const result = await deleteScheduleTemplate(1);
 * console.log(result.success ? "模板已删除" : "删除失败");
 * ```
 *
 * @throws 如果删除失败，会抛出错误
 *
 * @category 删除
 */
export async function deleteScheduleTemplate(id: number) {
  try {
    // 检查模板是否存在
    const template = await prisma.scheduleTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new ErrorUtils.NotFoundError("模板不存在", { id }, "schedule-management");
    }

    // 删除模板
    await prisma.scheduleTemplate.delete({
      where: { id },
    });

    // 刷新排班页面
    revalidatePath("/schedule");

    return { success: true };
  } catch (error) {
    console.error("Error deleting schedule template:", error);
    const appError = await ErrorUtils.handleError(error, "schedule-management");
    throw appError;
  }
}
