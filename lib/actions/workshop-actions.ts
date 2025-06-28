/**
 * 工作坊管理模块
 *
 * 本模块提供工作坊管理相关的功能，包括工作坊活动的增删改查、工作坊渠道管理、工作坊讲师管理等。
 *
 * @module 工作坊管理
 * @category 核心模块
 */

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  PrismaWorkshopActivity,
  PrismaWorkshopChannel,
  PrismaWorkshopInstructor,
  CreateWorkshopActivityInput,
  UpdateWorkshopActivityInput,
  CreateWorkshopChannelInput,
  UpdateWorkshopChannelInput,
  CreateWorkshopInstructorInput,
  UpdateWorkshopInstructorInput
} from "@/types/prisma-models";
import {
  validateCreateWorkshopActivity,
  validateUpdateWorkshopActivity,
  validateCreateWorkshopChannel,
  validateUpdateWorkshopChannel,
  validateCreateWorkshopInstructor,
  validateUpdateWorkshopInstructor
} from "@/lib/validation";
import { findRecord, findRecords, createRecord, updateRecord } from "@/lib/prisma-wrapper";
import { createWorkshop as createWorkshopOrder } from "@/lib/actions/workshop-order-actions";

/**
 * 获取所有团建活动
 *
 * 获取所有团建活动，可以根据状态和日期范围筛选。
 *
 * @param status - 活动状态
 * @param startDate - 开始日期
 * @param endDate - 结束日期
 * @returns 团建活动列表，包含渠道、讲师、助理和参与者信息
 *
 * @example
 * ```typescript
 * // 获取所有团建活动
 * const activities = await getWorkshopActivities();
 *
 * // 获取待处理的团建活动
 * const pendingActivities = await getWorkshopActivities('pending');
 *
 * // 获取指定日期范围的团建活动
 * const rangeActivities = await getWorkshopActivities(undefined, '2023-01-01', '2023-12-31');
 * ```
 *
 * @throws 如果获取团建活动失败，会抛出错误
 *
 * @category 查询
 */
