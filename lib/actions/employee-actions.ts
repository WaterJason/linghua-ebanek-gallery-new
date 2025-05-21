/**
 * 员工管理模块
 *
 * 本模块提供员工管理相关的功能，包括员工的增删改查、薪资管理等。
 *
 * @module 员工管理
 * @category 核心模块
 */

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  PrismaEmployee,
  CreateEmployeeInput,
  UpdateEmployeeInput
} from "@/types/prisma-models";
import { validateCreateEmployee, validateUpdateEmployee } from "@/lib/validation";
import { findRecord, findRecords, createRecord, updateRecord } from "@/lib/prisma-wrapper";

/**
 * 获取所有员工
 *
 * 获取所有员工的列表，按ID升序排序。
 *
 * @returns 员工列表
 *
 * @example
 * ```typescript
 * // 获取所有员工
 * const employees = await getEmployees();
 * console.log(employees[0].name); // 输出第一个员工的名称
 * ```
 *
 * @throws 如果获取员工失败，会抛出错误
 *
 * @category 查询
 */
export async function getEmployees(): Promise<PrismaEmployee[]> {
  try {
    // 使用类型安全的包装函数获取员工
    const employees = await findRecords('employee', {
      orderBy: {
        id: "asc",
      },
    });

    return employees as PrismaEmployee[];
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw new Error("Failed to fetch employees");
  }
}

/**
 * 创建员工
 *
 * 创建新的员工记录，并可选择关联用户。
 *
 * @param data - 员工创建数据
 * @returns 创建的员工
 *
 * @example
 * ```typescript
 * // 创建新员工
 * const employee = await createEmployee({
 *   name: '张三',
 *   position: '销售经理',
 *   phone: '13800138000',
 *   dailySalary: 200
 * });
 * console.log(employee.id); // 输出新创建的员工ID
 * ```
 *
 * @throws 如果验证失败或创建失败，会抛出错误
 *
 * @category 创建
 */
export async function createEmployee(data: CreateEmployeeInput): Promise<PrismaEmployee> {
  try {
    // 验证数据
    const validation = validateCreateEmployee(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    // 确保 dailySalary 是数字类型
    const dailySalaryValue = typeof data.dailySalary === 'string' ? parseFloat(data.dailySalary) : data.dailySalary;

    if (isNaN(dailySalaryValue)) {
      throw new Error("日薪必须是有效的数字");
    }

    // 使用类型安全的包装函数创建员工
    const employee = await createRecord('employee', {
      name: data.name,
      position: data.position,
      phone: data.phone || null,
      email: data.email || null,
      dailySalary: dailySalaryValue,
      status: data.status || "active",
    });

    // 如果提供了用户ID，关联用户
    if (data.userId) {
      await prisma.user.update({
        where: { id: data.userId },
        data: {
          employeeId: employee.id,
        },
      });
    }

    revalidatePath("/employees");
    return employee as PrismaEmployee;
  } catch (error) {
    console.error("Error creating employee:", error);
    // 提供更详细的错误信息
    if (error instanceof Error) {
      console.error("Error details:", error.stack);
      throw new Error(error.message);
    } else {
      throw new Error("Failed to create employee");
    }
  }
}

/**
 * 更新员工
 *
 * 更新员工信息，并可选择关联或解除关联用户。
 *
 * @param id - 员工ID
 * @param data - 员工更新数据
 * @returns 更新后的员工
 *
 * @example
 * ```typescript
 * // 更新员工信息
 * const updatedEmployee = await updateEmployee(1, {
 *   name: '李四',
 *   position: '销售总监',
 *   dailySalary: 300
 * });
 * console.log(updatedEmployee.name); // 输出更新后的员工名称
 * ```
 *
 * @throws 如果验证失败、员工不存在或更新失败，会抛出错误
 *
 * @category 更新
 */
export async function updateEmployee(id: number, data: UpdateEmployeeInput): Promise<PrismaEmployee> {
  try {
    // 验证数据
    const validation = validateUpdateEmployee(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    // 检查员工是否存在
    const existingEmployee = await findRecord('employee', id);

    if (!existingEmployee) {
      throw new Error("员工不存在");
    }

    // 准备更新数据
    const updateData: any = {};

    // 只更新提供的字段
    if (data.name !== undefined) updateData.name = data.name;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.dailySalary !== undefined) updateData.dailySalary = typeof data.dailySalary === 'string' ? parseFloat(data.dailySalary) : data.dailySalary;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.salary !== undefined) updateData.salary = data.salary !== null ? (typeof data.salary === 'string' ? parseFloat(data.salary) : data.salary) : null;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.emergencyContact !== undefined) updateData.emergencyContact = data.emergencyContact;
    if (data.emergencyPhone !== undefined) updateData.emergencyPhone = data.emergencyPhone;
    if (data.idNumber !== undefined) updateData.idNumber = data.idNumber;
    if (data.bankAccount !== undefined) updateData.bankAccount = data.bankAccount;
    if (data.bankName !== undefined) updateData.bankName = data.bankName;

    // 使用类型安全的包装函数更新员工
    const employee = await updateRecord('employee', id, updateData);

    // 如果提供了用户ID，关联或解除关联用户
    if (data.userId !== undefined) {
      if (data.userId) {
        // 关联新用户
        await prisma.user.update({
          where: { id: data.userId },
          data: {
            employeeId: employee.id,
          },
        });
      } else {
        // 查找关联的用户并解除关联
        const associatedUser = await prisma.user.findFirst({
          where: { employeeId: employee.id },
        });

        if (associatedUser) {
          await prisma.user.update({
            where: { id: associatedUser.id },
            data: {
              employeeId: null,
            },
          });
        }
      }
    }

    revalidatePath("/employees");
    return employee as PrismaEmployee;
  } catch (error) {
    console.error("Error updating employee:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update employee");
  }
}

