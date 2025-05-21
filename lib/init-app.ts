import { setupAutoBackup } from "./auto-backup"
import { createLog } from "./actions"
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
      await createLog({
        module: "系统",
        level: "info",
        message: "系统已启动",
        details: "应用程序初始化完成，系统正常运行"
      })
    } catch (logError) {
      console.error("记录系统启动日志失败:", logError)
    }

    console.log("应用程序初始化完成")
  } catch (error) {
    console.error("应用程序初始化失败:", error)

    // 记录启动失败日志
    try {
      await createLog({
        module: "系统",
        level: "error",
        message: "系统启动失败",
        details: error instanceof Error ? error.message : String(error)
      })
    } catch (logError) {
      console.error("记录系统启动失败日志失败:", logError)
    }
  }
}

// 在应用启动时自动执行初始化
if (typeof window === "undefined") {
  // 仅在服务器端执行
  initApp().catch(error => {
    console.error("应用程序初始化失败:", error)
  })
}
