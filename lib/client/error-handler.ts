/**
 * 前端错误处理工具
 * 
 * 提供前端错误处理相关的功能，包括错误类型识别、错误消息格式化、错误重试等。
 * 
 * @module 前端错误处理
 * @category 客户端工具
 */

import { toast } from '@/components/ui/use-toast';
import { ErrorType, ErrorCode } from '../error-handler';

/**
 * 错误响应接口
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    type?: string;
    code?: string;
    module?: string;
  };
}

/**
 * 可重试错误类型
 */
export const RETRYABLE_ERROR_TYPES = [
  ErrorType.DATABASE,
  ErrorType.EXTERNAL_SERVICE,
];

/**
 * 可重试错误代码
 */
export const RETRYABLE_ERROR_CODES = [
  ErrorCode.DATABASE_ERROR,
  ErrorCode.EXTERNAL_SERVICE_ERROR,
];

/**
 * 重试配置接口
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

/**
 * 默认重试配置
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 500,
  maxDelay: 5000,
  backoffFactor: 2,
};

/**
 * 错误类型到用户友好消息的映射
 */
export const ERROR_TYPE_MESSAGES: Record<string, string> = {
  [ErrorType.VALIDATION]: '输入数据验证失败',
  [ErrorType.DATABASE]: '数据库操作失败',
  [ErrorType.AUTHENTICATION]: '认证失败',
  [ErrorType.AUTHORIZATION]: '权限不足',
  [ErrorType.NOT_FOUND]: '资源不存在',
  [ErrorType.ALREADY_EXISTS]: '资源已存在',
  [ErrorType.BUSINESS_LOGIC]: '业务逻辑错误',
  [ErrorType.EXTERNAL_SERVICE]: '外部服务错误',
  [ErrorType.SYSTEM]: '系统错误',
  [ErrorType.GENERAL]: '发生错误',
};

/**
 * 错误代码到用户友好消息的映射
 */
export const ERROR_CODE_MESSAGES: Record<string, string> = {
  [ErrorCode.VALIDATION_ERROR]: '请检查输入数据是否正确',
  [ErrorCode.DATABASE_ERROR]: '数据库操作失败，请稍后重试',
  [ErrorCode.AUTHENTICATION_ERROR]: '请重新登录',
  [ErrorCode.AUTHORIZATION_ERROR]: '您没有权限执行此操作',
  [ErrorCode.NOT_FOUND_ERROR]: '请求的资源不存在',
  [ErrorCode.ALREADY_EXISTS_ERROR]: '资源已存在，请勿重复创建',
  [ErrorCode.BUSINESS_LOGIC_ERROR]: '操作无法完成',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: '外部服务暂时不可用，请稍后重试',
  [ErrorCode.SYSTEM_ERROR]: '系统发生错误，请联系管理员',
  [ErrorCode.GENERAL_ERROR]: '操作失败，请重试',
};

/**
 * 检查错误是否可重试
 * @param error 错误响应
 * @returns 是否可重试
 */
export function isRetryableError(error: ErrorResponse): boolean {
  if (!error || !error.error) return false;
  
  const { type, code } = error.error;
  
  return (
    (type && RETRYABLE_ERROR_TYPES.includes(type as ErrorType)) ||
    (code && RETRYABLE_ERROR_CODES.includes(code as ErrorCode))
  );
}

/**
 * 获取用户友好的错误消息
 * @param error 错误响应
 * @returns 用户友好的错误消息
 */
export function getUserFriendlyErrorMessage(error: ErrorResponse): string {
  if (!error || !error.error) return '发生未知错误';
  
  const { message, type, code } = error.error;
  
  // 优先使用原始错误消息
  if (message) return message;
  
  // 其次使用错误代码对应的消息
  if (code && ERROR_CODE_MESSAGES[code]) return ERROR_CODE_MESSAGES[code];
  
  // 最后使用错误类型对应的消息
  if (type && ERROR_TYPE_MESSAGES[type]) return ERROR_TYPE_MESSAGES[type];
  
  return '发生未知错误';
}

/**
 * 显示错误消息
 * @param error 错误响应或错误消息
 */
export function showErrorMessage(error: ErrorResponse | string): void {
  const message = typeof error === 'string' 
    ? error 
    : getUserFriendlyErrorMessage(error);
  
  toast({
    title: '操作失败',
    description: message,
    variant: 'destructive',
  });
}

/**
 * 带重试机制的异步函数包装器
 * @param fn 异步函数
 * @param config 重试配置
 * @returns 包装后的异步函数
 */
export function withRetry<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  config: Partial<RetryConfig> = {}
): (...args: Args) => Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  return async (...args: Args): Promise<T> => {
    let lastError: any;
    let retryCount = 0;
    let delay = retryConfig.initialDelay;
    
    while (retryCount <= retryConfig.maxRetries) {
      try {
        if (retryCount > 0) {
          console.log(`Retry attempt ${retryCount}/${retryConfig.maxRetries}...`);
        }
        
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        // 检查错误是否可重试
        if (!isRetryableError(error as ErrorResponse) || retryCount >= retryConfig.maxRetries) {
          break;
        }
        
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // 增加延迟时间（指数退避）
        delay = Math.min(delay * retryConfig.backoffFactor, retryConfig.maxDelay);
        retryCount++;
      }
    }
    
    // 所有重试都失败了，抛出最后一个错误
    throw lastError;
  };
}

/**
 * 错误处理包装器
 * @param fn 异步函数
 * @param errorHandler 错误处理函数
 * @returns 包装后的异步函数
 */
export function withErrorHandling<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  errorHandler?: (error: any) => void
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      // 调用自定义错误处理函数
      if (errorHandler) {
        errorHandler(error);
      } else {
        // 默认错误处理：显示错误消息
        showErrorMessage(error as ErrorResponse);
      }
      
      // 重新抛出错误，让调用者可以继续处理
      throw error;
    }
  };
}

/**
 * 带重试和错误处理的异步函数包装器
 * @param fn 异步函数
 * @param config 重试配置
 * @param errorHandler 错误处理函数
 * @returns 包装后的异步函数
 */
export function withRetryAndErrorHandling<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  config: Partial<RetryConfig> = {},
  errorHandler?: (error: any) => void
): (...args: Args) => Promise<T> {
  // 先应用重试，再应用错误处理
  return withErrorHandling(withRetry(fn, config), errorHandler);
}

/**
 * 解析API响应错误
 * @param response Fetch API响应
 * @returns 解析后的错误响应
 */
export async function parseApiError(response: Response): Promise<ErrorResponse> {
  try {
    const data = await response.json();
    
    if (data && data.success === false && data.error) {
      return data as ErrorResponse;
    }
    
    return {
      success: false,
      error: {
        message: `API错误: ${response.status} ${response.statusText}`,
        type: ErrorType.EXTERNAL_SERVICE,
        code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: `无法解析API错误: ${response.status} ${response.statusText}`,
        type: ErrorType.EXTERNAL_SERVICE,
        code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      },
    };
  }
}
