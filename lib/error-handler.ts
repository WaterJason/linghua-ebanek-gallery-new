/**
 * 错误处理模块
 * 
 * 本模块提供统一的错误处理机制，包括错误类型定义、错误日志记录、错误响应格式化等。
 * 
 * @module 错误处理
 * @category 核心模块
 */

import { createSystemLog } from './actions/system-actions';

/**
 * 错误类型枚举
 */
export enum ErrorType {
  // 通用错误
  GENERAL = 'GENERAL',
  // 验证错误
  VALIDATION = 'VALIDATION',
  // 数据库错误
  DATABASE = 'DATABASE',
  // 认证错误
  AUTHENTICATION = 'AUTHENTICATION',
  // 授权错误
  AUTHORIZATION = 'AUTHORIZATION',
  // 资源不存在
  NOT_FOUND = 'NOT_FOUND',
  // 资源已存在
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  // 业务逻辑错误
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  // 外部服务错误
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  // 系统错误
  SYSTEM = 'SYSTEM',
}

/**
 * 错误代码枚举
 */
export enum ErrorCode {
  // 通用错误
  GENERAL_ERROR = 'E0001',
  // 验证错误
  VALIDATION_ERROR = 'E0002',
  // 数据库错误
  DATABASE_ERROR = 'E0003',
  // 认证错误
  AUTHENTICATION_ERROR = 'E0004',
  // 授权错误
  AUTHORIZATION_ERROR = 'E0005',
  // 资源不存在
  NOT_FOUND_ERROR = 'E0006',
  // 资源已存在
  ALREADY_EXISTS_ERROR = 'E0007',
  // 业务逻辑错误
  BUSINESS_LOGIC_ERROR = 'E0008',
  // 外部服务错误
  EXTERNAL_SERVICE_ERROR = 'E0009',
  // 系统错误
  SYSTEM_ERROR = 'E0010',
}

/**
 * 应用错误类
 */
export class AppError extends Error {
  type: ErrorType;
  code: ErrorCode;
  details?: any;
  module: string;
  timestamp: Date;
  
  /**
   * 构造函数
   * @param message 错误消息
   * @param type 错误类型
   * @param code 错误代码
   * @param details 错误详情
   * @param module 模块名称
   */
  constructor(
    message: string,
    type: ErrorType = ErrorType.GENERAL,
    code: ErrorCode = ErrorCode.GENERAL_ERROR,
    details?: any,
    module: string = 'unknown'
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code;
    this.details = details;
    this.module = module;
    this.timestamp = new Date();
  }
  
  /**
   * 获取错误的JSON表示
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      code: this.code,
      details: this.details,
      module: this.module,
      timestamp: this.timestamp,
    };
  }
}

/**
 * 验证错误类
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any, module: string = 'validation') {
    super(message, ErrorType.VALIDATION, ErrorCode.VALIDATION_ERROR, details, module);
    this.name = 'ValidationError';
  }
}

/**
 * 数据库错误类
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: any, module: string = 'database') {
    super(message, ErrorType.DATABASE, ErrorCode.DATABASE_ERROR, details, module);
    this.name = 'DatabaseError';
  }
}

/**
 * 认证错误类
 */
export class AuthenticationError extends AppError {
  constructor(message: string, details?: any, module: string = 'authentication') {
    super(message, ErrorType.AUTHENTICATION, ErrorCode.AUTHENTICATION_ERROR, details, module);
    this.name = 'AuthenticationError';
  }
}

/**
 * 授权错误类
 */
export class AuthorizationError extends AppError {
  constructor(message: string, details?: any, module: string = 'authorization') {
    super(message, ErrorType.AUTHORIZATION, ErrorCode.AUTHORIZATION_ERROR, details, module);
    this.name = 'AuthorizationError';
  }
}

/**
 * 资源不存在错误类
 */
export class NotFoundError extends AppError {
  constructor(message: string, details?: any, module: string = 'resource') {
    super(message, ErrorType.NOT_FOUND, ErrorCode.NOT_FOUND_ERROR, details, module);
    this.name = 'NotFoundError';
  }
}

/**
 * 资源已存在错误类
 */
export class AlreadyExistsError extends AppError {
  constructor(message: string, details?: any, module: string = 'resource') {
    super(message, ErrorType.ALREADY_EXISTS, ErrorCode.ALREADY_EXISTS_ERROR, details, module);
    this.name = 'AlreadyExistsError';
  }
}

/**
 * 业务逻辑错误类
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, details?: any, module: string = 'business') {
    super(message, ErrorType.BUSINESS_LOGIC, ErrorCode.BUSINESS_LOGIC_ERROR, details, module);
    this.name = 'BusinessLogicError';
  }
}

/**
 * 处理错误
 * @param error 错误对象
 * @param module 模块名称
 * @param userId 用户ID
 * @returns 格式化后的错误对象
 */
export async function handleError(error: any, module: string = 'unknown', userId?: string): Promise<AppError> {
  // 如果已经是 AppError，直接返回
  if (error instanceof AppError) {
    // 记录错误日志
    await logError(error, userId);
    return error;
  }
  
  // 转换为 AppError
  let appError: AppError;
  
  if (error.name === 'PrismaClientKnownRequestError' || error.name === 'PrismaClientUnknownRequestError') {
    appError = new DatabaseError(
      error.message || '数据库操作失败',
      { code: error.code, meta: error.meta },
      module
    );
  } else if (error.name === 'ValidationError') {
    appError = new ValidationError(
      error.message || '数据验证失败',
      error.details,
      module
    );
  } else {
    appError = new AppError(
      error.message || '发生未知错误',
      ErrorType.GENERAL,
      ErrorCode.GENERAL_ERROR,
      error,
      module
    );
  }
  
  // 记录错误日志
  await logError(appError, userId);
  
  return appError;
}

/**
 * 记录错误日志
 * @param error 错误对象
 * @param userId 用户ID
 */
async function logError(error: AppError, userId?: string): Promise<void> {
  try {
    // 记录到系统日志
    await createSystemLog({
      level: 'error',
      module: error.module,
      message: error.message,
      details: JSON.stringify(error.toJSON()),
      userId: userId,
    });
    
    // 同时输出到控制台
    console.error(`[${error.timestamp.toISOString()}] [${error.type}] [${error.code}] [${error.module}] ${error.message}`, error.details);
  } catch (logError) {
    // 如果记录日志失败，只输出到控制台
    console.error('Failed to log error:', logError);
    console.error(`[${error.timestamp.toISOString()}] [${error.type}] [${error.code}] [${error.module}] ${error.message}`, error.details);
  }
}

/**
 * 格式化错误响应
 * @param error 错误对象
 * @returns 格式化后的错误响应
 */
export function formatErrorResponse(error: any): { success: false; error: any } {
  // 如果已经是 AppError，直接使用
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        type: error.type,
        code: error.code,
        module: error.module,
      },
    };
  }
  
  // 否则，创建一个通用错误响应
  return {
    success: false,
    error: {
      message: error.message || '发生未知错误',
      type: ErrorType.GENERAL,
      code: ErrorCode.GENERAL_ERROR,
      module: 'unknown',
    },
  };
}