export async function getWorkshopActivities(status?: string, startDate?: string, endDate?: string): Promise<PrismaWorkshopActivity[]> {
  try {
    // 构建查询条件
    let whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

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

    // 使用类型安全的包装函数获取团建活动
    const activities = await findRecords('workshopActivity', {
      where: whereClause,
      include: {
        channel: true,
        instructor: true,
        assistant: true,
        participants: {
          include: {
            participant: true,
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

    return activities.map(activity => ({
      ...activity,
      participants: activity.participants.map(p => p.participant),
    })) as PrismaWorkshopActivity[];
  } catch (error) {
    console.error("Error fetching workshop activities:", error);
    throw new Error("Failed to fetch workshop activities");
  }
}

/**
 * 获取单个团建活动
 *
 * 根据ID获取单个团建活动的详细信息。
 *
 * @param id - 团建活动ID
 * @returns 团建活动详细信息，包含渠道、讲师、助理和参与者信息
 *
 * @example
 * ```typescript
 * // 获取ID为1的团建活动
 * const activity = await getWorkshopActivity(1);
 * console.log(activity.title); // 输出活动标题
 * console.log(activity.participants.length); // 输出参与者数量
 * ```
 *
 * @throws 如果团建活动不存在或获取失败，会抛出错误
 *
 * @category 查询
 */
export async function getWorkshopActivity(id: number): Promise<PrismaWorkshopActivity> {
  try {
    // 使用类型安全的包装函数获取团建活动
    const activity = await findRecord('workshopActivity', id, {
      include: {
        channel: true,
        instructor: true,
        assistant: true,
        participants: {
          include: {
            participant: true,
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
    });

    if (!activity) {
      throw new Error("团建活动不存在");
    }

    return {
      ...activity,
      participants: activity.participants.map(p => p.participant),
    } as PrismaWorkshopActivity;
  } catch (error) {
    console.error("Error fetching workshop activity:", error);
    throw new Error("Failed to fetch workshop activity");
  }
}

/**
 * 创建团建活动
 *
 * 创建新的团建活动，并关联参与者。
 *
 * @param data - 团建活动创建数据
 * @returns 创建的团建活动
 *
 * @example
 * ```typescript
 * // 创建新的团建活动
 * const activity = await createWorkshopActivity({
 *   title: '团建活动1',
 *   date: '2023-06-01',
 *   channelId: 1,
 *   instructorId: 1,
 *   participantIds: [1, 2, 3]
 * });
 * console.log(activity.id); // 输出新创建的活动ID
 * ```
 *
 * @throws 如果验证失败或创建失败，会抛出错误
 *
 * @category 创建
 */
export async function createWorkshopActivity(data: CreateWorkshopActivityInput): Promise<PrismaWorkshopActivity> {
  try {
    // 验证数据
    const validation = validateCreateWorkshopActivity(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    // 准备创建数据
    const createData: any = {
      title: data.title,
      date: data.date instanceof Date ? data.date : new Date(data.date),
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      location: data.location || null,
      description: data.description || null,
      channelId: data.channelId ? Number(data.channelId) : null,
      instructorId: data.instructorId ? Number(data.instructorId) : null,
      assistantId: data.assistantId ? Number(data.assistantId) : null,
      participantCount: data.participantCount ? Number(data.participantCount) : null,
      fee: data.fee ? Number(data.fee) : null,
      status: data.status || "pending",
      notes: data.notes || null,
      createdById: data.createdById || null,
    };

    // 使用类型安全的包装函数创建团建活动
    const activity = await createRecord('workshopActivity', createData);

    // 如果提供了参与者，添加参与者
    if (data.participantIds && Array.isArray(data.participantIds) && data.participantIds.length > 0) {
      await prisma.workshopParticipant.createMany({
        data: data.participantIds.map(participantId => ({
          activityId: activity.id,
          participantId: Number(participantId),
        })),
        skipDuplicates: true,
      });
    }

    revalidatePath("/workshop");
    return activity as PrismaWorkshopActivity;
  } catch (error) {
    console.error("Error creating workshop activity:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create workshop activity");
  }
}

/**
 * 更新团建活动
 *
 * 更新团建活动信息，并可选择更新参与者。
 *
 * @param id - 团建活动ID
 * @param data - 团建活动更新数据
 * @returns 更新后的团建活动
 *
 * @example
 * ```typescript
 * // 更新团建活动
 * const activity = await updateWorkshopActivity(1, {
 *   title: '更新后的团建活动',
 *   date: '2023-07-01',
 *   status: 'confirmed',
 *   participantIds: [1, 2, 3, 4]
 * });
 * console.log(activity.title); // 输出更新后的活动标题
 * ```
 *
 * @throws 如果验证失败、团建活动不存在或更新失败，会抛出错误
 *
 * @category 更新
 */
export async function updateWorkshopActivity(id: number, data: UpdateWorkshopActivityInput): Promise<PrismaWorkshopActivity> {
  try {
    // 验证数据
    const validation = validateUpdateWorkshopActivity(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    // 检查团建活动是否存在
    const existingActivity = await findRecord('workshopActivity', id);

    if (!existingActivity) {
      throw new Error("团建活动不存在");
    }

    // 准备更新数据
    const updateData: any = {};

    // 只更新提供的字段
    if (data.title !== undefined) updateData.title = data.title;
    if (data.date !== undefined) updateData.date = data.date instanceof Date ? data.date : new Date(data.date);
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.channelId !== undefined) updateData.channelId = data.channelId ? Number(data.channelId) : null;
    if (data.instructorId !== undefined) updateData.instructorId = data.instructorId ? Number(data.instructorId) : null;
    if (data.assistantId !== undefined) updateData.assistantId = data.assistantId ? Number(data.assistantId) : null;
    if (data.participantCount !== undefined) updateData.participantCount = data.participantCount ? Number(data.participantCount) : null;
    if (data.fee !== undefined) updateData.fee = data.fee ? Number(data.fee) : null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // 使用类型安全的包装函数更新团建活动
    const activity = await updateRecord('workshopActivity', id, updateData);

    // 如果提供了参与者，更新参与者
    if (data.participantIds !== undefined) {
      // 删除现有参与者
      await prisma.workshopParticipant.deleteMany({
        where: { activityId: id },
      });

      // 添加新参与者
      if (data.participantIds && Array.isArray(data.participantIds) && data.participantIds.length > 0) {
        await prisma.workshopParticipant.createMany({
          data: data.participantIds.map((participantId: number) => ({
            activityId: id,
            participantId: Number(participantId),
          })),
          skipDuplicates: true,
        });
      }
    }

    revalidatePath("/workshop");
    return activity as PrismaWorkshopActivity;
  } catch (error) {
    console.error("Error updating workshop activity:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update workshop activity");
  }
}

/**
 * 删除团建活动
 *
 * 删除团建活动及其相关的参与者关联。
 *
 * @param id - 团建活动ID
 * @returns 操作结果，包含成功标志
 *
 * @example
 * ```typescript
 * // 删除ID为1的团建活动
 * const result = await deleteWorkshopActivity(1);
 * if (result.success) {
 *   console.log('团建活动删除成功');
 * }
 * ```
 *
 * @throws 如果团建活动不存在或删除失败，会抛出错误
 *
 * @category 删除
 */
export async function deleteWorkshopActivity(id: number): Promise<{ success: boolean }> {
  try {
    // 检查团建活动是否存在
    const existingActivity = await findRecord('workshopActivity', id);

    if (!existingActivity) {
      throw new Error("团建活动不存在");
    }

    // 删除参与者关联
    await prisma.workshopParticipant.deleteMany({
      where: { activityId: id },
    });

    // 使用类型安全的包装函数删除团建活动
    await prisma.workshopActivity.delete({
      where: { id },
    });

    revalidatePath("/workshop");
    return { success: true };
  } catch (error) {
    console.error("Error deleting workshop activity:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete workshop activity");
  }
}

/**
 * 获取团建渠道
 */
export async function getWorkshopChannels() {
  try {
    const channels = await prisma.workshopChannel.findMany({
      include: {
        _count: {
          select: {
            activities: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return channels.map(channel => ({
      ...channel,
      activityCount: channel._count.activities,
    }));
  } catch (error) {
    console.error("Error fetching workshop channels:", error);
    throw new Error("Failed to fetch workshop channels");
  }
}

/**
 * 创建团建渠道
 */
export async function createWorkshopChannel(data: any) {
  try {
    // 验证必填字段
    if (!data.name) {
      throw new Error("渠道名称为必填项");
    }

    // 检查渠道是否已存在
    const existingChannel = await prisma.workshopChannel.findFirst({
      where: {
        name: data.name,
      },
    });

    if (existingChannel) {
      throw new Error("渠道已存在");
    }

    // 创建渠道
    const channel = await prisma.workshopChannel.create({
      data: {
        name: data.name,
        contactPerson: data.contactPerson || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        notes: data.notes || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    revalidatePath("/workshop/channels");
    return channel;
  } catch (error) {
    console.error("Error creating workshop channel:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create workshop channel");
  }
}

/**
 * 更新团建渠道
 */
export async function updateWorkshopChannel(id: number, data: any) {
  try {
    // 检查渠道是否存在
    const existingChannel = await prisma.workshopChannel.findUnique({
      where: { id },
    });

    if (!existingChannel) {
      throw new Error("渠道不存在");
    }

    // 如果更改了名称，检查是否已存在
    if (data.name && data.name !== existingChannel.name) {
      const duplicateChannel = await prisma.workshopChannel.findFirst({
        where: {
          name: data.name,
          NOT: {
            id,
          },
        },
      });

      if (duplicateChannel) {
        throw new Error("渠道名称已存在");
      }
    }

    // 更新渠道
    const channel = await prisma.workshopChannel.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : existingChannel.name,
        contactPerson: data.contactPerson !== undefined ? data.contactPerson : existingChannel.contactPerson,
        phone: data.phone !== undefined ? data.phone : existingChannel.phone,
        email: data.email !== undefined ? data.email : existingChannel.email,
        address: data.address !== undefined ? data.address : existingChannel.address,
        notes: data.notes !== undefined ? data.notes : existingChannel.notes,
        isActive: data.isActive !== undefined ? data.isActive : existingChannel.isActive,
      },
    });

    revalidatePath("/workshop/channels");
    return channel;
  } catch (error) {
    console.error("Error updating workshop channel:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update workshop channel");
  }
}

/**
 * 删除团建渠道
 */
export async function deleteWorkshopChannel(id: number) {
  try {
    // 检查渠道是否存在
    const existingChannel = await prisma.workshopChannel.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            activities: true,
          },
        },
      },
    });

    if (!existingChannel) {
      throw new Error("渠道不存在");
    }

    // 检查渠道是否有活动
    if (existingChannel._count.activities > 0) {
      throw new Error("渠道有活动记录，无法删除");
    }

    // 删除渠道
    await prisma.workshopChannel.delete({
      where: { id },
    });

    revalidatePath("/workshop/channels");
    return { success: true };
  } catch (error) {
    console.error("Error deleting workshop channel:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete workshop channel");
  }
}

/**
 * 获取团建讲师
 */
export async function getWorkshopInstructors() {
  try {
    const instructors = await prisma.workshopInstructor.findMany({
      include: {
        _count: {
          select: {
            instructedActivities: true,
            assistedActivities: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return instructors.map(instructor => ({
      ...instructor,
      instructedCount: instructor._count.instructedActivities,
      assistedCount: instructor._count.assistedActivities,
    }));
  } catch (error) {
    console.error("Error fetching workshop instructors:", error);
    throw new Error("Failed to fetch workshop instructors");
  }
}

/**
 * 创建团建讲师
 */
export async function createWorkshopInstructor(data: any) {
  try {
    // 验证必填字段
    if (!data.name) {
      throw new Error("讲师姓名为必填项");
    }

    // 创建讲师
    const instructor = await prisma.workshopInstructor.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        specialty: data.specialty || null,
        bio: data.bio || null,
        fee: data.fee ? parseFloat(data.fee) : null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    revalidatePath("/workshop/instructors");
    return instructor;
  } catch (error) {
    console.error("Error creating workshop instructor:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create workshop instructor");
  }
}

/**
 * 更新团建讲师
 */
export async function updateWorkshopInstructor(id: number, data: any) {
  try {
    // 检查讲师是否存在
    const existingInstructor = await prisma.workshopInstructor.findUnique({
      where: { id },
    });

    if (!existingInstructor) {
      throw new Error("讲师不存在");
    }

    // 更新讲师
    const instructor = await prisma.workshopInstructor.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : existingInstructor.name,
        phone: data.phone !== undefined ? data.phone : existingInstructor.phone,
        email: data.email !== undefined ? data.email : existingInstructor.email,
        specialty: data.specialty !== undefined ? data.specialty : existingInstructor.specialty,
        bio: data.bio !== undefined ? data.bio : existingInstructor.bio,
        fee: data.fee !== undefined ? (data.fee ? parseFloat(data.fee) : null) : existingInstructor.fee,
        isActive: data.isActive !== undefined ? data.isActive : existingInstructor.isActive,
      },
    });

    revalidatePath("/workshop/instructors");
    return instructor;
  } catch (error) {
    console.error("Error updating workshop instructor:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update workshop instructor");
  }
}

/**
 * 删除团建讲师
 */
export async function deleteWorkshopInstructor(id: number) {
  try {
    // 检查讲师是否存在
    const existingInstructor = await prisma.workshopInstructor.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            instructedActivities: true,
            assistedActivities: true,
          },
        },
      },
    });

    if (!existingInstructor) {
      throw new Error("讲师不存在");
    }

    // 检查讲师是否有活动
    if (existingInstructor._count.instructedActivities > 0 || existingInstructor._count.assistedActivities > 0) {
      throw new Error("讲师有活动记录，无法删除");
    }

    // 删除讲师
    await prisma.workshopInstructor.delete({
      where: { id },
    });

    revalidatePath("/workshop/instructors");
    return { success: true };
  } catch (error) {
    console.error("Error deleting workshop instructor:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete workshop instructor");
  }
}

/**
 * 获取团建参与者
 */
export async function getWorkshopParticipants() {
  try {
    const participants = await prisma.workshopParticipantInfo.findMany({
      include: {
        _count: {
          select: {
            activities: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return participants.map(participant => ({
      ...participant,
      activityCount: participant._count.activities,
    }));
  } catch (error) {
    console.error("Error fetching workshop participants:", error);
    throw new Error("Failed to fetch workshop participants");
  }
}

/**
 * 创建团建参与者
 */
export async function createWorkshopParticipant(data: any) {
  try {
    // 验证必填字段
    if (!data.name) {
      throw new Error("参与者姓名为必填项");
    }

    // 创建参与者
    const participant = await prisma.workshopParticipantInfo.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        company: data.company || null,
        position: data.position || null,
        notes: data.notes || null,
      },
    });

    revalidatePath("/workshop/participants");
    return participant;
  } catch (error) {
    console.error("Error creating workshop participant:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create workshop participant");
  }
}

/**
 * 更新团建参与者
 */
export async function updateWorkshopParticipant(id: number, data: any) {
  try {
    // 检查参与者是否存在
    const existingParticipant = await prisma.workshopParticipantInfo.findUnique({
      where: { id },
    });

    if (!existingParticipant) {
      throw new Error("参与者不存在");
    }

    // 更新参与者
    const participant = await prisma.workshopParticipantInfo.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : existingParticipant.name,
        phone: data.phone !== undefined ? data.phone : existingParticipant.phone,
        email: data.email !== undefined ? data.email : existingParticipant.email,
        company: data.company !== undefined ? data.company : existingParticipant.company,
        position: data.position !== undefined ? data.position : existingParticipant.position,
        notes: data.notes !== undefined ? data.notes : existingParticipant.notes,
      },
    });

    revalidatePath("/workshop/participants");
    return participant;
  } catch (error) {
    console.error("Error updating workshop participant:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update workshop participant");
  }
}

/**
 * 删除团建参与者
 */
export async function deleteWorkshopParticipant(id: number) {
  try {
    // 检查参与者是否存在
    const existingParticipant = await prisma.workshopParticipantInfo.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            activities: true,
          },
        },
      },
    });

    if (!existingParticipant) {
      throw new Error("参与者不存在");
    }

    // 检查参与者是否有活动
    if (existingParticipant._count.activities > 0) {
      throw new Error("参与者有活动记录，无法删除");
    }

    // 删除参与者
    await prisma.workshopParticipantInfo.delete({
      where: { id },
    });

    revalidatePath("/workshop/participants");
    return { success: true };
  } catch (error) {
    console.error("Error deleting workshop participant:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete workshop participant");
  }
}

