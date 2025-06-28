"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { SearchIcon, XIcon, Loader2Icon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"

interface SearchResult {
  id: string | number
  type: 'product' | 'order' | 'customer' | 'employee' | 'supplier'
  title: string
  subtitle?: string
  description?: string
  imageUrl?: string
  link: string
  metadata?: Record<string, any>
}

interface SimpleSearchProps {
  className?: string
  placeholder?: string
}

const typeConfig = {
  product: { label: "产品", color: "bg-blue-100 text-blue-700", icon: "📦" },
  order: { label: "订单", color: "bg-green-100 text-green-700", icon: "📋" },
  customer: { label: "客户", color: "bg-purple-100 text-purple-700", icon: "👤" },
  employee: { label: "员工", color: "bg-orange-100 text-orange-700", icon: "👨‍💼" },
  supplier: { label: "供应商", color: "bg-red-100 text-red-700", icon: "🏢" },
}

export function SimpleSearch({ 
  className, 
  placeholder = "搜索产品、订单、客户..." 
}: SimpleSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  // 执行搜索
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([])
        setShowResults(false)
        return
      }

      setLoading(true)
      setShowResults(true)

      try {
        const response = await fetch(`/api/search/simple?q=${encodeURIComponent(debouncedQuery)}`)
        if (!response.ok) throw new Error('搜索失败')
        
        const data = await response.json()
        setResults(data.results || [])
      } catch (error) {
        console.error("Search failed:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    performSearch()
  }, [debouncedQuery])

  // 处理键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showResults) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultClick(results[selectedIndex])
          }
          break
        case 'Escape':
          setShowResults(false)
          setSelectedIndex(-1)
          inputRef.current?.blur()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showResults, selectedIndex, results])

  // 点击外部关闭结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowResults(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false)
    setQuery("")
    setSelectedIndex(-1)
    router.push(result.link)
  }

  const clearSearch = () => {
    setQuery("")
    setResults([])
    setShowResults(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowResults(true)
    }
  }

  return (
    <div className={cn("relative", className)}>
      {/* 搜索输入框 */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          className="pl-10 pr-10 h-9 bg-background border-input"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2Icon className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* 搜索结果 */}
      {showResults && (
        <Card 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto shadow-lg"
        >
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2Icon className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">搜索中...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {query ? "未找到匹配的结果" : "输入关键词开始搜索"}
                </p>
              </div>
            ) : (
              <div className="py-2">
                {results.map((result, index) => {
                  const config = typeConfig[result.type]
                  return (
                    <div
                      key={`${result.type}-${result.id}`}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                        index === selectedIndex 
                          ? "bg-accent text-accent-foreground" 
                          : "hover:bg-accent/50"
                      )}
                      onClick={() => handleResultClick(result)}
                    >
                      {result.imageUrl ? (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={result.imageUrl} alt={result.title} />
                          <AvatarFallback className={config.color}>
                            {config.icon}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm", config.color)}>
                          {config.icon}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{result.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {config.label}
                          </Badge>
                        </div>
                        {result.subtitle && (
                          <p className="text-sm text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        )}
                        {result.description && (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {result.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
