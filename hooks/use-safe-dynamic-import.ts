'use client'

import { useState, useEffect, useCallback } from 'react'
import { retryableImport } from '@/lib/chunk-retry-handler'

interface UseSafeDynamicImportOptions {
  chunkName?: string
  fallback?: any
  onError?: (error: Error) => void
  onSuccess?: (module: any) => void
  autoRetry?: boolean
}

interface UseSafeDynamicImportResult<T> {
  module: T | null
  loading: boolean
  error: Error | null
  retry: () => void
  retryCount: number
}

/**
 * 安全的动态导入 Hook
 * 提供错误处理、重试机制和加载状态管理
 */
export function useSafeDynamicImport<T = any>(
  importFn: () => Promise<T>,
  options: UseSafeDynamicImportOptions = {}
): UseSafeDynamicImportResult<T> {
  const {
    chunkName = 'unknown',
    fallback = null,
    onError,
    onSuccess,
    autoRetry = true
  } = options

  const [module, setModule] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const loadModule = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const loadedModule = await retryableImport(importFn, chunkName)
      setModule(loadedModule)
      onSuccess?.(loadedModule)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown import error')
      setError(error)
      onError?.(error)
      
      if (fallback) {
        setModule(fallback)
      }
    } finally {
      setLoading(false)
    }
  }, [importFn, chunkName, fallback, onError, onSuccess])

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1)
    loadModule()
  }, [loadModule])

  useEffect(() => {
    loadModule()
  }, [loadModule])

  return {
    module,
    loading,
    error,
    retry,
    retryCount
  }
}

/**
 * 用于 React 组件的安全动态导入 Hook
 */
export function useSafeDynamicComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: UseSafeDynamicImportOptions = {}
): UseSafeDynamicImportResult<T> {
  const result = useSafeDynamicImport(importFn, options)
  
  return {
    ...result,
    module: result.module?.default || null
  }
}

/**
 * 批量动态导入 Hook
 */
export function useBatchDynamicImport<T = any>(
  imports: Array<{
    importFn: () => Promise<T>
    chunkName?: string
  }>,
  options: Omit<UseSafeDynamicImportOptions, 'chunkName'> = {}
) {
  const [modules, setModules] = useState<(T | null)[]>(new Array(imports.length).fill(null))
  const [loading, setLoading] = useState<boolean[]>(new Array(imports.length).fill(false))
  const [errors, setErrors] = useState<(Error | null)[]>(new Array(imports.length).fill(null))
  const [retryCount, setRetryCount] = useState(0)

  const loadModules = useCallback(async () => {
    setLoading(new Array(imports.length).fill(true))
    setErrors(new Array(imports.length).fill(null))

    const results = await Promise.allSettled(
      imports.map(({ importFn, chunkName }) => 
        retryableImport(importFn, chunkName)
      )
    )

    const newModules: (T | null)[] = []
    const newLoading: boolean[] = []
    const newErrors: (Error | null)[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        newModules[index] = result.value
        newLoading[index] = false
        newErrors[index] = null
        options.onSuccess?.(result.value)
      } else {
        newModules[index] = options.fallback || null
        newLoading[index] = false
        newErrors[index] = result.reason instanceof Error ? result.reason : new Error('Unknown error')
        options.onError?.(newErrors[index]!)
      }
    })

    setModules(newModules)
    setLoading(newLoading)
    setErrors(newErrors)
  }, [imports, options])

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1)
    loadModules()
  }, [loadModules])

  useEffect(() => {
    loadModules()
  }, [loadModules])

  return {
    modules,
    loading,
    errors,
    retry,
    retryCount,
    allLoaded: loading.every(l => !l),
    hasErrors: errors.some(e => e !== null)
  }
}
