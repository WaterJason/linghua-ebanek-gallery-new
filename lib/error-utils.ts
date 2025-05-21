/**
 * 错误处理工具模块
 * 
 * 提供错误处理相关的辅助函数和类型导出，简化错误处理的使用。
 * 
 * @module 错误处理工具
 * @category 核心模块
 */

import {
  AppError,
  ErrorType,
  ErrorCode,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  AlreadyExistsError,
  BusinessLogicError,
  handleError,
  formatErrorResponse
} from './error-handler';

/**
 * 错误处理工具对象
 * 包含所有错误处理相关的类和函数
 */
export const ErrorUtils = {
  // 错误类
  AppError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  AlreadyExistsError,
  BusinessLogicError,
  
  // 错误类型和代码
  ErrorType,
  ErrorCode,
  
  // 错误处理函数
  handleError,
  formatErrorResponse,
  
  /**
   * 创建验证错误
   * @param message 错误消息
   * @param details 错误详情
   * @param module 模块名称
   * @returns 验证错误对象
   */
  createValidationError: (message: string, details?: any, module: string = 'validation') => {
    return new ValidationError(message, details, module);
  },
  
  /**
   * 创建数据库错误
   * @param message 错误消息
   * @param details 错误详情
   * @param module 模块名称
   * @returns 数据库错误对象
   */
  createDatabaseError: (message: string, details?: any, module: string = 'database') => {
    return new DatabaseError(message, details, module);
  },
  
  /**
   * 创建认证错误
   * @param message 错误消息
   * @param details 错误详情
   * @param module 模块名称
   * @returns 认证错误对象
   */
  createAuthenticationError: (message: string, details?: any, module: string = 'authentication') => {
    return new AuthenticationError(message, details, module);
  },
  
  /**
   * 创建授权错误
   * @param message 错误消息
   * @param details 错误详情
   * @param module 模块名称
   * @returns 授权错误对象
   */
  createAuthorizationError: (message: string, details?: any, module: string = 'authorization') => {
    return new AuthorizationError(message, details, module);
  },
  
  /**
   * 创建资源不存在错误
   * @param message 错误消息
   * @param details 错误详情
   * @param module 模块名称
   * @returns 资源不存在错误对象
   */
  createNotFoundError: (message: string, details?: any, module: string = 'resource') => {
    return new NotFoundError(message, details, module);
  },
  
  /**
   * 创建资源已存在错误
   * @param message 错误消息
   * @param details 错误详情
   * @param module 模块名称
   * @returns 资源已存在错误对象
   */
  createAlreadyExistsError: (message: string, details?: any, module: string = 'resource') => {
    return new AlreadyExistsError(message, details, module);
  },
  
  /**
   * 创建业务逻辑错误
   * @param message 错误消息
   * @param details 错误详情
   * @param module 模块名称
   * @returns 业务逻辑错误对象
   */
  createBusinessLogicError: (message: string, details?: any, module: string = 'business') => {
    return new BusinessLogicError(message, details, module);
  },
  
  /**
   * 处理验证结果
   * 如果验证失败，抛出验证错误
   * @param validation 验证结果
   * @param module 模块名称
   */
  handleValidationResult: (validation: { isValid: boolean; errors: string[] }, module: string) => {
    if (!validation.isValid) {
      throw new ValidationError(validation.errors.join('; '), validation.errors, module);
    }
  }
};

// 导出所有错误类和函数
export {
  AppError,
  ErrorType,
  ErrorCode,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  AlreadyExistsError,
  BusinessLogicError,
  handleError,
  formatErrorResponse
};
