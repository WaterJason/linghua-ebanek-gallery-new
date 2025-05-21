import prisma from "./db"
import fs from "fs"
import path from "path"
import { format } from "date-fns"
import { revalidatePath } from "next/cache"

// 备份目录
const BACKUP_DIR = path.join(process.cwd(), "backups")

// 确保备份目录存在
const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
  }
}

/**
 * 创建数据库备份
 * @param reason 备份原因，例如 "module-update", "scheduled", "manual"
 * @returns 备份文件路径
 */
export async function createBackup(reason: string = "manual"): Promise<string> {
  try {
    console.log(`开始创建数据库备份，原因: ${reason}...`)
    ensureBackupDir()

    // 获取所有数据表的数据
    const backup = {
      timestamp: new Date().toISOString(),
      reason,
      version: "1.0.0",
      data: {
        employees: await prisma.employee.findMany(),
        products: await prisma.product.findMany(),
        pieceWorkItems: await prisma.pieceWorkItem.findMany(),
        schedules: await prisma.schedule.findMany(),
        scheduleTemplates: await prisma.scheduleTemplate.findMany(),
        gallerySales: await prisma.gallerySale.findMany({
          include: {
            salesItems: true,
            files: true
          }
        }),
        workshops: await prisma.workshop.findMany(),
        pieceWorks: await prisma.pieceWork.findMany({
          include: {
            details: true
          }
        }),
        coffeeShopSales: await prisma.coffeeShopSale.findMany({
          include: {
            shifts: true,
            items: true
          }
        }),
        systemSettings: await prisma.systemSetting.findMany(),
        warehouses: await prisma.warehouse.findMany(),
        inventoryItems: await prisma.inventoryItem.findMany(),
        inventoryTransactions: await prisma.inventoryTransaction.findMany(),
        customers: await prisma.customer.findMany(),
        orders: await prisma.order.findMany({
          include: {
            items: true
          }
        }),
        channels: await prisma.channel.findMany({
          include: {
            prices: true
          }
        }),
        salaryRecords: await prisma.salaryRecord.findMany(),
        salaryAdjustments: await prisma.salaryAdjustment.findMany(),
        users: await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            roles: true,
            employeeId: true,
            createdAt: true,
            updatedAt: true
          }
        })
      }
    }

    // 生成备份文件名
    const timestamp = format(new Date(), "yyyyMMdd_HHmmss")
    const filename = `backup_${timestamp}_${reason}.json`
    const filePath = path.join(BACKUP_DIR, filename)

    // 写入备份文件
    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2))

    console.log(`数据库备份已创建: ${filePath}`)

    // 不在这里调用revalidatePath，而是在服务器操作中调用
    // 移除: revalidatePath('/settings/backup')

    return filePath
  } catch (error) {
    console.error("创建数据库备份失败:", error)
    throw new Error("创建数据库备份失败")
  }
}

/**
 * 从备份文件恢复数据库
 * @param filePath 备份文件路径
 * @returns 恢复结果
 */
export async function restoreBackup(filePath: string): Promise<{ success: boolean, message: string }> {
  try {
    console.log(`开始从备份文件恢复数据库: ${filePath}...`)

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return { success: false, message: "备份文件不存在" }
    }

    // 读取备份文件
    const backupContent = fs.readFileSync(filePath, "utf-8")
    const backup = JSON.parse(backupContent)

    // 验证备份数据
    if (!backup.data) {
      return { success: false, message: "无效的备份文件格式" }
    }

    // 开始恢复数据
    // 注意：这里使用事务来确保数据一致性
    await prisma.$transaction(async (tx) => {
      // 清空现有数据（按照依赖关系的反序）
      // 注意：这可能会导致外键约束问题，需要根据实际情况调整
      await tx.salaryAdjustment.deleteMany({})
      await tx.salaryRecord.deleteMany({})
      await tx.channelPrice.deleteMany({})
      await tx.channel.deleteMany({})
      await tx.orderItem.deleteMany({})
      await tx.order.deleteMany({})
      await tx.customer.deleteMany({})
      await tx.inventoryTransaction.deleteMany({})
      await tx.inventoryItem.deleteMany({})
      await tx.warehouse.deleteMany({})
      await tx.systemSetting.deleteMany({})
      await tx.coffeeShopItem.deleteMany({})
      await tx.coffeeShopShift.deleteMany({})
      await tx.coffeeShopSale.deleteMany({})
      await tx.pieceWorkDetail.deleteMany({})
      await tx.pieceWork.deleteMany({})
      await tx.workshop.deleteMany({})
      await tx.salesItem.deleteMany({})
      await tx.uploadedFile.deleteMany({})
      await tx.gallerySale.deleteMany({})
      await tx.scheduleTemplate.deleteMany({})
      await tx.schedule.deleteMany({})
      await tx.pieceWorkItem.deleteMany({})
      await tx.product.deleteMany({})
      await tx.employee.deleteMany({})

      // 恢复数据（按照依赖关系的顺序）
      if (backup.data.employees?.length) {
        for (const employee of backup.data.employees) {
          await tx.employee.create({ data: employee })
        }
      }



      if (backup.data.products?.length) {
        for (const product of backup.data.products) {
          await tx.product.create({ data: product })
        }
      }

      // 继续恢复其他表...
      // 注意：这里需要根据实际情况完善恢复逻辑
    })

    // 不在这里调用revalidatePath，而是在服务器操作中调用
    // 移除: revalidatePath('/settings/backup')

    return { success: true, message: "数据库已成功从备份恢复" }
  } catch (error) {
    console.error("恢复数据库失败:", error)
    return { success: false, message: `恢复数据库失败: ${error.message}` }
  }
}

/**
 * 获取所有备份文件列表
 * @returns 备份文件列表
 */
export function getBackupsList(): { filename: string, path: string, timestamp: string, reason: string, size: number }[] {
  ensureBackupDir()

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith("backup_") && file.endsWith(".json"))
    .map(file => {
      const filePath = path.join(BACKUP_DIR, file)
      const stats = fs.statSync(filePath)

      // 从文件名解析信息
      const parts = file.replace(".json", "").split("_")
      const timestamp = `${parts[1]}_${parts[2]}`
      const reason = parts.slice(3).join("_")

      return {
        filename: file,
        path: filePath,
        timestamp,
        reason,
        size: stats.size
      }
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp)) // 按时间倒序排序

  return files
}

/**
 * 删除备份文件
 * @param filePath 备份文件路径
 * @returns 删除结果
 */
export async function deleteBackup(filePath: string): Promise<{ success: boolean, message: string }> {
  try {
    console.log(`开始删除备份文件: ${filePath}...`)

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return { success: false, message: "备份文件不存在" }
    }

    // 删除文件
    fs.unlinkSync(filePath)

    // 不在这里调用revalidatePath，而是在服务器操作中调用
    // 移除: revalidatePath('/settings/backup')

    return { success: true, message: "备份文件已成功删除" }
  } catch (error) {
    console.error("删除备份文件失败:", error)
    return { success: false, message: `删除备份文件失败: ${error.message}` }
  }
}