/**
 * 删除员工
 * @param id 员工ID
 * @returns 操作结果
 */
export async function deleteEmployee(id: number): Promise<{ success: boolean }> {
  try {
    // 检查员工是否存在
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      throw new Error("员工不存在");
    }

    // 检查员工是否有关联的订单
    const orderCount = await prisma.order.count({
      where: { employeeId: id },
    });

    if (orderCount > 0) {
      throw new Error("员工有关联订单，无法删除");
    }

    // 检查员工是否有关联的采购订单
    const purchaseOrderCount = await prisma.purchaseOrder.count({
      where: { employeeId: id },
    });

    if (purchaseOrderCount > 0) {
      throw new Error("员工有关联采购订单，无法删除");
    }

    // 检查员工是否有关联的工作坊
    const workshopCount = await prisma.workshop.count({
      where: {
        OR: [
          { teacherId: id },
          { assistantId: id },
        ],
      },
    });

    if (workshopCount > 0) {
      throw new Error("员工有关联工作坊，无法删除");
    }

    // 查找关联的用户并解除关联
    const associatedUser = await prisma.user.findFirst({
      where: { employeeId: id },
    });

    if (associatedUser) {
      await prisma.user.update({
        where: { id: associatedUser.id },
        data: {
          employeeId: null,
        },
      });
    }

    // 删除员工
    await prisma.employee.delete({
      where: { id },
    });

    revalidatePath("/employees");
    return { success: true };
  } catch (error) {
    console.error("Error deleting employee:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete employee");
  }
}

/**
 * 获取薪资记录
 *
 * 获取薪资记录列表，可以按员工ID、年份和月份筛选。
 *
 * @param employeeId - 可选的员工ID筛选条件
 * @param year - 可选的年份筛选条件
 * @param month - 可选的月份筛选条件
 * @returns 薪资记录列表
 *
 * @example
 * ```typescript
 * // 获取所有薪资记录
 * const allRecords = await getSalaryRecords();
 *
 * // 获取特定员工的薪资记录
 * const employeeRecords = await getSalaryRecords(1);
 *
 * // 获取特定年份的薪资记录
 * const yearRecords = await getSalaryRecords(undefined, 2023);
 *
 * // 获取特定年月的薪资记录
 * const monthRecords = await getSalaryRecords(undefined, 2023, 7);
 * ```
 *
 * @throws 如果获取薪资记录失败，会抛出错误
 *
 * @category 查询
 */