/**
 * 获取计件工项
 *
 * 获取计件工项列表，可以根据类型筛选。
 *
 * @param type - 工项类型，可选值：accessory（配饰工项）或 enamelling（点蓝工项）
 * @returns 计件工项列表
 *
 * @example
 * ```typescript
 * // 获取所有计件工项
 * const allItems = await getPieceWorkItems();
 *
 * // 获取配饰工项
 * const accessoryItems = await getPieceWorkItems('accessory');
 *
 * // 获取点蓝工项
 * const enamellingItems = await getPieceWorkItems('enamelling');
 * ```
 *
 * @throws 如果获取计件工项失败，会抛出错误
 *
 * @category 查询
 */
export async function getPieceWorkItems(type?: string) {
  try {
    const whereClause = type ? { type } : {}

    return await prisma.pieceWorkItem.findMany({
      where: whereClause,
      orderBy: {
        id: "asc",
      },
    })
  } catch (error) {
    console.error("Error fetching piece work items:", error)
    throw new Error("Failed to fetch piece work items")
  }
}

/**
 * 创建计件工项
 *
 * 创建新的计件工项。
 *
 * @param data - 计件工项数据，包含名称、价格和类型
 * @returns 创建的计件工项
 *
 * @example
 * ```typescript
 * // 创建配饰工项
 * const newItem = await createPieceWorkItem({
 *   name: '手工编织',
 *   price: 50,
 *   type: 'accessory'
 * });
 * ```
 *
 * @throws 如果创建计件工项失败，会抛出错误
 *
 * @category 创建
 */
