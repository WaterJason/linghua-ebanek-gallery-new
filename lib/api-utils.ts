/**
 * 统一的API工具函数
 * 提供标准化的错误处理、日志记录和网络请求功能
 */

export interface ApiCallOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  details?: any;
}

/**
 * 创建带有详细错误信息的API错误
 */
function createApiError(
  message: string, 
  status?: number, 
  statusText?: string, 
  details?: any
): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.statusText = statusText;
  error.details = details;
  return error;
}

/**
 * 统一的API调用函数
 * 提供详细的错误处理、日志记录和重试机制
 */
export async function apiCall(url: string, options: ApiCallOptions = {}): Promise<any> {
  const {
    timeout = 10000,
    retries = 0,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 API调用 (尝试 ${attempt + 1}/${retries + 1}): ${fetchOptions.method || 'GET'} ${url}`);
      
      // 创建AbortController用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
        signal: controller.signal,
        ...fetchOptions,
      });

      clearTimeout(timeoutId);
      console.log(`📡 API响应状态: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorDetails = null;
        
        try {
          errorDetails = await response.json();
          errorMessage = errorDetails.error || errorDetails.details || errorMessage;
          console.error(`🔥 API错误详情:`, errorDetails);
        } catch (parseError) {
          console.error(`🔥 无法解析错误响应:`, parseError);
        }
        
        throw createApiError(errorMessage, response.status, response.statusText, errorDetails);
      }

      const data = await response.json();
      console.log(`✅ API调用成功:`, data);
      return data;

    } catch (error) {
      console.error(`🔥 API调用失败 (尝试 ${attempt + 1}):`, error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          lastError = createApiError(`请求超时 (${timeout}ms)`, 408, 'Request Timeout');
        } else if (error.message.includes('fetch')) {
          lastError = createApiError('网络连接失败，请检查网络连接', 0, 'Network Error');
        } else {
          lastError = error as ApiError;
        }
      } else {
        lastError = createApiError('未知错误', 500, 'Internal Server Error');
      }

      // 如果是最后一次尝试，抛出错误
      if (attempt === retries) {
        throw lastError;
      }

      // 等待重试延迟
      if (retryDelay > 0) {
        console.log(`⏳ 等待 ${retryDelay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError || createApiError('所有重试都失败了', 500, 'All Retries Failed');
}

/**
 * SWR fetcher 函数
 * 专门用于SWR的数据获取，提供统一的错误处理
 */
export async function swrFetcher(url: string): Promise<any> {
  try {
    console.log(`🔄 SWR获取数据: GET ${url}`);
    
    const response = await fetch(url);
    
    console.log(`📡 SWR响应状态: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.details || errorMessage;
        console.error(`🔥 SWR错误详情:`, errorData);
      } catch (parseError) {
        console.error(`🔥 无法解析SWR错误响应:`, parseError);
      }
      
      throw createApiError(errorMessage, response.status, response.statusText);
    }
    
    const data = await response.json();
    console.log(`✅ SWR获取成功:`, data);
    return data;
  } catch (error) {
    console.error(`🔥 SWR获取失败:`, error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw createApiError('网络连接失败，请检查网络连接', 0, 'Network Error');
    }
    
    throw error;
  }
}

/**
 * 检查错误是否可重试
 */
export function isRetryableError(error: ApiError): boolean {
  if (!error.status) return true; // 网络错误通常可重试
  
  // 5xx 服务器错误和 408 超时错误可重试
  return error.status >= 500 || error.status === 408;
}

/**
 * 获取用户友好的错误消息
 */
export function getUserFriendlyErrorMessage(error: ApiError): string {
  if (!error.status) {
    return '网络连接失败，请检查网络连接';
  }
  
  switch (error.status) {
    case 400:
      return '请求参数错误，请检查输入信息';
    case 401:
      return '未授权访问，请重新登录';
    case 403:
      return '权限不足，无法执行此操作';
    case 404:
      return '请求的资源不存在';
    case 408:
      return '请求超时，请稍后重试';
    case 409:
      return '数据冲突，请刷新页面后重试';
    case 422:
      return '数据验证失败，请检查输入信息';
    case 429:
      return '请求过于频繁，请稍后重试';
    case 500:
      return '服务器内部错误，请稍后重试';
    case 502:
      return '网关错误，请稍后重试';
    case 503:
      return '服务暂时不可用，请稍后重试';
    case 504:
      return '网关超时，请稍后重试';
    default:
      return error.message || '操作失败，请稍后重试';
  }
}

/**
 * 带重试的API调用
 */
export async function apiCallWithRetry(
  url: string, 
  options: ApiCallOptions = {},
  maxRetries: number = 3
): Promise<any> {
  return apiCall(url, { ...options, retries: maxRetries });
}

/**
 * 批量API调用
 */
export async function batchApiCall(
  requests: Array<{ url: string; options?: ApiCallOptions }>,
  options: { 
    concurrent?: boolean; 
    maxConcurrency?: number;
    failFast?: boolean;
  } = {}
): Promise<any[]> {
  const { concurrent = true, maxConcurrency = 5, failFast = false } = options;
  
  if (!concurrent) {
    // 顺序执行
    const results = [];
    for (const request of requests) {
      try {
        const result = await apiCall(request.url, request.options);
        results.push(result);
      } catch (error) {
        if (failFast) throw error;
        results.push({ error });
      }
    }
    return results;
  }
  
  // 并发执行
  const executeRequest = async (request: typeof requests[0]) => {
    try {
      return await apiCall(request.url, request.options);
    } catch (error) {
      if (failFast) throw error;
      return { error };
    }
  };
  
  // 限制并发数
  const results = [];
  for (let i = 0; i < requests.length; i += maxConcurrency) {
    const batch = requests.slice(i, i + maxConcurrency);
    const batchResults = await Promise.all(batch.map(executeRequest));
    results.push(...batchResults);
  }
  
  return results;
}
