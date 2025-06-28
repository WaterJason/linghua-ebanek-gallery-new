"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/actions/auth-actions"

/**
 * 获取消息列表
 */
export async function getMessages(filter = "all", limit = 20) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return []
    }

    let where: any = {}

    // 构建查询条件
    if (filter === "unread") {
      where = {
        OR: [
          {
            recipientId: user.id,
            read: false,
          },
          {
            recipientId: null, // 群发消息
            recipients: {
              some: {
                userId: user.id,
                read: false,
              },
            },
          },
        ],
      }
    } else if (filter === "sent") {
      where = {
        senderId: user.id,
      }
    } else {
      // 所有消息（接收的和发送的）
      where = {
        OR: [
          { recipientId: user.id },
          { senderId: user.id },
          {
            recipientId: null, // 群发消息
            recipients: {
              some: {
                userId: user.id,
              },
            },
          },
        ],
      }
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            employee: {
              select: {
                position: true,
              },
            },
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        recipients: {
          where: {
            userId: user.id,
          },
          select: {
            read: true,
            readAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })

    // 转换为前端需要的格式
    return messages.map(message => {
      const isGroupMessage = message.recipientId === null
      const recipientInfo = isGroupMessage ? message.recipients[0] : null

      return {
        id: message.id,
        type: message.type,
        sender: {
          id: message.sender.id,
          name: message.sender.name,
          role: message.sender.employee?.position || "员工",
        },
        subject: message.subject,
        content: message.content,
        timestamp: message.createdAt,
        read: isGroupMessage ? (recipientInfo?.read || false) : message.read,
        urgent: message.priority === "urgent",
        priority: message.priority,
      }
    })
  } catch (error) {
    console.error("Error getting messages:", error)
    return []
  }
}

/**
 * 获取未读消息数量
 */
export async function getUnreadMessageCount() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return 0
    }

    const count = await prisma.message.count({
      where: {
        OR: [
          {
            recipientId: user.id,
            read: false,
          },
          {
            recipientId: null, // 群发消息
            recipients: {
              some: {
                userId: user.id,
                read: false,
              },
            },
          },
        ],
      },
    })

    return count
  } catch (error) {
    console.error("Error getting unread message count:", error)
    return 0
  }
}

/**
 * 创建消息
 */
export async function createMessage(data: {
  recipientIds?: string[]
  subject: string
  content: string
  type?: string
  priority?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("未登录")
    }

    const { recipientIds, subject, content, type = "chat", priority = "normal" } = data

    // 如果是群发消息
    if (recipientIds && recipientIds.length > 1) {
      const message = await prisma.message.create({
        data: {
          senderId: user.id,
          recipientId: null, // 群发消息
          subject,
          content,
          type,
          priority,
        },
      })

      // 创建接收者记录
      await prisma.messageRecipient.createMany({
        data: recipientIds.map(recipientId => ({
          messageId: message.id,
          userId: recipientId,
        })),
      })

      return message
    } else {
      // 单个接收者
      const recipientId = recipientIds?.[0]
      const message = await prisma.message.create({
        data: {
          senderId: user.id,
          recipientId,
          subject,
          content,
          type,
          priority,
        },
      })

      return message
    }
  } catch (error) {
    console.error("Error creating message:", error)
    throw error
  }
}

/**
 * 标记消息为已读
 */
export async function markMessageAsRead(messageId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("未登录")
    }

    // 检查是否是群发消息
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { recipientId: true },
    })

    if (!message) {
      throw new Error("消息不存在")
    }

    if (message.recipientId === null) {
      // 群发消息，更新MessageRecipient
      await prisma.messageRecipient.updateMany({
        where: {
          messageId,
          userId: user.id,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      })
    } else {
      // 单个接收者消息
      await prisma.message.update({
        where: {
          id: messageId,
          recipientId: user.id,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      })
    }

    revalidatePath("/messages")
    return true
  } catch (error) {
    console.error("Error marking message as read:", error)
    throw error
  }
}

/**
 * 获取所有用户（用于发送消息时选择接收者）
 */
export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        employee: {
          select: {
            position: true,
            department: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      position: user.employee?.position || "员工",
      department: user.employee?.department || "未分配",
    }))
  } catch (error) {
    console.error("Error getting users:", error)
    return []
  }
}

/**
 * 删除消息
 */
export async function deleteMessage(messageId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("未登录")
    }

    // 只能删除自己发送的消息
    await prisma.message.delete({
      where: {
        id: messageId,
        senderId: user.id,
      },
    })

    revalidatePath("/messages")
    return true
  } catch (error) {
    console.error("Error deleting message:", error)
    throw error
  }
}