export async function createPieceWorkItem(data: any) {
  try {
    const pieceWorkItem = await prisma.pieceWorkItem.create({
      data: {
        name: data.name,
        price: Number.parseFloat(data.price),
        type: data.type, // accessory or enamelling
      },
    })

    revalidatePath("/settings")
    return pieceWorkItem
  } catch (error) {
    console.error("Error creating piece work item:", error)
    throw new Error("Failed to create piece work item")
  }
}

/**
 * 更新计件工项
 *
 * 更新现有的计件工项。
 *
 * @param id - 计件工项ID
 * @param data - 计件工项更新数据
 * @returns 更新后的计件工项
 *
 * @example
 * ```typescript
 * // 更新计件工项
 * const updatedItem = await updatePieceWorkItem(1, {
 *   name: '手工编织（高级）',
 *   price: 60,
 *   type: 'accessory'
 * });
 * ```
 *
 * @throws 如果更新计件工项失败，会抛出错误
 *
 * @category 更新
 */
export async function updatePieceWorkItem(id: number, data: any) {
  try {
    const pieceWorkItem = await prisma.pieceWorkItem.update({
      where: { id },
      data: {
        name: data.name,
        price: Number.parseFloat(data.price),
        type: data.type,
      },
    })

    revalidatePath("/settings")
    return pieceWorkItem
  } catch (error) {
    console.error("Error updating piece work item:", error)
    throw new Error("Failed to update piece work item")
  }
}

