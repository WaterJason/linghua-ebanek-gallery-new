"use server"

import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/actions/auth-actions"
import { revalidatePath } from "next/cache"
import { createSystemLog } from "./system-actions"
import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import crypto from 'crypto'

const execAsync = promisify(exec)

/**
 * 数据备份管理操作
 *
 * 提供企业级数据备份和恢复功能
 * 包括全量备份、增量备份、选择性备份等
 */

// 备份类型定义
export type BackupType = 'full' | 'incremental' | 'selective'
export type BackupStatus = 'pending' | 'running' | 'completed' | 'failed'

// 备份配置接口
export interface BackupConfig {
  name: string
  description?: string
  type: BackupType
  modules?: string[] // 选择性备份的模块
  isEncrypted?: boolean
}

// 备份结果接口
export interface BackupResult {
  id: number
  filePath: string
  fileSize: number
  duration: number
  checksum: string
}

/**
 * 创建数据备份
 *
 * @param config 备份配置
 * @returns 备份记录ID
 */
export async function createBackup(config: BackupConfig): Promise<number> {
  try {
    // 权限检查
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.email !== "admin@linghua.com")) {
      throw new Error("权限不足：只有超级管理员可以执行备份操作")
    }

    // 创建备份记录
    const backup = await prisma.dataBackup.create({
      data: {
        name: config.name,
        description: config.description,
        type: config.type,
        status: 'pending',
        modules: config.modules || [],
        createdBy: user.id,
        isEncrypted: config.isEncrypted ?? true,
      }
    })

    // 记录系统日志
    await createSystemLog({
      module: 'backup',
      level: 'info',
      message: `开始创建数据备份: ${config.name}`,
      details: { backupId: backup.id, config }
    })

    // 异步执行备份
    executeBackup(backup.id, config).catch(error => {
      console.error('备份执行失败:', error)
    })

    revalidatePath('/settings/backup-restore')
    return backup.id

  } catch (error) {
    console.error("创建备份失败:", error)
    throw new Error(error instanceof Error ? error.message : "创建备份失败")
  }
}

/**
 * 执行备份操作
 *
 * @param backupId 备份记录ID
 * @param config 备份配置
 */
