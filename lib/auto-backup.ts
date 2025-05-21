import { createBackup } from "./backup"
import fs from "fs"
import path from "path"
import { format } from "date-fns"

// 备份目录
const BACKUP_DIR = path.join(process.cwd(), "backups")

// 确保备份目录存在
const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
  }
}

// 自动备份配置
const AUTO_BACKUP_CONFIG = {
  // 是否启用自动备份
  enabled: true,
  // 自动备份间隔（毫秒）
  interval: 24 * 60 * 60 * 1000, // 24小时
  // 最大备份文件数量
  maxBackups: 7, // 保留最近7天的备份
  // 最后一次备份时间
  lastBackup: 0,
}

// 清理旧备份
const cleanupOldBackups = () => {
  ensureBackupDir()

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith("backup_") && file.endsWith(".json"))
    .map(file => {
      const filePath = path.join(BACKUP_DIR, file)
      const stats = fs.statSync(filePath)
      
      return {
        filename: file,
        path: filePath,
        timestamp: file.replace(".json", "").split("_").slice(1, 3).join("_"),
        mtime: stats.mtime.getTime(),
      }
    })
    .sort((a, b) => b.mtime - a.mtime) // 按修改时间倒序排序

  // 如果备份文件数量超过最大值，删除最旧的文件
  if (files.length > AUTO_BACKUP_CONFIG.maxBackups) {
    const filesToDelete = files.slice(AUTO_BACKUP_CONFIG.maxBackups)
    
    for (const file of filesToDelete) {
      try {
        fs.unlinkSync(file.path)
        console.log(`已删除旧备份文件: ${file.filename}`)
      } catch (error) {
        console.error(`删除旧备份文件失败: ${file.filename}`, error)
      }
    }
  }
}

// 执行自动备份
export const runAutoBackup = async () => {
  if (!AUTO_BACKUP_CONFIG.enabled) {
    return
  }

  const now = Date.now()
  
  // 检查是否需要备份
  if (now - AUTO_BACKUP_CONFIG.lastBackup < AUTO_BACKUP_CONFIG.interval) {
    return
  }

  try {
    console.log("开始执行自动备份...")
    
    // 创建备份
    const backupPath = await createBackup("auto")
    
    // 更新最后备份时间
    AUTO_BACKUP_CONFIG.lastBackup = now
    
    // 清理旧备份
    cleanupOldBackups()
    
    console.log(`自动备份完成: ${backupPath}`)
    
    return backupPath
  } catch (error) {
    console.error("自动备份失败:", error)
  }
}

// 在应用启动时执行一次备份
export const runStartupBackup = async () => {
  try {
    console.log("应用启动，执行启动备份...")
    
    // 创建备份
    const backupPath = await createBackup("startup")
    
    // 清理旧备份
    cleanupOldBackups()
    
    console.log(`启动备份完成: ${backupPath}`)
    
    return backupPath
  } catch (error) {
    console.error("启动备份失败:", error)
  }
}

// 在模块更新前执行备份
export const runPreUpdateBackup = async (moduleName: string) => {
  try {
    console.log(`模块 ${moduleName} 更新前，执行备份...`)
    
    // 创建备份
    const backupPath = await createBackup(`pre-update-${moduleName}`)
    
    console.log(`模块更新前备份完成: ${backupPath}`)
    
    return backupPath
  } catch (error) {
    console.error(`模块更新前备份失败:`, error)
  }
}

// 设置自动备份定时器
export const setupAutoBackup = () => {
  // 立即执行一次启动备份
  runStartupBackup()
  
  // 设置定时器，定期执行自动备份
  setInterval(runAutoBackup, 60 * 60 * 1000) // 每小时检查一次是否需要备份
}