export async function getSalaryRecords(employeeId?: number, year?: number, month?: number) {
  try {
    // 构建查询条件
    let whereClause: any = {};

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (year) {
      whereClause.year = year;
    }

    if (month) {
      whereClause.month = month;
    }

    // 获取薪资记录
    const salaryRecords = await prisma.salaryRecord.findMany({
      where: whereClause,
      include: {
        employee: true,
      },
      orderBy: [
        { year: "desc" },
        { month: "desc" },
        { employeeId: "asc" },
      ],
    });

    return salaryRecords;
  } catch (error) {
    console.error("Error fetching salary records:", error);
    throw new Error("Failed to fetch salary records");
  }
}

/**
 * 获取单个薪资记录
 */
export async function getSalaryRecord(id: number) {
  try {
    const salaryRecord = await prisma.salaryRecord.findUnique({
      where: { id },
      include: {
        employee: true,
        adjustments: true,
      },
    });

    if (!salaryRecord) {
      throw new Error("薪资记录不存在");
    }

    return salaryRecord;
  } catch (error) {
    console.error("Error fetching salary record:", error);
    throw new Error("Failed to fetch salary record");
  }
}

/**
 * 创建薪资记录
 *
 * 创建新的薪资记录。
 *
 * @param data - 薪资记录数据
 * @returns 创建的薪资记录
 *
 * @example
 * ```typescript
 * // 创建新薪资记录
 * const record = await createSalaryRecord({
 *   employeeId: 1,
 *   year: 2023,
 *   month: 7,
 *   baseSalary: 5000,
 *   status: "draft"
 * });
 * console.log(`薪资记录已创建，ID: ${record.id}`);
 * ```
 *
 * @throws 如果验证失败或创建失败，会抛出错误
 *
 * @category 创建
 */
export async function createSalaryRecord(data: any) {
  try {
    // 验证必填字段
    if (!data.employeeId || !data.year || !data.month) {
      throw new Error("员工ID、年份和月份为必填项");
    }

    // 检查员工是否存在
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(data.employeeId) },
    });

    if (!employee) {
      throw new Error("员工不存在");
    }

    // 检查是否已存在相同员工和年月的记录
    const existingRecord = await prisma.salaryRecord.findFirst({
      where: {
        employeeId: parseInt(data.employeeId),
        year: parseInt(data.year),
        month: parseInt(data.month),
      },
    });

    if (existingRecord) {
      throw new Error(`该员工在${data.year}年${data.month}月已有薪资记录`);
    }

    // 创建薪资记录
    const salaryRecord = await prisma.salaryRecord.create({
      data: {
        employeeId: parseInt(data.employeeId),
        year: parseInt(data.year),
        month: parseInt(data.month),
        baseSalary: parseFloat(data.baseSalary || "0"),
        scheduleSalary: parseFloat(data.scheduleSalary || "0"),
        salesCommission: parseFloat(data.salesCommission || "0"),
        pieceWorkIncome: parseFloat(data.pieceWorkIncome || "0"),
        workshopIncome: parseFloat(data.workshopIncome || "0"),
        coffeeShiftCommission: parseFloat(data.coffeeShiftCommission || "0"),
        overtimePay: parseFloat(data.overtimePay || "0"),
        bonus: parseFloat(data.bonus || "0"),
        deductions: parseFloat(data.deductions || "0"),
        socialInsurance: parseFloat(data.socialInsurance || "0"),
        tax: parseFloat(data.tax || "0"),
        totalIncome: parseFloat(data.totalIncome || "0"),
        netIncome: parseFloat(data.netIncome || "0"),
        status: data.status || "draft",
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
        notes: data.notes || null,
      },
    });

    revalidatePath("/salary");
    return salaryRecord;
  } catch (error) {
    console.error("Error creating salary record:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create salary record");
  }
}

