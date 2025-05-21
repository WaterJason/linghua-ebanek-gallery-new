"use server";

/**
 * 服务器端初始化模块
 * 
 * 本模块负责在服务器端执行的初始化操作，包括账号系统初始化等。
 * 该文件只应在服务器端导入和使用，不应在客户端组件中直接使用。
 */

import { initAccountSystem } from "@/lib/init-account-system";

/**
 * 初始化服务器端系统
 * 这个函数应该在应用启动时在服务器端调用一次
 */
export async function initServerSystems() {
  console.log("开始服务器端系统初始化...");
  
  try {
    // 初始化账号管理系统
    await initAccountSystem();
    
    console.log("服务器端系统初始化完成");
  } catch (error) {
    console.error("服务器端系统初始化失败:", error);
    // 不抛出错误，让应用继续启动
  }
}

// 自动执行初始化
// 这将在服务器启动时运行一次
initServerSystems().catch(error => {
  console.error("服务器端系统初始化失败:", error);
});
