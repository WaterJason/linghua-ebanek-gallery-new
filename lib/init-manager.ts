/**
 * 系统初始化管理器
 *
 * 统一管理系统初始化，避免重复初始化，提升性能
 */

import { initAccountSystem } from "@/lib/init-account-system";
import { setupAutoBackup } from "./auto-backup";
import { setupGlobalErrorHandler } from "./error-logger";

// 初始化状态管理
class InitializationManager {
  private static instance: InitializationManager;
  private initialized = false;
  private initializing = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): InitializationManager {
    if (!InitializationManager.instance) {
      InitializationManager.instance = new InitializationManager();
    }
    return InitializationManager.instance;
  }

  /**
   * 确保系统只初始化一次
   */
  async ensureInitialized(): Promise<void> {
    // 如果已经初始化完成，直接返回
    if (this.initialized) {
      return;
    }

    // 如果正在初始化，等待初始化完成
    if (this.initializing && this.initPromise) {
      return this.initPromise;
    }

    // 开始初始化
    this.initializing = true;
    this.initPromise = this.performInitialization();

    try {
      await this.initPromise;
      this.initialized = true;
    } catch (error) {
      console.error("系统初始化失败:", error);
      // 重置状态，允许重试
      this.initializing = false;
      this.initPromise = null;
      throw error;
    } finally {
      this.initializing = false;
    }
  }

  /**
   * 执行实际的初始化操作
   */
  private async performInitialization(): Promise<void> {
    console.log("开始系统初始化...");

    try {
      // 1. 设置全局错误处理器（最先执行）
      setupGlobalErrorHandler();

      // 2. 初始化账号管理系统
      console.log("初始化账号管理系统...");
      await initAccountSystem();

      // 3. 设置自动备份（仅在生产环境或明确启用时）
      if (process.env.NODE_ENV === "production" || process.env.ENABLE_AUTO_BACKUP === "true") {
        console.log("设置自动备份...");
        setupAutoBackup();
      }

      // 4. 记录系统启动日志
      console.log("[INFO][系统] 系统初始化完成");

    } catch (error) {
      console.error("系统初始化过程中发生错误:", error);
      throw error;
    }
  }

  /**
   * 重置初始化状态（用于测试或特殊情况）
   */
  reset(): void {
    this.initialized = false;
    this.initializing = false;
    this.initPromise = null;
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// 导出单例实例
export const initManager = InitializationManager.getInstance();

/**
 * 确保系统初始化的便捷函数
 */
export async function ensureSystemInitialized(): Promise<void> {
  // 只在服务器端执行
  if (typeof window !== "undefined") {
    return;
  }

  // 在构建时跳过初始化，避免构建错误
  if (process.env.NODE_ENV === "development" && process.env.NEXT_PHASE === "phase-production-build") {
    console.log("构建阶段跳过系统初始化");
    return;
  }

  return initManager.ensureInitialized();
}

/**
 * 检查系统是否已初始化
 */
export function isSystemInitialized(): boolean {
  return initManager.isInitialized();
}