/**
 * 更新薪资记录
 *
 * 更新现有薪资记录。
 *
 * @param id - 薪资记录ID
 * @param data - 薪资记录更新数据
 * @returns 更新后的薪资记录
 *
 * @example
 * ```typescript
 * // 更新薪资记录
 * const updatedRecord = await updateSalaryRecord(1, {
 *   baseSalary: 5500,
 *   status: "confirmed"
 * });
 * console.log(`薪资记录已更新，状态: ${updatedRecord.status}`);
 * ```
 *
 * @throws 如果薪资记录不存在或更新失败，会抛出错误
 *
 * @category 更新
 */
export async function updateSalaryRecord(id: number, data: any) {
  try {
    // 检查薪资记录是否存在
    const existingRecord = await prisma.salaryRecord.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      throw new Error("薪资记录不存在");
    }

    // 更新薪资记录
    const salaryRecord = await prisma.salaryRecord.update({
      where: { id },
      data: {
        baseSalary: data.baseSalary !== undefined ? parseFloat(data.baseSalary) : existingRecord.baseSalary,
        scheduleSalary: data.scheduleSalary !== undefined ? parseFloat(data.scheduleSalary) : existingRecord.scheduleSalary,
        salesCommission: data.salesCommission !== undefined ? parseFloat(data.salesCommission) : existingRecord.salesCommission,
        pieceWorkIncome: data.pieceWorkIncome !== undefined ? parseFloat(data.pieceWorkIncome) : existingRecord.pieceWorkIncome,
        workshopIncome: data.workshopIncome !== undefined ? parseFloat(data.workshopIncome) : existingRecord.workshopIncome,
        coffeeShiftCommission: data.coffeeShiftCommission !== undefined ? parseFloat(data.coffeeShiftCommission) : existingRecord.coffeeShiftCommission,
        overtimePay: data.overtimePay !== undefined ? parseFloat(data.overtimePay) : existingRecord.overtimePay,
        bonus: data.bonus !== undefined ? parseFloat(data.bonus) : existingRecord.bonus,
        deductions: data.deductions !== undefined ? parseFloat(data.deductions) : existingRecord.deductions,
        socialInsurance: data.socialInsurance !== undefined ? parseFloat(data.socialInsurance) : existingRecord.socialInsurance,
        tax: data.tax !== undefined ? parseFloat(data.tax) : existingRecord.tax,
        totalIncome: data.totalIncome !== undefined ? parseFloat(data.totalIncome) : existingRecord.totalIncome,
        netIncome: data.netIncome !== undefined ? parseFloat(data.netIncome) : existingRecord.netIncome,
        status: data.status || existingRecord.status,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : existingRecord.paymentDate,
        notes: data.notes !== undefined ? data.notes : existingRecord.notes,
      },
    });

    revalidatePath("/salary");
    return salaryRecord;
  } catch (error) {
    console.error("Error updating salary record:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update salary record");
  }
}

/**
 * 删除薪资记录
 */
export async function deleteSalaryRecord(id: number) {
  try {
    // 检查薪资记录是否存在
    const existingRecord = await prisma.salaryRecord.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      throw new Error("薪资记录不存在");
    }

    // 删除调整项
    await prisma.salaryAdjustment.deleteMany({
      where: { salaryRecordId: id },
    });

    // 删除薪资记录
    await prisma.salaryRecord.delete({
      where: { id },
    });

    revalidatePath("/salary");
    return { success: true };
  } catch (error) {
    console.error("Error deleting salary record:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete salary record");
  }
}

/**
 * 创建薪资调整
 */
