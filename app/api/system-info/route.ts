import { NextResponse } from "next/server"
import os from "os"
import prisma from "@/lib/db"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

const execPromise = promisify(exec)

export async function GET() {
  try {
    // 获取系统基本信息
    const uptime = os.uptime()
    const nodeVersion = process.version
    const platform = os.platform()
    
    // 获取内存信息
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()
    const usedMemory = totalMemory - freeMemory
    
    // 获取数据库信息
    const databaseInfo = await getDatabaseInfo()
    
    // 获取存储信息
    const storageInfo = await getStorageInfo()
    
    return NextResponse.json({
      version: "1.0.0", // 系统版本
      uptime,
      nodeVersion,
      platform,
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory
      },
      database: databaseInfo,
      storage: storageInfo
    })
  } catch (error) {
    console.error("Error fetching system info:", error)
    return NextResponse.json(
      { error: "Failed to fetch system info" },
      { status: 500 }
    )
  }
}

// 获取数据库信息
async function getDatabaseInfo() {
  try {
    // 获取数据库类型和版本
    const databaseType = "PostgreSQL" // 从环境变量或配置中获取
    
    // 获取表数量
    const tables = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    const tableCount = Number(tables[0].count)
    
    // 获取记录总数（估计值）
    const recordsQuery = await prisma.$queryRaw`
      SELECT 
        SUM(n_live_tup) as total_records
      FROM 
        pg_stat_user_tables
    `
    const recordCount = Number(recordsQuery[0].total_records || 0)
    
    // 获取数据库大小
    const sizeQuery = await prisma.$queryRaw`
      SELECT pg_database_size(current_database()) as size
    `
    const databaseSize = Number(sizeQuery[0].size)
    
    // 获取数据库版本
    const versionQuery = await prisma.$queryRaw`SELECT version()`
    const versionString = String(versionQuery[0].version)
    const versionMatch = versionString.match(/PostgreSQL (\d+\.\d+)/)
    const version = versionMatch ? versionMatch[1] : "未知"
    
    return {
      type: databaseType,
      version,
      size: databaseSize,
      tables: tableCount,
      records: recordCount
    }
  } catch (error) {
    console.error("Error fetching database info:", error)
    return {
      type: "PostgreSQL",
      version: "未知",
      size: 0,
      tables: 0,
      records: 0
    }
  }
}

// 获取存储信息
async function getStorageInfo() {
  try {
    // 获取当前目录的磁盘信息
    const currentDir = process.cwd()
    
    if (process.platform === "win32") {
      // Windows平台
      const drive = currentDir.split(path.sep)[0] + "\\"
      const { stdout } = await execPromise(`wmic logicaldisk where "DeviceID='${drive}'" get Size,FreeSpace /format:csv`)
      
      const lines = stdout.trim().split("\n")
      if (lines.length >= 2) {
        const values = lines[1].split(",")
        if (values.length >= 3) {
          const freeSpace = Number(values[1])
          const totalSize = Number(values[2])
          
          return {
            total: totalSize,
            free: freeSpace,
            used: totalSize - freeSpace
          }
        }
      }
    } else {
      // Unix/Linux/macOS平台
      const { stdout } = await execPromise(`df -k "${currentDir}"`)
      
      const lines = stdout.trim().split("\n")
      if (lines.length >= 2) {
        const values = lines[1].split(/\s+/)
        if (values.length >= 6) {
          const totalSize = Number(values[1]) * 1024
          const usedSize = Number(values[2]) * 1024
          const freeSpace = Number(values[3]) * 1024
          
          return {
            total: totalSize,
            free: freeSpace,
            used: usedSize
          }
        }
      }
    }
    
    // 如果无法获取磁盘信息，返回默认值
    return {
      total: 1000 * 1024 * 1024 * 1024, // 1TB
      free: 500 * 1024 * 1024 * 1024,   // 500GB
      used: 500 * 1024 * 1024 * 1024    // 500GB
    }
  } catch (error) {
    console.error("Error fetching storage info:", error)
    return {
      total: 1000 * 1024 * 1024 * 1024, // 1TB
      free: 500 * 1024 * 1024 * 1024,   // 500GB
      used: 500 * 1024 * 1024 * 1024    // 500GB
    }
  }
}