/**
 * 删除计件工项
 *
 * 删除计件工项。
 *
 * @param id - 计件工项ID
 * @returns 操作结果，包含成功标志
 *
 * @example
 * ```typescript
 * // 删除计件工项
 * const result = await deletePieceWorkItem(1);
 * if (result.success) {
 *   console.log('计件工项删除成功');
 * }
 * ```
 *
 * @throws 如果删除计件工项失败，会抛出错误
 *
 * @category 删除
 */
export async function deletePieceWorkItem(id: number) {
  try {
    await prisma.pieceWorkItem.delete({
      where: { id },
    })

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error deleting piece work item:", error)
    throw new Error("Failed to delete piece work item")
  }
}

/**
 * 创建计件工作记录
 *
 * 创建员工计件工作记录，包括工作类型、数量、单价等信息。
 *
 * @param data - 计件工作数据
 * @returns 创建的计件工作记录
 *
 * @example
 * ```typescript
 * // 创建计件工作记录
 * const pieceWork = await createPieceWork({
 *   employeeId: 1,
 *   date: new Date(),
 *   itemId: 2,
 *   quantity: 5,
 *   notes: "完成得很好"
 * });
 * ```
 *
 * @throws 如果创建计件工作记录失败，会抛出错误
 *
 * @category 创建
 */
