'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // 检查是否是 ChunkLoadError
    const isChunkError = error.name === 'ChunkLoadError' || 
                        error.message.includes('Loading chunk') ||
                        error.message.includes('ChunkLoadError')
    
    return { 
      hasError: true, 
      error: isChunkError ? error : undefined 
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ChunkErrorBoundary caught an error:', error, errorInfo)
    
    // 如果是 ChunkLoadError，自动重试
    if (this.isChunkLoadError(error)) {
      console.log('Detected ChunkLoadError, attempting automatic recovery...')
      this.handleChunkError()
    }
    
    this.setState({
      error,
      errorInfo
    })
  }

  private isChunkLoadError(error: Error): boolean {
    return error.name === 'ChunkLoadError' || 
           error.message.includes('Loading chunk') ||
           error.message.includes('ChunkLoadError') ||
           error.stack?.includes('__webpack_require__')
  }

  private handleChunkError = () => {
    // 清除可能的缓存
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('next-static') || name.includes('webpack')) {
            caches.delete(name)
          }
        })
      })
    }

    // 延迟重新加载，给用户时间看到错误信息
    setTimeout(() => {
      window.location.reload()
    }, 2000)
  }

  private handleManualReload = () => {
    // 强制清除所有缓存并重新加载
    if ('caches' in window) {
      caches.keys().then(names => {
        Promise.all(names.map(name => caches.delete(name)))
          .then(() => {
            window.location.reload()
          })
      })
    } else {
      window.location.reload()
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 检查是否是 ChunkLoadError
      const isChunkError = this.state.error && this.isChunkLoadError(this.state.error)

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <CardTitle className="text-xl">
                {isChunkError ? '页面加载失败' : '发生错误'}
              </CardTitle>
              <CardDescription>
                {isChunkError 
                  ? '页面资源加载失败，这通常是由于网络问题或缓存问题引起的。'
                  : '应用程序遇到了一个错误。'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isChunkError && (
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                  <p className="font-medium mb-1">自动恢复中...</p>
                  <p>系统正在清除缓存并重新加载页面，请稍候。</p>
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={this.handleManualReload}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  刷新页面
                </Button>
                
                {!isChunkError && (
                  <Button 
                    onClick={this.handleRetry}
                    variant="outline"
                    className="w-full"
                  >
                    重试
                  </Button>
                )}
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    错误详情 (开发模式)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong>错误:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>堆栈:</strong>
                        <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ChunkErrorBoundary
