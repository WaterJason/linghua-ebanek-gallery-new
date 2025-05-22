import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '../lib/api/client';

// 简易toast实现，实际项目可能使用UI库的toast组件
export interface Toast {
  error: (message: string) => void;
  success: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

// Toast Context可以单独实现
export const useToast = (): Toast => {
  return {
    error: (message) => console.error(message),
    success: (message) => console.log(message),
    info: (message) => console.info(message),
    warning: (message) => console.warn(message),
  };
};

/**
 * 统一错误处理Hook
 * 
 * @returns 错误处理函数
 */
export function useErrorHandler() {
  const toast = useToast();
  const router = useRouter();
  
  return useCallback((error: unknown) => {
    console.error(error);
    
    if (error instanceof ApiError) {
      // API错误处理
      switch (error.status) {
        case 401:
          toast.error("会话已过期，请重新登录");
          // 重定向到登录页
          router.push('/login');
          break;
        
        case 403:
          toast.error("您没有权限执行此操作");
          break;
        
        case 404:
          toast.error("请求的资源不存在");
          break;
        
        case 422:
          toast.error(error.message || "表单验证失败");
          break;
        
        case 500:
        case 502:
        case 503:
        case 504:
          toast.error("服务器错误，请稍后重试");
          break;
        
        case 408:
          toast.error("请求超时，请检查网络连接");
          break;
        
        default:
          toast.error(error.message || "请求失败，请稍后重试");
      }
    } else if (error instanceof Error) {
      // 一般JavaScript错误
      toast.error(`发生错误: ${error.message}`);
    } else {
      // 未知错误
      toast.error("发生未知错误，请刷新页面重试");
    }
  }, [toast, router]);
}

/**
 * 异步操作错误处理Hook
 * 
 * @example
 * ```tsx
 * const { handleAsyncAction } = useAsyncErrorHandler();
 * 
 * const handleSubmit = async () => {
 *   await handleAsyncAction(async () => {
 *     await api.post('users', userData);
 *     toast.success('用户创建成功');
 *   });
 * };
 * ```
 */
export function useAsyncErrorHandler() {
  const handleError = useErrorHandler();
  const toast = useToast();
  
  const handleAsyncAction = useCallback(async <T>(
    action: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void;
      onError?: (error: unknown) => void;
      loadingMessage?: string;
      successMessage?: string;
    }
  ): Promise<T | undefined> => {
    try {
      if (options?.loadingMessage) {
        toast.info(options.loadingMessage);
      }
      
      const result = await action();
      
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      options?.onError?.(error);
      handleError(error);
      return undefined;
    }
  }, [handleError, toast]);
  
  return { handleAsyncAction };
} 