"use server";

import { revalidatePath } from "next/cache";
import { createRecord, updateRecord, deleteRecord, findRecords, findRecord } from "@/lib/prisma-wrapper";

/**
 * 获取所有员工
 */
export async function getEmployees() {
  try {
    return await findRecords('employee', {
      include: {
        user: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw new Error("Failed to fetch employees");
  }
}

/**
 * 创建员工
 */
export async function createEmployee(data: any) {
  try {
    // 验证必填字段
    if (!data.name) {
      throw new Error("员工姓名为必填项");
    }

    // 创建员工
    const employee = await createRecord('employee', {
      name: data.name,
      position: data.position || "",
      phone: data.phone || "",
      email: data.email || "",
      status: data.status || "active",
      salary: data.salary ? parseFloat(data.salary) : null,
      dailySalary: data.dailySalary ? parseFloat(data.dailySalary) : 0,
      address: data.address || "",
      emergencyContact: data.emergencyContact || "",
      emergencyPhone: data.emergencyPhone || "",
      idNumber: data.idNumber || "",
      bankAccount: data.bankAccount || "",
      bankName: data.bankName || "",
      // 移除 notes 字段，因为 Employee 模型中没有这个字段
    });

    // 如果提供了用户ID，关联用户
    if (data.userId) {
      await updateRecord('user', data.userId, {
        employeeId: employee.id,
      });
    }

    revalidatePath("/employees");
    return employee;
  } catch (error) {
    console.error("Error creating employee:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create employee");
  }
}

/**
 * 更新员工
 */
export async function updateEmployee(id: number, data: any) {
  try {
    // 检查员工是否存在
    const existingEmployee = await findRecord('employee', id);

    if (!existingEmployee) {
      throw new Error("员工不存在");
    }

    // 更新员工
    const employee = await updateRecord('employee', id, {
      name: data.name || existingEmployee.name,
      position: data.position !== undefined ? data.position : existingEmployee.position,
      phone: data.phone !== undefined ? data.phone : existingEmployee.phone,
      email: data.email !== undefined ? data.email : existingEmployee.email,
      status: data.status || existingEmployee.status,
      salary: data.salary !== undefined ? parseFloat(data.salary) : existingEmployee.salary,
      dailySalary: data.dailySalary !== undefined ? parseFloat(data.dailySalary) : existingEmployee.dailySalary,
      address: data.address !== undefined ? data.address : existingEmployee.address,
      emergencyContact: data.emergencyContact !== undefined ? data.emergencyContact : existingEmployee.emergencyContact,
      emergencyPhone: data.emergencyPhone !== undefined ? data.emergencyPhone : existingEmployee.emergencyPhone,
      idNumber: data.idNumber !== undefined ? data.idNumber : existingEmployee.idNumber,
      bankAccount: data.bankAccount !== undefined ? data.bankAccount : existingEmployee.bankAccount,
      bankName: data.bankName !== undefined ? data.bankName : existingEmployee.bankName,
      // 移除 notes 字段，因为 Employee 模型中没有这个字段
    });

    // 如果提供了用户ID，关联或解除关联用户
    if (data.userId !== undefined) {
      if (data.userId) {
        // 关联新用户
        await updateRecord('user', data.userId, {
          employeeId: employee.id,
        });
      } else {
        // 查找关联的用户并解除关联
        const associatedUser = await findRecords('user', {
          where: { employeeId: employee.id },
          take: 1,
        });

        if (associatedUser.length > 0) {
          await updateRecord('user', associatedUser[0].id, {
            employeeId: null,
          });
        }
      }
    }

    revalidatePath("/employees");
    return employee;
  } catch (error) {
    console.error("Error updating employee:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update employee");
  }
}

/**
 * 删除员工
 */
export async function deleteEmployee(id: number) {
  try {
    // 检查员工是否存在
    const existingEmployee = await findRecord('employee', id);

    if (!existingEmployee) {
      throw new Error("员工不存在");
    }

    // 查找关联的用户并解除关联
    const associatedUser = await findRecords('user', {
      where: { employeeId: id },
      take: 1,
    });

    if (associatedUser.length > 0) {
      await updateRecord('user', associatedUser[0].id, {
        employeeId: null,
      });
    }

    // 删除员工
    await deleteRecord('employee', id);

    revalidatePath("/employees");
    return { success: true };
  } catch (error) {
    console.error("Error deleting employee:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete employee");
  }
}