async function executeBackup(backupId: number, config: BackupConfig): Promise<void> {
  const startTime = new Date()

  try {
    // 更新状态为运行中
    await prisma.dataBackup.update({
      where: { id: backupId },
      data: { status: 'running' }
    })

    // 创建备份目录
    const backupDir = path.join(process.cwd(), 'backups')
    await fs.mkdir(backupDir, { recursive: true })

    // 生成备份文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `backup_${config.type}_${timestamp}.sql`
    const filePath = path.join(backupDir, fileName)

    // 执行数据库备份
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('数据库连接字符串未配置')
    }

    // 解析数据库连接信息
    const dbUrl = new URL(databaseUrl)
    const dbName = dbUrl.pathname.slice(1)
    const host = dbUrl.hostname
    const port = dbUrl.port || '5432'
    const username = dbUrl.username
    const password = dbUrl.password

    // 构建pg_dump命令
    let pgDumpCmd = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${dbName}`

    // 根据备份类型调整命令
    if (config.type === 'selective' && config.modules && config.modules.length > 0) {
      // 选择性备份：只备份指定表
      const tables = getTablesForModules(config.modules)
      pgDumpCmd += ` ${tables.map(table => `-t ${table}`).join(' ')}`
    }

    pgDumpCmd += ` > "${filePath}"`

    // 执行备份命令
    await execAsync(pgDumpCmd)

    // 获取文件信息
    const stats = await fs.stat(filePath)
    const fileSize = stats.size

    // 计算文件校验和
    const fileBuffer = await fs.readFile(filePath)
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex')

    // 如果启用加密，加密备份文件
    let finalFilePath = filePath
    if (config.isEncrypted) {
      finalFilePath = await encryptBackupFile(filePath)
      await fs.unlink(filePath) // 删除未加密文件
    }

    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

    // 更新备份记录
    await prisma.dataBackup.update({
      where: { id: backupId },
      data: {
        status: 'completed',
        filePath: finalFilePath,
        fileSize,
        endTime,
        duration,
        checksum,
      }
    })

    // 记录成功日志
    await createSystemLog({
      module: 'backup',
      level: 'info',
      message: `数据备份完成: ${config.name}`,
      details: {
        backupId,
        filePath: finalFilePath,
        fileSize,
        duration,
        checksum
      }
    })

  } catch (error) {
    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

    // 更新备份记录为失败状态
    await prisma.dataBackup.update({
      where: { id: backupId },
      data: {
        status: 'failed',
        endTime,
        duration,
        errorMessage: error instanceof Error ? error.message : String(error),
      }
    })

    // 记录错误日志
    await createSystemLog({
      module: 'backup',
      level: 'error',
      message: `数据备份失败: ${config.name}`,
      details: {
        backupId,
        error: error instanceof Error ? error.message : String(error),
        duration
      }
    })

    throw error
  }
}

/**
 * 根据模块获取对应的数据表
 *
 * @param modules 模块列表
 * @returns 数据表列表
 */
function getTablesForModules(modules: string[]): string[] {
  const moduleTableMap: Record<string, string[]> = {
    'products': ['Product', 'ProductCategory', 'ProductTag', 'ProductTagsOnProducts'],
    'employees': ['Employee', 'Schedule', 'SalaryRecord', 'SalaryAdjustment'],
    'customers': ['Customer', 'Order', 'OrderItem'],
    'inventory': ['InventoryItem', 'InventoryTransaction', 'Warehouse'],
    'sales': ['PosSale', 'PosSaleItem', 'GallerySale', 'SalesItem'],
    'channels': ['Channel', 'ChannelInventory', 'ChannelSale', 'ChannelSaleItem'],
    'finance': ['FinancialAccount', 'FinancialTransaction', 'FinancialCategory'],
    'workshops': ['Workshop', 'WorkshopActivity', 'WorkshopServiceItem'],
    'users': ['User', 'UserRole', 'UserSettings', 'Role', 'Permission'],
    'system': ['SystemSetting', 'SystemParameter', 'DataDictionary', 'AuditLog']
  }

  const tables: string[] = []
  modules.forEach(module => {
    if (moduleTableMap[module]) {
      tables.push(...moduleTableMap[module])
    }
  })

  return [...new Set(tables)] // 去重
}

/**
 * 加密备份文件
 *
 * @param filePath 原文件路径
 * @returns 加密后文件路径
 */
async function encryptBackupFile(filePath: string): Promise<string> {
  const encryptedPath = filePath + '.enc'
  const key = process.env.BACKUP_ENCRYPTION_KEY || 'default-backup-key-change-in-production'

  // 这里应该使用更安全的加密方法，这只是示例
  const fileBuffer = await fs.readFile(filePath)
  const cipher = crypto.createCipher('aes-256-cbc', key)
  const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()])

  await fs.writeFile(encryptedPath, encrypted)
  return encryptedPath
}

/**
 * 获取备份列表
 *
 * @param page 页码
 * @param pageSize 每页大小
 * @returns 备份列表
 */
export async function getBackups(page = 1, pageSize = 20) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("未登录")
    }

    const skip = (page - 1) * pageSize

    const [backups, total] = await Promise.all([
      prisma.dataBackup.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          status: true,
          fileSize: true,
          modules: true,
          startTime: true,
          endTime: true,
          duration: true,
          errorMessage: true,
          createdBy: true,
          isEncrypted: true,
          createdAt: true,
        }
      }),
      prisma.dataBackup.count()
    ])

    return {
      data: backups,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }

  } catch (error) {
    console.error("获取备份列表失败:", error)
    throw new Error(error instanceof Error ? error.message : "获取备份列表失败")
  }
}

/**
 * 删除备份
 *
 * @param id 备份ID
 */
export async function deleteBackup(id: number): Promise<void> {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.email !== "admin@linghua.com")) {
      throw new Error("权限不足")
    }

    // 获取备份信息
    const backup = await prisma.dataBackup.findUnique({
      where: { id }
    })

    if (!backup) {
      throw new Error("备份记录不存在")
    }

    // 删除备份文件
    if (backup.filePath) {
      try {
        await fs.unlink(backup.filePath)
      } catch (error) {
        console.warn('删除备份文件失败:', error)
      }
    }

    // 删除数据库记录
    await prisma.dataBackup.delete({
      where: { id }
    })

    // 记录系统日志
    await createSystemLog({
      module: 'backup',
      level: 'info',
      message: `删除备份: ${backup.name}`,
      details: { backupId: id, filePath: backup.filePath }
    })

    revalidatePath('/settings/backup-restore')

  } catch (error) {
    console.error("删除备份失败:", error)
    throw new Error(error instanceof Error ? error.message : "删除备份失败")
  }
}





/**
 * 恢复数据备份
 *
 * @param id 备份ID
 * @param options 恢复选项
 */
export async function restoreBackup(
  id: number,
  options: {
    confirmPassword: string
    dropExisting?: boolean
  }
): Promise<void> {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.email !== "admin@linghua.com")) {
      throw new Error("权限不足：只有超级管理员可以执行恢复操作")
    }

    // 验证确认密码（这里应该验证用户密码）
    if (!options.confirmPassword) {
      throw new Error("请输入确认密码")
    }

    // 获取备份信息
    const backup = await prisma.dataBackup.findUnique({
      where: { id }
    })

    if (!backup) {
      throw new Error("备份记录不存在")
    }

    if (backup.status !== 'completed') {
      throw new Error("只能恢复已完成的备份")
    }

    if (!backup.filePath) {
      throw new Error("备份文件路径不存在")
    }

    // 检查备份文件是否存在
    try {
      await fs.access(backup.filePath)
    } catch {
      throw new Error("备份文件不存在或无法访问")
    }

    // 记录恢复开始日志
    await createSystemLog({
      module: 'backup',
      level: 'warning',
      message: `开始恢复数据备份: ${backup.name}`,
      details: {
        backupId: id,
        filePath: backup.filePath,
        operator: user.id,
        dropExisting: options.dropExisting
      }
    })

    // 执行恢复操作
    await executeRestore(backup, options)

    // 记录恢复成功日志
    await createSystemLog({
      module: 'backup',
      level: 'info',
      message: `数据恢复完成: ${backup.name}`,
      details: { backupId: id, operator: user.id }
    })

    revalidatePath('/settings/backup-restore')

  } catch (error) {
    // 记录恢复失败日志
    await createSystemLog({
      module: 'backup',
      level: 'error',
      message: `数据恢复失败`,
      details: {
        backupId: id,
        error: error instanceof Error ? error.message : String(error)
      }
    })

    console.error("恢复备份失败:", error)
    throw new Error(error instanceof Error ? error.message : "恢复备份失败")
  }
}

/**
 * 执行恢复操作
 *
 * @param backup 备份记录
 * @param options 恢复选项
 */
async function executeRestore(
  backup: any,
  options: { dropExisting?: boolean }
): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('数据库连接字符串未配置')
  }

  // 解析数据库连接信息
  const dbUrl = new URL(databaseUrl)
  const dbName = dbUrl.pathname.slice(1)
  const host = dbUrl.hostname
  const port = dbUrl.port || '5432'
  const username = dbUrl.username
  const password = dbUrl.password

  let restoreFilePath = backup.filePath

  // 如果是加密文件，先解密
  if (backup.isEncrypted) {
    restoreFilePath = await decryptBackupFile(backup.filePath)
  }

  try {
    // 如果选择删除现有数据，先备份当前数据
    if (options.dropExisting) {
      const preRestoreBackup = await createPreRestoreBackup()
      console.log('预恢复备份已创建:', preRestoreBackup)
    }

    // 构建psql恢复命令
    const psqlCmd = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d ${dbName} -f "${restoreFilePath}"`

    // 执行恢复命令
    await execAsync(psqlCmd)

  } finally {
    // 清理临时解密文件
    if (backup.isEncrypted && restoreFilePath !== backup.filePath) {
      try {
        await fs.unlink(restoreFilePath)
      } catch (error) {
        console.warn('清理临时文件失败:', error)
      }
    }
  }
}