export async function createPieceWork(data: any) {
  try {
    // 验证必填字段
    if (!data.employeeId) throw new Error("员工ID为必填项");
    if (!data.date) throw new Error("日期为必填项");
    if (!data.itemId) throw new Error("工项ID为必填项");
    if (!data.quantity || Number(data.quantity) <= 0) throw new Error("数量必须大于0");

    // 获取员工信息
    const employee = await prisma.employee.findUnique({
      where: { id: Number(data.employeeId) },
    });

    if (!employee) {
      throw new Error("员工不存在");
    }

    // 获取工项信息
    const pieceWorkItem = await prisma.pieceWorkItem.findUnique({
      where: { id: Number(data.itemId) },
    });

    if (!pieceWorkItem) {
      throw new Error("工项不存在");
    }

    // 计算总金额
    const amount = pieceWorkItem.price * Number(data.quantity);

    // 创建计件工作记录
    const pieceWork = await prisma.pieceWork.create({
      data: {
        employeeId: Number(data.employeeId),
        date: data.date instanceof Date ? data.date : new Date(data.date),
        itemId: Number(data.itemId),
        quantity: Number(data.quantity),
        unitPrice: pieceWorkItem.price,
        amount,
        notes: data.notes || null,
      },
    });

    // 重新验证路径
    revalidatePath("/daily-log");
    revalidatePath("/employees");
    revalidatePath(`/employees/${data.employeeId}`);

    return pieceWork;
  } catch (error) {
    console.error("Error creating piece work:", error);
    throw new Error(error instanceof Error ? error.message : "创建计件工作记录失败");
  }
}

