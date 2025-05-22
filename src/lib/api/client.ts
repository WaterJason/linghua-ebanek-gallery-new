/**
 * API错误类，用于统一处理API错误
 */
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * 通用API响应类型
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * API请求配置
 */
export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean | undefined>;
  withCredentials?: boolean;
  timeout?: number;
}

/**
 * 统一API客户端
 */
const api = {
  /**
   * 发送API请求
   */
  async request<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    try {
      const { params, timeout = 30000, withCredentials = true, body, ...rest } = options;
      
      // 构建URL和查询参数
      const url = new URL(`/api/${endpoint}`, window.location.origin);
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            url.searchParams.append(key, String(value));
          }
        });
      }
      
      // 超时处理
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // 准备请求配置
      const requestOptions: RequestInit = {
        ...rest,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: withCredentials ? 'include' : 'same-origin',
        signal: controller.signal,
      };
      
      // 如果有请求体，序列化成JSON
      if (body !== undefined) {
        requestOptions.body = JSON.stringify(body);
      }
      
      // 发送请求
      const response = await fetch(url.toString(), requestOptions);
      clearTimeout(timeoutId);
      
      // 解析响应
      const data = await response.json();
      
      if (!response.ok) {
        throw new ApiError(
          data.message || `请求失败，状态码: ${response.status}`,
          response.status,
          data
        );
      }
      
      return { data };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('请求超时', 408);
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : '未知错误',
        500
      );
    }
  },
  
  /**
   * GET请求
   */
  get: <T = any>(endpoint: string, options?: ApiRequestOptions) => 
    api.request<T>(endpoint, { method: 'GET', ...options }),
  
  /**
   * POST请求
   */
  post: <T = any>(endpoint: string, body?: any, options?: ApiRequestOptions) => 
    api.request<T>(endpoint, { method: 'POST', body, ...options }),
  
  /**
   * PUT请求
   */
  put: <T = any>(endpoint: string, body?: any, options?: ApiRequestOptions) => 
    api.request<T>(endpoint, { method: 'PUT', body, ...options }),
  
  /**
   * PATCH请求
   */
  patch: <T = any>(endpoint: string, body?: any, options?: ApiRequestOptions) => 
    api.request<T>(endpoint, { method: 'PATCH', body, ...options }),
  
  /**
   * DELETE请求
   */
  delete: <T = any>(endpoint: string, options?: ApiRequestOptions) => 
    api.request<T>(endpoint, { method: 'DELETE', ...options }),
};

export default api;