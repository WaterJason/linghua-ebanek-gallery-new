"use client"

import { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircleIcon, RefreshCwIcon, HomeIcon } from "lucide-react"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetOnPropsChange?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * 错误边界组件
 * 
 * 捕获子组件中的 JavaScript 错误，并显示备用 UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 更新状态，下次渲染时显示备用 UI
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误信息
    console.error("Error caught by ErrorBoundary:", error, errorInfo)
    
    // 调用错误处理回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }
  
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // 如果 props 发生变化，并且设置了 resetOnPropsChange，重置错误状态
    if (
      this.state.hasError &&
      this.props.resetOnPropsChange &&
      prevProps.children !== this.props.children
    ) {
      this.setState({ hasError: false, error: null })
    }
  }
  
  // 重置错误状态
  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }
  
  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义的 fallback，则使用它
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      // 默认错误 UI
      return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center gap-2">
              <AlertCircleIcon className="h-5 w-5 text-red-500" />
              <CardTitle>出错了</CardTitle>
            </div>
            <CardDescription>
              组件渲染过程中发生错误
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-4">
              错误信息：
            </div>
            <div className="bg-muted p-3 rounded-md overflow-auto max-h-[200px] text-sm font-mono">
              {this.state.error?.message || "未知错误"}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => window.location.href = "/"}
            >
              <HomeIcon className="mr-2 h-4 w-4" />
              返回首页
            </Button>
            <Button onClick={this.handleReset}>
              <RefreshCwIcon className="mr-2 h-4 w-4" />
              重试
            </Button>
          </CardFooter>
        </Card>
      )
    }
    
    return this.props.children
  }
}

/**
 * 页面级错误边界组件
 * 
 * 专为页面级别的错误处理设计
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
          <div className="text-red-500 mb-4">
            <AlertCircleIcon className="h-16 w-16" />
          </div>
          <h1 className="text-2xl font-bold mb-2">页面加载失败</h1>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            很抱歉，加载页面时发生错误。请尝试刷新页面，或返回首页。
          </p>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => window.location.href = "/"}
            >
              <HomeIcon className="mr-2 h-4 w-4" />
              返回首页
            </Button>
            <Button onClick={() => window.location.reload()}>
              <RefreshCwIcon className="mr-2 h-4 w-4" />
              刷新页面
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * 组件级错误边界组件
 * 
 * 专为组件级别的错误处理设计
 */
export function ComponentErrorBoundary({ 
  children,
  name = "组件",
  onReset
}: { 
  children: ReactNode
  name?: string
  onReset?: () => void
}) {
  return (
    <ErrorBoundary
      resetOnPropsChange
      fallback={
        <Card className="w-full">
          <CardHeader className="bg-red-50 dark:bg-red-900/20 py-3">
            <div className="flex items-center gap-2">
              <AlertCircleIcon className="h-4 w-4 text-red-500" />
              <CardTitle className="text-base">{name}加载失败</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="py-3">
            <p className="text-sm text-muted-foreground">
              加载{name}时发生错误，请尝试重新加载。
            </p>
          </CardContent>
          <CardFooter className="py-3">
            <Button 
              size="sm"
              onClick={() => {
                if (onReset) {
                  onReset()
                } else {
                  window.location.reload()
                }
              }}
            >
              <RefreshCwIcon className="mr-2 h-3 w-3" />
              重新加载
            </Button>
          </CardFooter>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary
