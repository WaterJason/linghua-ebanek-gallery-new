import useSWR, { SWRConfiguration, SWRResponse } from 'swr';
import api, { ApiRequestOptions, ApiResponse, ApiError } from '../lib/api/client';

export interface UseApiOptions {
  fetchOptions?: ApiRequestOptions;
  swrOptions?: SWRConfiguration;
}

export interface UseApiResponse<T> extends Omit<SWRResponse<ApiResponse<T>, ApiError>, 'data'> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
}

/**
 * 用于数据获取的Hook，集成了SWR的缓存和重新验证功能
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, mutate } = useApi<Product[]>('products', { 
 *   fetchOptions: { params: { category: 'electronics' } },
 *   swrOptions: { revalidateOnFocus: false }
 * });
 * ```
 */
export function useApi<T = any>(
  endpoint: string, 
  options: UseApiOptions = {}
): UseApiResponse<T> {
  const { fetchOptions, swrOptions } = options;
  
  const {
    data: response,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<ApiResponse<T>, ApiError>(
    endpoint,
    () => api.get<T>(endpoint, fetchOptions),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      ...swrOptions,
    }
  );
  
  return {
    data: response?.data,
    error,
    isLoading,
    isValidating,
    isError: !!error,
    mutate,
  };
}

/**
 * 用于提交数据的Hook
 */
export function useApiMutation<T = any, R = any>(
  endpoint: string,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post',
  options: UseApiOptions = {}
) {
  const { fetchOptions } = options;
  
  const mutate = async (data?: T): Promise<ApiResponse<R>> => {
    switch (method) {
      case 'post':
        return api.post<R>(endpoint, data, fetchOptions);
      case 'put':
        return api.put<R>(endpoint, data, fetchOptions);
      case 'patch':
        return api.patch<R>(endpoint, data, fetchOptions);
      case 'delete':
        return api.delete<R>(endpoint, fetchOptions);
      default:
        throw new Error(`不支持的HTTP方法: ${method}`);
    }
  };
  
  return { mutate };
} 