/**
 * 解密备份文件
 *
 * @param encryptedPath 加密文件路径
 * @returns 解密后文件路径
 */
async function decryptBackupFile(encryptedPath: string): Promise<string> {
  const decryptedPath = encryptedPath.replace('.enc', '.decrypted.sql')
  const key = process.env.BACKUP_ENCRYPTION_KEY || 'default-backup-key-change-in-production'

  const encryptedBuffer = await fs.readFile(encryptedPath)
  const decipher = crypto.createDecipher('aes-256-cbc', key)
  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()])

  await fs.writeFile(decryptedPath, decrypted)
  return decryptedPath
}

/**
 * 创建恢复前备份
 *
 * @returns 备份ID
 */
async function createPreRestoreBackup(): Promise<number> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const config: BackupConfig = {
    name: `恢复前自动备份_${timestamp}`,
    description: '数据恢复前的自动备份',
    type: 'full',
    isEncrypted: true
  }

  return await createBackup(config)
}

/**
 * 验证备份文件完整性
 *
 * @param id 备份ID
 * @returns 验证结果
 */
export async function validateBackup(id: number): Promise<{
  isValid: boolean
  message: string
  details?: any
}> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("未登录")
    }

    const backup = await prisma.dataBackup.findUnique({
      where: { id }
    })

    if (!backup) {
      return { isValid: false, message: "备份记录不存在" }
    }

    if (!backup.filePath) {
      return { isValid: false, message: "备份文件路径不存在" }
    }

    // 检查文件是否存在
    try {
      await fs.access(backup.filePath)
    } catch {
      return { isValid: false, message: "备份文件不存在或无法访问" }
    }

    // 验证文件大小
    const stats = await fs.stat(backup.filePath)
    if (backup.fileSize && stats.size !== backup.fileSize) {
      return {
        isValid: false,
        message: "文件大小不匹配",
        details: {
          expected: backup.fileSize,
          actual: stats.size
        }
      }
    }

    // 验证校验和
    if (backup.checksum) {
      let fileBuffer: Buffer

      if (backup.isEncrypted) {
        // 解密后验证
        const decryptedPath = await decryptBackupFile(backup.filePath)
        try {
          fileBuffer = await fs.readFile(decryptedPath)
          await fs.unlink(decryptedPath) // 清理临时文件
        } catch (error) {
          return { isValid: false, message: "无法解密备份文件进行验证" }
        }
      } else {
        fileBuffer = await fs.readFile(backup.filePath)
      }

      const actualChecksum = crypto.createHash('sha256').update(fileBuffer).digest('hex')
      if (actualChecksum !== backup.checksum) {
        return {
          isValid: false,
          message: "文件校验和不匹配，文件可能已损坏",
          details: {
            expected: backup.checksum,
            actual: actualChecksum
          }
        }
      }
    }

    return { isValid: true, message: "备份文件验证通过" }

  } catch (error) {
    console.error("验证备份失败:", error)
    return {
      isValid: false,
      message: error instanceof Error ? error.message : "验证备份失败"
    }
  }
}

/**
 * 获取备份统计信息
 *
 * @returns 统计信息
 */
export async function getBackupStats() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("未登录")
    }

    const [
      totalBackups,
      completedBackups,
      failedBackups,
      totalSize,
      lastBackup
    ] = await Promise.all([
      prisma.dataBackup.count(),
      prisma.dataBackup.count({ where: { status: 'completed' } }),
      prisma.dataBackup.count({ where: { status: 'failed' } }),
      prisma.dataBackup.aggregate({
        where: { status: 'completed' },
        _sum: { fileSize: true }
      }),
      prisma.dataBackup.findFirst({
        where: { status: 'completed' },
        orderBy: { createdAt: 'desc' },
        select: {
          name: true,
          createdAt: true,
          fileSize: true,
          type: true
        }
      })
    ])

    return {
      totalBackups,
      completedBackups,
      failedBackups,
      runningBackups: totalBackups - completedBackups - failedBackups,
      totalSize: totalSize._sum.fileSize || 0,
      lastBackup,
      successRate: totalBackups > 0 ? (completedBackups / totalBackups * 100) : 0
    }

  } catch (error) {
    console.error("获取备份统计失败:", error)
    throw new Error(error instanceof Error ? error.message : "获取备份统计失败")
  }
}