/**
 * 创建手作团建记录
 *
 * 此函数是为了兼容旧版的数据录入表单，将其提交的数据转换为新的团建订单格式。
 *
 * @param data - 手作团建数据
 * @returns 创建的手作团建记录
 *
 * @example
 * ```typescript
 * // 创建手作团建记录
 * const workshop = await createWorkshop({
 *   date: new Date(),
 *   employee: "1",
 *   role: "teacher",
 *   locationType: "in-gallery",
 *   location: "珐琅馆一楼",
 *   participants: 10,
 *   duration: 2,
 *   notes: "团建活动"
 * });
 * ```
 *
 * @throws 如果创建手作团建记录失败，会抛出错误
 *
 * @category 创建
 */
export async function createWorkshop(data: any) {
  try {
    // 验证必填字段
    if (!data.date) throw new Error("日期为必填项");
    if (!data.employee) throw new Error("员工为必填项");
    if (!data.role) throw new Error("角色为必填项");
    if (!data.locationType) throw new Error("活动地点类型为必填项");
    if (!data.location) throw new Error("活动地点为必填项");
    if (!data.participants) throw new Error("参与人数为必填项");
    if (!data.duration) throw new Error("活动时长为必填项");

    // 获取员工信息
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(data.employee) },
    });

    if (!employee) {
      throw new Error("员工不存在");
    }

    // 准备提交的数据
    const submitData = {
      // 使用默认客户（可以是公司自己）
      customerId: 1,
      // 使用传入的日期
      date: data.date instanceof Date ? data.date : new Date(data.date),
      // 根据角色设置活动类型
      activityType: "jewelry_enameling", // 默认为饰品点蓝手作
      // 转换地点类型
      locationType: data.locationType === "in-gallery" ? "in_gallery" : "outside",
      // 默认底胎类型
      baseType: "jewelry",
      // 使用传入的地点
      location: data.location,
      // 使用传入的参与人数
      participants: typeof data.participants === 'number' ? data.participants : parseInt(data.participants),
      // 使用传入的活动时长
      duration: typeof data.duration === 'number' ? data.duration : parseFloat(data.duration),
      // 根据角色设置讲师和助理
      teacherId: data.role === "teacher" ? parseInt(data.employee) : null,
      assistantId: data.role === "assistant" ? parseInt(data.employee) : null,
      // 默认项目负责人为员工自己
      managerId: parseInt(data.employee),
      // 设置角色
      role: "jewelry_workshop",
      // 设置状态为已完成
      status: "completed",
      // 设置支付状态为已付全款
      paymentStatus: "fully_paid",
      // 默认总金额为0
      totalAmount: 0,
      depositAmount: 0,
      // 使用传入的备注
      notes: data.notes || null,
      // 默认服务项目
      serviceItems: [
        {
          productId: 1, // 默认产品ID
          quantity: 1,
          price: 0,
          notes: null
        }
      ]
    };

    // 创建团建订单
    const workshop = await createWorkshopOrder(submitData);

    revalidatePath("/daily-log");
    return workshop;
  } catch (error) {
    console.error("Error creating workshop:", error);
    throw new Error(error instanceof Error ? error.message : "创建手作团建记录失败");
  }
}

