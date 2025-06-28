import { setupAutoBackup } from "./auto-backup"
// 暂时注释掉，避免导入错误
// import { createLog } from "./actions"
import { setupGlobalErrorHandler } from "./error-logger"

// 初始化应用程序
export async function initApp() {
  try {
    console.log("初始化应用程序...")

    // 设置自动备份
    setupAutoBackup()

    // 设置全局错误处理器
    setupGlobalErrorHandler()

    // 记录系统启动日志
    try {
      // 暂时只输出到控制台，不记录到系统日志
      console.log("[INFO][系统] 系统已启动")
    } catch (logError) {
      console.error("记录系统启动日志失败:", logError)
    }

    console.log("应用程序初始化完成")
  } catch (error) {
    console.error("应用程序初始化失败:", error)

    // 记录启动失败日志
    try {
      // 暂时只输出到控制台，不记录到系统日志
      console.error("[ERROR][系统] 系统启动失败:", error instanceof Error ? error.message : String(error))
    } catch (logError) {
      console.error("记录系统启动失败日志失败:", logError)
    }
  }
}

// 注释掉自动执行，改用统一的初始化管理器
// if (typeof window === "undefined") {
//   // 仅在服务器端执行
//   initApp().catch(error => {
//     console.error("应用程序初始化失败:", error)
//   })
// }
