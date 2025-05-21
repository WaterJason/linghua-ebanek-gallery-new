/**
 * 错误处理示例组件
 * 
 * 展示如何使用错误处理工具和 Hook。
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { ErrorType, ErrorCode } from '@/lib/error-handler';
import { captureError, captureMessage } from '@/lib/monitoring/sentry';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * 模拟 API 调用
 * @param shouldFail 是否应该失败
 * @param errorType 错误类型
 * @returns 模拟数据
 */
async function mockApiCall(shouldFail: boolean = false, errorType: string = ErrorType.GENERAL): Promise<any> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (shouldFail) {
    throw {
      success: false,
      error: {
        message: `模拟 ${errorType} 错误`,
        type: errorType,
        code: errorType === ErrorType.VALIDATION ? ErrorCode.VALIDATION_ERROR : ErrorCode.GENERAL_ERROR,
        module: 'mock-api',
      },
    };
  }
  
  return {
    success: true,
    data: {
      message: '操作成功',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * 错误处理示例组件
 */
export function ErrorHandlingExample() {
  const {
    error,
    isLoading,
    retryCount,
    clearError,
    getErrorMessage,
    withRetryAndErrorHandling,
  } = useErrorHandler();
  
  const [result, setResult] = useState<any>(null);
  
  // 使用错误处理包装器包装 API 调用
  const fetchDataWithErrorHandling = withRetryAndErrorHandling(async (shouldFail: boolean, errorType: string) => {
    const data = await mockApiCall(shouldFail, errorType);
    setResult(data);
    return data;
  }, {
    maxRetries: 2,
    initialDelay: 1000,
  });
  
  // 处理成功请求
  const handleSuccess = async () => {
    try {
      await fetchDataWithErrorHandling(false, ErrorType.GENERAL);
      captureMessage('成功请求示例', 'info');
    } catch (error) {
      // 错误已经被 withRetryAndErrorHandling 处理
      console.error('This should not happen:', error);
    }
  };
  
  // 处理验证错误
  const handleValidationError = async () => {
    try {
      await fetchDataWithErrorHandling(true, ErrorType.VALIDATION);
    } catch (error) {
      // 错误已经被 withRetryAndErrorHandling 处理
      captureError(error, { context: 'validation-error-example' });
    }
  };
  
  // 处理数据库错误（可重试）
  const handleDatabaseError = async () => {
    try {
      await fetchDataWithErrorHandling(true, ErrorType.DATABASE);
    } catch (error) {
      // 错误已经被 withRetryAndErrorHandling 处理
      captureError(error, { context: 'database-error-example' });
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>错误处理示例</CardTitle>
        <CardDescription>
          展示如何使用错误处理工具和 Hook 处理不同类型的错误
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>
              {getErrorMessage(error)}
              {retryCount > 0 && (
                <div className="mt-2 text-sm">
                  <span className="font-medium">重试次数:</span> {retryCount}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {result && !error && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <AlertTitle>成功</AlertTitle>
            <AlertDescription>
              <pre className="mt-2 p-2 bg-green-100 rounded text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={handleSuccess} disabled={isLoading}>
            {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
            成功请求
          </Button>
          
          <Button onClick={handleValidationError} variant="outline" disabled={isLoading}>
            {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
            验证错误 (不可重试)
          </Button>
          
          <Button onClick={handleDatabaseError} variant="secondary" disabled={isLoading}>
            {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
            数据库错误 (可重试)
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={clearError} disabled={!error}>
          清除错误
        </Button>
        
        <div className="text-sm text-gray-500">
          {isLoading ? '加载中...' : '就绪'}
        </div>
      </CardFooter>
    </Card>
  );
}