/**
 * 获取团建活动报告
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 团建活动报告数据
 */
export async function getWorkshopReport(startDate?: string, endDate?: string) {
  try {
    // 构建日期过滤条件
    let dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter = {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        }
      }
    } else if (startDate) {
      dateFilter = {
        date: {
          gte: new Date(startDate),
        }
      }
    } else if (endDate) {
      dateFilter = {
        date: {
          lte: new Date(endDate),
        }
      }
    }

    // 获取团建订单数据
    const workshopOrders = await prisma.workshopOrder.findMany({
      where: dateFilter,
      include: {
        customer: true,
        teacher: true,
        assistant: true,
        manager: true,
        serviceItems: {
          include: {
            product: true,
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // 计算统计数据
    const totalOrders = workshopOrders.length
    const totalParticipants = workshopOrders.reduce((sum, order) => sum + order.participants, 0)
    const totalRevenue = workshopOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    const totalDuration = workshopOrders.reduce((sum, order) => sum + order.duration, 0)

    // 按活动类型分组
    const byActivityType = workshopOrders.reduce((acc, order) => {
      const type = order.activityType
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          participants: 0,
          revenue: 0,
          duration: 0
        }
      }
      acc[type].count++
      acc[type].participants += order.participants
      acc[type].revenue += order.totalAmount
      acc[type].duration += order.duration
      return acc
    }, {} as Record<string, any>)

    // 按地点类型分组
    const byLocationType = workshopOrders.reduce((acc, order) => {
      const type = order.locationType
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          participants: 0,
          revenue: 0
        }
      }
      acc[type].count++
      acc[type].participants += order.participants
      acc[type].revenue += order.totalAmount
      return acc
    }, {} as Record<string, any>)

    // 按状态分组
    const byStatus = workshopOrders.reduce((acc, order) => {
      const status = order.status
      if (!acc[status]) {
        acc[status] = {
          count: 0,
          participants: 0,
          revenue: 0
        }
      }
      acc[status].count++
      acc[status].participants += order.participants
      acc[status].revenue += order.totalAmount
      return acc
    }, {} as Record<string, any>)

    return {
      summary: {
        totalOrders,
        totalParticipants,
        totalRevenue,
        totalDuration,
        averageParticipants: totalOrders > 0 ? Math.round(totalParticipants / totalOrders) : 0,
        averageRevenue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
        averageDuration: totalOrders > 0 ? Math.round(totalDuration / totalOrders * 10) / 10 : 0
      },
      byActivityType,
      byLocationType,
      byStatus,
      orders: workshopOrders.map(order => ({
        id: order.id,
        date: order.date,
        activityType: order.activityType,
        locationType: order.locationType,
        location: order.location,
        participants: order.participants,
        duration: order.duration,
        totalAmount: order.totalAmount,
        status: order.status,
        customer: order.customer?.name || 'Unknown',
        teacher: order.teacher?.name || null,
        assistant: order.assistant?.name || null,
        manager: order.manager?.name || null,
      }))
    }
  } catch (error) {
    console.error("Error getting workshop report:", error)
    return {
      summary: {
        totalOrders: 0,
        totalParticipants: 0,
        totalRevenue: 0,
        totalDuration: 0,
        averageParticipants: 0,
        averageRevenue: 0,
        averageDuration: 0
      },
      byActivityType: {},
      byLocationType: {},
      byStatus: {},
      orders: []
    }
  }
}