export async function createSalaryAdjustment(data: any) {
  try {
    // 验证必填字段
    if (!data.salaryRecordId || !data.type || data.amount === undefined) {
      throw new Error("薪资记录ID、类型和金额为必填项");
    }

    // 检查薪资记录是否存在
    const salaryRecord = await prisma.salaryRecord.findUnique({
      where: { id: parseInt(data.salaryRecordId) },
    });

    if (!salaryRecord) {
      throw new Error("薪资记录不存在");
    }

    // 创建薪资调整
    const adjustment = await prisma.salaryAdjustment.create({
      data: {
        salaryRecordId: parseInt(data.salaryRecordId),
        type: data.type,
        amount: parseFloat(data.amount),
        reason: data.reason || "",
      },
    });

    // 更新薪资记录的总收入和净收入
    let totalIncome = salaryRecord.baseSalary + salaryRecord.scheduleSalary +
                      salaryRecord.salesCommission + salaryRecord.pieceWorkIncome +
                      salaryRecord.workshopIncome + salaryRecord.coffeeShiftCommission +
                      salaryRecord.overtimePay + salaryRecord.bonus;

    let netIncome = totalIncome - salaryRecord.deductions - salaryRecord.socialInsurance - salaryRecord.tax;

    // 更新薪资记录
    await prisma.salaryRecord.update({
      where: { id: salaryRecord.id },
      data: {
        totalIncome,
        netIncome,
      },
    });

    revalidatePath("/salary");
    return adjustment;
  } catch (error) {
    console.error("Error creating salary adjustment:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create salary adjustment");
  }
}

/**
 * 获取薪资调整
 */
export async function getSalaryAdjustments(salaryRecordId: number) {
  try {
    const adjustments = await prisma.salaryAdjustment.findMany({
      where: { salaryRecordId },
      orderBy: {
        createdAt: "desc",
      },
    });

    return adjustments;
  } catch (error) {
    console.error("Error fetching salary adjustments:", error);
    throw new Error("Failed to fetch salary adjustments");
  }
}

/**
 * 计算薪资
 *
 * 为指定月份的所有活跃员工创建薪资记录。
 *
 * @param month - 月份字符串，格式为"YYYY-MM"
 * @returns 操作结果，包含每个员工的处理状态
 *
 * @example
 * ```typescript
 * // 计算2023年7月的薪资
 * const results = await calculatePayroll("2023-07");
 * console.log(`成功创建 ${results.filter(r => r.status === "created").length} 条薪资记录`);
 * ```
 *
 * @throws 如果计算薪资失败，会抛出错误
 *
 * @category 创建
 */
export async function calculatePayroll(month: string) {
  try {
    const [year, monthNum] = month.split("-");
    const yearValue = parseInt(year);
    const monthValue = parseInt(monthNum);

    // 获取所有员工
    const employees = await prisma.employee.findMany({
      where: {
        status: "active",
      },
    });

    const results = [];

    // 为每个员工计算薪资
    for (const employee of employees) {
      // 检查是否已存在该月薪资记录
      const existingRecord = await prisma.salaryRecord.findFirst({
        where: {
          employeeId: employee.id,
          year: yearValue,
          month: monthValue,
        },
      });

      if (existingRecord) {
        results.push({
          employeeId: employee.id,
          employeeName: employee.name,
          status: "exists",
          message: "薪资记录已存在",
        });
        continue;
      }

      // 创建薪资记录
      const salaryRecord = await prisma.salaryRecord.create({
        data: {
          employeeId: employee.id,
          year: yearValue,
          month: monthValue,
          baseSalary: employee.dailySalary * 22 || 0, // 使用日薪乘以默认工作日数(22天)
          scheduleSalary: 0,
          salesCommission: 0,
          pieceWorkIncome: 0,
          workshopIncome: 0,
          coffeeShiftCommission: 0,
          overtimePay: 0,
          bonus: 0,
          deductions: 0,
          socialInsurance: 0,
          tax: 0,
          totalIncome: employee.dailySalary * 22 || 0,
          netIncome: employee.dailySalary * 22 || 0,
          status: "draft",
          notes: `自动生成的${yearValue}年${monthValue}月薪资记录`,
        },
      });

      results.push({
        employeeId: employee.id,
        employeeName: employee.name,
        status: "created",
        salaryRecordId: salaryRecord.id,
      });
    }

    revalidatePath("/salary");
    return results;
  } catch (error) {
    console.error("Error calculating payroll:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to calculate payroll");
  }
}
