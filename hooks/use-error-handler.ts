/**
 * 错误处理 Hook
 * 
 * 提供在 React 组件中使用的错误处理功能。
 * 
 * @module 错误处理Hook
 * @category 客户端工具
 */

import { useState, useCallback } from 'react';
import { 
  ErrorResponse, 
  RetryConfig, 
  DEFAULT_RETRY_CONFIG,
  withRetry,
  withErrorHandling,
  withRetryAndErrorHandling,
  showErrorMessage,
  getUserFriendlyErrorMessage,
  isRetryableError
} from '@/lib/client/error-handler';

/**
 * 错误处理 Hook 返回值接口
 */
export interface UseErrorHandlerReturn {
  /**
   * 错误状态
   */
  error: ErrorResponse | null;
  
  /**
   * 是否正在加载
   */
  isLoading: boolean;
  
  /**
   * 重试次数
   */
  retryCount: number;
  
  /**
   * 设置错误
   */
  setError: (error: ErrorResponse | null) => void;
  
  /**
   * 清除错误
   */
  clearError: () => void;
  
  /**
   * 显示错误消息
   */
  showError: (error: ErrorResponse | string) => void;
  
  /**
   * 获取用户友好的错误消息
   */
  getErrorMessage: (error: ErrorResponse) => string;
  
  /**
   * 检查错误是否可重试
   */
  isRetryable: (error: ErrorResponse) => boolean;
  
  /**
   * 带错误处理的异步函数包装器
   */
  withErrorHandling: <T, Args extends any[]>(
    fn: (...args: Args) => Promise<T>
  ) => (...args: Args) => Promise<T>;
  
  /**
   * 带重试的异步函数包装器
   */
  withRetry: <T, Args extends any[]>(
    fn: (...args: Args) => Promise<T>,
    config?: Partial<RetryConfig>
  ) => (...args: Args) => Promise<T>;
  
  /**
   * 带重试和错误处理的异步函数包装器
   */
  withRetryAndErrorHandling: <T, Args extends any[]>(
    fn: (...args: Args) => Promise<T>,
    config?: Partial<RetryConfig>
  ) => (...args: Args) => Promise<T>;
}

/**
 * 错误处理 Hook
 * @returns 错误处理工具和状态
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);
  
  const showError = useCallback((err: ErrorResponse | string) => {
    if (typeof err === 'string') {
      showErrorMessage(err);
    } else {
      setError(err);
      showErrorMessage(err);
    }
  }, []);
  
  const getErrorMessage = useCallback((err: ErrorResponse) => {
    return getUserFriendlyErrorMessage(err);
  }, []);
  
  const isRetryableError_ = useCallback((err: ErrorResponse) => {
    return isRetryableError(err);
  }, []);
  
  const withErrorHandling_ = useCallback(<T, Args extends any[]>(
    fn: (...args: Args) => Promise<T>
  ) => {
    return withErrorHandling(fn, (err) => {
      setError(err as ErrorResponse);
      showErrorMessage(err as ErrorResponse);
    });
  }, []);
  
  const withRetry_ = useCallback(<T, Args extends any[]>(
    fn: (...args: Args) => Promise<T>,
    config?: Partial<RetryConfig>
  ) => {
    return withRetry(fn, {
      ...DEFAULT_RETRY_CONFIG,
      ...config,
      onRetry: (attempt) => {
        setRetryCount(attempt);
        if (config?.onRetry) {
          config.onRetry(attempt);
        }
      },
    });
  }, []);
  
  const withRetryAndErrorHandling_ = useCallback(<T, Args extends any[]>(
    fn: (...args: Args) => Promise<T>,
    config?: Partial<RetryConfig>
  ) => {
    // 创建一个新的函数，在执行前设置 loading 状态，执行后清除 loading 状态
    const wrappedFn = async (...args: Args): Promise<T> => {
      setIsLoading(true);
      clearError();
      
      try {
        const result = await fn(...args);
        setIsLoading(false);
        return result;
      } catch (err) {
        setIsLoading(false);
        throw err;
      }
    };
    
    return withRetryAndErrorHandling(
      wrappedFn,
      {
        ...DEFAULT_RETRY_CONFIG,
        ...config,
        onRetry: (attempt) => {
          setRetryCount(attempt);
          if (config?.onRetry) {
            config.onRetry(attempt);
          }
        },
      },
      (err) => {
        setError(err as ErrorResponse);
        showErrorMessage(err as ErrorResponse);
      }
    );
  }, [clearError]);
  
  return {
    error,
    isLoading,
    retryCount,
    setError,
    clearError,
    showError,
    getErrorMessage,
    isRetryable: isRetryableError_,
    withErrorHandling: withErrorHandling_,
    withRetry: withRetry_,
    withRetryAndErrorHandling: withRetryAndErrorHandling_,
  };
}
